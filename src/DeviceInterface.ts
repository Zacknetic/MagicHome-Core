import { ICommandOptions, IDeviceCommand, ICompleteResponse } from './types';

import { Transport } from './Transport';
import { commandToByteArray, isStateEqual } from './utils/coreUtils';

import { bufferToDeviceResponse as bufferToCompleteResponse } from './utils/miscUtils';

const testDelay = 3000;

export class DeviceInterface {

    protected transport: Transport;

    protected timeoutId;
    protected rejections: Array<Function> = [];
    constructor(transport: Transport) {
        //console.time('sendCommand')
        this.transport = transport;
    }

    public queryState(timeoutMS = 100): ICompleteResponse {
        try {
            const response = this.transport.queryState(timeoutMS);
            return response;
    } catch(e) {
        throw e;
    }
}
      





    public sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise < ICompleteResponse | void> {
    this.abort();
    return new Promise<ICompleteResponse | void>((_resolve, _reject) => {
        this.sendCommandToTransport(deviceCommand, commandOptions);
        this.rejections.push(_reject);
        this.timeoutId = setTimeout(async () => {
            try {
                const result: ICompleteResponse | void = await this.processCommand(deviceCommand, commandOptions);
                _resolve(result);
            } catch (e) {
                _reject(e);
            }
        }, testDelay);
    })

}



    private async processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise < ICompleteResponse | void> {
    let state: ICompleteResponse = null;
    let isValidState = false;
    let retryCount = commandOptions.maxRetries || 0;
    while(!isValidState && retryCount > 0) {
    try {
        state = await this.queryState(500);
        isValidState = isStateEqual(deviceCommand, state, commandOptions.commandType);
        if (!isValidState) {
            console.log('wrongState - retrying', state, deviceCommand, commandOptions.commandType);
            this.sendCommandToTransport(deviceCommand, commandOptions);
        }
        retryCount--;
        await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {
        throw e;
    }
}
if (!isValidState) {
    throw new Error('Invalid state');
}
return state;
    }

    private async sendCommandToTransport(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
    //console.timeLog('sendCommand');
    const byteArray = commandToByteArray(deviceCommand, commandOptions);
    try {
        await this.transport.quickSend(byteArray);
    } catch (e) {
        throw e;
    }
}

abort() {
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
    if (this.rejections.length > 0)
        this.rejections.forEach(reject => reject('exit early'));
}
}
