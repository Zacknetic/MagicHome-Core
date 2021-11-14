export { scan } from './DeviceDiscovery';
export * from './Transport'


// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env.TS_NODE_PROJECT = './tsconfig.json'

// // Optional: set env variable to enable `tsconfig-paths` integration
// process.env.TS_CONFIG_PATHS = true;

// // register mocha wrapper
// require('ts-mocha');
// async function main() {
//     const deviceInterface = new DeviceInterface('192.168.1.20')
//     let deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xFF }
//     let commandOptions: ICommandOptions = { commandType: 'colorCommand', maxRetries: 5 }
//     let res1 = await deviceInterface.sendCommand(deviceCommand, commandOptions)

//     console.log('first')

//     deviceCommand = { isOn: true, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xFF }
//     commandOptions = { commandType: 'colorCommand', maxRetries: 5 }
//     let res2 = await deviceInterface.sendCommand(deviceCommand, commandOptions)
//     console.log('second')

//     deviceCommand = { isOn: false, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xFF }
//     commandOptions = { commandType: 'powerCommand', maxRetries: 5 }
//     let res3 = await deviceInterface.sendCommand(deviceCommand, commandOptions)
//     console.log('third')

//     console.log('results', res1, res2, res3)
// }

// main()

// deviceCommand = {isOn: false, RGB: {red: 0, green: 255, blue: 0}, CCT: {warmWhite: 0, coldWhite: 0}, colorMask: 0xFF}
// commandOptions = {commandType: 'powerCommand', maxRetries: 5}
// deviceInterface.sendCommand(deviceCommand, commandOptions).catch(error => console.log(error))


// function failureTask(timeout = 500) {
//   return new Promise((resolve, reject) => setTimeout(reject, timeout));
// }

// const queue = new Queue({
//   concurrent: 1,
//   interval: 1000,
//   start: true,
// });

// queue.on("start", () => {
//   console.debug("Queue started");
// });

// queue.on("stop", () => {
//   console.debug("Queue stopped");
// });

// queue.on("end", () => {
//   console.debug("Queue finished");
// });

// queue.on("dequeue", () => {
//   console.debug("Queue dequeued a task");
// });

// queue.on("resolve", (data) => {
//   console.debug("Resolve", data);
// });

// queue.on("reject", (error) => {
//   console.debug("Reject", error);
// });

// queue.enqueue(successTask);
// queue.enqueue(successTask);
// queue.enqueue(failureTask);
// queue.enqueue(failureTask);

// // (async function () {
// //   while (queue.shouldRun) {
// //     const result = await queue.dequeue();

// //     console.debug("Dequeue result", result);
// //   }
// // })();
