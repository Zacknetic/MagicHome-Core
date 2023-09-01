// import { DeviceInterface } from '../DeviceInterface'
// import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

import assert = require("assert");
import { discoverDevices, completeDevices } from "../DeviceDiscovery";
import { ICompleteDevice } from "../types";
import { ICommandOptions } from "../types";
import * as types from "../types";
// import * as types from '../types'

describe("Test DeviceDiscovery class functions", function () {
  const {
    COMMAND_TYPE: { COLOR_COMMAND },
  } = types;

  describe("Test the DeviceInterface class", () => {
    const commandOptions: ICommandOptions = {
      colorAssist: false,
      waitForResponse: true,
      maxRetries: 5,
      remainingRetries: 5,
      commandType: COLOR_COMMAND,
      timeoutMS: 50,
      isEightByteProtocol: true,
    };

    it("Should find all devices, create CompleteDevice, and set light state to red", async function () {
      // Discover devices
      const protoDevices = await discoverDevices();
      // assert.strictEqual(protoDevices.length > 0, true);
      console.log("protoDevices: ", protoDevices); 

      // // Create CompleteDevice for each ProtoDevice
      // const completedDevices: ICompleteDevice[] = await completeDevices(
      //   protoDevices,
      //   500,
      //   10
      // );

      // console.log("completedDevices: ", completedDevices);
      // assert.strictEqual(protoDevices.length, completedDevices.length);

      // // Define the red command
      // const deviceCommand = {
      //   isOn: true,
      //   RGB: { red: 255, green: 0, blue: 0 },
      //   CCT: { warmWhite: 0, coldWhite: 0 },
      //   colorMask: 0xf0,
      // };

      // // Create an array of promises to send the red command to each device
      // const promises = completedDevices.map(async (device) => {
      //   try {
      //     const returnValue: types.ICompleteResponse | void =
      //       await device.deviceInterface.sendCommand(
      //         deviceCommand,
      //         commandOptions
      //       );
      //   } catch (err) {
      //   //   console.log(
      //   //     `Device ${device.completeDeviceInfo.protoDevice.ipAddress} error: `,
      //   //     err
      //   //   );
      //   }
      // });

      // // Wait for all promises to complete
      // await Promise.all(promises);
    });
  });
});
