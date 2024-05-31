import { CommandOptions, DeviceCommand, CompleteResponse, FetchStateResponse, ErrorType, InterfaceOptions } from "./types";
import { EventEmitter } from "events";
import { Transport } from "./Transport";
import { commandToByteArray, isStateEqual } from "./utils/coreUtils";
import {  bufferToFetchStateResponse, combineDeep } from "./utils/miscUtils";
import { MHError } from "./utils/MHResponses";

type CancellationToken = {
  isCancelled: boolean;
  cancel?: () => void;
};

export class DeviceManager {

  private cancellationEmitter: EventEmitter = new EventEmitter();

  private cancellationToken: CancellationToken = { isCancelled: false };

  constructor(private transport: Transport, private interfaceOptions: InterfaceOptions) { }

  public async queryState(): Promise<FetchStateResponse> {
    const response = await this.transport.requestState(this.interfaceOptions.timeoutMS);
    const fetchStateResponse: FetchStateResponse = bufferToFetchStateResponse(response);
    return fetchStateResponse;
  }

  public async sendCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions): Promise<CompleteResponse> {
    this.abort(); // Cancel any previous command
    this.cancellationToken = { isCancelled: false }; // Reset the cancellation token
    this.cancellationEmitter.removeAllListeners(); // Clear any previous cancellation listeners

    await this.sendCommandToTransport(deviceCommand, commandOptions);
    const result: CompleteResponse = await this.processCommand(deviceCommand, commandOptions, this.cancellationToken);
    return result;
  }

  private async processCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions, cancellationToken: CancellationToken): Promise<CompleteResponse> {
    let fetchStateResponse: FetchStateResponse = null;
    let isValidState = false;
    let retryCount = commandOptions.maxRetries || 0;

    while (!isValidState && retryCount > 0 && commandOptions.waitForResponse) {
      // Create a new cancellation promise for this iteration
      const cancellationPromise = new Promise<void>((resolve) => {
        cancellationToken.cancel = resolve; // Set the cancellation function
      });

      // Wait for either the timeout or the cancellation, whichever comes first
      await Promise.race([new Promise((resolve) => setTimeout(resolve, 2000)), cancellationPromise]);
      if (cancellationToken.isCancelled) return; // Exit if this command has been cancelled

      try {
        fetchStateResponse = await this.queryState();
      } catch (error) {
        retryCount--;
        continue;
      }
      isValidState = isStateEqual(deviceCommand, fetchStateResponse, commandOptions.commandType);
      if (!isValidState) {
        await this.sendCommandToTransport(deviceCommand, commandOptions);
      }

      retryCount--;
    }

    if (!isValidState) {
      throw new MHError(null, { fetchStateResponse, initialCommandOptions: commandOptions, initialDeviceCommand: deviceCommand, responseMsg: `Invalid state after ${commandOptions.maxRetries} retries` }, ErrorType.INCORRECT_DEVICE_STATE_ERROR);
    }
    const completeResponse: CompleteResponse = combineDeep<CompleteResponse>({}, { fetchStateResponse, responseCode: 1, initialCommandOptions: commandOptions, initialDeviceCommand: deviceCommand, responseMsg: `state validity verified ${isValidState} after ${commandOptions.maxRetries - retryCount - 1} retries` });
    return completeResponse;
  }

  private async sendCommandToTransport(deviceCommand: DeviceCommand, commandOptions: CommandOptions) {
    const byteArray = commandToByteArray(deviceCommand, commandOptions);
    await this.transport.send(byteArray);
  }

  private abort() {
    if (this.cancellationToken) {
      this.cancellationToken.isCancelled = true; // Mark the current command as cancelled
      if (this.cancellationToken.cancel) {
        this.cancellationToken.cancel(); // Call the cancellation function to resolve the cancellation promise
      }
    }
  }
}
