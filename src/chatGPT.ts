// import { EventEmitter } from 'events';
// import {
//     ICompleteDeviceInfo,
//     ICommandOptions,
//     ICompleteDevice,
//     ICompleteResponse,
//     IDeviceCommand,
//     ITransportResponse,
//     IQueueOptions,
//     DEVICE_COMMAND_BYTES,
//     COMMAND_TYPE,
//     COLOR_MASKS,
//     IDeviceMetaData,
//     IDeviceState,

// } from './types';

// export class WifiLightDevice extends EventEmitter {
//     private deviceInfo: ICompleteDeviceInfo;
//     private device: ICompleteDevice;
//     private queue: { command: IDeviceCommand; options: ICommandOptions }[] = [];
//     private queueOptions: IQueueOptions = {
//         timeout: 500,
//         autoStart: true,
//         interval: 50,
//     };
//     transport: any;

//     constructor(deviceInfo: ICompleteDeviceInfo) {
//         super();
//         this.deviceInfo = deviceInfo;
//     }

//     public async connect(): Promise<void> {
//         // Connect to the device and instantiate the ICompleteDevice interface
//         this.device = await this.connectToDevice();
//     }

//     public async sendCommand(
//         command: IDeviceCommand,
//         options: ICommandOptions,
//     ): Promise<ICompleteResponse | void> {
//         // Send the command to the device and return the response
//         return this.device.deviceInterface.sendCommand(command, options);
//     }

//     public async queueCommand(
//         command: IDeviceCommand,
//         options: ICommandOptions,
//     ): Promise<void> {
//         // Add the command to the queue
//         this.queue.push({ command, options });
//     }


//     public async startQueue(): Promise<void> {
//         // Send the commands in the queue to the device
//         while (this.queue.length > 0) {
//             const { command, options } = this.queue.shift();
//             await this.sendCommand(command, options);
//             await new Promise((resolve) =>
//                 setTimeout(resolve, this.queueOptions.interval),
//             );
//         }
//     }

//     private async connectToDevice(): Promise<ICompleteDevice> {
//         // Connect to the device and return the ICompleteDevice interface
//         const transportResponse = await this.transport.send(
//             DEVICE_COMMAND_BYTES.COMMAND_QUERY_STATE,
//             { commandType: COMMAND_TYPE.QUERY_COMMAND, waitForResponse: true },
//         );
//         const deviceState = this.parseDeviceState(transportResponse);
//         return {
//             completeDeviceInfo: this.deviceInfo,
//             deviceInterface: {
//                 async sendCommand(
//                     command: IDeviceCommand,
//                     options: ICommandOptions,
//                 ): Promise<ICompleteResponse> {
//                     // Send the command to the device and return the response
//                     const transportResponse = await this.transport.send(
//                         this.getCommandBytes(command),
//                         options,
//                     );
//                     return this.parseResponse(transportResponse, options);
//                 },
//             },
//             completeResponse: {
//                 deviceState,
//                 deviceMetaData: this.parseDeviceMetaData(transportResponse),
//             },
//         };
//     }

//     private parseDeviceState(
//         transportResponse: ITransportResponse,
//     ): IDeviceState {
//         // Parse the device state from the transport response
//         const { responseMsg } = transportResponse;
//         return {
//             isOn: responseMsg[0] === COLOR_MASKS.ON,
//             RGB: {
//                 red: responseMsg[1],
//                 green: responseMsg[2],
//                 blue: responseMsg[3],
//             },
//             CCT: {
//                 warmWhite: responseMsg[4],
//                 coldWhite: responseMsg[5],
//             },
//         };
//     }

//     private parseDeviceMetaData(
//         transportResponse: ITransportResponse,
//     ): IDeviceMetaData {
//         // Parse the device metadata from the transport response
//         const { responseCode, responseMsg } = transportResponse;
//         return {
//             controllerHardwareVersion: responseMsg[6],
//             controllerFirmwareVersion: responseMsg[7],
//             rawData: responseMsg.slice(8),
//         };
//     }

//     private getCommandBytes(command: IDeviceCommand): number[] {
//         // Get the byte values for the command
//         if (command.isOn) {
//             return DEVICE_COMMAND_BYTES.COMMAND_POWER_ON;
//         } else {
//             return DEVICE_COMMAND_BYTES.COMMAND_POWER_OFF;
//         }
//     }
// }
