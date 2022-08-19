import net from 'net';
import { ITransportResponse } from './types';
import { bufferFromByteArray, mergeDeep, overwriteDeep } from './utils/miscUtils';
// import net from './tests/mock-net';

const PORT = 5577;
const SOCKET_TIMEOUT = 2000;
export class Transport {
  host: any;
  socket: net.Socket;
  queue: any;
  waitTimeout: any;
  socketTimeout: NodeJS.Timeout;
  /**
   * @param {string} host - hostname
   * @param {number} timeout - connection timeout (in seconds)
   */
  constructor(host: any) {
    this.host = host;
    this.socket = null;
  }

  async connect(_timeout = 200) {

    const options = {
      host: this.host,
      port: PORT,
      timeout: SOCKET_TIMEOUT,
    };

    let result;

    if (!this.socket) {
      this.socket = net.connect(options);
      this.socket.setMaxListeners(100)
      await this.wait(this.socket, 'connect', SOCKET_TIMEOUT);
    }
    clearTimeout(this.socketTimeout);


    this.socketTimeout = setTimeout(() => {
      if (this.socket) {
        this.socket.end();
        this.socket.destroy();
        this.socket = null;
      }
    }, SOCKET_TIMEOUT)


    return result;
  }

  async send(byteArray: number[], timeoutMS, expectResponse: boolean = false): Promise<ITransportResponse> {


    await this.connect().catch(e => {});
    this.write(byteArray);

    let transportResponse: ITransportResponse = { responseCode: 2, responseMsg: null };

    if (expectResponse) {
      const responseMsg = await this.read(timeoutMS);
      transportResponse = mergeDeep({ responseMsg, responseCode: 1 }, transportResponse)
    }

    return transportResponse;
  }

  write(byteArray: number[]): void {
    const payload = bufferFromByteArray(byteArray);
    this.socket.write(payload, 'binary');
  }

  async read(timeoutMS = 200) {
    const data = await this.wait(this.socket, 'data', timeoutMS);
    this.socket.removeListener('data', () => { })
    return data;
  }

  wait(emitter: net.Socket, eventName: string, timeout: number) {

    let waitTimeout;
    return new Promise((resolve, reject) => {
      let complete = false;

      waitTimeout = setTimeout(() => {
        complete = true; // mark the job as done
        reject(`timed out while awaiting: ${eventName}`,);
      }, timeout);

      // listen for the first event, then stop listening (once)
      emitter.once(eventName, (args: any) => {
        clearTimeout(waitTimeout); // stop the timeout from executing
        if (!complete) {
          complete = true; // mark the job as done
          resolve(args);
        }
      });

      // handle the first error and reject the promise
      emitter.on('error', (e) => {
        clearTimeout(waitTimeout); // stop the timeout from executing
        if (!complete) {
          complete = true;
          reject(e);
        }
      });


    });

  }


}