export { discoverDevices, generateCompleteDevices, generateInterface } from './DeviceDiscovery';
export { DeviceManager } from './DeviceManager';
export { mergeDeep, combineDeep, cloneDeep } from './utils/miscUtils';
export { isStateEqual } from './utils/coreUtils';
export * from './types';

// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env.TS_NODE_PROJECT = './tsconfig.json'

import TestQueryState from './TestQueryState';

const ipAddress = '192.168.50.238';  // Replace with the actual IP address of the device you want to test
// const ipAddress = '192.168.50.137'
const testTimes = 1000;

(async () => {
  const testQuery = new TestQueryState(ipAddress);

  try {
    await testQuery.testResponseTime(testTimes);
  } catch (error) {
    console.error('Error during query state testing:', error);
  }
})();
