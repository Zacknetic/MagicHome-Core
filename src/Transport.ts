import net from 'net';
import Queue from 'promise-queue';
import { ITransportResponse } from './types';
import { bufferFromByteArray } from './utils/miscUtils';
// import net from './tests/mock-net';

const PORT = 5577;
const SOCKET_TIMEOUT = 2000;
export class Transport {
  host: any;
  socket: net.Socket;
  queue: any;
  waitTimeout: any;
  /**
   * @param {string} host - hostname
   * @param {number} timeout - connection timeout (in seconds)
   */
  constructor(host: any) {
    this.host = host;
    this.socket = null;
  }

  connect(_timeout = 200) {
    const options = {
      host: this.host,
      port: PORT,
      timeout: SOCKET_TIMEOUT,
    };

    let result;

    if (!this.socket) {
      this.socket = net.connect(options);
      this.socket.setMaxListeners(100)
      this.wait(this.socket, 'connect', SOCKET_TIMEOUT);
    }

    // clearTimeout(this.waitTimeout);

    setTimeout(() => {
      if (this.socket) {
  
        this.socket.destroy();
        this.socket = null;
      }
    }, SOCKET_TIMEOUT)


    return result;
  }

  async send(byteArray: number[], timeoutMS, expectResponse: boolean = false): Promise<ITransportResponse> {


    this.connect();
    this.write(byteArray);

    let transportResponse: ITransportResponse = { responseCode: 2, responseMsg: Buffer.from("0") };

    if (expectResponse) {
      const responseMsg = await this.read(timeoutMS);
      Object.assign(transportResponse, { responseMsg, responseCode: 1 })
    }

    return transportResponse;
  }

  write(byteArray: number[]): void {
    const payload = bufferFromByteArray(byteArray);
    this.socket.write(payload, 'binary');
  }

  read(timeoutMS = 200) {
    const data = this.wait(this.socket, 'data', timeoutMS);
    return data;
  }

  wait(emitter: net.Socket, eventName: string, timeout: number) {

    return new Promise((resolve, reject) => {
      let complete = false;
      this.waitTimeout = setTimeout(() => {
        complete = true; // mark the job as done
        reject(-1);
      }, timeout);

      // listen for the first event, then stop listening (once)
      emitter.once(eventName, (args: any) => {
        clearTimeout(this.waitTimeout); // stop the timeout from executing

        if (!complete) {
          complete = true; // mark the job as done
          resolve(args);
        }
      });

      // handle the first error and reject the promise
      emitter.on('error', (e) => {
        clearTimeout(this.waitTimeout); // stop the timeout from executing

        if (!complete) {
          complete = true;
          reject(e);
        }
      });


    });
  }

}