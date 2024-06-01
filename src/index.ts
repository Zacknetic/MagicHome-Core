export { discoverDevices, generateCompleteDevices, generateInterface } from './DeviceDiscovery';
export { DeviceManager } from './DeviceManager';
export { mergeDeep, combineDeep, cloneDeep } from './utils/miscUtils';
export { isStateEqual } from './utils/coreUtils';
export * from './types';
import TestClass from './test';

// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env.TS_NODE_PROJECT = './tsconfig.json'

import TestQueryState from './TestQueryState';

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
    const response = await testQuery.colorLerpWave();
    console.log('response at the final index:', response);
  } catch (error) {
    console.error('Error during query state testing:', error);
  }
})();
