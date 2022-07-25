import net from 'net';
import Queue from 'promise-queue';
import { bufferFromByteArray } from './utils/miscUtils';
// import net from './tests/mock-net';

const PORT = 5577;
const SOCKET_TIMEOUT = 2000;
function wait(emitter: net.Socket, eventName: string, timeout: number) {

  return new Promise((resolve, reject) => {
    let complete = false;
    const waitTimeout: any = setTimeout(() => {
      complete = true; // mark the job as done
      reject(-1);
    }, timeout);

    // listen for the first event, then stop listening (once)
    emitter.once(eventName, (args: any) => {
      clearTimeout(waitTimeout); // stop the timeout from executing
      if (!complete) {
        complete = true; // mark the job as done
        resolve(args);
      }
    });

    emitter.once('close', () => {
      clearTimeout(waitTimeout); // stop the timeout from executing
      // if the socket closed before we resolved the promise, reject the promise
      if (!complete) {
        complete = true;
        reject(null);
      }
    });

    // handle the first error and reject the promise
    emitter.on('error', (e) => {
      clearTimeout(waitTimeout); // stop the timeout from executing
      if (!complete) {
        complete = true;
        console.error('error', e)
        reject(e);
      }
    });


  });
}

export class Transport {
  host: any;
  socket: net.Socket;
  queue: any;
  /**
   * @param {string} host - hostname
   * @param {number} timeout - connection timeout (in seconds)
   */
  constructor(host: any) {
    this.host = host;
    this.socket = null;
    this.queue = new Queue(1, Infinity); // 1 concurrent, infinite size
  }

  async connect(fn: any, _timeout = 200) {
    const options = {
      host: this.host,
      port: PORT,
      timeout: SOCKET_TIMEOUT,
    };

    let result;

    // try {
    if (!this.socket) {
      this.socket = net.connect(options);
      this.socket.setMaxListeners(100)
      await wait(this.socket, 'connect', SOCKET_TIMEOUT);
    }
    result = await fn();
    this.disconnect()
    return result;
  }

  send(byteArray: number[], timeoutMS, expectResponse: boolean = false) {
 
    return this.queue.add(() => (
      this.connect(() => {
        this.write(byteArray, timeoutMS);
        let response;
        if (!expectResponse) {
          response = 2;
        } else {
          response = this.read(timeoutMS);
        }

        return response;
      })
        .then(response => {

          return { response, queueSize: this.queue.getQueueLength() }
        })
    ));
  }

  async write(byteArray: number[], timeoutMS): Promise<boolean> {
    const payload = await bufferFromByteArray(byteArray);
    const ret = await this.socket.write(payload, 'binary');
    return ret;


    // // wait for drain event which means all data has been sent
    // if (!sent) {
    //   wait(this.socket, 'drain', _timeout);
    // }


  }

  private writeCallback() {
    console.log('running callback')
    return 2;
  }

  read(_timeout = 200) {
    const data = wait(this.socket, 'data', _timeout);
    return data;
  }

  disconnect() {
    this.socket.end();
    this.socket.destroy();
    this.socket = null;
  }

}

