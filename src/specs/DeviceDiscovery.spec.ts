import { DeviceInterface } from '../DeviceInterface'
import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

import { DeviceDiscovery } from '../DeviceDiscovery';
import * as types from '../types'

const deviceDiscovery = new DeviceDiscovery();

// describe('Test the scan function for DeviceDiscovery.ts', function () {

//     it('Should output each device scanned', async function () {
//         const ret =  await deviceDiscovery.scanModel()
//         console.log(ret)
//     })

// });