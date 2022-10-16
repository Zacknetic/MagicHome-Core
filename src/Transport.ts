import net from 'net';
import { DEVICE_COMMAND_BYTES, ICompleteResponse, ITransportResponse } from './types';
import { bufferFromByteArray, mergeDeep, overwriteDeep } from './utils/miscUtils';
// import net from './tests/mock-net';

const PORT = 5577;
const SOCKET_TIMEOUT_MS = 2000;
const SOCKET_CONNECTION_RETRIES = 2;

export class Transport {
  protected host: any;
  protected socket: net.Socket;
  protected socketTimeout: NodeJS.Timeout;


  /**
   * @param {string} host - hostname
   * @param {number} timeout - connection timeout (in seconds)
   */
  constructor(host: any) {
    this.host = host;
    this.socket = null;
  }

  /**
   * 
   * @param byteArray 
   * @param timeoutMS 
   * @param waitForResponse 
   * @returns 
   */

  public async queryState(timeoutMS: number) {
    const response = await this.sendWaitResponse(DEVICE_COMMAND_BYTES.COMMAND_QUERY_STATE, timeoutMS).catch(e => {
      // throw new Error(e);
    });
    return response;
  }

  public async sendWaitResponse(byteArray: number[], timeoutMS: number) {

    this.quickSend(byteArray);
    const responseMsg: Buffer = await this.read(timeoutMS).catch(e => {
      // throw new Error(e);

    }) as Buffer;
    if (responseMsg.length < 14) throw { responseMsg: 'response buffer length is less than 14', responseCode: -7, deviceState: null, deviceMetaData: null }


    const transportResponse: ITransportResponse = { responseMsg, responseCode: 1 }

    return transportResponse;
  }

  public async quickSend(byteArray: number[]): Promise<void> {

    await this.connect();
    this.write(byteArray);
  }

  private write(byteArray: number[]): void {
    const payload = bufferFromByteArray(byteArray);
    this.socket.write(payload, 'binary');
  }


  private async read(timeoutMS = 200): Promise<Buffer> {
    const data = await wait(this.socket, 'data', timeoutMS).catch(e => { 
      // throw new Error(e) 
    }
      );
    return data as Buffer;
  }

  private async connect(retries = SOCKET_CONNECTION_RETRIES) {

    this.resetSocketTimeout();
    if (this.socket) return;
    const options = {
      host: this.host,
      port: PORT,
      timeout: SOCKET_TIMEOUT_MS,
    };

    this.socket = net.connect(options);
    this.socket.setMaxListeners(100)
    await wait(this.socket, 'connect', SOCKET_TIMEOUT_MS).catch((e) => {
      if (retries > 0) return this.connect(retries - 1);
      else {
        const completeResponse: ICompleteResponse = { responseMsg: e, responseCode: -7, deviceState: null, deviceMetaData: null }
        // throw new Error(e);
      }
    });;
  }

  resetSocketTimeout() {
    clearTimeout(this.socketTimeout);
    this.socketTimeout = setTimeout(() => {
      this.socket.removeAllListeners();
      this.socket.end();
      this.socket.destroy();
      this.socket = null;
    }, SOCKET_TIMEOUT_MS);
  }
}

async function wait(emitter: net.Socket, eventName: string, timeout: number) {
  try {
    return await new Promise((resolve, reject) => {
      let complete = false;

      const waitTimeout = setTimeout(() => {
        complete = true; // mark the job as done
        reject(`timed out while awaiting: ${eventName}. Timeout time was ${timeout}ms.`);
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
          reject(`Received error while awaiting: ${eventName}. Error: ${e}`);
        }
      });

    });
  } catch (error) {
    // throw Error(error);
  }
}