import { CommandOptions, DeviceCommand, CompleteResponse, FetchStateResponse, ErrorType, InterfaceOptions, MaxCommandRetryError, CancelTokenObject, CommandCancelledError, MaxWaitTimeError } from "./types";
import { Transport } from "./Transport";
import { commandToByteArray, isStateEqual } from "./utils/coreUtils";
import { bufferToFetchStateResponse } from "./utils/miscUtils";


export class DeviceManager {
  private currentCommandId = 0;
  private readonly MAX_COMMAND_ID = 2 ** 32 - 1; // Maximum value for a 32-bit integer
  constructor(private transport: Transport, private interfaceOptions: InterfaceOptions) { }

  public sendCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions): Promise<CompleteResponse> {

    if (this.currentCommandId >= this.MAX_COMMAND_ID) {
      this.currentCommandId = 0;
    } else {
      this.currentCommandId++;
    }
    // Increment command ID to represent a new command
    const commandId = ++this.currentCommandId;
    const cancellationToken: CancelTokenObject = this.createCancelToken();

    // Set the current cancellation token

    // Return a promise that resolves with the result of processCommand
    this.sendCommandToTransport(deviceCommand, commandOptions);

    return this.processCommand(deviceCommand, commandOptions, cancellationToken, commandId);
  }

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
      const errorResponse: Partial<CompleteResponse> = {
        fetchStateResponse: fetchStateResponse!,
        responseCode: -4,
        initialCommandOptions: commandOptions,
        initialDeviceCommand: deviceCommand,
        responseMsg: `Invalid state after ${commandOptions.maxRetries - retryCount - 1} retries`
      };
      throw new MaxCommandRetryError(commandOptions.maxRetries , `Command failed after max retries ${commandOptions.maxRetries}`);
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

  public async queryState(cancelToken: CancelTokenObject): Promise<FetchStateResponse> {
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