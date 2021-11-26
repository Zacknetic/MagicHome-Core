import { DeviceInterface } from '../DeviceInterface'
import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';
import * as types from '../types'

const {
    DEVICE_COMMANDS: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND }
} = types;

function asyncMethod(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
    return deviceInterface.sendCommand(deviceCommand, commandOptions)
}
0
let deviceInterface;

beforeEach(done => {
    deviceInterface = new DeviceInterface('192.168.1.26');
    setTimeout(done, 500)
});

// afterEach(done => {
//     setTimeout(done, 500)
// })

describe('Basic Commands Without Waiting For Reply', () => {
    const deviceCommand: IDeviceCommand = {isOn: true, RGB: {red: 2, green: 10, blue: 125}, CCT: {warmWhite: 0, coldWhite: 0}, colorMask: 0xF0}
    const commandOptions: ICommandOptions = {retries: 20, commandType: COLOR_COMMAND, timeoutMS: 20, isEightByteProtocol: true}
    // it('Should add a single color command to the queue and return success code and null deviceState', async () => {
    //     asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
    //         console.log('return value: ', returnValue)
    //     }).catch(err => {
    //         console.log('FATAL err', err)
    //     })
    // })

    it('Should add five color commands to the queue and return success code for each null deviceState', async () => {
        asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
            console.log('return value: ', returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })
        asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
            console.log('return value: ', returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })
        asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
            console.log('return value: ', returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })
        asyncMethod(deviceCommand, commandOptions).then((returnValue) => {
            console.log('return value: ', returnValue)
        }).catch(err => {
            console.log('FATAL err', err)
        })
    })

    // it('Should add five color commands two queryState commands to the queue \nreturning success code for color commands and state for query state commands', async () => {
    //     asyncMethod(COMMAND_QUERY_STATE, TIMEOUT).then((returnValue) => {
    //         console.log('return value: ', returnValue)
    //     }).catch(err => {
    //         console.log('FATAL err', err)
    //     })
    // })

});

// describe('Color/Power Commands With Testing and Retries', () => {
//     const commandOptions: ICommandOptions = { commandType: COLOR_COMMAND, retries: 5, timeoutMS: 1000, isEightByteProtocol: true }
//     let deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
//     it('Should add a single color command, test state, and retry until correct.', () => {
//         asyncMethod(deviceCommand, commandOptions)
//         deviceCommand = { isOn: true, RGB: { red: 255, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
//         asyncMethod(deviceCommand, commandOptions)

//         deviceCommand = { isOn: true, RGB: { red: 0, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
//         asyncMethod(deviceCommand, commandOptions)
//         deviceCommand = { isOn: true, RGB: { red: 0, green: 255, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
//         asyncMethod(deviceCommand, commandOptions)
//         deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 255 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
//         asyncMethod(deviceCommand, commandOptions)
//         deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
//         asyncMethod(deviceCommand, commandOptions)
//     })

//     it('Should add five color commands to the queue, \non the last command: test state, and retry until correct.', async () => {
//         asyncMethod(COMMAND_QUERY_STATE, TIMEOUT).then((returnValue) => {
//             console.log('return value: ', returnValue)
//         }).catch(err => {
//             console.log('FATAL err', err)
//         })
//     })

//     it('Should add five color commands two queryState commands to the queue\n queryState commands should be discarded as we are testing state for the final command \non the last command: test state, and retry until correct', async () => {
//         asyncMethod(COMMAND_QUERY_STATE, TIMEOUT).then((returnValue) => {
//             console.log('return value: ', returnValue)
//         }).catch(err => {
//             console.log('FATAL err', err)
//         })
//     })

// });

// describe('Color/Power Commands With Testing and Retries', () => {
//     const commandOptions: ICommandOptions = { commandType: POWER_COMMAND, retries: 5, timeoutMS: 1000, isEightByteProtocol: true }
//     let deviceCommand: IDeviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
//     it('Should add a single color command, test state, and retry until correct.', () => {
//         asyncMethod(deviceCommand, commandOptions)
//         deviceCommand = { isOn: true, RGB: { red: 255, green: 255, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 }
//         asyncMethod(deviceCommand, commandOptions)
//     })

  

// });