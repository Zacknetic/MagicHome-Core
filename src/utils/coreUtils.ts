import * as types from '../types';
import { ICommandOptions, IDeviceCommand, IDeviceState, ICompleteResponse, defaultCompleteResponse } from '../types'

const {
    DEVICE_COMMANDS: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND }
} = types;


export function commandToByteArray(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): number[] {
    let commandByteArray: number[];

    switch (commandOptions.commandType) {
        case POWER_COMMAND:
            // if (!this.testLatestPowerCommand(deviceCommand.isOn)) {
            //     const transportResponse: ITransportResponse = { responseCode: -5, deviceState: null, deviceCommand }
            //     throw transportResponse;
            // }
            // construct the power command byte array
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
            // if (this.queueSize > 0) {
            //     const transportResponse: ITransportResponse = { responseCode: 0, deviceState: null, deviceCommand }
            //     throw transportResponse;
            // }
            //construct query command byte array
            commandByteArray = COMMAND_QUERY_STATE;
            break;

        case ANIMATION_FRAME:
            //test for bad or insufficient data?
            //construct animation frame byte array
            break;
        default:
            const completeResponse: ICompleteResponse = Object.assign({}, defaultCompleteResponse, { esponseCode: -1, deviceState: null, deviceCommand });
            throw completeResponse;
    }

    return commandByteArray;
}