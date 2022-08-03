import { DeviceInterface } from "./DeviceInterface";

export const DEVICE_COMMANDS = {
    COMMAND_POWER_ON: [0x71, 0x23, 0x0f],
    COMMAND_POWER_OFF: [0x71, 0x24, 0x0f],
    COMMAND_QUERY_STATE: [0x81, 0x8a, 0x8b]
}

export const EventNumber = new Map([
    [-8, 'device unresponsive'],
    [-7, 'socket reported error'],
    [-6, 'command/query timed out'],
    [-5, 'duplicate power command'],
    [-4, 'incorrect device state, insufficient retries'],
    [-3, 'incorrect device state, no retries requested'],
    [-2, 'socket closed before resolving'],
    [-1, 'unknown failure'],
    [0, 'unnecessary query command, query already queued'],
    [1, 'device responded with valid state'],
    [2, 'read state timeout not requested'],
    [3, 'write confirmation not requested']
]);

export interface IProtoDevice {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
}

export interface ICustomProtoDevice {
    ipAddress: string;
    uniqueId?: string;
    modelNumber?: string;
}

export interface ICompleteDevice {
    protoDevice: IProtoDevice;
    completeResponse: ICompleteResponse;
    deviceInterface: DeviceInterface;
    latestUpdate: number;
}

export interface ICustomCompleteDevice {
    customProtoDevice: ICustomProtoDevice,
    completeResponse: ICompleteResponse;
    latestUpdate: number;
}

export const COMMAND_TYPE = {
    POWER_COMMAND: 'powerCommand',
    COLOR_COMMAND: 'colorCommand',
    ANIMATION_FRAME: 'animationFrame',
    QUERY_COMMAND: 'queryCommand',
}

/**
 * @field timeoutMS?: number
 * @field bufferMS?: number
 * @field commandType?: string
 * @field isEightByteProtocol?: boolean
 * @field maxRetries: number
 * @field remainingRetries: number
 */
export interface ICommandOptions {
    readonly timeoutMS?: number;
    readonly bufferMS?: number;
    readonly commandType: string;
    readonly isEightByteProtocol?: boolean;
    readonly waitForResponse: boolean;
    maxRetries?: number;
    remainingRetries?: number;
}

export const CommandOptionDefaults: ICommandOptions = {
    timeoutMS: 50,
    bufferMS: 20,
    commandType: 'powerCommand',
    isEightByteProtocol: false,
    waitForResponse: false,
    maxRetries: 0,
}

export interface IDeviceCommand {
    isOn: boolean;
    readonly RGB: IColorRGB;
    readonly CCT: IColorCCT;
    colorMask: number;
}

export interface IIncompleteCommand {
    isOn?: boolean;
    readonly RGB?: IColorRGB;
    readonly CCT?: IColorCCT;
    colorMask?: number;
}

export interface IColorRGB {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
}

export interface IColorCCT {
    readonly warmWhite: number;
    readonly coldWhite: number;
}

export interface IDeviceState {
    readonly isOn: boolean;
    readonly RGB: IColorRGB;
    readonly CCT: IColorCCT;
}

export interface IDeviceMetaData {
    controllerHardwareVersion: number;
    controllerFirmwareVersion: number;
    rawData: Buffer;
}

export interface ICompleteResponse {
    responseCode: number;
    deviceCommand?: IDeviceCommand;
    commandOptions?: ICommandOptions;
    deviceState: IDeviceState;
    deviceMetaData: IDeviceMetaData;
    responseMsg?: any;
}

export interface ITransportResponse {
    responseCode: number,
    responseMsg: Buffer;
}

export interface IQueueOptions {
    timeout?: number;
    autoStart?: boolean;
    interval?: number
}

/*******************************MOCK SETTINGS****************** */

export interface IMockDeviceSettings {
    deviceState: IDeviceState;
    controllerHardwareVersion: number;
    controllerFirmwareVersion: number;
    responseTimeMS: number;
}

export interface IMockCommandSettings {
    responseTimeMS: number;
    numFailures: number;
}


export interface IMockLEDState {
    isOn: boolean;
    RGB: IColorRGB;
    CCT: IColorCCT;
}

export const ColorMasks = {
    white: 0x0F,
    color: 0xF0,
    both: 0xFF,
}


export const defaultCommand: IDeviceCommand = {
    isOn: false,
    RGB: {
        red: 0,
        green: 0,
        blue: 0,
    },
    CCT: {
        warmWhite: 0,
        coldWhite: 0,
    },
    colorMask: ColorMasks.color,
}

export const defaultRGB: IColorRGB = {
    red: 0,
    green: 0,
    blue: 0,
}

export const defaultCCT: IColorCCT = {
    warmWhite: 0,
    coldWhite: 0,
}

export const defaultDeviceState: IDeviceState = {
    isOn: false,
    RGB: defaultRGB,
    CCT: defaultCCT
}

export const defaultDeviceMetaData: IDeviceMetaData = {
    controllerFirmwareVersion: -1,
    controllerHardwareVersion: -1,
    rawData: Buffer.from("0"),
}


 export const defaultCompleteResponse: ICompleteResponse = {
    responseCode: 0,
    deviceState: defaultDeviceState,
    deviceMetaData: defaultDeviceMetaData,
}