import { CommandOptions, DeviceCommand, CompleteResponse, FetchStateResponse, ErrorType, InterfaceOptions } from "./types";
import { EventEmitter } from "events";
import { Transport } from "./Transport";
import { commandToByteArray, isStateEqual } from "./utils/coreUtils";
import { bufferToFetchStateResponse, combineDeep } from "./utils/miscUtils";
import { MHError } from "./utils/MHResponses";

type CancellationToken = {
  isCancelled: boolean;
  cancel?: () => void;
};

export class DeviceManager {
  private currentCommandId = 0;

  constructor(private transport: Transport, private interfaceOptions: InterfaceOptions) { }

  public async queryState(): Promise<FetchStateResponse> {
    const response = await this.transport.requestState(this.interfaceOptions.timeoutMS);
    return bufferToFetchStateResponse(response);
  }

  private cancellationToken: CancellationToken = { isCancelled: false };

  public async sendCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions): Promise<CompleteResponse | string> {
    // Increment command ID to represent a new command



    // Clear previous cancellation if any
    if (this.cancellationToken.cancel) {
      this.cancellationToken.cancel();
    }

    this.cancellationToken = { isCancelled: false };

    this.sendCommandToTransport(deviceCommand, commandOptions);
    this.currentCommandId++;
    if (!commandOptions.waitForResponse) return Promise.resolve(null);
    const val = await this.processCommand(deviceCommand, commandOptions, this.cancellationToken).catch((error) => {
      console.error(`Error in sendCommand ${this.currentCommandId}`);
      console.error("the error: ", error);
      return `exited too early ${this.currentCommandId}`;
    });
    
    console.log("got the VAL at stage 3", this.currentCommandId, val)
    console.log('val', val? val : "no val")
    
    return val;
  }

  private async processCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions, cancellationToken: CancellationToken): Promise<CompleteResponse> {
    
    let fetchStateResponse: FetchStateResponse = null;
    let isValidState = false;
    let retryCount = commandOptions.maxRetries || 0;
    while (!isValidState && retryCount > 0 && commandOptions.waitForResponse) {

      // Wait for either the timeout or the cancellation, whichever comes first
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, 2000)),
        new Promise((_, reject) => this.cancellationToken.cancel = () => {
          console.log('command should be canceled within the promise race. Command ID:', this.currentCommandId)
          
          reject(new Error(`Command cancelled ${this.currentCommandId}`))
        })
      ]).catch((error) => { 
        console.log("caught the promise race error")
        console.log('the error: ', error);
        throw new Error('Command cancelled' + error);
      });

      if (cancellationToken.isCancelled) throw new Error('Command cancelled but late'); // Exit if this command has been cancelled

      try {
        fetchStateResponse = await this.queryState();
        console.log("this shoudln't be called until the end")
      } catch (error) {
        retryCount--;
        continue;
      }
      isValidState = isStateEqual(deviceCommand, fetchStateResponse, commandOptions.commandType);
      console.log('isValidState', isValidState)
      if (!isValidState) await this.sendCommandToTransport(deviceCommand, commandOptions);


      retryCount--;
    }

    if (!isValidState) {
      throw new MHError(null, { fetchStateResponse, initialCommandOptions: commandOptions, initialDeviceCommand: deviceCommand, responseMsg: `Invalid state after ${commandOptions.maxRetries} retries` }, ErrorType.INCORRECT_DEVICE_STATE_ERROR);
    }

    return combineDeep<CompleteResponse>({}, {
      fetchStateResponse,
      responseCode: 1,
      initialCommandOptions: commandOptions,
      initialDeviceCommand: deviceCommand,
      responseMsg: `State validity verified ${isValidState} after ${commandOptions.maxRetries - retryCount - 1} retries`
    });
  }

  private async sendCommandToTransport(deviceCommand: DeviceCommand, commandOptions: CommandOptions) {
    const byteArray = commandToByteArray(deviceCommand, commandOptions);
    await this.transport.send(byteArray);
  }
}
