export { scan } from './DeviceDiscovery';
export * from './Transport'

import { Transport } from './Transport'
// import { Transport2 } from './Transport2'
const host = '192.168.1.16'
// const transport2 = new Transport2(host);
const transport = new Transport(host);
async function start() {
    console.log('start')
    //const state = await transport2.queryState()
    const state = await transport.getState()
    console.log(state)

}

start()

import { scan } from './DeviceDiscovery';

(async () => {
    const test = await scan(2000);
    console.log(test)
})()


// import Queue from 'queue-promise';

// function successTask(timeout = 500) {
//   return new Promise((resolve, reject) => setTimeout(resolve, timeout));
// }

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
