import * as dgram from 'dgram';
import { Network } from './Network';

import { IDeviceDiscoveredProps } from './types';

const BROADCAST_PORT: number = 48899;
const BROADCAST_MAGIC_STRING: string = 'HF-A11ASSISTHREAD';

export class DeviceDiscovery {
  protected userInterfaces: string[] = [];
  protected socket: dgram.Socket;
  protected discoveredDevicesMap = new Map<string, IDeviceDiscoveredProps>();
  protected completeDetails: IDeviceDiscoveredProps[] = [];

  constructor(customSubnets: string[] = []) {
    for (const subnet of Network.subnets()) {
      this.userInterfaces.push(subnet.broadcast);
    }
    this.userInterfaces.push(...customSubnets);
  }

  async scanModel(timeout = 2000) {

    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.socket.bind(BROADCAST_PORT);

    this.socket.on('error', (err) => {
      this.socket.close();
      console.log(err)
      return err;
    });

    this.socket.on('listening', () => {
      this.socket.setBroadcast(true);
      for (const userInterface of this.userInterfaces) {
        this.socket.send(BROADCAST_MAGIC_STRING, BROADCAST_PORT, userInterface);
      }

    });

    this.socket.on('message', (msg, rinfo) => {
      const address = rinfo.address;

      const parts = msg.toString().split(',');
      if (parts.length !== 3) return;

      const [ipAddress, uniqueId, modelNumber] = parts;
      if (this.discoveredDevicesMap.has(address)) return;

      this.discoveredDevicesMap.set(address, {
        ipAddress,
        uniqueId,
        modelNumber,
      });
    });

    await sleepTimeout(timeout);
    this.socket.close();

    return this.discoveredDevicesMap;
  }

}

function sleepTimeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}