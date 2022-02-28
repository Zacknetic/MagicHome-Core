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
      console.log('connected!')
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
    return result;
  }

  send(byteArray: number[], timeoutMS, expectResponse: boolean = false) {
    console.log(timeoutMS)
    return this.queue.add(() => (
      this.connect(() => {
        this.write(byteArray, timeoutMS);
        // let response;
        // // if (!expectResponse) {
        // //   response = writeReturn;
        // // } else {
          const response = this.read(timeoutMS);
          console.log('response',response)
        // // }

        // return response;
      })
        .then(response => {
          return { response, queueSize: this.queue.getQueueLength() }
        })
    ));
  }

  write(byteArray: number[], timeoutMS) {
    return new Promise((resolve, reject) => {
      const payload = bufferFromByteArray(byteArray)
      // if (timeoutMS > 0) {
        const ret = this.socket.write('HF-A11ASSISTHREAD');
        console.log(ret)
      // } else {
      //   this.socket.write(payload, 'binary');
      //   resolve(3)
      // }


      // // wait for drain event which means all data has been sent
      // if (!sent) {
      //   wait(this.socket, 'drain', _timeout);
      // }
    })

  }

  private writeCallback() {
    console.log('running callback')
    return 2;
  }

  async read(_timeout = 200) {
    console.log('read')
    const data = wait(this.socket, 'data', _timeout);
    console.log('data',data)
    return data;
  }

  disconnect() {
    this.socket.end();
    this.socket.destroy();
  }

}

