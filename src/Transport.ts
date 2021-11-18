import net from 'net';
import Queue from 'promise-queue';
import { bufferFromByteArray } from './utils/miscUtils';

const COMMAND_QUERY_STATE: Uint8Array = Uint8Array.from([0x81, 0x8a, 0x8b]);

const PORT = 5577;

function wait(emitter: net.Socket, eventName: string, timeout: number) {

  return new Promise((resolve, reject) => {
    let complete = false;

    const waitTimeout: any = setTimeout(() => {
      complete = true; // mark the job as done
      resolve(null);
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
        reject(e);
      }
    });

  });
}

export class Transport {
  host: any;
  socket: any;
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
      timeout: _timeout,
    };

    let result;
    try {
      if (!this.socket) {
        this.socket = net.connect(options);
        await wait(this.socket, 'connect', _timeout = 200);
      }
      result = await fn();
      return result;
    } catch (e) {
      this.disconnect();
      const { code, address, port } = e;
      if (code) {
        // No need to show error here, shown upstream
        // this.log.debug(`Unable to connect to ${address} ${port} (code: ${code})`);
      } else {
        // this.logs.error('transport.ts error:', e);
      }
    } finally {
      if (this.queue.getQueueLength() === 0) {
        this.disconnect();
      }
    }

    return null;
  }



  send(byteArray: any, _timeout?) {
    return this.queue.add(async () => (
      this.connect(async () => {
        await this.write(byteArray);
        if (!_timeout) return null
        return this.read(_timeout);
      })
        .then(response => {
          return { response, queueSize: this.queue.getQueueLength() }
        })
    ));
  }

  async write(byteArray: any, _timeout = 200) {
    let sent;

    const payload = bufferFromByteArray(byteArray)
    sent = this.socket.write(payload);


    // wait for drain event which means all data has been sent
    if (sent !== true) {
      await wait(this.socket, 'drain', _timeout);
    }
  }

  async read(_timeout = 200) {
    const data = await wait(this.socket, 'data', _timeout);

    return data;
  }
  disconnect() {
    this.socket.end();
    this.socket.destroy();
    this.socket = null;
  }

}