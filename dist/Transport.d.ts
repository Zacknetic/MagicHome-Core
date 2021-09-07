export declare class Transport {
    host: any;
    socket: any;
    queue: any;
    /**
     * @param {string} host - hostname
     * @param {number} timeout - connection timeout (in seconds)
     */
    constructor(host: any);
    connect(fn: any, _timeout?: number): Promise<any>;
    disconnect(): void;
    send(buffer: any, useChecksum?: boolean, _timeout?: number): Promise<any>;
    write(buffer: any, useChecksum?: boolean, _timeout?: number): Promise<void>;
    read(_timeout?: number): Promise<unknown>;
    getState(_timeout?: number): Promise<{
        debugBuffer: any;
        controllerHardwareVersion: any;
        isOn: boolean;
        RGB: {
            red: any;
            green: any;
            blue: any;
        };
        whiteValues: {
            warmWhite: any;
            coldWhite: any;
        };
        controllerFirmwareVersion: any;
    }>;
}
