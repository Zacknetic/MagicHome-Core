//ignore typescript strict mode
// @ts-nocheck
import { DeviceManager } from '../src/MagicHome/DeviceManager';
import { Transport } from '../src/MagicHome/Transport';
import { CommandType, CommandOptions, DeviceCommand, FetchStateResponse, ColorMask, CompleteResponse, DeviceState } from '../src/models/types';
import { commandToByteArray, isStateEqual } from '../src/utils/coreUtils';
import { bufferFromByteArray, bufferToFetchStateResponse } from '../src/utils/miscUtils';

export interface IAllSettledResult<T> {
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: any;
}

const COMMAND_QUERY_STATE = bufferFromByteArray([0x81, 0x8a, 0x8b]);
class TestQueryState {
  private transport: Transport;
  private deviceManager: DeviceManager;
  constructor(ipAddress: string) {
    this.transport = new Transport(ipAddress);
    this.deviceManager = new DeviceManager(this.transport, { timeoutMS: 300 });
    // this.startLoggingDeviceState();
  }

  public async testResponseTimeTransport(times: number): Promise<void> {
    return;
    // const responseTimes: number[] = [];
    // const commandOptions: CommandOptions = {
    //   colorAssist: false,
    //   isEightByteProtocol: false,
    //   commandType: CommandType.COLOR,
    //   waitForResponse: true,
    //   maxRetries: 5,
    // };
    // let command: DeviceCommand;
    // for (let i = 0; i < times; i++) {
    //   const randomRed = Math.floor(Math.random() * 256);
    //   const randomGreen = Math.floor(Math.random() * 256);
    //   const randomBlue = Math.floor(Math.random() * 256);
    //   command = { isOn: true, RGB: { red: randomRed, green: randomGreen, blue: randomBlue }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: ColorMask.BOTH };
    //   // command = { isOn: true, RGB: { red: 255, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: ColorMask.BOTH};

    //   const byteArray = commandToByteArray(command, commandOptions);
    //   const commandTest = bufferFromByteArray(byteArray);

    //   // console.log("testing that command is equal to commandTest: ", command, commandTest.toString('hex') === command.toString());
    //   // console.log(`Sending data: ${byteArray.toString()}`);
    //   await this.transport.send(byteArray);
    //   // console.log(`Sent data: ${byteArray.toString()}`);
    //   if (i === times - 2) {
    //     //wait for 1000 ms
    //     await new Promise((resolve) => setTimeout(resolve, 500));
    //   }
    // }
    // for (let i = 0; i < 100; i++) {
    //   const startTime = process.hrtime();

    //   try {
    //     const data = await this.transport.requestState(1000);
    //     const fetchStateResponse: FetchStateResponse = bufferToFetchStateResponse(data);
    //     console.log(`Received data:`, fetchStateResponse);
    //     console.log(`sent data:`, command);
    //     const isValidState = isStateEqual(command, fetchStateResponse, commandOptions.commandType);
    //     console.log(`State is valid: ${isValidState}`);
    //     const elapsedTime = process.hrtime(startTime);
    //     const elapsedMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1e6;
    //     responseTimes.push(elapsedMs);
    //     // console.log(`Received data: ${data.toString('hex')}`);
    //     if (isValidState) {
    //       console.log('State is valid');
    //       break;
    //     }
    //   } catch (error) {
    //     console.error(`Error during query state: ${error.message}`);
    //   }
    // }

    // this.logResults(responseTimes);
  }

  private logResults(responseTimes: number[]): void {
    if (responseTimes.length === 0) {
      console.log('No successful queries.');
      return;
    }

    responseTimes.forEach((time, index) => {
      console.log(`Query ${index + 1}: ${time.toFixed(3)} ms`);
    });

    const averageTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    console.log(`Average response time: ${averageTime.toFixed(3)} ms`);
    console.log(`Total time: ${responseTimes.reduce((sum, time) => sum + time, 0).toFixed(3)} ms`)
  }

  // async testResponseTimeDeviceManager(times: number) {
  //   const commandOptions: CommandOptions = {
  //     colorAssist: false,
  //     isEightByteProtocol: false,
  //     commandType: CommandType.COLOR,
  //     waitForResponse: false,
  //     maxRetries: 0,
  //   };
  //   let command: DeviceCommand;
  //   for (let i = 0; i < 5; i++) {
  //     const randomRed = Math.floor(Math.random() * 256);
  //     const randomGreen = Math.floor(Math.random() * 256);
  //     const randomBlue = Math.floor(Math.random() * 256);
  //     command = { isOn: true, RGB: { red: randomRed, green: randomGreen, blue: randomBlue }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: ColorMask.BOTH };
  //     try {
  //       this.deviceManager.sendCommand(command, commandOptions).catch((error) => {
  //         // console.error(`Error during send command: ${error.message}`);
  //       });
  //       //wait for 1000 ms

  //       await new Promise((resolve) => setTimeout(resolve, 1000));

  //     } catch (error: any) {
  //       console.warn(`Error during query state: ${error.message}`);
  //     }
  //     // const state = await this.deviceManager.sendCommand(command, commandOptions);
  //   }

  // }

  private deviceState: DeviceState | undefined;

  async colorLerpWave(): Promise<PromiseSettledResult<CompleteResponse | boolean>[]> {



    const commandOptions: CommandOptions = {
      colorAssist: false,
      isEightByteProtocol: false,
      commandType: CommandType.LED,
      waitForResponse: true,
      maxRetries: 5,
    };

    let command: DeviceCommand;
    let count = 0;
    let promiseList: Promise<PromiseSettledResult<CompleteResponse | boolean>>[] = [];

    for (let i = 1; i <= 50; i++) {
      const red = Math.floor(Math.sin(count) * 128 + 128);
      const green = Math.floor(Math.sin(count + 1) * 128 + 128);
      const blue = Math.floor(Math.sin(count + 2) * 128 + 128);
      const warmWhite = Math.floor(Math.sin(count + 3) * 128 + 128);
      const coldWhite = Math.floor(Math.sin(count + 4) * 128 + 128);

      command = {
        isOn: true,
        RGB: { red, green: 0, blue: 0 },
        CCT: { warmWhite: 0, coldWhite: 0 },
        colorMask: ColorMask.BOTH
      };

      console.log(red);
      const promise = this.deviceManager.sendCommand(command, commandOptions)
      .then(value => ({ status: 'fulfilled', value } as PromiseFulfilledResult<CompleteResponse>))
      .catch(reason => ({ status: 'rejected', reason } as PromiseRejectedResult));

      promiseList.push(promise);
      await new Promise((resolve) => setTimeout(resolve, 20));
      count += .1;
    }
    const finalResult = await Promise.all(promiseList);
    return finalResult;
  }



  private loggingInterval!: NodeJS.Timeout;
  private startLoggingDeviceState() {
    if (this.loggingInterval) {
      clearInterval(this.loggingInterval);
    }

    this.loggingInterval = setInterval(() => {
      console.log(this.deviceState);
    }, 2000);
  }
}



export default TestQueryState;
