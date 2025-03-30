const TEST_MODE = false;
import { SocketManager } from "../src/core/socketManager";
import { BASIC_DEVICE_COMMANDS, CommandType } from "../src/models/types";
const red = [0x31, 0xff, 0x00, 0xff, 0xff, 0xf0, 0x0f];
const green = [0x31, 0x00, 0xff, 0x00, 0x00, 0xf0, 0x0f];
const blue = [0x31, 0x00, 0x00, 0xff, 0x00, 0xf0, 0x0f];
// const red = [0x31, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xF0, 0x0F];
// const green = [0x31, 0x00, 0xFF, 0x00, 0x00, 0x00, 0xF0, 0x0F];
// const blue = [0x31, 0x00, 0x00, 0xff, 0x00, 0x00, 0xf0, 0x0f];
// const warmWhite = [0x31, 0x00, 0x00, 0xFF, 0x00, 0x00, 0xF0, 0x0F];

const TIMEOUT = 1000;
let transport: SocketManager;
// ; (async () => {
// const testParams = {
//     result: 'FAIL',
//     timeToFail: '500'
// }
// transport = new Transport(HOST);
const HOST = "192.168.50.63";
before((done) => {
  setTimeout(done, 100);
  //   console.log("test");
  transport = new SocketManager(HOST);
});

async function asyncMethod(byteArray, expectResponse, timeout?) {
  await transport.send(byteArray);
  await sleep(5000)
  return await transport.requestState(5000);
}

// describe('Check input data types', () => {

//     it('Should accept format: byteArray: number[]', () => {

//         asyncMethod(COMMAND_QUERY_STATE, true, TIMEOUT).then((returnValue) => {
//             console.log('Current State: ', returnValue)
//             // assert.strictEqual((returnValue !== null), true) //TODO create real assert
//         }).catch(err => {
//             console.log('FATAL err', err)
//         })

//     })

//     it('Should handle unsupported format', () => {
//         asyncMethod("THIS IS A STRING WHICH IS unsupported", true, TIMEOUT).then((returnValue) => {
//             console.log('Test return value:', returnValue)
//         }).catch(err => {
//             // assert(typeof err == typeof new Error())
//             console.log('Successfully caught unsupported format')
//         })

//     })
// })

// describe("Query State Test", () => {
//   it("Should return current device state", () => {
//     transport.send(red);
//     transport
//       .requestState(10000)
//       .then((returnValue) => {
//         console.log("Current State: ", returnValue);
//         // assert.strictEqual((returnValue !== null), true) //TODO create real assert
//       })
//       .catch((err) => {
//         console.log("FATAL err", err);
//       });

// transport
//   .requestState(10000)
//   .then((returnValue) => {
//     console.log("Current State: ", returnValue);
//     // assert.strictEqual((returnValue !== null), true) //TODO create real assert
//   })
//   .catch((err) => {
//     console.log("FATAL err", err);
//   });

// transport.then((returnValue) => {
//     console.log('Current State: ', returnValue)
//     tran
//     // assert.strictEqual((returnValue !== null), true) //TODO create real assert
// }
// ).catch(err => {
//     console.log('FATAL err', err)
// }
// )
//   });
// });

describe("Send Command Test", () => {
  it("Should set the device color to red, green, blue", async function () {
    asyncMethod(BASIC_DEVICE_COMMANDS.POWER_OFF, false, 0).then((returnValue) => {
        console.log(returnValue)
        // setImmediate(done)
    }).catch(err => {
        console.log('FATAL err', err)
    })

    await sleep(1000)
    asyncMethod(BASIC_DEVICE_COMMANDS.POWER_OFF, false, 0).then((returnValue) => {
        console.log(returnValue)
        // setImmediate(done)
    }).catch(err => {
        console.log('FATAL err', err)
    })

    // await sleep(1000)
    // asyncMethod(BASIC_DEVICE_COMMANDS.POWER_OFF, false, 0).then((returnValue) => {
    //     console.log(returnValue)
    //     // setImmediate(done)
    // }).catch(err => {
    //     console.log('FATAL err', err)
    // })
    await sleep(1000)
    asyncMethod(BASIC_DEVICE_COMMANDS.POWER_OFF, false, 0).then((returnValue) => {
        console.log(returnValue)
        // setImmediate(done)
    }).catch(err => {
        console.log('FATAL err', err)
    })

    await sleep(1000)
    asyncMethod(BASIC_DEVICE_COMMANDS.POWER_OFF, false, 0).then((returnValue) => {
        console.log(returnValue)
        // setImmediate(done)
    }).catch(err => {
        console.log('FATAL err', err)
    })

    // // await sleep(1000)
    asyncMethod(BASIC_DEVICE_COMMANDS.POWER_ON, false, 0).then((returnValue) => {
        console.log(returnValue)
        // setImmediate(done)
    }).catch(err => {
        console.log('FATAL err', err)
    })



    await sleep(1000)
    asyncMethod(BASIC_DEVICE_COMMANDS.POWER_ON, false, 0).then((returnValue) => {
        console.log(returnValue)
        // setImmediate(done)
    }).catch(err => {
        console.log('FATAL err', err)
    })

    await sleep(1000)
    // asyncMethod(BASIC_DEVICE_COMMANDS.POWER_ON, false, 0).then((returnValue) => {
    //     console.log(returnValue)
    //     // setImmediate(done)
    // }).catch(err => {
    //     console.log('FATAL err', err)
    // })

    // await sleep(1000)


    // await sleep(500)
    asyncMethod(blue, false, 0).then((returnValue) => {
        console.log(returnValue)
        // setImmediate(done)
        // setImmediate(done)

    }).catch(err => {
        console.log('FATAL err', err)
    })
  });
});

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// https://www.testim.io/blog/testing-promises-using-mocha/
