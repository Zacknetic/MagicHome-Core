import * as dgram from 'dgram';
import { Network } from './Network';
import { DeviceInterface } from './DeviceInterface';
import { Transport } from './Transport';
import { IProtoDevice, ICompleteDevice, ICompleteResponse, ICompleteDeviceInfo, DEFAULT_COMPLETE_RESPONSE } from './types';
import { mergeDeep, sleepTimeout } from './utils/miscUtils';
import { v1 as UUID } from 'uuid';


const BROADCAST_PORT: number = 48899;
const BROADCAST_MAGIC_STRING: string = 'HF-A11ASSISTHREAD';

export async function discoverDevices(timeout = 500, customSubnets: string[] = []): Promise<IProtoDevice[]> {
  const userInterfaces: string[] = [];


  for (const subnet of Network.subnets()) {
    userInterfaces.push(subnet.broadcast);
  }
  userInterfaces.push(...customSubnets);
  const protoDevicesSet = new Set<string>();
  const protoDevicesList: IProtoDevice[] = [];
  const socket: dgram.Socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  socket.bind(BROADCAST_PORT);

  socket.on('error', (err) => {
    socket.close();
    console.log(err)
    return err;
  });

  socket.on('listening', () => {
    socket.setBroadcast(true);
    for (const userInterface of userInterfaces) {
      socket.send(BROADCAST_MAGIC_STRING, BROADCAST_PORT, userInterface);
    }

  });

  socket.on('message', (msg, rinfo) => {
    const address = rinfo.address;
    const parts = msg.toString().split(',');
    if (parts.length !== 3) return;

    const [ipAddress, uniqueId, modelNumber] = parts;
    if (protoDevicesSet.has(uniqueId)) return;

    protoDevicesList.push({
      ipAddress,
      uniqueId,
      modelNumber,
    });

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
export async function completeDevices(protoDevices: IProtoDevice[], timeout = 500): Promise<ICompleteDevice[]> {
  if (protoDevices.length < 1) return;
  const completeDevices: ICompleteDevice[] = [];
  for (const protoDevice of protoDevices) {
    const transport = new Transport(protoDevice.ipAddress);
    const deviceInterface = new DeviceInterface(transport);
    const completeResponse: ICompleteResponse = await deviceInterface.queryState(timeout);

    if (completeResponse.deviceMetaData) {

      const completeDeviceInfo: ICompleteDeviceInfo = { deviceMetaData: completeResponse.deviceMetaData, protoDevice, latestUpdate: Date.now() }
      const completeDevice: ICompleteDevice = { completeResponse, deviceInterface, completeDeviceInfo }
      completeDevices.push(completeDevice);
    }
  };

  return completeDevices;
}

/**
 * 
 * @param protoDevices IProtoDevice[]
 * @param timeout number
 * @returns completeDevice[]
 */
export function completeCustomDevices(completeDevicesInfo: ICompleteDeviceInfo[]): ICompleteDevice[] {
  const completeDevices: ICompleteDevice[] = [];

  for (const completeDeviceInfo of completeDevicesInfo) {
    const { protoDevice: { ipAddress } } = completeDeviceInfo;

    const transport = new Transport(ipAddress);
    const deviceInterface = new DeviceInterface(transport);

    const completeResponse = {};
    mergeDeep(completeResponse, DEFAULT_COMPLETE_RESPONSE);
    const completeDevice: ICompleteDevice = { completeDeviceInfo, deviceInterface, completeResponse: completeResponse as ICompleteResponse }
    completeDevices.push(completeDevice);
  };

  return completeDevices;
}