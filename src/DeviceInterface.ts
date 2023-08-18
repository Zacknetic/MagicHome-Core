import { ICommandOptions, IDeviceCommand, ICompleteResponse, DEFAULT_COMMAND_OPTIONS, IFetchStateResponse, DEFAULT_COMPLETE_RESPONSE, ErrorType } from "./types";

import { EventEmitter } from "events";
import { Transport } from "./Transport";
import { commandToByteArray, isStateEqual } from "./utils/coreUtils";
import { bufferFromByteArray, bufferToFetchStateResponse, mergeDeep } from "./utils/miscUtils";
import { MHError } from "./utils/MHResponses";

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

  public async queryState(timeoutMS = 500): Promise<IFetchStateResponse> {
    const response = await this.transport.requestState(timeoutMS);
    const fetchStateResponse: IFetchStateResponse = bufferToFetchStateResponse(response);
    return fetchStateResponse;
  }

  public async sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions = DEFAULT_COMMAND_OPTIONS): Promise<ICompleteResponse> {
    this.abort(); // Cancel any previous command
    this.cancellationToken = { isCancelled: false }; // Reset the cancellation token
    this.cancellationEmitter.removeAllListeners(); // Clear any previous cancellation listeners

    await this.sendCommandToTransport(deviceCommand, commandOptions);
    const result: ICompleteResponse = await this.processCommand(deviceCommand, commandOptions, this.cancellationToken);
    return result;
  }

  private async processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions, cancellationToken: CancellationToken): Promise<ICompleteResponse> {
    let fetchStateResponse: IFetchStateResponse = null;
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
        fetchStateResponse = await this.queryState(500);
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
      throw new MHError(null, {fetchStateResponse, commandOptions, deviceCommand, responseMsg: `Invalid state after ${commandOptions.maxRetries} retries`}, ErrorType.INCORRECT_DEVICE_STATE_ERROR); 
    }
    const completeResponse:ICompleteResponse = mergeDeep<ICompleteResponse>({}, {fetchStateResponse, responseCode: 1 ,commandOptions, deviceCommand, responseMsg: `state validity verified ${isValidState} after ${commandOptions.maxRetries - retryCount - 1} retries` });
    return completeResponse;
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
