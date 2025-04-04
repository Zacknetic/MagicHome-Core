import * as dgram from 'dgram';
import * as net from 'net';

import { NetworkUtils, sleepTimeout } from '../utils';
import { DeviceManager, SocketManager } from '../core';
import {
	ProtoDevice,
	CompleteDevice,
	FetchStateResponse,
	InterfaceOptions,
	DeviceBundle,
} from '../models/types';

const BROADCAST_PORT: number = 48899;
const BROADCAST_MAGIC_STRING: string = 'HF-A11ASSISTHREAD';

export async function discoverDevices(timeout = 1000, customSubnets: string[] = []): Promise<ProtoDevice[]> {
	const userInterfaces: string[] = [];

	if (isDockerHostMode()) {
		userInterfaces.push('255.255.255.255');
	} else {
		for (const subnet of NetworkUtils.subnets()) {
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
			console.log('Sending broadcast to:', userInterface);
			socket.send(BROADCAST_MAGIC_STRING, BROADCAST_PORT, userInterface);
		}
	});

	socket.on('message', (msg, _rinfo) => {
		const parts = msg.toString().split(',');
		const [ipAddress, uniqueId, modelNumber] = parts;
		if (!ipAddress || !uniqueId || !modelNumber) return;
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
export async function generateDeviceBundles(
	protoDevices: ProtoDevice[],
	interfaceOptions: InterfaceOptions,
	retries = 3
): Promise<DeviceBundle[]> {
	if (!protoDevices || protoDevices.length < 1) return [];
	const completedDevices: DeviceBundle[] = [];
	let retryProtoDevices: ProtoDevice[] = [];
	const promiseList: Promise<PromiseSettledResult<DeviceBundle>>[] = [];

	for (const protoDevice of protoDevices) {
		const promise = generateDeviceBundle(protoDevice, interfaceOptions)
			.then(value => ({ status: 'fulfilled', value } as PromiseFulfilledResult<DeviceBundle>))
			.catch(reason => ({ status: 'rejected', reason: { protoDevice, reason } } as PromiseRejectedResult));
		promiseList.push(promise);
	}

	const finalResult = await Promise.all(promiseList);
	finalResult.forEach(result => {
		if (result.status === 'fulfilled') {
			completedDevices.push(result.value);
			// result.value.deviceManager.sendCommand(({ isOn: true, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 } }), { commandType: CommandType.LED, colorAssist: true, isEightByteProtocol: false, waitForResponse: true, maxRetries: 3 });
		} else if (result.reason && result.reason.protoDevice) {
			retryProtoDevices.push(result.reason.protoDevice);
		}
	});
	if (retryProtoDevices.length > 0 && retries > 0) {
		const retriedDevices = await generateDeviceBundles(retryProtoDevices, interfaceOptions, retries - 1);
		completedDevices.push(...retriedDevices);
	}
	
	return completedDevices;
}

async function generateDeviceBundle(protoDevice: ProtoDevice, interfaceOptions: InterfaceOptions): Promise<DeviceBundle> {
	try {
		const transport = new SocketManager(protoDevice.ipAddress);
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
	const transport = new SocketManager(ipAddress);
	return new DeviceManager(transport, { timeoutMS });
}

function isDockerHostMode(): boolean {
	return !!process.env['DOCKER_HOST_NETWORK'];
}
