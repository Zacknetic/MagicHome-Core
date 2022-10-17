// import { DeviceInterface } from '../DeviceInterface'
// import { ICommandOptions, IDeviceCommand } from '../types';
// import * as types from '../types'
// import { Transport } from '../Transport';

// const {
//     DEVICE_COMMAND_BYTES: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
//     COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND }
// } = types;



// let deviceInterface;
// let transport;


// async function asyncMethod(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
//     const party: types.ICompleteResponse = await deviceInterface.sendCommand(deviceCommand, commandOptions);
//     return party
// }


// // describe('Set the device state to red, green, blue, warmWhite at a 500ms interval. Each with 20 retries.\nOnly after the final message, output state', () => {



// //     it('Should return the device state', function () {
// //         let deviceCommand = { isOn: true, RGB: { red: 255, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };
// //         const commandOptions: ICommandOptions = { remainingRetries: 20, commandType: COLOR_COMMAND, timeoutMS: 0, isEightByteProtocol: true };

// //         // await sleep(500);
// //         asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
// //             console.log('return value: ', returnValue);
// //         }).catch(err => {
// //             console.log('FATAL err', err);
// //         })

// //     })


// // });


// // afterEach(done => {
// //     setTimeout(done, 500)
// // })



// describe('Test the DeviceInterface class', () => {
//     before(done => {
//         setTimeout(done, 100);
//         transport = new Transport('192.168.1.15');
//         deviceInterface = new DeviceInterface(transport);

//     });



//     const commandOptions: ICommandOptions = { colorAssist: false, waitForResponse: true, maxRetries: 10, remainingRetries: 10, commandType: COLOR_COMMAND, timeoutMS: 50, isEightByteProtocol: false };

//     it('Should set light state to red', async function () {
//         let deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };

//         asyncMethod(deviceCommand, commandOptions)
//             .then((returnValue: types.ICompleteResponse) => {
//                 console.log('return value: ', returnValue);
//             }).catch(err => {
//                 console.log('FATAL err', err);
//             })
//         await sleep(1000);

//         deviceCommand = { isOn: true, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };

//         asyncMethod(deviceCommand, commandOptions)
//             .then((returnValue: types.ICompleteResponse) => {
//                 console.log('return value: ', returnValue);
//             }).catch(err => {
//                 console.log('FATAL err', err);
//             })
//         await sleep(1000);
//         deviceCommand = { isOn: true, RGB: { red: 0, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };

//         asyncMethod(deviceCommand, commandOptions)
//             .then((returnValue: types.ICompleteResponse) => {
//                 console.log('return value: ', returnValue);
//             }).catch(err => {
//                 console.log('FATAL err', err);
//             })
//     })

// });

// // afterEach()
// // describe('Set the device state to red, green, blue, warmWhite at a 500ms interval. Each with 0 retries.', () => {
// //     afterEach(done => {
// //         setTimeout(done, 500);
// //     });


// //     it('Should set light state to red', function () {
// //         let deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };
// //         const commandOptions: ICommandOptions = { remainingRetries: 0, commandType: COLOR_COMMAND, timeoutMS: 0, isEightByteProtocol: true };

// //         // await sleep(500);
// //         asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
// //             console.log('return value: ', returnValue);
// //         }).catch(err => {
// //             console.log('FATAL err', err);
// //         })

// //     })

// //     it('Should set the light state to green', function ()  {
// //         let deviceCommand = { isOn: true, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };
// //         const commandOptions: ICommandOptions = { remainingRetries: 0, commandType: COLOR_COMMAND, timeoutMS: 0, isEightByteProtocol: true };

// //         asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
// //             console.log('return value: ', returnValue);
// //         }).catch(err => {
// //             console.log('FATAL err', err);
// //         });
// //     });

// //     it('Should set the light state to blue', function () {
// //         let deviceCommand = { isOn: true, RGB: { red: 0, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };
// //         const commandOptions: ICommandOptions = { remainingRetries: 0, commandType: COLOR_COMMAND, timeoutMS: 0, isEightByteProtocol: true };

// //         asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
// //             console.log('return value: ', returnValue);
// //         }).catch(err => {
// //             console.log('FATAL err', err);
// //         });
// //     });

// //     it('Should set the light state to warmWhite', function () {
// //         let deviceCommand = { isOn: true, RGB: { red: 0, green: 0, blue: 0 }, CCT: { warmWhite: 255, coldWhite: 0 }, colorMask: 0x0F };
// //         const commandOptions: ICommandOptions = { remainingRetries: 0, commandType: COLOR_COMMAND, timeoutMS: 0, isEightByteProtocol: true };

// //         asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
// //             console.log('return value: ', returnValue);
// //         }).catch(err => {
// //             console.log('FATAL err', err);
// //         });
// //     });

// // });

// // describe('Color/Power Commands With Testing and Retries', () => {
// //     const commandOptions: ICommandOptions = { commandType: COLOR_COMMAND, retries: 5, timeoutMS: 1000, isEightByteProtocol: true }
// //     let deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
// //     it('Should add a single color command, test state, and retry until correct.', () => {
// //         asyncMethod(deviceCommand, commandOptions)
// //         deviceCommand = { isOn: true, RGB: { red: 255, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
// //         asyncMethod(deviceCommand, commandOptions)

// //         deviceCommand = { isOn: true, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
// //         asyncMethod(deviceCommand, commandOptions)
// //         deviceCommand = { isOn: true, RGB: { red: 0, green: 255, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
// //         asyncMethod(deviceCommand, commandOptions)
// //         deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
// //         asyncMethod(deviceCommand, commandOptions)
// //         deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
// //         asyncMethod(deviceCommand, commandOptions)
// //     })

// //     it('Should add five color commands to the queue, \non the last command: test state, and retry until correct.', async () => {
// //         asyncMethod(COMMAND_QUERY_STATE, TIMEOUT).then((returnValue) => {
// //             console.log('return value: ', returnValue)
// //         }).catch(err => {
// //             console.log('FATAL err', err)
// //         })
// //     })

// //     it('Should add five color commands two queryState commands to the queue\n queryState commands should be discarded as we are testing state for the final command \non the last command: test state, and retry until correct', async () => {
// //         asyncMethod(COMMAND_QUERY_STATE, TIMEOUT).then((returnValue) => {
// //             console.log('return value: ', returnValue)
// //         }).catch(err => {
// //             console.log('FATAL err', err)
// //         })
// //     })

// // });

// // describe('Color/Power Commands With Testing and Retries', () => {
// //     const commandOptions: ICommandOptions = { commandType: POWER_COMMAND, retries: 5, timeoutMS: 1000, isEightByteProtocol: true }
// //     let deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
// //     it('Should add a single color command, test state, and retry until correct.', () => {
// //         asyncMethod(deviceCommand, commandOptions)
// //         deviceCommand = { isOn: true, RGB: { red: 255, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
// //         asyncMethod(deviceCommand, commandOptions)
// //     })



// // });

// async function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }