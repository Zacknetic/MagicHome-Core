// import { DeviceInterface } from '../DeviceInterface'
// import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

import { assert } from 'console';
import { discoverDevices, completeDevices } from '../DeviceDiscovery';
// import * as types from '../types'

let protoDevices;
describe('Test the scan function for DeviceDiscovery.ts', function () {
    afterEach(done => {
        setTimeout(done, 1000);
    });

    it('Should output each device scanned', async function () {
        const ret = await discoverDevices()
        protoDevices = ret;
        if(ret.length < 1) throw new Error("Zero devices discovered!");
        console.log(ret)

    })


    it('Should retrieve meta-data on each device', async function () {
        const ret = await completeDevices(protoDevices, 500);
        if(ret.length != protoDevices.length) throw new Error("Every proto-device did not retrieve meta-data successfully");
        console.log(ret)

    })

    it('Should output an individual device', async function () {
        if (protoDevices.length > 0) {
            const ret = await completeDevices([protoDevices[0]])
            console.log(ret)
        }
    })


});