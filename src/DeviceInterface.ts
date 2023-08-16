import { ICommandOptions, IDeviceCommand, ICompleteResponse, DEFAULT_COMMAND_OPTIONS } from "./types";

import { EventEmitter } from "events";
import { Transport } from "./Transport";
import { commandToByteArray, isStateEqual } from "./utils/coreUtils";
import { bufferFromByteArray, bufferToCompleteResponse, mergeDeep } from "./utils/miscUtils";

type CancellationToken = {
  isCancelled: boolean;
  cancel?: () => void;
};

export class DeviceInterface {
  private cancellationEmitter: EventEmitter = new EventEmitter();

  protected transport: Transport;
  private cancellationToken: CancellationToken = { isCancelled: false };

  constructor(transport: Transport) {
    this.transport = transport;
  }

  public async queryState(timeoutMS = 500): Promise<ICompleteResponse> {
    const response = await this.transport.requestState(timeoutMS);
    const completeResponse = bufferToCompleteResponse(response);

    return completeResponse;
  }

  public async sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions = DEFAULT_COMMAND_OPTIONS): Promise<ICompleteResponse | void> {
    this.abort(); // Cancel any previous command
    this.cancellationToken = { isCancelled: false }; // Reset the cancellation token
    this.cancellationEmitter.removeAllListeners(); // Clear any previous cancellation listeners

    await this.sendCommandToTransport(deviceCommand, commandOptions);
    const result: ICompleteResponse | void = await this.processCommand(deviceCommand, commandOptions, this.cancellationToken);
    return result;
  }

  private async processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions, cancellationToken: CancellationToken): Promise<ICompleteResponse | void> {
    let response: ICompleteResponse = null;
    let isValidState = false;
    let retryCount = commandOptions.maxRetries || 0;

    while (!isValidState && retryCount > 0) {
      // Create a new cancellation promise for this iteration
      const cancellationPromise = new Promise<void>((resolve) => {
        cancellationToken.cancel = resolve; // Set the cancellation function
      });

      // Wait for either the timeout or the cancellation, whichever comes first
      await Promise.race([new Promise((resolve) => setTimeout(resolve, 2000)), cancellationPromise]);
      if (cancellationToken.isCancelled) return; // Exit if this command has been cancelled

      try {
        response = await this.queryState(500);
      } catch (error) {
        retryCount--;
        continue;
      }
      isValidState = isStateEqual(deviceCommand, response, commandOptions.commandType);

      if (!isValidState) {
        await this.sendCommandToTransport(deviceCommand, commandOptions);
      }

      retryCount--;
    }

    if (!isValidState) {
      throw new Error(`Invalid state after ${commandOptions.maxRetries} retries`);
    }
    mergeDeep(response, {deviceCommand, commandOptions, responseMsg: `state validity verified ${isValidState} after ${commandOptions.maxRetries - retryCount} retries`});
    return response;
  }

  private async sendCommandToTransport(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
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
