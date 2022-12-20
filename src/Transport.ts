import net from 'net';
import { DEVICE_COMMAND_BYTES, ICompleteResponse, ITransportResponse } from './types';
import { bufferFromByteArray, mergeDeep, overwriteDeep, ValidationError } from './utils/miscUtils';
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

  public queryState(timeoutMS: number) {
    const response = this.sendWaitResponse(DEVICE_COMMAND_BYTES.COMMAND_QUERY_STATE, timeoutMS).then(res => res).catch(e => { throw e });
    return response;
  }

  public async sendWaitResponse(byteArray: number[], timeoutMS: number) {

    await this.quickSend(byteArray)
      .catch(e => { throw e });
    const responseMsg: Buffer = await this.read(timeoutMS)
      .then(res => res).catch(e => { throw e });
    if (responseMsg.length < 14) throw new ValidationError("response buffer length is less than 14", -9);
    return responseMsg;
  }

  public async quickSend(byteArray: number[]): Promise<void> {

    await this.connect().then(res => res).catch(e => { throw e });
    this.write(byteArray);
  }

  private write(byteArray: number[]): void {
    const payload = bufferFromByteArray(byteArray);
    this.socket.write(payload, 'binary');
  }


  private async read(timeoutMS = 200): Promise<Buffer> {
    const data = await wait(this.socket, 'data', timeoutMS)
      .catch((e) => {
        const error = new ValidationError(e, -8);
        throw error;
      });
      // const error = new ValidationError('test', -8);
      //   throw error;
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
    this.socket.setMaxListeners(100);
    await wait(this.socket, 'connect', SOCKET_TIMEOUT_MS).catch((e) => {
      if (retries > 0) return this.connect(retries - 1);
      else {
        const error = new ValidationError(e, -7);
        throw error;
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

  return await new Promise((resolve, reject) => {
    let complete = false;
    const waitTimeout = setTimeout(() => {
      complete = true; // mark the job as done
      reject(`timed out while awaiting: ${eventName}. Timeout: ${timeout}ms. Retries: ${SOCKET_CONNECTION_RETRIES}`);
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

  }).catch(e => {
    throw e;
  });

}