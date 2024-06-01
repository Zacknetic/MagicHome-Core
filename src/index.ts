export { discoverDevices, generateCompleteDevices, generateInterface } from './DeviceDiscovery';
export { DeviceManager } from './DeviceManager';
export { mergeDeep, combineDeep, cloneDeep } from './utils/miscUtils';
export { isStateEqual } from './utils/coreUtils';
export * from './types';
import TestClass from './test';
import { IAllSettledResult } from './TestQueryState';
// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env.TS_NODE_PROJECT = './tsconfig.json'

import TestQueryState from './TestQueryState';
import { CompleteResponse } from './types';

const ipAddress = '192.168.50.238';  // Replace with the actual IP address of the device you want to test
// const ipAddress = '192.168.50.137'
const testTimes = 5;
const testClass = new TestClass();
(async () => {
  const testQuery = new TestQueryState(ipAddress);
  try {
    // testClass.callTestFunction();
    // await testQuery.testResponseTimeTransport(testTimes);
    // await testQuery.testResponseTimeDeviceManager(testTimes);
    const results = await testQuery.colorLerpWave();

    const fulfilledResults: IAllSettledResult<CompleteResponse>[] = results.filter(result => result.status === 'fulfilled');
    
    if (fulfilledResults.length > 0) {
      const lastFulfilled = fulfilledResults[fulfilledResults.length - 1];
      console.log('Last fulfilled value:', lastFulfilled.value);
    } else {
      console.log('No fulfilled promises found.');
    }
  } catch (error) {
    console.error('Error processing colorLerpWave:', error);
  }

})();
