// export { scan } from './DeviceDiscovery';
import { DeviceInterface } from './DeviceInterface';
import { ICommandOptions, IDeviceCommand } from './types';

async function main() {
    const deviceInterface = new DeviceInterface('192.168.1.20')
    let deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xFF }
    let commandOptions: ICommandOptions = { commandType: 'colorCommand', maxRetries: 5 }
    let res1 = await deviceInterface.sendCommand(deviceCommand, commandOptions)

    console.log('first')

    deviceCommand = { isOn: true, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xFF }
    commandOptions = { commandType: 'colorCommand', maxRetries: 5 }
    let res2 = await deviceInterface.sendCommand(deviceCommand, commandOptions)
    console.log('second')

    deviceCommand = { isOn: false, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xFF }
    commandOptions = { commandType: 'powerCommand', maxRetries: 5 }
    let res3 = await deviceInterface.sendCommand(deviceCommand, commandOptions)
    console.log('third')

    console.log('results', res1, res2, res3)
}

main()

// deviceCommand = {isOn: false, RGB: {red: 0, green: 255, blue: 0}, CCT: {warmWhite: 0, coldWhite: 0}, colorMask: 0xFF}
// commandOptions = {commandType: 'powerCommand', maxRetries: 5}
// deviceInterface.sendCommand(deviceCommand, commandOptions).catch(error => console.log(error))
// import { ICommandResponse, IPromiseOptions } from './types';

// const queue = new PromiseQueue({});
// const queue2 = new PromiseQueue({});
// console.log('start')
// const commandResponse: ICommandResponse = {deviceCommand: '[0xFF, 0x00, 0xFF]', deviceResponse: '[0xFF, 0x00, 0xFF]'}

// function test(str) {
//     return commandResponse;
// }
// const promiseOptions: IPromiseOptions = { timeoutMS: 500, intervalMS: 50, maxRetries: 5 }

// const startTime = Date.now();
// async function main() {
//     let res = queue.add(() => { return test('foo1') }, promiseOptions);
//     let res2 = queue.add((() => {
//         return new Promise((resolve, reject) => {
//             setTimeout(() => {
//                 reject(test('bar1'));
//             }, 2000);
//         })
//     }), promiseOptions);
//     res.then(result => console.log(result, Date.now() - startTime)).catch((reason) => console.log('caught: foo1', reason))
//     res2.then(result => console.log(result, Date.now() - startTime)).catch((reason) => console.log('caught:bar1', reason))
// }
// async function main2() {

//     let res = queue2.add((() => {
//         return new Promise((resolve, reject) => {

//             setTimeout(() => {
//                 reject(test('foo2'));
//             }, 2000);
//         })

//     }), promiseOptions);
//     let res2 = queue2.add((() => {
//         return test('bar2');
//     }), promiseOptions);
//     res.then(result => console.log(result, Date.now() - startTime)).catch((reason) => console.log('caught: foo2', reason))
//     res2.then(result => console.log(result, Date.now() - startTime)).catch((reason) => console.log('caught:bar2', reason))
// }

// async function go() {
//     main()
//     main2()
// }

// go()