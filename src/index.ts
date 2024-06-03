export { discoverDevices, generateCompleteDevices, generateInterface } from './DeviceDiscovery';
export { DeviceManager } from './DeviceManager';
export { mergeDeep, combineDeep, cloneDeep } from './utils/miscUtils';
export { isStateEqual } from './utils/coreUtils';
export * from './types';
import { ExampleClass } from './test2';
import { IAllSettledResult } from './TestQueryState';
// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env.TS_NODE_PROJECT = './tsconfig.json'

import TestQueryState from './TestQueryState';
import { CompleteResponse } from './types';

const ipAddress = '192.168.50.238';  // Replace with the actual IP address of the device you want to test
// const ipAddress = '192.168.50.137'
const testTimes = 5;

(async () => {
  // const exampleClass = new ExampleClass();
  const testQuery = new TestQueryState(ipAddress);

  try {
    const results = await testQuery.colorLerpWave();
    console.log("Results:", results);
  } catch (error) {
    console.error("An error occurred:", error);
  }

  // try {
  //   // testClass.callTestFunction();
  //   // await testQuery.testResponseTimeTransport(testTimes);
  //   // await testQuery.testResponseTimeDeviceManager(testTimes);
  //   // foo();
  //   const results = await testQuery.colorLerpWave().catch((error) => console.error('Error processing colorLerpWave:', error.stack));
  //   console.log("Results:", results);    // testClass.foo();
  //   // const fulfilledResults: IAllSettledResult<CompleteResponse>[] = results.filter(result => result.status === 'fulfilled');

  //   // if (fulfilledResults.length > 0) {
  //   //   const lastFulfilled = fulfilledResults[fulfilledResults.length - 1];
  //   //   console.log('Last fulfilled value:', lastFulfilled.value);
  //   // } else {
  //   //   console.log('No fulfilled promises found.');
  //   // }
  // } catch (error: any) {
  //   console.error('Error processing colorLerpWave:', error);
  // }

})();
