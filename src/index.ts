export { discoverDevices, generateCompleteDevices, generateInterface } from './MagicHome';
export { DeviceManager } from './MagicHome/deviceManager';
export { mergeDeep, combineDeep, cloneDeep } from './utils/miscUtils';
export { isStateEqual } from './utils/coreUtils';
export * from './models/types';
export * from './models/errorTypes';

// set env variable to the `tsconfig.json` path before loading mocha (default: './tsconfig.json')
process.env['TS_NODE_PROJECT'] = './tsconfig.json'