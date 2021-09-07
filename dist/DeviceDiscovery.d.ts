import { IDeviceDiscoveredProps } from './types';
export declare class DeviceDiscovery {
    count: number;
    scan(timeout?: number): Promise<IDeviceDiscoveredProps[]>;
}
