import { Transport } from '../Transport'

const TEST_MODE = true
const transport = new Transport('localhost');
import * as types from '../types'
const {
    DEVICE_COMMANDS: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND },
    DefaultAccessoryCommand
} = types;

const red = [0x31, 0xFF, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x0F];
const green = [0x31, 0x00, 0xFF, 0x00, 0x00, 0x00, 0xFF, 0x0F];

const power = COMMAND_POWER_ON

const TIMEOUT = 1000

    ; (async () => {
        const testParams = {
            result: 'FAIL',
            timeToFail: '500'
        }


        // // TEST 1
        // let promise = new Promise((resolve, reject) => {
        //     transport.writeCommand(red, resolve, reject, 2000);
        // })

        // promise.then((returnValue) => {
        //     console.log('ret', returnValue)
        // }).catch(err => {
        //     console.log('FATAL err', err)
        // })


        // // TEST 2
        // promise = new Promise((resolve, reject) => {
        //     const buffer = Buffer.from(COMMAND_QUERY_STATE)
        //     transport.createEventListener(buffer, true, resolve, reject, TIMEOUT);
        // })

        // promise.then((returnValue) => {
        //     console.log('ret', returnValue)
        // }).catch(err => {
        //     console.log('FATAL err', err)
        // })


        // TEST 3
        let promise = new Promise((resolve, reject) => {
            const buffer = Buffer.from(green)
            transport._sendCommand(buffer, true, resolve, reject, TIMEOUT);
        })

        promise.then((returnValue) => {
            console.log('ret', returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })


        // TEST 4
        promise = new Promise((resolve, reject) => {
            const buffer = Buffer.from(COMMAND_QUERY_STATE)
            transport._sendCommand(buffer, true, resolve, reject, TIMEOUT);
        })

        promise.then((returnValue) => {
            console.log('ret', returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })


    })()