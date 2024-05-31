import dgram from 'dgram';
import { NetworkError } from './errors/Errors';

class SocketManager {
  private static instance: SocketManager;
  private client: dgram.Socket;
  private responseCallbacks: ((msg: Buffer, rinfo: dgram.RemoteInfo) => void)[] = [];

  private constructor() {
    this.client = dgram.createSocket('udp4');
    this.client.on('error', (err) => {
      this.client.close();
      throw new NetworkError(`Socket error: ${err.message}`);
    });
    this.client.on('message', (msg, rinfo) => {
      this.responseCallbacks.forEach(callback => callback(msg, rinfo));
    });
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public send(message: Buffer, port: number, address: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.send(message, port, address, (err) => {
        if (err) {
          reject(new NetworkError(`UDP Send Error: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  public onMessage(callback: (msg: Buffer, rinfo: dgram.RemoteInfo) => void): void {
    this.responseCallbacks.push(callback);
  }

  public close(): void {
    this.client.close();
  }
}

export default SocketManager;
