import * as net from 'net';
import Queue from 'queue-promise';
import { ICommandOptions } from './types';
import { checksum } from './utils';

const COMMAND_QUERY_STATE: Uint8Array = Uint8Array.from([0x81, 0x8a, 0x8b]);

const QUEUE_INTERVAL = 50;
const RESPONSE_TIMEOUT = 50;

const PORT = 5577;

const SLOW_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 20, bufferMS: 0, timeoutMS: 2000 };
const MEDIUM_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 100 };
const FAST_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 20 };


export class Transport {

  protected queue;
  protected host;
  protected commandQueue = []
  protected socket = null;
  protected receivedData = Buffer.alloc(0);
  protected receiveTimeout = null;
  protected connectTimeout = null;
  protected commandTimeout = null;
  protected preventDataSending = false;


  /**
   * @param {string} host - hostname
   */
  constructor(host: string) {
    this.host = host;
  }

  send(buffer: Buffer, expect_reply, useChecksum = true, timeout = null) {
    let command;

    return this.queue.enqueue(async () => {
      if (useChecksum) {
        const chk = checksum(buffer);
        command = Buffer.concat([buffer, Buffer.from([chk])]);
      } else {
        command = buffer;
      }

      return new Promise((resolve, reject) => {

        if (this.commandQueue.length == 0 && this.socket == null) {
          this.commandQueue.push({ expect_reply, useChecksum, resolve, reject, command });

          this.preventDataSending = false;

          this.socket = net.connect(PORT, this.host, () => {
            if (this.connectTimeout != null) {
              clearTimeout(this.connectTimeout);
              this.connectTimeout = null;
            }

            if (!this.preventDataSending) { // prevent "write after end" errors
              this._handleNextCommand(); // which is the "first" command in this case
            }
          });

          this.socket.on('error', (err) => {
            this._socketErrorHandler(err, reject);
          });

          this.socket.on('data', (data) => {
            this._receiveData(false, data);
          });

          if (timeout) {
            this.connectTimeout = setTimeout(() => {
              this._socketErrorHandler(new Error("Connection timeout reached"), reject);
            }, timeout);
          }
        } else {
          this.commandQueue.push({ expect_reply, useChecksum, resolve, reject, command });
        }
      })
       
  });
}

_receiveData(empty, data ?) {
  if (this.commandTimeout !== null) { // we have received _something_ so the command cannot timeout anymore
    clearTimeout(this.commandTimeout);
    this.commandTimeout = null;
  }

  if (empty) {
    // no data, so request is instantly finished
    // this can happend when a command is sent without waiting for a reply or when a timeout is reached
    let finished_command = this.commandQueue[0];

    if (finished_command != undefined) {
      const resolve = finished_command.resolve;
      if (resolve != undefined) {
        resolve(this.receivedData);
      }
    }

    // clear received data
    this.receivedData = Buffer.alloc(0);

    this.commandQueue.shift();

    this._handleNextCommand();
  } else {
    this.receivedData = Buffer.concat([this.receivedData, data]);

    if (this.receiveTimeout != null) clearTimeout(this.receiveTimeout);

    // since we don't know how long the response is going to be, set a timeout after which we consider the
    // whole message to be received
    this.receiveTimeout = setTimeout(() => {
      this._receiveData(true);
    }, RESPONSE_TIMEOUT);
  }
}

_handleCommandTimeout() {
  this.commandTimeout = null;

  let timedout_command = this.commandQueue[0];

  if (timedout_command !== undefined) {
    const reject = timedout_command.reject;
    if (reject != undefined) {
      reject(new Error("Command timed out"));
    }
  }

  this.receivedData = Buffer.alloc(0); // just for good measure

  this.commandQueue.shift();

  this._handleNextCommand();
}

_handleNextCommand(timeout = null) {
  if (this.commandQueue.length == 0) {
    if (this.socket != null) this.socket.end();
    this.socket = null;
  } else {
    let cmd = this.commandQueue[0];

    if (!cmd.expect_reply) {
      this.socket.write(cmd.command, "binary", () => {
        this._receiveData(true);
      });
    } else {
      this.socket.write(cmd.command, "binary", () => {
        if (timeout === null) return;

        this.commandTimeout = setTimeout(() => {
          this._handleCommandTimeout();
        }, timeout);
      });
    }
  }
}

_socketErrorHandler(err, reject) {
  this.preventDataSending = true;

  reject(err);

  if (this.socket != null) this.socket.end();
  this.socket = null;

  // also reject all commands currently in the queue
  for (let c of this.commandQueue) {
    let reject = c.reject;
    if (reject != undefined) {
      reject(err);
    }
  }

  this.commandQueue = []; // reset commandqueue so commands dont get stuck if the controller becomes unavailable
}

getState(_timeout = 500) {
  try {
    const buffer = Buffer.from(COMMAND_QUERY_STATE)
    const data = this.send(buffer, true, true, _timeout);
    if (data == null) {
      return null;
    }
    return data;
  } catch (error) {

  }
}

  private setupCommandQueue() {

  this.queue = new Queue({
    concurrent: 1,
    interval: QUEUE_INTERVAL,
    start: false
  });

}
}