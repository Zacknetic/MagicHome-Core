// // import { DeviceInterface } from '../DeviceInterface'
// // import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

// import { assert } from 'console';
// import { discoverDevices, completeDevices } from '../DeviceDiscovery';
// import { ICompleteDevice } from '../types';
// // import * as types from '../types'

// let protoDevices;
// let completedDevices: ICompleteDevice[];
// describe('Test the scan function for DeviceDiscovery.ts', function () {
//     afterEach(done => {
//         setTimeout(done, 1000);
//     });

//     it('Should output each device scanned', async function () {
//         const ret = await discoverDevices()
//         protoDevices = ret;
//         if (ret.length < 1) throw new Error("Zero devices discovered!");
//         console.log(ret)

//     })


//     it('Should retrieve meta-data on each device', async function () {
//         const ret = await completeDevices(protoDevices, 500);
//         if (ret.length != protoDevices.length) throw new Error("Every proto-device did not retrieve meta-data successfully");
//         completedDevices = ret;
//         console.log(ret)
//         // console.log(completedDevices[0])
//         const firmware = completedDevices[0].transportResponse.deviceMetaData.controllerFirmwareVersion;
//         const matchingFirmware = matchingFirmwareVersions.get(firmware);
//         console.log(matchingFirmware)
//         // for (let i = 0; i < 10; i++) {
//         //     console.log(`firmwareVersion: ${firmware} == ${i}: ${firmware == i}`)
//         // }
//     })

//     // it('Should output an individual device', async function () {
//     //     if (protoDevices.length > 0) {
//     //         const ret = await completeDevices([protoDevices[0]])
//     //         console.log(ret)
//     //     }
//     // })





// });

// const matchingFirmwareVersions: Map<number, any> = new Map([
//     [1, { needsPowerCommand: false }],
//     [2, { needsPowerCommand: true }],
//     [3, { needsPowerCommand: true, isEightByteProtocol: true }],
//     [4, { needsPowerCommand: true }],
//     [5, { needsPowerCommand: true }],
//     [7, {needsPowerCommand: true }],
//     [8, { needsPowerCommand: true, isEightByteProtocol: true }],
//     [9, { needsPowerCommand: false, isEightByteProtocol: true }],
// ])
