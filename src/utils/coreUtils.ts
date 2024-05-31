import * as types from '../types';
import { ColorCommandArray, CommandOptions, DeviceCommand, FetchStateResponse, StateCommandArray } from '../types'
import { deepEqual } from './miscUtils';
import { CommandType, ColorMask } from '../types';
const {
    BASIC_DEVICE_COMMANDS
} = types;


/**
 * Converts the device command to a byte array. 
 * @param deviceCommand 
 * @param commandOptions 
 * @returns ColorCommandArray | StateCommandArray
 * 
 */
export function commandToByteArray(deviceCommand: DeviceCommand, commandOptions: CommandOptions): ColorCommandArray | StateCommandArray {
    let commandByteArray: ColorCommandArray | StateCommandArray;

    switch (commandOptions.commandType) {
        case CommandType.POWER: // construct the power command byte array
            // if (!this.testLatestPowerCommand(deviceCommand.isOn)) {
            //     const transportResponse: ITransportResponse = { responseCode: -5, deviceState: null, deviceCommand }
            //     throw transportResponse;
            // }

            commandByteArray = deviceCommand.isOn ? BASIC_DEVICE_COMMANDS.POWER_ON : BASIC_DEVICE_COMMANDS.POWER_OFF;
            break;

        case CommandType.COLOR: // Constructs the color command byte array
            //test for bad or insufficient data?

            commandByteArray = constructColorCommand(deviceCommand, commandOptions);
            break;

        case CommandType.QUERY_STATE:
            //construct query command byte array
            commandByteArray = BASIC_DEVICE_COMMANDS.QUERY_STATE;
            break;

        case CommandType.ANIMATION_FRAME:
            //test for bad or insufficient data?

            commandByteArray = constructColorCommand(deviceCommand, commandOptions);
            break;
    }

    return commandByteArray;
}

function constructColorCommand(deviceCommand: DeviceCommand, commandOptions: CommandOptions): ColorCommandArray {
    let commandByteArray: ColorCommandArray;
    const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;
    console.log("Color Command: ", deviceCommand, commandOptions)
    let newColorMask = colorMask;

    if (!colorMask) {
        newColorMask = Math.max(red, green, blue) > Math.max(warmWhite, coldWhite) ? ColorMask.COLOR : ColorMask.WHITE;
    }
    if (commandOptions.isEightByteProtocol) {
        commandByteArray = [0x31, red, green, blue, warmWhite, newColorMask, 0x0F]; //8th byte checksum calculated later in send()
    } else {
        commandByteArray = [0x31, red, green, blue, warmWhite, coldWhite, newColorMask, 0x0F]; //9 byte
    }

    return commandByteArray;
}

export function isStateEqual(deviceCommand: DeviceCommand, deviceResponse: FetchStateResponse, commandType: CommandType): boolean {

    const { deviceState } = deviceResponse;
    if (deviceState.isOn == false && deviceCommand.isOn == false) return true;
    let omitItems;
    if (commandType == CommandType.POWER) omitItems = ["RGB", "CCT"];
    else if (commandType == CommandType.ANIMATION_FRAME) omitItems = ["isOn"];
    else if (deviceCommand.colorMask == ColorMask.WHITE) omitItems = ["RGB"];
    else omitItems = ["CCT"]
    const isEqual = deepEqual(deviceCommand, deviceState, ['colorMask', ...omitItems]);
    return isEqual;
}