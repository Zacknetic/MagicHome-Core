import { ICommandOptions, IDeviceCommand, ICompleteResponse } from './types';

import { Transport } from './Transport';
import { commandToByteArray, isStateEqual } from './utils/coreUtils';

import { bufferToDeviceResponse as bufferToCompleteResponse } from './utils/miscUtils';

const testDelay = 3000;

export class DeviceInterface {

    protected transport: Transport;

    protected processing = false;
    protected timeoutId;
    protected rejections: Array<Function> = [];
    constructor(transport: Transport) {
        console.time('sendCommand')
        this.transport = transport;
    }

    public async queryState(timeoutMS = 100): Promise<ICompleteResponse> {
        const responseMsg: Buffer | void = await this.transport.queryState(timeoutMS);
        if (!responseMsg) {
            Promise.reject(new Error('No response in queryState'));
        } else {
            const completeResponse: ICompleteResponse = bufferToCompleteResponse(responseMsg);
            return completeResponse;
        }
    }

    public sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse | void> {
        this.abort();
        this.sendCommandToTransport(deviceCommand, commandOptions);
        return new Promise<ICompleteResponse | void>((_resolve, _reject) => {
            this.rejections.push(_reject);
            this.timeoutId = setTimeout(async () => {
                const result: ICompleteResponse | void = await this.processCommand(deviceCommand, commandOptions).catch(e => { _reject(e) });
                _resolve(result);
            }, testDelay);
        })

    }



    private processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse | void> {
        let state: ICompleteResponse = null;
        let isValidState = false;
        let retryCount = commandOptions.maxRetries || 0;
        return new Promise<ICompleteResponse | void>(async (_resolve, _reject) => {
            while (!isValidState && retryCount > 0) {
                this.rejections.push(_reject);
                state = await this.queryState(500);
                isValidState = isStateEqual(deviceCommand, state, commandOptions.commandType);
                if (!isValidState) {
                    console.log('wrongState - retrying', state, deviceCommand, commandOptions.commandType);
                    try {
                        this.sendCommandToTransport(deviceCommand, commandOptions);
                    }
                    catch (e) {
                        this.processing = false;
                        _reject(e);
                    }
                }
                retryCount--;
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            if (!isValidState) {
                _reject(new Error('Invalid state'));
            }
            _resolve(state);
        }).catch(e => { console.log(e) });
    }

    private sendCommandToTransport(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
        console.timeLog('sendCommand');
        const byteArray = commandToByteArray(deviceCommand, commandOptions);
        this.transport.quickSend(byteArray);
    }

    abort() {
        clearTimeout(this.timeoutId);
        if (this.rejections.length > 0)
            this.rejections.forEach(reject => reject('exit early'));
    }
}