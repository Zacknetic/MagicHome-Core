// import * as net from './tests/mock-net';
import { ICommandOptions } from './types';
import { checksum } from './utils';

import { MockNet } from './tests/mock-net';
// import Net from Net;
const net = new MockNet();

const COMMAND_QUERY_STATE = [0x81, 0x8a, 0x8b];

const COMMAND_INTERVAL = 30;
const RESPONSE_TIMEOUT = 500;

const PORT = 5577;

// const SLOW_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 20, bufferMS: 0, timeoutMS: 2000 };
// const MEDIUM_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 100 };
// const FAST_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 20 };


export class Transport {
  protected host;
  protected commandQueue = []
  protected eventEmitter = null;
  protected receivedData = Buffer.alloc(0);
  protected receiveTimeout = null;
  protected connectTimeout = null;
  protected commandTimeout = null;
  protected preventDataSending = false;
  constructor(host) {
    this.host = host;

  }

  async _sendCommand(buffer, expect_reply, resolve, reject, socketConnectionTimeout = null) {
    // calculate checksum
    let checksum = 0;
    for (let byte of buffer.values()) {
      checksum += byte;
    }
    checksum &= 0xFF;
    let command = Buffer.concat([buffer, Buffer.from([checksum])]);

    if (this.commandQueue.length == 0 && this.eventEmitter == null) {
      this.commandQueue.push({ expect_reply, resolve, reject, command, firstCommand: true });

      this.preventDataSending = false;
      this.eventEmitter = net.connect(PORT, this.host);

      this.eventEmitter.on('connect', () => {
        if (this.connectTimeout != null) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }

        this.eventEmitter.on('error', (err) => {
          this._socketErrorHandler(err, reject);
        });

        this.eventEmitter.on('data', (data) => {
          this._receiveData(false, data);
        });
        if (!this.preventDataSending) {
          this._handleNextCommand();
        }
      });

      if (socketConnectionTimeout) {
        this.connectTimeout = setTimeout(() => {
          this._socketErrorHandler(new Error("Connection timeout reached"), reject);
        }, socketConnectionTimeout);

      }
    } else {
      this.commandQueue.push({ expect_reply, resolve, reject, command });
    }
    return this.eventEmitter;
  }


  _receiveData(empty, data?) {
    if (this.commandTimeout !== null) {
      clearTimeout(this.commandTimeout);
      this.commandTimeout = null;
    }

    if (empty) {
      let finished_command = this.commandQueue[0];

      if (finished_command != undefined) {
        const resolve = finished_command.resolve;

        if (finished_command.expect_reply) {
          if (resolve != undefined) {
            resolve(this.receivedData);
          }
        } else {
          resolve(this.commandQueue.length)
        }
      }

      this.receivedData = Buffer.alloc(0);

      this.commandQueue.shift();
      this._handleNextCommand();

    } else {
      this.receivedData = Buffer.concat([this.receivedData, data]);
      if (this.receiveTimeout != null) clearTimeout(this.receiveTimeout);

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

    this._handleNextCommand();
  }

  _handleNextCommand(timeout = null) {

    if (this.commandQueue.length == 0) {
      this.closeSocket();
    } else {
      let cmd = this.commandQueue[0];

      let commandInterval = cmd.firstCommand == true ? 0 : COMMAND_INTERVAL;
      setTimeout(() => {
        if (!cmd.expect_reply) {
          this.eventEmitter.write(cmd.command, "binary", () => {
            this._receiveData(true);
          });
        } else {
          this.eventEmitter.write(cmd.command, "binary", () => {
            if (timeout === null) return;

            this.commandTimeout = setTimeout(() => {
              this._handleCommandTimeout();
            }, timeout);
          });
        }
      }, commandInterval);
    }

  }

  _socketErrorHandler(err, reject) {
    this.preventDataSending = true;

    reject(err);

    this.closeSocket()
    // also reject all commands currently in the queue
    for (let c of this.commandQueue) {
      let reject = c.reject;
      if (reject != undefined) {
        reject(err);
      }
    }

    this.commandQueue = []; // reset commandqueue so commands dont get stuck if the controller becomes unavailable
  }

  public closeSocket() {
    if (this.eventEmitter != null) this.eventEmitter.end();
    this.eventEmitter = null;
  }

}

