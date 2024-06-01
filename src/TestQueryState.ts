import { DeviceManager } from './DeviceManager';
import { Transport } from './Transport';
import { CommandType, CommandOptions, DeviceCommand, FetchStateResponse, ColorMask } from './types';
import { bufferFromByteArray } from './utils/checksum';
import { commandToByteArray, isStateEqual } from './utils/coreUtils';
import { bufferToFetchStateResponse } from './utils/miscUtils';

const COMMAND_QUERY_STATE = bufferFromByteArray([0x81, 0x8a, 0x8b]);
class TestQueryState {
  private transport: Transport;
  private deviceManager: DeviceManager;
  constructor(ipAddress: string) {
    this.transport = new Transport(ipAddress);
    this.deviceManager = new DeviceManager(this.transport, { timeoutMS: 1000 });

  }

  public async testResponseTimeTransport(times: number): Promise<void> {
    return;
    const responseTimes: number[] = [];
    const commandOptions: CommandOptions = {
      colorAssist: false,
      isEightByteProtocol: false,
      commandType: CommandType.COLOR,
      waitForResponse: true,
      maxRetries: 5,
    };
    let command: DeviceCommand;
    for (let i = 0; i < times; i++) {
      const randomRed = Math.floor(Math.random() * 256);
      const randomGreen = Math.floor(Math.random() * 256);
      const randomBlue = Math.floor(Math.random() * 256);
      command = { isOn: true, RGB: { red: randomRed, green: randomGreen, blue: randomBlue }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: ColorMask.BOTH };
      // command = { isOn: true, RGB: { red: 255, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: ColorMask.BOTH};

      const byteArray = commandToByteArray(command, commandOptions);
      const commandTest = bufferFromByteArray(byteArray);

      // console.log("testing that command is equal to commandTest: ", command, commandTest.toString('hex') === command.toString());
      // console.log(`Sending data: ${byteArray.toString()}`);
      await this.transport.send(byteArray);
      // console.log(`Sent data: ${byteArray.toString()}`);
      if (i === times - 2) {
        //wait for 1000 ms
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    for (let i = 0; i < 100; i++) {
      const startTime = process.hrtime();

      try {
        const data = await this.transport.requestState(1000);
        const fetchStateResponse: FetchStateResponse = bufferToFetchStateResponse(data);
        console.log(`Received data:`, fetchStateResponse);
        console.log(`sent data:`, command);
        const isValidState = isStateEqual(command, fetchStateResponse, commandOptions.commandType);
        console.log(`State is valid: ${isValidState}`);
        const elapsedTime = process.hrtime(startTime);
        const elapsedMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1e6;
        responseTimes.push(elapsedMs);
        // console.log(`Received data: ${data.toString('hex')}`);
        if (isValidState) {
          console.log('State is valid');
          break;
        }
      } catch (error) {
        console.error(`Error during query state: ${error.message}`);
      }
    }

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

  async testResponseTimeDeviceManager(times: number) {
    const commandOptions: CommandOptions = {
      colorAssist: false,
      isEightByteProtocol: false,
      commandType: CommandType.COLOR,
      waitForResponse: false,
      maxRetries: 0,
    };
    let command: DeviceCommand;
    for (let i = 0; i < 5; i++) {
      const randomRed = Math.floor(Math.random() * 256);
      const randomGreen = Math.floor(Math.random() * 256);
      const randomBlue = Math.floor(Math.random() * 256);
      command = { isOn: true, RGB: { red: randomRed, green: randomGreen, blue: randomBlue }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: ColorMask.BOTH };
      try {
        this.deviceManager.sendCommand(command, commandOptions).catch((error) => {
          // console.error(`Error during send command: ${error.message}`);
        });
        //wait for 1000 ms

        await new Promise((resolve) => setTimeout(resolve, 1000));

      } catch (error) {
        console.warn(`Error during query state: ${error.message}`);
      }
      // const state = await this.deviceManager.sendCommand(command, commandOptions);
    }

  }

  async colorLerpWave() {
    const commandOptions: CommandOptions = {
      colorAssist: false,
      isEightByteProtocol: false,
      commandType: CommandType.COLOR,
      waitForResponse: true,
      maxRetries: 100,
    };
    let command: DeviceCommand;
    let count = 0;

    let val
    while (count < 5) {



      const red = Math.floor(Math.sin(count) * 128 + 128);
      const green = Math.floor(Math.sin(count + 15) * 16 + 16);
      const blue = Math.floor(Math.sin(count + 3) * 128 + 128);
      const warmWhite = Math.floor(Math.sin(count + 64) * 16 + 16);
      const coldWhite = Math.floor(Math.sin(count + 128) * 16 + 16);
      command = { isOn: true, RGB: { red, green: 0, blue }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: ColorMask.BOTH };
      console.log(red, green, blue, warmWhite, coldWhite)
      try {
        val = this.deviceManager.sendCommand(command, commandOptions).catch((error) => {
          console.error(`Error during send command: ${error.message}`);
        });
        console.log("VAL MADE IT TO THE MIDDLE", val)
      } catch (error) {
        // console.warn(`Error during query state: ${error.message}`);
      }
      count += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (count > 10) return val;
    }
  }
}



export default TestQueryState;
