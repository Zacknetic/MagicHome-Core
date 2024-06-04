// // import { DeviceManager } from '../DeviceManager'
// // import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

// import assert = require('assert');
// import { discoverDevices, completeDevices } from '../DeviceDiscovery';
// import { ICompleteDevice } from '../types';
// import { ICommandOptions } from '../types';
// import * as types from '../types';
// // import * as types from '../types'

// describe('Test DeviceDiscovery class functions', function () {
// 	const {
// 		COMMAND_TYPE: { COLOR_COMMAND },
// 	} = types;

// 	let protoDevices: types.IProtoDevice[] = [];
// 	let completedDevices: ICompleteDevice[] = [];
// 	it('Should find all devices, create CompleteDevice, and set light state to red', async function () {
// 		// Discover devices
// 		protoDevices = await discoverDevices();
// 		console.log(protoDevices);
// 		assert.strictEqual(protoDevices.length > 0, true);
// 	});

// 	it('Should create the same number of CompleteDevice for each ProtoDevice.', async function () {
// 		// Create CompleteDevice for each ProtoDevice
// 		completedDevices = await completeDevices(protoDevices, 500, 10);
// 		for (const completedDevice of completedDevices) {
// 			console.log('CompleteDevice Info: ', completedDevice.completeDeviceInfo);
// 			console.log('Complete Response: ', completedDevice.completeResponse);
// 			console.log('Device Interface: ', completedDevice.deviceManager);
// 		}

// 		assert.strictEqual(protoDevices.length, completedDevices.length);
// 	});

// 	describe('Test the DeviceManager send function for eight byte protocol devices', () => {
// 		it('Should set light state to red for each eight byte protocol device.', async function () {
// 			const commandOptions: ICommandOptions = {
// 				colorAssist: false,
// 				waitForResponse: true,
// 				maxRetries: 5,
// 				remainingRetries: 5,
// 				commandType: COLOR_COMMAND,
// 				timeoutMS: 50,
// 				isEightByteProtocol: true,
// 			};

// 			// Define the red command
// 			const deviceCommand = {
// 				isOn: true,
// 				RGB: { red: 255, green: 0, blue: 0 },
// 				CCT: { warmWhite: 0, coldWhite: 0 },
// 				colorMask: 0xf0,
// 			};

// 			// Create an array of promises to send the red command to each device
// 			const promises = completedDevices.map(async (device) => {
// 				try {
// 					const returnValue: types.ICompleteResponse | void =
// 						await device.deviceManager.sendCommand(
// 							deviceCommand,
// 							commandOptions
// 						);
// 					console.log('return value: ', returnValue);
// 				} catch (err) {
// 					console.log(
// 						`Device ${device.completeDeviceInfo.protoDevice.ipAddress} error: `,
// 						err
// 					);
// 				}
// 			});

// 			// Wait for all promises to complete
// 			await Promise.all(promises);
// 		});
// 	});

// 	describe('Test the DeviceManager send function for non-eight byte protocol devices', () => {
// 		it('Should set light state to red for each non-eight byte protocol device.', async function () {
// 			const commandOptions: ICommandOptions = {
// 				colorAssist: false,
// 				waitForResponse: true,
// 				maxRetries: 5,
// 				remainingRetries: 5,
// 				commandType: COLOR_COMMAND,
// 				timeoutMS: 50,
// 				isEightByteProtocol: false,
// 			};

// 			// Define the red command
// 			const deviceCommand = {
// 				isOn: true,
// 				RGB: { red: 255, green: 0, blue: 0 },
// 				CCT: { warmWhite: 0, coldWhite: 0 },
// 				colorMask: 0xf0,
// 			};

// 			// Create an array of promises to send the red command to each device
// 			const promises = completedDevices.map(async (device) => {
// 				try {
// 					const returnValue: types.ICompleteResponse | void =
// 						await device.deviceManager.sendCommand(
// 							deviceCommand,
// 							commandOptions
// 						);
// 					console.log('return value: ', returnValue);
// 				} catch (err) {
// 					console.log(
// 						`Device ${device.completeDeviceInfo.protoDevice.ipAddress} error: `,
// 						err
// 					);
// 				}
// 			});

// 			// Wait for all promises to complete
// 			await Promise.all(promises);
// 		});
// 	});
// });
