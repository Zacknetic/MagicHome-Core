export { discoverDevices, generateCompleteDevices, generateInterface } from './MagicHome/DeviceDiscovery';
export { DeviceManager } from './MagicHome/DeviceManager';
export { mergeDeep, combineDeep, cloneDeep } from './utils/miscUtils';
export { isStateEqual } from './utils/coreUtils';
export * from './types';
export * from './errors/errorTypes';

// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env['TS_NODE_PROJECT'] = './tsconfig.json'