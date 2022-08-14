export { discoverDevices, completeDevices } from './DeviceDiscovery';
export { DeviceInterface } from './DeviceInterface';
export { mergeDeep } from './utils/miscUtils';
export * from './types';

// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env.TS_NODE_PROJECT = './tsconfig.json'