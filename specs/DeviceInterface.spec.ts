// import { DeviceManager } from '../DeviceManager'
// import { discoverDevices } from '../DeviceDiscovery';
// import { ICommandOptions, IDeviceCommand } from '../types';
// import * as types from '../types'
// import { Transport } from '../Transport';

// const {
//     COMMAND_TYPE: { COLOR_COMMAND, }
// } = types;



// let deviceManager;
// let transport;
// beforeEach(async () => {
//     transport = new Transport('192.168.50.137');
//     deviceManager = new DeviceManager(transport);
// });






// describe('Test the DeviceManager class', () => {



//     const commandOptions: ICommandOptions = { colorAssist: false, waitForResponse: true, maxRetries: 5, remainingRetries: 5, commandType: COLOR_COMMAND, timeoutMS: 50, isEightByteProtocol: true };

//     it('Should set light state to red', async function () {


//         let deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };

//         deviceManager.sendCommand(deviceCommand, commandOptions)
//             .then((returnValue: types.ICompleteResponse) => {
//                 console.log('return value: ', returnValue);
//             }).catch(err => {
//                 console.log('Cool err', err);
//             });
//         await sleep(200);
//     })

// });

// async function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }