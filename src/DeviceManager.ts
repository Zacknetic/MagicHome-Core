import { CommandOptions, DeviceCommand, CompleteResponse, FetchStateResponse, ErrorType, InterfaceOptions } from "./types";
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
  private currentCancellationToken: CancellationToken | null = null;
  private readonly MAX_COMMAND_ID = 2 ** 32 - 1; // Maximum value for a 32-bit integer
  constructor(private transport: Transport, private interfaceOptions: InterfaceOptions) { }

  public async queryState(): Promise<FetchStateResponse> {
    const response = await this.transport.requestState(this.interfaceOptions.timeoutMS);
    return bufferToFetchStateResponse(response);
  }

  public sendCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions): Promise<CompleteResponse> {

    if (this.currentCommandId >= this.MAX_COMMAND_ID) {
      this.currentCommandId = 0;
    } else {
      this.currentCommandId++;
    }
    // Increment command ID to represent a new command
    const commandId = ++this.currentCommandId;
    const cancellationToken: CancellationToken = { isCancelled: false };

    // Set the current cancellation token
    this.currentCancellationToken = cancellationToken;

    // Return a promise that resolves with the result of processCommand
    this.sendCommandToTransport(deviceCommand, commandOptions);

    return this.processCommand(deviceCommand, commandOptions, cancellationToken, commandId);
  }

  private async processCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions, cancellationToken: CancellationToken, commandId: number): Promise<CompleteResponse> {
    let fetchStateResponse: FetchStateResponse = null;
    let isValidState = false;
    let retryCount = commandOptions.maxRetries || 0;

    while (!isValidState && retryCount > 0 && commandOptions.waitForResponse) {
      // Check if this command has been canceled
      if (cancellationToken.isCancelled || this.currentCommandId !== commandId) {
        throw new Error('Command cancelled');
      }

      // Wait for either the timeout or the cancellation
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, 2000)),
        new Promise<void>((_, reject) => cancellationToken.cancel = () => reject(new Error('Command cancelled')))
      ]);

      if (cancellationToken.isCancelled || this.currentCommandId !== commandId) {
        throw new Error('Command cancelled');
      }

      try {
        fetchStateResponse = await this.queryState();
      } catch (error) {
        retryCount--;
        continue;
      }

      isValidState = isStateEqual(deviceCommand, fetchStateResponse, commandOptions.commandType);
      if (!isValidState) {
        console.log("this should not send")
        await this.sendCommandToTransport(deviceCommand, commandOptions);
      }

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

  public abort() {
    if (this.currentCancellationToken) {
      this.currentCancellationToken.isCancelled = true; // Mark the current command as cancelled
      if (this.currentCancellationToken.cancel) {
        this.currentCancellationToken.cancel(); // Call the cancellation function to reject the cancellation promise
      }
    }
  }
}