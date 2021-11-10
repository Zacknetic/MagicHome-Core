import * as net from 'net';
import { ICommandResponse, IPromiseOptions } from './types';
import { checksum } from './utils';

const QUEUE_INTERVAL = 50;
const RESPONSE_TIMEOUT = 100;

const PORT = 5577;



export class Transport {

  protected queue;
  protected host;

  protected socket = null;
  protected receivedData = Buffer.alloc(0);
  protected receiveTimeout = null;
  protected connectTimeout = null;
  protected commandTimeout = null;
  protected preventDataSending = false;


  /**
   * @param {string} host - hostname
   */


  /**
   * 
   *  export interface IColorRGB {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
}

state.RGB.red
   */
  constructor(host: string) {
    this.host = host;
  }                     //header red  green  blue
  //0   1       2     3     4             
  //commandByteArray = [0x31, 0xFF, 0x00, 0x00, white, deviceCommand.colorMask, 0x0F]; //8th byte checksum calculated later in send()

  send(buffer: Buffer, promiseOptions: IPromiseOptions, promiseQueue) {
    let command;


    // if (useChecksum) {
    const chk = checksum(buffer);
    command = Buffer.concat([buffer, Buffer.from([chk])]);
    // } else {
    //   command = buffer;
    // }

    return new Promise((resolve, reject) => {

      this.preventDataSending = false;

      if (!this.socket) { // if the socket doesn't exist create it before writing data
        this.socket = net.connect(PORT, this.host); //create socket

        this.socket.on('connect', () => { //listen and wait for the 'connect' response 
          this.writeData(command);  //once connected, write the data!
        })
      } else { //otherwise, socket already exists, lets not make it twice. Simply send the data.
        this.writeData(command);
      }

      this.socket.on('error', (error) => {  //if the socket reponds with an error, reject (throw) that error to later be caught
        this.clearTransport();
        reject(error);
      });

      //if the command type is "color-command", instantly return without waiting for data.

      //if(commandType == 'color-command') resolve
      this.socket.on('data', (data) => {
        this.receivedData = Buffer.concat([this.receivedData, data]);
      });

      this.receiveTimeout = setTimeout(() => {

        if (promiseQueue.length() < 1) this.clearTransport();
        const commandResponse: ICommandResponse = { eventNumber: -6, deviceCommand: null, deviceResponse: null }

        console.log('resolving ', promiseQueue.length())
        resolve(commandResponse);
      }, RESPONSE_TIMEOUT);

    });

  }

  // receiveData(data) {
  //   if (this.commandTimeout !== null) { // we have received _something_ so the command cannot timeout anymore
  //     clearTimeout(this.commandTimeout);
  //     this.commandTimeout = null;
  //   }


  //   if (this.receiveTimeout != null) clearTimeout(this.receiveTimeout);

  //   // since we don't know how long the response is going to be, set a timeout after which we consider the
  //   // whole message to be received

  //   return this.receiveData(true);


  // }

  public clearTransport() {
    if (this.socket != null) this.socket.end();
    this.socket = null;
  }


  writeData(command) {
    this.socket.write(command, "binary");
  }

}