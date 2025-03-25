import { CommandOptions, DeviceCommand, CompleteResponse, FetchStateResponse, InterfaceOptions, CancelTokenObject } from "../models/types";
import { SocketManager } from "./socketManager";
import { commandToByteArray, isStateEqual, bufferToFetchStateResponse } from "../utils";
import { CommandCancelledError, MaxCommandRetryError, MaxWaitTimeError } from "../models/errorTypes";

export class DeviceManager {
  private currentCommandId = 0;
  private readonly MAX_COMMAND_ID = 2 ** 32 - 1; // Maximum value for a 32-bit integer
  constructor(private transport: SocketManager, private interfaceOptions: InterfaceOptions) { }

  public sendCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions): Promise<CompleteResponse> {
    this.currentCommandId = this.currentCommandId >= this.MAX_COMMAND_ID ? 0 : this.currentCommandId + 1; // Ensure that the command ID is within the valid range
    const commandId = this.currentCommandId; // Store the current command ID

    const cancellationToken: CancelTokenObject = this.createCancelToken(); // Create a cancellation token for the command

    this.sendCommandToTransport(deviceCommand, commandOptions); // Send the command to the device.
    return this.processCommand(deviceCommand, commandOptions, cancellationToken, commandId); // Process the command
  }

  /**
   * Tests the validity of the state after sending a command to the device.
   * Retries sending the command to the device until the state is valid or the maximum number of retries is reached.
   * Cancels the command if the cancellation token is cancelled.
   * @param deviceCommand 
   * @param commandOptions 
   * @param cancellationToken 
   * @param commandId 
   * @returns Promise<CompleteResponse>
   * @throws CommandCancelledError, MaxCommandRetryError, MaxWaitTimeError
   */
  private async processCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions, cancellationToken: CancelTokenObject, commandId: number): Promise<CompleteResponse> {
    let fetchStateResponse: FetchStateResponse;
    let isStateValid = false;
    let retryCount = commandOptions.maxRetries || 0;

    if (!commandOptions.waitForResponse) {
      const completeResponse: CompleteResponse = {
        fetchStateResponse: fetchStateResponse!,
        responseCode: 1,
        initialCommandOptions: commandOptions,
        initialDeviceCommand: deviceCommand,
        responseMsg: `Command sent without waiting for response`
      };

      return Promise.resolve(completeResponse);
    }

    while (!isStateValid && retryCount > 0) {

      await this.wait(cancellationToken);

      if (cancellationToken.isCancelled() || this.currentCommandId !== commandId) {
        throw new Error('Command cancelled');
      }

      try {
        fetchStateResponse = await this.queryState(cancellationToken);
        isStateValid = isStateEqual(deviceCommand, fetchStateResponse, commandOptions.commandType);

        if (!isStateValid) await this.sendCommandToTransport(deviceCommand, commandOptions);
      } catch (error: any) {
        if (error instanceof CommandCancelledError) {
          throw error;
        } else if (error instanceof MaxWaitTimeError) {
          console.log("waited a bit too long");

        } else {
          throw error; // rethrow unexpected errors
        }
      }

      retryCount--;
    }


    if (!isStateValid) {
      // const errorResponse: Partial<CompleteResponse> = {
      //   fetchStateResponse: fetchStateResponse!,
      //   responseCode: -4,
      //   initialCommandOptions: commandOptions,
      //   initialDeviceCommand: deviceCommand,
      //   responseMsg: `Invalid state after ${commandOptions.maxRetries - retryCount - 1} retries`
      // };
      throw new MaxCommandRetryError(commandOptions.maxRetries, `Command failed after max retries ${commandOptions.maxRetries}`);
    }

    const completeResponse: CompleteResponse = {
      fetchStateResponse: fetchStateResponse!,
      responseCode: 1,
      initialCommandOptions: commandOptions,
      initialDeviceCommand: deviceCommand,
      responseMsg: `State validity verified ${isStateValid} after ${commandOptions.maxRetries - retryCount - 1} retries`
    };

    return completeResponse; 
  }

  private async sendCommandToTransport(deviceCommand: DeviceCommand, commandOptions: CommandOptions) {
    const byteArray = commandToByteArray(deviceCommand, commandOptions);
    await this.transport.send(byteArray);
  }

  public async queryState(cancelToken?: CancelTokenObject): Promise<FetchStateResponse> {
    const response = await this.transport.requestState(this.interfaceOptions.timeoutMS, cancelToken);
    return bufferToFetchStateResponse(response);
  }

  private createCancelToken(): CancelTokenObject {
    let cancelled = false;
    return {
      cancel: () => {
        cancelled = true;
      },
      isCancelled: () => cancelled
    };
  }

  private async wait(cancellationToken: CancelTokenObject): Promise<void> {
    await new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (cancellationToken.isCancelled()) {
          reject(new CommandCancelledError());
        } else {
          resolve(true);
        }
      }, this.interfaceOptions.timeoutMS);

      if (cancellationToken.isCancelled()) {
        clearTimeout(timeout);
        reject(new CommandCancelledError());
      }
    });
  }

}