// import { types } from "util";
// import { DeviceManager } from "../src/core/deviceManager";
// import { CommandOptions, CommandType } from "../src/models/types";




// let deviceManager;
// let transport;
// beforeEach(async () => {
//     transport = new transport('192.168.50.137');
//     deviceManager = new DeviceManager(transport, { timeoutMS: 300 });
// });






// describe('Test the DeviceManager class', () => {



//     const commandOptions: CommandOptions = { colorAssist: false, waitForResponse: true, maxRetries: 5, commandType: CommandType.LED, isEightByteProtocol: true };

//     it('Should set light state to red', async function () {


//         let deviceCommand = { isOn: true, RGB: { red: 255, green: 0, blue: 0 }, CCT: { warmWhite: 0, coldWhite: 0 }, colorMask: 0xF0 };

//         deviceManager.sendCommand(deviceCommand, commandOptions)
       
//         await sleep(200);
//     })

// });

// async function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }