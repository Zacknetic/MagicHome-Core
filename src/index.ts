export { discoverDevices, generateDeviceBundles, generateInterface, DeviceManager } from './core';
export { mergeDeep, combineDeep, cloneDeep, isStateEqual } from './utils'
export * from './models/types';
export * from './models/errorTypes';

// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env['TS_NODE_PROJECT'] = './tsconfig.json'