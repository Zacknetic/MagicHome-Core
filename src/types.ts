export const DEVICE_COMMANDS = {
    COMMAND_POWER_ON: [0x71, 0x23, 0x0f],
    COMMAND_POWER_OFF: [0x71, 0x24, 0x0f],
    COMMAND_QUERY_STATE: [0x81, 0x8a, 0x8b]
}

export const EventNumber = new Map([
    [-7, 'socket reported error'],
    [-6, 'command/query timed out'],
    [-5, 'duplicate power command'],
    [-4, 'incorrect device state, insufficient retries'],
    [-3, 'incorrect device state, no retries requested'],
    [-2, 'socket closed before resolving'],
    [-1, 'unknown failure'],
    [0, 'unneccisary query command, query already queued'],
    [1, 'device responded with valid state'],
    [2, 'read state timeout not requested']
]);

export interface IDeviceDiscoveredProps {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
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
 */
export interface ICommandOptions {
    readonly timeoutMS?: number;
    readonly bufferMS?: number;
    readonly commandType: string;
    readonly isEightByteProtocol?: boolean;
    retries: number;
}

export const CommandOptionDefaults: ICommandOptions = {
    timeoutMS: 50,
    bufferMS: 20,
    commandType: 'powerCommand',
    isEightByteProtocol: false,
    retries: 0,
}

export interface IDeviceCommand {
    readonly isOn: boolean;
    readonly RGB: IColorRGB;
    readonly CCT: IColorCCT;
    readonly colorMask: number;
}

export interface ILEDState {
    readonly isOn: boolean;
    readonly RGB: IColorRGB;
    readonly CCT: IColorCCT;
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
    LEDState: ILEDState;
    controllerHardwareVersion?: number;
    controllerFirmwareVersion?: number;
    rawData?: Buffer;
}

export interface ICommandResponse {
    eventNumber: number;
    readonly deviceCommand: IDeviceCommand | null;
    readonly deviceState: IDeviceState | null;
}

export interface ITransportResponse {
    eventNumber?: number;
    command?: number[];
    response?: any;
    msg?: string;
    queueSize?: number
}

export interface IQueueOptions {
    timeout?: number;
    autoStart?: boolean;
    interval?: number
}

/**
 * @field timeoutMS?: number
 * @field intervalMS?: number
 * @field remainingRetries?: number
 * @field maxRetries: number
 */
export interface IPromiseOptions {
    readonly timeoutMS?: number;
    readonly intervalMS?: number
    remainingRetries?: number;
    readonly maxRetries: number;
}

/*******************************MOCK SETTINGS****************** */

export interface IMockDeviceSettings {
    LEDState: ILEDState;
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

export const DefaultAccessoryCommand = {
    isOn: false,
    RGB: {
        red: 0,
        green: 0,
        blue: 0
    },

    CCT: {
        warmWhite: 0,
        coldWhite: 0,
    }
};