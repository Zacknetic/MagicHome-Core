import { ICommandOptions, IDeviceCommand, ICompleteResponse } from './types';

import { Transport } from './Transport';
import { commandToByteArray, isStateEqual } from './utils/coreUtils';

import { bufferToDeviceResponse as bufferToCompleteResponse } from './utils/miscUtils';

const RETRY_WAIT_MS = 2000;


export class DeviceInterface {

    protected queue;
    protected queueSize = 0;

    protected latestPowerCommand = null;
    protected testPowerStateTimeout: NodeJS.Timeout;
    protected retryCommandTimeout: NodeJS.Timeout = null;
    protected latestPromiseReject;
    protected transport: Transport;

    protected commandQueue: Array<{ deviceCommand: IDeviceCommand, commandOptions: ICommandOptions }>;
    private processingCommand: boolean;
    private retryCount: number;

    constructor(transport: Transport) {
        console.time('sendCommand')
        this.transport = transport;
        this.latestPromiseReject = null;
        this.commandQueue = [];
        this.processingCommand = false;
        this.retryCount = 0;

    }

    public async queryState(timeoutMS = 100): Promise<ICompleteResponse> {

        const responseMsg: Buffer = await this.transport.queryState(timeoutMS).then(res => res).catch(e => { throw e });
        // if (typeof responseMsg == 'undefined') throw ('updated Response undefiend')

        const completeResponse: ICompleteResponse = bufferToCompleteResponse(responseMsg);
        return completeResponse;

    }

    public async sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse> {
        this.commandQueue.push({ deviceCommand, commandOptions });
        if (!this.processingCommand) {
            this.processingCommand = true;
            let result: ICompleteResponse;
            while (this.commandQueue.length > 0) {
                const { deviceCommand: _deviceCommand, commandOptions: _commandOptions } = this.commandQueue.shift();
                result = await this.processCommand(_deviceCommand, _commandOptions);
            }
            this.processingCommand = false;
            return result;
        } else {
            return null;
        }
    }


    private async processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse> {
        try {
            let state: ICompleteResponse = null;
            let retries = commandOptions.maxRetries;
            let isValidState = false;

            do {
                try {
                    await this.sendCommandToTransport(deviceCommand, commandOptions);

                    if (this.commandQueue.length !== 0) {
                        return null;
                    }
                    await new Promise(resolve => setTimeout(resolve, RETRY_WAIT_MS));

                    state = await this.queryState(500);
                    isValidState = await isStateEqual(deviceCommand, state, commandOptions.commandType);
                } catch (e) {
                    //do nothing just catch the error
                }
                retries--;
            } while (!isValidState)
            return state;
        } catch (e) {
            throw e;
        }
    }



    private async sendCommandToTransport(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<void> {
        console.timeLog('sendCommand');
        const byteArray = commandToByteArray(deviceCommand, commandOptions);
        await this.transport.quickSend(byteArray);
    }
}