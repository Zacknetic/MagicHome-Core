// const SLOW_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 20, bufferMS: 0, timeoutMS: 2000 };
// const MEDIUM_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 100 };
// const FAST_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 20 };

import { ICommandOptions, ICommandResponse, IDeviceCommand, IDeviceResponse, IDeviceState, IPromiseOptions, ITransportResponse } from './types'
import { Transport } from './Transport'

import * as types from './types';
import { bufferToDeviceState, deepEqual } from './utils/miscUtils';

const RETRY_WAIT_MS = 2000;
const RETRY_QUERY_MS = 1000;
const RESET_LATEST_POWER_COMMAND_MS = 2000;

const {
    DEVICE_COMMANDS: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND }
} = types;

export class DeviceInterface {

    protected queueSize = 0;
    protected latestPowerCommand = null;

    protected testPowerStateTimeout: NodeJS.Timeout;
    protected retryCommandTimeout: NodeJS.Timeout = null;

    protected transport;
    constructor(ipAddress) {
        this.transport = new Transport(ipAddress);
    }

    public async sendCommand(deviceCommand: IDeviceCommand, commandOptions?: ICommandOptions) {
        const byteArray = this.commandToByteArray(deviceCommand, commandOptions);
        const transportResponse: ITransportResponse = await this.transport.send(byteArray, commandOptions.timeoutMS ?? 200, false)
        const state = await this.handleReponse(transportResponse, commandOptions, deviceCommand);
        console.log(state)
        if (!state) {
            return transportResponse
        } else {
            return state;
        }
    }

    /**
     * Query the device for state
     * @param timeoutMS (default 500ms) duration to wait for device state before returning null
     * @returns ITransportResponse
     */

    public async queryState(timeoutMS): Promise<ITransportResponse> {
        const commandOptions: ICommandOptions = { commandType: QUERY_COMMAND, timeoutMS, retries: 0 }
        const byteArray = this.commandToByteArray(null, commandOptions);
        const transportResponse: ITransportResponse = await this.transport.send(byteArray, timeoutMS);
        const stateBuffer = transportResponse.response;
        const deviceResponse: IDeviceResponse = bufferToDeviceState(stateBuffer);
        transportResponse.response = deviceResponse;

        return transportResponse;
    }


    protected async handleReponse(transportResponse: ITransportResponse, commandOptions: ICommandOptions, deviceCommand: IDeviceCommand) {

        this.queueSize = transportResponse.queueSize ?? this.queueSize;
        let queryResponse: ITransportResponse;

        if (this.queueSize === 0 && commandOptions.retries > 0) {
            this.clearRetryCommandTimeout();

            return new Promise((resolve) => {
                this.retryCommandTimeout = setTimeout(async () => {
                    queryResponse = await this.queryState(RETRY_QUERY_MS);
                    const deviceResponse: IDeviceResponse = queryResponse.response;
                    let deviceState, deviceMetaData, isValidState;
                    if (deviceResponse) {
                        deviceState = deviceResponse.deviceState;
                        deviceMetaData = deviceResponse.deviceMetaData;
                        isValidState = this.isValidState(deviceCommand, deviceResponse, commandOptions)
                    }
                    if (!deviceResponse || (!isValidState ?? null)) {
                        commandOptions.retries--;
                        resolve (this.sendCommand(deviceCommand, commandOptions));
                    } else {
                        const transportResponse: ITransportResponse = { deviceMetaData, deviceState, deviceCommand, retriesUsed: commandOptions.retries }
                        this.transport.disconnect()
                        resolve( transportResponse);
                    }
                }, RETRY_WAIT_MS);
            });

        } else {
            return null;
        }
    }

    protected isValidState(deviceCommand: IDeviceCommand, deviceResponse: IDeviceResponse, commandOptions?: ICommandOptions): boolean {
        const isEqual = deepEqual(deviceCommand, deviceResponse.deviceState, ['colorMask']);
        return isEqual;
    }


    private commandToByteArray(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
        let commandByteArray;

        switch (commandOptions.commandType) {
            case POWER_COMMAND:
                if (!this.testLatestPowerCommand(deviceCommand.isOn)) {
                    const commandResponse: ICommandResponse = { eventNumber: -5, deviceState: null, deviceCommand }
                    throw commandResponse;
                }
                //construct the power command byte array
                commandByteArray = deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF;
                break;

            case COLOR_COMMAND:
                //test for bad or insufficient data?
                //construct the color command byte array
                const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite } } = deviceCommand;

                if (commandOptions.isEightByteProtocol) {
                    commandByteArray = [0x31, red, green, blue, warmWhite, deviceCommand.colorMask, 0x0F]; //8th byte checksum calculated later in send()
                } else {
                    commandByteArray = [0x31, red, green, blue, warmWhite, coldWhite, deviceCommand.colorMask, 0x0F]; //9 byte
                }
                break;

            case QUERY_COMMAND:
                if (this.queueSize > 0) {
                    const commandResponse: ICommandResponse = { eventNumber: 0, deviceState: null, deviceCommand }
                    throw commandResponse;
                }
                //construct query command byte array
                commandByteArray = COMMAND_QUERY_STATE;
                break;

            case ANIMATION_FRAME:
                //test for bad or insufficient data?
                //construct animation frame byte array
                break;
            default:
                const commandResponse: ICommandResponse = { eventNumber: -1, deviceState: null, deviceCommand }
                throw commandResponse;
        }

        return commandByteArray;
    }

    clearRetryCommandTimeout() {
        if (this.retryCommandTimeout) clearTimeout(this.retryCommandTimeout);
        this.retryCommandTimeout = null;
    }

    testLatestPowerCommand(isOn: boolean) {
        console.log(this.latestPowerCommand)
        if (isOn === this.latestPowerCommand) {
            console.log('DOUBLE POWER COMMAND')
            return false;
        }
        this.latestPowerCommand = isOn;
        clearTimeout(this.testPowerStateTimeout);
        this.testPowerStateTimeout = setTimeout(() => {
            this.latestPowerCommand = null;
        }, RESET_LATEST_POWER_COMMAND_MS);

        return true;
    }
}
