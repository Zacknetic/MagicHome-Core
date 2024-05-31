import { DeviceInterface } from './DeviceInterface';
import { Transport } from './Transport';
import { CommandType, ICommandOptions, IDeviceCommand, IFetchStateResponse } from './types';
import { bufferFromByteArray } from './utils/checksum';
import { commandToByteArray, isStateEqual } from './utils/coreUtils';
import { bufferToFetchStateResponse } from './utils/miscUtils';

const COMMAND_QUERY_STATE = bufferFromByteArray([0x81, 0x8a, 0x8b]);
const REPEAT_TIMES = 1000;
class TestQueryState {
  private transport: Transport;
  // private deviceInterface: DeviceInterface;
  constructor(ipAddress: string) {
    this.transport = new Transport(ipAddress);
    // this.deviceInterface = new DeviceInterface(this.transport);

  }

  public async testResponseTime(times: number): Promise<void> {

    const responseTimes: number[] = [];
    const commandOptions: ICommandOptions = {
      colorAssist: true,
      isEightByteProtocol: false,
      commandType: CommandType.COLOR,
      waitForResponse: true,
      maxRetries: 5,
    };
    let command: IDeviceCommand;
    for (let i = 0; i < 100; i++) {
      const randomRed = Math.floor(Math.random() * 256);
      const randomGreen = Math.floor(Math.random() * 256);
      const randomBlue = Math.floor(Math.random() * 256);
      command = { isOn: true, RGB: { red: randomRed, green: randomGreen, blue: randomBlue }, CCT: { warmWhite: 0, coldWhite: 0 } };

      const byteArray = commandToByteArray(command, commandOptions);
      await this.transport.send(byteArray);
      console.log(`Sent data: ${byteArray.toString()}`);
      // if(i === 0) {
      //   //wait for 1000 ms
      //   await new Promise((resolve) => setTimeout(resolve, 5000));
      // }
    }
    for (let i = 0; i < REPEAT_TIMES; i++) {
      const startTime = process.hrtime();

      try {
        const data = await this.transport.requestState(1000);
        const fetchStateResponse: IFetchStateResponse = bufferToFetchStateResponse(data);
        const isValidState = isStateEqual(command, fetchStateResponse, commandOptions.commandType);

        const elapsedTime = process.hrtime(startTime);
        const elapsedMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1e6;
        responseTimes.push(elapsedMs);
        console.log(`Received data: ${data.toString('hex')}`);
        if (isValidState) {
          console.log('State is valid');
          break;
        }
      } catch (error) {
        console.error(`Error during query state: ${error.message}`);
      }
    }

    this.logResults(responseTimes);
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
}

export default TestQueryState;
