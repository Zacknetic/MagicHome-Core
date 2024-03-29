import * as dgram from 'dgram';
import * as net from 'net';
import { Network } from './Network';
import { DeviceInterface } from './DeviceInterface';
import { Transport } from './Transport';
import {
	IProtoDevice,
	ICompleteDevice,
	ICompleteResponse,
	ICompleteDeviceInfo,
	DEFAULT_COMPLETE_RESPONSE,
	IFetchStateResponse,
} from './types';
import {
	mergeDeep,
	cloneDeep,
	combineDeep,
	sleepTimeout,
} from './utils/miscUtils';
import { generateCompleteResponse } from './utils/MHResponses';

const BROADCAST_PORT: number = 48899;
const BROADCAST_MAGIC_STRING: string = 'HF-A11ASSISTHREAD';

let testCounter = 0;
export async function discoverDevices(
	timeout = 1000,
	customSubnets: string[] = []
): Promise<IProtoDevice[]> {
	const userInterfaces: string[] = [];

	if (dockerHostMode()) {
		userInterfaces.push('255.255.255.255');
	} else {
		for (const subnet of Network.subnets()) {
			userInterfaces.push(subnet.broadcast);
		}
		userInterfaces.push(...customSubnets);
	}

	const protoDevicesSet = new Set<string>();
	const protoDevicesList: IProtoDevice[] = [];
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

	socket.on('message', (msg, rinfo) => {
    if(testCounter > 3) return;
		const parts = msg.toString().split(',');
		const [ipAddress, uniqueId, modelNumber] = parts;
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

	await sleepTimeout(timeout).catch((e) => {
		throw 'sleep somehow failed';
	});
	socket.close();
	return protoDevicesList;
}

/**
 *
 * @param protoDevices IProtoDevice[]
 * @param timeout number
 * @returns completeDevice[]
 */

export async function completeDevices(
	protoDevices: IProtoDevice[],
	timeout = 500,
	retries = 3
): Promise<ICompleteDevice[]> {

	if (!protoDevices || protoDevices.length < 1) return;

	const deviceResponses: Promise<ICompleteDevice>[] = [];
	const completedDevices: ICompleteDevice[] = [];
	const retryProtoDevices: IProtoDevice[] = [];

	protoDevices.forEach((protoDevice) => {
		deviceResponses.push(
			completeDevice(protoDevice, timeout).catch((e) => {
				throw Error('DeviceDiscoveryError: ' + e);
			})
		);
	});

	await Promise.allSettled(deviceResponses).then((results) => {
		results.forEach((result) => {
			if (result.status === 'fulfilled') completedDevices.push(result.value);
			else retryProtoDevices.push(result.reason.protoDevice);
		});
	});
	if (retryProtoDevices.length > 0 && retries > 0)
		completedDevices.push(
			...(await completeDevices(retryProtoDevices, timeout, retries - 1).catch(
				(e) => {
					throw Error('DeviceDiscoveryError: ' + e);
				}
			))
		);

	return completedDevices;
}

async function completeDevice(
	protoDevice: IProtoDevice,
	timeout
): Promise<ICompleteDevice> {
	try {
		const transport = new Transport(protoDevice.ipAddress);
		const deviceInterface = new DeviceInterface(transport);

		const fetchStateResponse: IFetchStateResponse =
			await deviceInterface.queryState(timeout);
		const completeDeviceInfo: ICompleteDeviceInfo = {
			deviceMetaData: fetchStateResponse.deviceMetaData,
			protoDevice,
			latestUpdate: Date.now(),
		};
		const completeResponse: ICompleteResponse = generateCompleteResponse({
			fetchStateResponse,
			responseCode: 1,
			deviceCommand: null,
			responseMsg: 'completeDevice',
		});
		const completeDevice: ICompleteDevice = {
			completeResponse,
			deviceInterface,
			completeDeviceInfo,
		};
		return completeDevice;
	} catch (e) {
		throw Error('completeDeviceError: ' + e);
	}
}

/**
 * @param protoDevices IProtoDevice[]
 * @param timeout number
 * @returns completeDevice[]
 */
export function completeCustomDevices(
	completeDevicesInfo: ICompleteDeviceInfo[]
): ICompleteDevice[] {
	const completeDevices: ICompleteDevice[] = [];

	for (const completeDeviceInfo of completeDevicesInfo) {
		const {
			protoDevice: { ipAddress },
		} = completeDeviceInfo;

		const transport = new Transport(ipAddress);
		const deviceInterface = new DeviceInterface(transport);

		const completeResponse: ICompleteResponse = cloneDeep(
			DEFAULT_COMPLETE_RESPONSE
		);
		const completeDevice: ICompleteDevice = {
			completeDeviceInfo,
			deviceInterface,
			completeResponse,
		};
		completeDevices.push(completeDevice);
	}

	return completeDevices;
}

function dockerHostMode(): boolean {
	return !!process.env.DOCKER_HOST_NETWORK;
}
