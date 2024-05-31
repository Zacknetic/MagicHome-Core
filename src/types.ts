import { DeviceManager } from "./DeviceManager";
import { cloneDeep } from "./utils/miscUtils";

export type ProtoDevice = {
  readonly ipAddress: string;
  readonly uniqueId: string;
  readonly modelNumber: string;
}

export type CompleteDevice = {
  protoDevice: ProtoDevice;
  fetchStateResponse: FetchStateResponse;
  latestUpdate: number;
}

export type DeviceBundle = {
	completeDevice: CompleteDevice;
	deviceManager: DeviceManager;
};

export type InterfaceOptions = {
  readonly timeoutMS: number;
}

export type ColorRGB = {
  red: number;
  green: number;
  blue: number;
}

export type IColorCCT = {
  warmWhite: number;
  coldWhite: number;
}

export type CompleteResponse = {
  fetchStateResponse: FetchStateResponse;
  initialDeviceCommand: DeviceCommand;
  initialCommandOptions: CommandOptions;
  responseCode: number;
  responseMsg?: string;
}

export type FetchStateResponse = {
  deviceState: DeviceState;
  deviceMetaData: DeviceMetaData;
}

export type DeviceCommand = {
  isOn: boolean;
  RGB: ColorRGB;
  CCT: IColorCCT;
  colorMask?: number;
}

export type CommandOptions = {
  readonly colorAssist: boolean;
  readonly commandType: CommandType;
  readonly isEightByteProtocol: boolean;
  readonly waitForResponse: boolean;
  readonly maxRetries: number;
}

export type DeviceState = {
  isOn: boolean;
  RGB: ColorRGB;
  CCT: IColorCCT;
}

export type DeviceMetaData = {
  readonly controllerHardwareVersion: number;
  readonly controllerFirmwareVersion: number;
  readonly rawData: Buffer;
}

export type TransportResponse = {
  responseCode: number;
  responseMsg: Buffer;
}

export type IQueueOptions = {
  timeout?: number;
  autoStart?: boolean;
  interval?: number;
}

/*******************************CONSTANTS****************** */

export enum ErrorType {
  INCORRECT_BUFFER_ERROR = -9,
  DEVICE_UNRESPONSIVE_ERROR = -8,
  SOCKET_ERROR = -7,
  COMMAND_TIMEOUT_ERROR = -6,
  DUPLICATE_POWER_COMMAND_ERROR = -5,
  INCORRECT_DEVICE_STATE_ERROR = -4,
  SOCKET_CLOSED_ERROR = -2,
  UNKNOWN_FAILURE_ERROR = -1,
  UNNECESSARY_QUERY_ERROR = 0,
}

export const ErrorMessages: { [key in ErrorType]: string } = {
  [ErrorType.INCORRECT_BUFFER_ERROR]: "Incorrect or wrong length buffer",
  [ErrorType.DEVICE_UNRESPONSIVE_ERROR]: "The device did not respond",
  [ErrorType.SOCKET_ERROR]: "The socket reported an error",
  [ErrorType.COMMAND_TIMEOUT_ERROR]: "The command/query timed out",
  [ErrorType.DUPLICATE_POWER_COMMAND_ERROR]: "The power command was a duplicate",
  [ErrorType.INCORRECT_DEVICE_STATE_ERROR]: "The device state was incorrect",
  [ErrorType.SOCKET_CLOSED_ERROR]: "The socket was closed before resolving",
  [ErrorType.UNKNOWN_FAILURE_ERROR]: "An unknown failure occurred",
  [ErrorType.UNNECESSARY_QUERY_ERROR]: "The query was unnecessary",
};

export enum CommandType {
  POWER,
  COLOR,
  ANIMATION_FRAME,
  QUERY_STATE
};

export type StateCommandArray = [number, number, number];

export const BASIC_DEVICE_COMMANDS = {
  POWER_ON: [0x71, 0x23, 0x0f] as StateCommandArray,
  POWER_OFF: [0x71, 0x24, 0x0f] as StateCommandArray,
  QUERY_STATE: [0x81, 0x8a, 0x8b] as StateCommandArray
};

export type ColorCommandArray = [number, number, number, number, number, number, number, number] | [number, number, number, number, number, number, number];
/*******************************DEFAULT VALUES****************** */

export enum ColorMask {
  WHITE = 0x0f,
  COLOR = 0xf0,
  BOTH = 0xff,
};

export const DEFAULT_RGB: ColorRGB = {
  red: 0,
  green: 0,
  blue: 0,
};

export const DEFAULT_CCT: IColorCCT = {
  warmWhite: 0,
  coldWhite: 0,
};

export const DEVICE_STATE_DEFAULTS: DeviceState = {
  isOn: false,
  RGB: cloneDeep(DEFAULT_RGB),
  CCT: cloneDeep(DEFAULT_CCT),
};

export const DEFAULT_COMMAND: DeviceCommand = {
  isOn: true,
  RGB: cloneDeep(DEFAULT_RGB),
  CCT: cloneDeep(DEFAULT_CCT),
};

export const DEFAULT_DEVICE_METADATA: DeviceMetaData = {
  controllerFirmwareVersion: null,
  controllerHardwareVersion: null,
  rawData: null,
};

export const DEFAULT_COMPLETE_RESPONSE: CompleteResponse = {
  responseCode: null,
  initialDeviceCommand: null,
  fetchStateResponse: {
    deviceState: null,
    deviceMetaData: null,
  },
  initialCommandOptions: null,
  responseMsg: null,
};

// export const DEFAULT_COMMAND_OPTIONS: ICommandOptions = {
//   timeoutMS: 50,
//   colorAssist: true,
//   isEightByteProtocol: false,
//   commandType: CommandType.COLOR,
//   waitForResponse: true,
//   maxRetries: 5,
// };

/*******************************Helper Types****************** */
// type Enumerate<N extends number, Acc extends number[] = []> = Acc['length'] extends N
//     ? Acc[number]
//     : Enumerate<N, [...Acc, Acc['length']]>

// type PrependNextNum<A extends Array<unknown>> = A['length'] extends infer T ? ((t: T, ...a: A) => void) extends ((...x: infer X) => void) ? X : never : never;

// type EnumerateInternal<A extends Array<unknown>, N extends number> = { 0: A, 1: EnumerateInternal<PrependNextNum<A>, N> }[N extends A['length'] ? 0 : 1];

// export type Enumerate<N extends number> = EnumerateInternal<[], N> extends (infer E)[] ? E : never;

// // export type Range<FROM extends number, TO extends number> = Exclude<Enumerate<TO>, Enumerate<FROM>>;

// export type IntRange<F extends number, T extends number> = Exclude<Enumerate<T>, Enumerate<F>>;

/*******************************MOCK SETTINGS****************** */

// export interface IMockDeviceSettings {
//   deviceState: IDeviceState;
//   controllerHardwareVersion: number;
//   controllerFirmwareVersion: number;
//   responseTimeMS: number;
// }

// export interface IMockCommandSettings {
//   responseTimeMS: number;
//   numFailures: number;
// }

// export interface IMockLEDState {
//   isOn: boolean;
//   RGB: IColorRGB;
//   CCT: IColorCCT;
// }
