export interface IDeviceDiscoveredProps {
    ipAddress: string;
    uniqueId: string;
    modelNumber: string;
}

export interface ICommandOptions {
    timeoutMS?: number;
    bufferMS?: number;
    colorMask?: number;
    remainingRetries?: number;
    maxRetries?: number;
    isAnimationFrame?: boolean;
    isPowerCommand?: boolean;
}