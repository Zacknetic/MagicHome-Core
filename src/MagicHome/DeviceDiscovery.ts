import * as dgram from 'dgram';
import * as net from 'net';
import { Network } from '../utils/Network';
import { DeviceManager } from './deviceManager';
import { socketManager } from './socketManager';
import {
	ProtoDevice,
	CompleteDevice,
	FetchStateResponse,
	InterfaceOptions,
	DeviceBundle,
} from '../models/types';
import {
	sleepTimeout,
} from '../utils/miscUtils';

const BROADCAST_PORT: number = 48899;
const BROADCAST_MAGIC_STRING: string = 'HF-A11ASSISTHREAD';

let testCounter = 0;
export async function discoverDevices(timeout = 1000, customSubnets: string[] = []): Promise<ProtoDevice[]> {
	const userInterfaces: string[] = [];

	if (isDockerHostMode()) {
		userInterfaces.push('255.255.255.255');
	} else {
		for (const subnet of Network.subnets()) {
			if (subnet['broadcast']) {
				userInterfaces.push(subnet['broadcast']);
			}
		}
		userInterfaces.push(...customSubnets);
	}

	const protoDevicesSet = new Set<string>();
	const protoDevicesList: ProtoDevice[] = [];
	const socket: dgram.Socket = dgram.createSocket({
		type: 'udp4',
		reuseAddr: true,
	});

	socket.bind(BROADCAST_PORT);

	socket.on('error', (err) => {
		socket.close();
		return err;
	});

	socket.on('listening', () => {
		socket.setBroadcast(true);
		for (const userInterface of userInterfaces) {
			socket.send(BROADCAST_MAGIC_STRING, BROADCAST_PORT, userInterface);
		}
	});

	socket.on('message', (msg, _rinfo) => {
		if (testCounter > 3) return;
		const parts = msg.toString().split(',');
		const [ipAddress, uniqueId, modelNumber] = parts;
		if(!ipAddress || !uniqueId || !modelNumber) return;
		if ((net.isIPv4(ipAddress) || net.isIPv6(ipAddress)) && !protoDevicesSet.has(uniqueId)) {
			protoDevicesList.push({
				ipAddress,
				uniqueId,
				modelNumber,
			});
		} else {
			//TODO: handle discovery errors
		}
	});

	await sleepTimeout(timeout);
	socket.close();
	return protoDevicesList;
}

/**
 *
 * @param protoDevices IProtoDevice[]
 * @param timeout number
 * @returns completeDevice[]
 */
export async function generateCompleteDevices(
	protoDevices: ProtoDevice[],
	interfaceOptions: InterfaceOptions,
	retries = 3
): Promise<DeviceBundle[]> {
	if (!protoDevices || protoDevices.length < 1) return [];

	const completedDevices: DeviceBundle[] = [];
	let retryProtoDevices: ProtoDevice[] = [];

	const results = await Promise.allSettled(
		protoDevices.map(protoDevice =>
			generateCompleteDevice(protoDevice, interfaceOptions).catch((e) => {
				console.error('DeviceDiscoveryError: ', e);
				return Promise.reject({ protoDevice, error: e });
			})
		)
	);

	results.forEach(result => {
		if (result.status === 'fulfilled') {
			completedDevices.push(result.value);
		} else if (result.reason && result.reason.protoDevice) {
			retryProtoDevices.push(result.reason.protoDevice);
		}
	});

	if (retryProtoDevices.length > 0 && retries > 0) {
		const retriedDevices = await generateCompleteDevices(retryProtoDevices, interfaceOptions, retries - 1);
		completedDevices.push(...retriedDevices);
	}

	return completedDevices;
}

async function generateCompleteDevice(protoDevice: ProtoDevice, interfaceOptions: InterfaceOptions): Promise<DeviceBundle> {
	try {
		const transport = new socketManager(protoDevice.ipAddress);
		const deviceManager = new DeviceManager(transport, interfaceOptions);

		const fetchStateResponse: FetchStateResponse = await deviceManager.queryState();

		const completeDevice: CompleteDevice = {
			protoDevice,
			fetchStateResponse,
			latestUpdate: Date.now(),
		};

		return { completeDevice, deviceManager };
	} catch (e) {
		throw Error('completeDeviceError: ' + e);
	}
}


export function generateInterface(ipAddress: string, timeoutMS: number): DeviceManager {
	const transport = new socketManager(ipAddress);
	return new DeviceManager(transport, { timeoutMS });
}

function isDockerHostMode(): boolean {
	return !!process.env['DOCKER_HOST_NETWORK'];
}
