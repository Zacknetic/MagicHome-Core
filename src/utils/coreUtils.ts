import * as types from '../models/types';
import { ColorCommandArray, CommandOptions, DeviceCommandRGB, FetchStateResponse, StateCommandArray } from '../models/types'
import { deepEqual } from './miscUtils';
import { CommandType, ColorMask } from '../models/types';
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
export function commandToByteArray(deviceCommand: DeviceCommandRGB, commandOptions: CommandOptions): ColorCommandArray | StateCommandArray {
    let commandByteArray: ColorCommandArray | StateCommandArray;

    switch (commandOptions.commandType) {
        case CommandType.POWER: // construct the power command byte array
            // if (!this.testLatestPowerCommand(deviceCommand.isOn)) {
            //     const transportResponse: ITransportResponse = { responseCode: -5, deviceState: null, deviceCommand }
            //     throw transportResponse;
            // }

            commandByteArray = deviceCommand.isOn ? BASIC_DEVICE_COMMANDS.POWER_ON : BASIC_DEVICE_COMMANDS.POWER_OFF;
            break;

        case CommandType.LED: // Constructs the color command byte array
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

function constructColorCommand(deviceCommand: DeviceCommandRGB, commandOptions: CommandOptions): ColorCommandArray {
    let commandByteArray: ColorCommandArray;
    const { RGB: { red, green, blue }, CCT: { warmWhite, coldWhite }, colorMask } = deviceCommand;
    // console.log("Color Command: ", deviceCommand, commandOptions)
    let newColorMask = colorMask ? colorMask : Math.max(red, green, blue) > Math.max(warmWhite, coldWhite) ? ColorMask.RGB : ColorMask.CCT;
;
    if (commandOptions.isEightByteProtocol) {
        commandByteArray = [0x31, red, green, blue, warmWhite, newColorMask, 0x0F]; //8th byte checksum calculated later in send()
    } else {
        commandByteArray = [0x31, red, green, blue, warmWhite, coldWhite, newColorMask, 0x0F]; //9 byte
    }

    return commandByteArray;
}

export function isStateEqual(deviceCommand: DeviceCommandRGB, deviceResponse: FetchStateResponse, commandType: CommandType): boolean {
    if (!deviceResponse || !deviceCommand) throw new Error("Invalid arguments");
    const { ledStateRGB: deviceState } = deviceResponse;
    if (deviceState.isOn == false && deviceCommand.isOn == false) return true;
    let omitItems;
    if (commandType == CommandType.POWER) omitItems = ["RGB", "CCT"];
    else if (commandType == CommandType.ANIMATION_FRAME) omitItems = ["isOn"];
    else if (deviceCommand.colorMask == ColorMask.CCT) omitItems = ["RGB"];
    else omitItems = ["CCT"]
    const isEqual = deepEqual(deviceCommand, deviceState, ['colorMask', ...omitItems]);
    return isEqual;
}

  
export function bufferFromByteArray(byteArray: number[], useChecksum = true): Buffer {
    const buffer = Buffer.from(byteArray);
    let payload = buffer;
  
    if (useChecksum) payload = calcChecksum(buffer);
  
    return payload;
  }

/**
 * @param data Buffer
 * @returns Buffer
 * @example
 * const data = Buffer.from([0x81, 0x23, 0x23, 0x31, 0x00, 0x00, 0x00, 0x64, 0x64, 0x00, 0x64, 0x00, 0x00, 0x0F]);
 * const checksum = calcChecksum(data);
 * console.log(checksum);
 * <Buffer 81 23 23 31 00 00 00 64 64 00 64 00 00 0f 0f>
 * */
export function calcChecksum(buffer: Uint8Array): Buffer {
	let checksum = 0;

	for (const byte of buffer) {
		checksum += byte;
	}

	checksum = checksum & 0xff;
	const finalCommand: Buffer = Buffer.concat([buffer, Buffer.from([checksum])]);

	return finalCommand;
}
  