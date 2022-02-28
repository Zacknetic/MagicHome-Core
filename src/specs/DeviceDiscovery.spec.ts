import { DeviceInterface } from '../DeviceInterface'
import { ICommandOptions, ICommandResponse, IDeviceCommand } from '../types';

import { DeviceDiscovery } from '../DeviceDiscovery';
import * as types from '../types'





// function asyncMethod2(timeout, customSubnet?) {
//     return extendedScan(timeout, customSubnet)
// }
const deviceDiscovery = new DeviceDiscovery();
function asyncMethod(timeout, customSubnet?) {
    return deviceDiscovery.scan()
}
describe('Test the scan function for DeviceDiscovery.ts', function () {
   


    // afterEach(done => {
    //     setTimeout(done, 500);
    // });


    it('Should output each device scanned', function () {
       const test = asyncMethod(500, ['192.128.1.255']).catch(err => console.log(err))
       console.log(test)
        // console.log(scanned)
    })

});

// describe('Test the extendedScan function for DeviceDiscovery.ts', function() {



//     afterEach(done => {
//         setTimeout(done, 500);
//     });


//     it('Should output each device scanned', async function () {
//         const scanned = await asyncMethod2(1000)
//         console.log(scanned)
//     })

// });

// async function sleep(ms) {
//     return new Promise((resolve) => {
//         setTimeout(resolve, ms);
//     });
// }