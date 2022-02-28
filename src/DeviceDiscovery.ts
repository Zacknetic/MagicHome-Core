import * as dgram from 'dgram';
import { Network } from './Network';

import { IDeviceDiscoveredProps } from './types';

const BROADCAST_PORT: number = 48899;
const BROADCAST_MAGIC_STRING: string = 'HF-A11ASSISTHREAD';
const EXTENDED_MAGIC_STRING: string = 'AT+LVER\r';

export class DeviceDiscovery {
  protected userInterfaces: string[] = [];
  protected socket: dgram.Socket;
  protected discoveredDeviceMap = new Map<string, IDeviceDiscoveredProps>();
  protected discoveredDetailsMap = new Map<string, IDeviceDiscoveredProps>();
  protected completeDetails: IDeviceDiscoveredProps[] = [];

  constructor(customSubnets: string[] = []) {
    for (const subnet of Network.subnets()) {
      this.userInterfaces.push(subnet.broadcast);
    }
    this.userInterfaces.push(...customSubnets);
  }

  async scan(timeout = 500) {


      await this.scanModel();
      // await this.createScan(EXTENDED_MAGIC_STRING, this.setStateB);
  
      console.log(this.discoveredDeviceMap)

      // resolve
      // console.log(discoveredDeviceMap2)
  




  }



 


  async scanModel() {

      setTimeout(() => {
        this.socket.close();
        return;
      }, 5000);

      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      this.socket.bind(BROADCAST_PORT);
  
  
      this.socket.on('error', (err) => {
        this.socket.close();
        return err;
      });
  
      this.socket.on('listening', () => {
        this.socket.setBroadcast(true);
        for (const userInterface of this.userInterfaces) {
          //this.logs.debug('Scanning broadcast-address: %o for Magichome devices...', userInterface.broadcast);
          this.socket.send(BROADCAST_MAGIC_STRING, BROADCAST_PORT, userInterface);
        }
  
  
      });

      this.socket.on('message', (msg, rinfo) => {
        const address = rinfo.address;
        const parts = msg.toString().split(',');
        if (parts.length !== 3) {
          return;
        }
        const [ipAddress, uniqueId, modelNumber] = parts;

        // if (this.discoveredDetailsMap.has(address)) {

        //   // const { hardwareVersion, firmwareVersion, latestUpdate} = this.discoveredDetailsMap.get(address)
        //   const deets = this.discoveredDetailsMap.get(address)
        //   this.completeDetails.push({ ...parts, ...deets, })
        //   this.discoveredDetailsMap.delete(address);
        // } else {
        this.discoveredDeviceMap.set(address, {
          ipAddress,
          uniqueId,
          modelNumber,
        });
      });

      // }

      // clients.push({ ipAddress, uniqueId, modelNumber });



  }


  setStateB(msg, rinfo) {
    return new Promise((resolve, reject) => {

      // this.discoveredDetailsMap.set(rinfo.address, {
      console.log(msg.toString());
      // });

      setTimeout(() => {
        this.socket.close();
        resolve;
      }, 500);
    });
  }

  
}

async function createScan(timeout = 500, broadcastString, currentDiscoveryMap: IDeviceDiscoveredProps):  Promise<String[]> {

  return new Promise((resolve, reject) => {
    const userInterfaces = Network.subnets();
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const clients = [];
    socket.on('error', (err) => {
      socket.close();
      reject(err);
    });

    socket.on('message', (msg) => {
      const parts = msg.toString().split(',');

      if (parts.length !== 3) {
        return;
      }
      const [ipAddress, uniqueId, modelNumber] = parts;
      clients.push({ipAddress, uniqueId, modelNumber})
      
    });

    socket.on('listening', () => {
      socket.setBroadcast(true);
      
      const addressAlreadyScanned: string[] = [];
      for (const userInterface of userInterfaces){
        if( addressAlreadyScanned.includes(userInterface.broadcast)){
          //this.logs.debug('Skipping redundant scan of broadcast-address %o for Magichome devices.', userInterface.broadcast);
          continue;
        }
        addressAlreadyScanned.push(userInterface.broadcast);
        //this.logs.debug('Scanning broadcast-address: %o for Magichome devices...', userInterface.broadcast);
        socket.send(BROADCAST_MAGIC_STRING, BROADCAST_PORT, userInterface.broadcast);
      }
    });

    socket.bind(BROADCAST_PORT);

    setTimeout(() => {
      socket.close();
      resolve(clients);
    }, timeout);
  });
}