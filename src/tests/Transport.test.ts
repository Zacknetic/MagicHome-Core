import assert from 'assert';
import { Transport } from '../Transport'

const TEST_MODE = true
const HOST = '192.168.1.26'
import * as types from '../types'

const {
    DEVICE_COMMANDS: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND },
    DefaultAccessoryCommand
} = types;

const red = [0x31, 0xFF, 0x00, 0x00, 0x00, 0xF0, 0x0F];
const green = [0x31, 0x00, 0xFF, 0x00, 0x00, 0xF0, 0x0F];
const blue = [0x31, 0x00, 0x00, 0xFF, 0x00, 0xF0, 0x0F];

const power = COMMAND_POWER_ON

const TIMEOUT = 1000;
let transport;
// ; (async () => {
// const testParams = {
//     result: 'FAIL',
//     timeToFail: '500'
// }

beforeEach(done => {
    // if (transport) transport.closeSocket();
    transport = new Transport(HOST);
    setTimeout(done, 500);
});

afterEach(done => {
    setTimeout(done, 500);
})

async function asyncMethod(byteArray, timeout?) {
    return await transport.send(byteArray, timeout);
}

describe('Check input data types', () => {

    it('Should accept format: byteArray: number[]', () => {

        asyncMethod(COMMAND_QUERY_STATE, TIMEOUT).then((returnValue) => {
            console.log('Test return value:', returnValue)
            assert.strictEqual((returnValue !== null), true) //TODO create real assert
        }).catch(err => {
            console.log('FATAL err', err)
        })


    })

    it('Should handle unsupported format', () => {
        asyncMethod("THIS IS A STRING WHICH IS UNSUPORTED", TIMEOUT).then((returnValue) => {
            console.log('Test return value:', returnValue)
        }).catch(err => {
            assert(typeof err == typeof new Error())
            console.log('Successfully caught unsuported format')
        })

    })
})


describe('Query State Test', () => {

    it('Should return current device state', () => {

        asyncMethod(COMMAND_QUERY_STATE, TIMEOUT).then((returnValue) => {
            console.log('return value: ', returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })


    })

});

describe('Send Command Test', () => {

    it('Should set the device color to red, green, blue', () => {
        asyncMethod(red, 500).then((returnValue) => {
            console.log(returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })

        // await sleep(500)
        asyncMethod(green, 500).then((returnValue) => {
            console.log(returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })


        // await sleep(500)

        asyncMethod(blue, 500).then((returnValue) => {
            console.log(returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })
    })
});


async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// })()

// https://www.testim.io/blog/testing-promises-using-mocha/

