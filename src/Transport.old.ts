// import * as net from './tests/mock-net';
import { ICommandOptions } from './types';

// import { MockNet } from './tests/mock-net';
import * as net from 'net';
import { calcChecksum } from './utils/miscUtils';

// const net = new MockNet();

const RESPONSE_TIMEOUT = 500;
const SOCKET_TIMEOUT = 2000;

const PORT = 5577;

export class Transport {
  protected host;
  protected eventEmitter = null;
  protected receivedData = Buffer.alloc(0);

  protected receiveTimeout = null;
  protected connectTimeout = null;
  protected commandTimeout = null;
  protected preventDataSending = false;
  
  constructor(host) {
    this.host = host;
  }

  sendCommand(byteArray: number[], resolve, reject, timeout = null) {

    if (this.preventDataSending) {
      reject(new Error('device is busy'))
    }
    this.preventDataSending = true;
    if (!(byteArray instanceof Array)) {
      reject(new Error('byteArray is of wrong data type'));
    }

    if (this.eventEmitter == null) {
      console.log('socket does not exist recreating...')

      this.eventEmitter = net.connect(PORT, this.host);

      this.eventEmitter.on('connect', () => {

        if (this.connectTimeout != null) {
          clearTimeout(this.connectTimeout);
          this.connectTimeout = null;
        }

        this.writeCommand(byteArray, resolve, reject, timeout)

      });


      this.connectTimeout = setTimeout(() => {
        this._socketErrorHandler(new Error("Connection timeout reached"), reject);
      }, SOCKET_TIMEOUT);

    } else {
      console.log('socket exists so just writing...')
      this.writeCommand(byteArray, resolve, reject, timeout)
    }

  }

  async writeCommand(byteArray: number[], resolve, reject, timeout?) {
    const buffer = Buffer.from(byteArray);
    const finalBuffer = calcChecksum(buffer)


    if (timeout) {
      await this.eventEmitter.write(finalBuffer, () => {
        this.listenForData(resolve, reject)
        this.commandTimeout = setTimeout(() => {
          this._handleCommandTimeout(resolve, reject);
        }, timeout);
      });
    } else {
      await this.eventEmitter.write(finalBuffer)

      this.preventDataSending = false;
      resolve('wrote data without expecting a response');


    }
  }

  listenForData(resolve, reject) {
    this.eventEmitter.on('error', (err) => {
      this._socketErrorHandler(err, reject);
    });

    this.eventEmitter.on('data', (data) => {
      this._receiveData(false, resolve, reject, data);
    });

  }


  _receiveData(readyToReturn: boolean, resolve, reject, data?) {
    if (this.commandTimeout !== null) {
      clearTimeout(this.commandTimeout);
      this.commandTimeout = null;
    }

    if (readyToReturn) {
      resolve(this.receivedData);
      this.preventDataSending = false
    } else {
      this.receivedData = Buffer.concat([this.receivedData, data]);
      if (this.receiveTimeout != null) clearTimeout(this.receiveTimeout);

      if (this.eventEmitter?.bytesRead == 14) {
        this._receiveData(true, resolve, reject);
      } else {
        this.receiveTimeout = setTimeout(() => {
          this._receiveData(true, resolve, reject);
        }, RESPONSE_TIMEOUT);
      }
    }
  }

  _handleCommandTimeout(resolve, reject) {

    this.commandTimeout = null;

    reject(new Error("Command timed out"));
    this.preventDataSending = false;
    this.receivedData = Buffer.alloc(0); // just for good measure

  }

  // _handleNextCommand(timeout = null) {

  //   if (this.commandQueue.length == 0) {
  //     this.closeSocket();
  //   } else {
  //     let cmd = this.commandQueue[0];

  //     let commandInterval = cmd.firstCommand == true ? 0 : COMMAND_INTERVAL;
  //     setTimeout(() => {
  //       if (!cmd.expect_reply) {
  //         this.eventEmitter.write(cmd.command, "binary", () => {
  //           this._receiveData(true);
  //         });
  //       } else {
  //         this.eventEmitter.write(cmd.command, "binary", () => {
  //           if (timeout === null) return;

  //           this.commandTimeout = setTimeout(() => {
  //             this._handleCommandTimeout();
  //           }, timeout);
  //         });
  //       }
  //     }, commandInterval);
  //   }

  // }

  _socketErrorHandler(err, reject) {

    this.closeSocket()
    this.preventDataSending = false;
    reject(err);


    // also reject all commands currently in the queue
    // for (let c of this.commandQueue) {
    //   let reject = c.reject;
    //   if (reject != undefined) {
    //     reject(err);
    //   }
    // }

    // this.commandQueue = []; // reset commandqueue so commands dont get stuck if the controller becomes unavailable
  }

  public closeSocket() {
    if (this.eventEmitter != null) this.eventEmitter.end();
    this.eventEmitter = null;
    this.receivedData = Buffer.alloc(0); // just for good measure
  }

}

