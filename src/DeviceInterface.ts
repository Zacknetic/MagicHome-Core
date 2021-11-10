// const SLOW_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 20, bufferMS: 0, timeoutMS: 2000 };
// const MEDIUM_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 100 };
// const FAST_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 20 };

import { ICommandOptions, ICommandResponse, IDeviceCommand, IPromiseOptions } from './types'
import { Transport } from './Transport'
import * as types from './types';
import { PromiseQueue } from './PromiseQueue';

const promiseQueue = new PromiseQueue({
    concurrency: 1,
    interval: 2000,
    timeout: 1000
});

const RESET_LATEST_POWER_COMMAND_MS = 2000;

const {
    DEVICE_COMMANDS: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND }
} = types;

export class DeviceInterface {

    protected latestPowerCommand = null;

    protected testPowerStateTimeout: NodeJS.Timeout;
    protected finalCommandTimeout: NodeJS.Timeout;

    protected transport;
    constructor(ipAddress) {
        this.transport = new Transport(ipAddress);
    }

    public sendCommand(deviceCommand: IDeviceCommand, commandOptions?: ICommandOptions) {
        const commandBuffer = this.commandToBuffer(deviceCommand, commandOptions);
const promiseOptions: IPromiseOptions = {
            maxRetries: commandOptions.maxRetries,
            timeoutMS: commandOptions.timeoutMS,
        }
        promiseQueue.add(() => { return this.transport.send(commandBuffer, promiseOptions, promiseQueue) }, promiseOptions)
    }

    /**
     * Query the device for state
     * @param timeoutMS (default 500ms) duration to wait for device state before returning null
     * @returns ICommandResponse
     */
    public async queryState(timeoutMS): Promise<ICommandResponse> {
        const commandOptions: ICommandOptions = {
            commandType: QUERY_COMMAND, timeoutMS, maxRetries: 20
        }

        const commandBuffer = this.commandToBuffer(null, commandOptions);
        const commandResponse = await this.transport.send(commandBuffer);
        return commandResponse;
    }

    private commandToBuffer(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
        let commandByteArray;

        switch (commandOptions.commandType) {
            case POWER_COMMAND:
                if (!this.testLatestPowerCommand(deviceCommand.isOn ?? null)) {
                    const commandResponse: ICommandResponse = { eventNumber: -5, deviceResponse: null, deviceCommand }
                    throw commandResponse;
                }
                //construct the power command byte array
                commandByteArray = deviceCommand.isOn ? COMMAND_POWER_ON : COMMAND_POWER_OFF;
                break;

            case COLOR_COMMAND:
                //test for bad or insufficient data?
                //construct the color command byte array
                const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite } } = deviceCommand;

                // if (commandOptions.isEightByteProtocol) {
                    commandByteArray = [0x31, red, green, blue, red, deviceCommand.colorMask, 0x0F]; //8th byte checksum calculated later in send()
                // } else {
                //     commandByteArray = [0x31, red, green, blue, warmWhite, coldWhite, deviceCommand.colorMask, 0x0F]; //9 byte
                // }
                break;

            case QUERY_COMMAND:
                //construct query command byte array
                commandByteArray = COMMAND_QUERY_STATE;
                break;

            case ANIMATION_FRAME:
                //test for bad or insufficient data?
                //construct animation frame byte array
                break;
            default:
                const commandResponse: ICommandResponse = { eventNumber: -1, deviceResponse: null, deviceCommand: null }
                throw commandResponse;
        }

        const buffer = Buffer.from(commandByteArray);
        return buffer;
    }

    testLatestPowerCommand(isOn: boolean) {
        if (isOn == this.latestPowerCommand) return false;
        this.latestPowerCommand = isOn;
        clearTimeout(this.testPowerStateTimeout);
        this.testPowerStateTimeout = setTimeout(() => {
            this.latestPowerCommand = null;
        }, RESET_LATEST_POWER_COMMAND_MS);

        return true;
    }
}