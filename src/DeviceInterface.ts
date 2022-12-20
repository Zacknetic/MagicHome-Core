import { ICommandOptions, IDeviceCommand, ICompleteResponse, DEFAULT_COMMAND_OPTIONS, ITransportResponse, DEFAULT_COMPLETE_RESPONSE, DEFAULT_COMMAND } from './types';

import { Transport } from './Transport';
import { commandToByteArray, isStateEqual } from './utils/coreUtils';
import Queue from 'promise-queue';

import { bufferToDeviceResponse as bufferToCompleteResponse, deepEqual, mergeDeep, overwriteDeep, sleepTimeout, ValidationError } from './utils/miscUtils';

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
        this.transport = transport;
        this.latestPromiseReject = null;
        this.commandQueue = [];
        this.processingCommand = false;
        this.retryCount = 0;

    }

    /**
     * Query the device for state
     * @param timeoutMS (default 500ms) duration to wait for device state before returning null
     * @returns Promise<ICompleteResponse>
     */

    public async queryState(timeoutMS = 100): Promise<ICompleteResponse> {

        const responseMsg: Buffer = await this.transport.queryState(timeoutMS).then(res => res).catch(e => { throw e });
        // if (typeof responseMsg == 'undefined') throw ('updated Response undefiend')

        const completeResponse: ICompleteResponse = bufferToCompleteResponse(responseMsg);
        return completeResponse;

    }

    /**
     * 
     * @param deviceCommand 
     * @param commandOptions 
     * @returns 
     */
    public async sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse> {
        this.commandQueue.push({ deviceCommand, commandOptions });
        if (!this.processingCommand) {
            this.processingCommand = true;
            let result: ICompleteResponse;
            while (this.commandQueue.length > 0) {
                const {deviceCommand: _deviceCommand, commandOptions: _commandOptions} = this.commandQueue.shift();
                result = await this.processCommand(_deviceCommand, _commandOptions);
            }
            this.processingCommand = false;
            return result;
        } else {
            return null;
        }
    }


    private async processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse> {
        // retry the final command if necessary
        if (this.commandQueue.length === 0) {
            return await this.retryCommand(deviceCommand, commandOptions);
        } else {
            await this.sendCommandToTransport(deviceCommand, commandOptions);
            return null;
        }
    }

    private async retryCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse> {
        try {
            let state: ICompleteResponse = null;
            await this.sendCommandToTransport(deviceCommand, commandOptions);
            return new Promise((resolve, reject) => {
                this.retryCommandTimeout = setTimeout(async () => {
                    let isValidState = false;
                    let retries = commandOptions.maxRetries;

                    while (!isValidState) {
                        if (retries <= 0) {
                            clearTimeout(this.retryCommandTimeout);
                            reject(new Error('Failed to update light after 5 attempts'));
                            return;
                        }
                        try {
                            await this.sendCommandToTransport(deviceCommand, commandOptions);
                            state = await this.queryState(500);
                            isValidState = await isStateEqual(deviceCommand, state, commandOptions.commandType);
                        } catch (e) {
                            clearTimeout(this.retryCommandTimeout);
                            reject(e);
                            return;
                        }
                        retries--;
                    }
                    clearTimeout(this.retryCommandTimeout);
                    resolve(state);
                }, RETRY_WAIT_MS);
            });
        } catch (e) {
            clearTimeout(this.retryCommandTimeout);
            throw e;
        }
    }

    private async sendCommandToTransport(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<void> {
        const byteArray = commandToByteArray(deviceCommand, commandOptions);
        await this.transport.quickSend(byteArray);
    }
}

function sleep(timeoutMS) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true)
        }, timeoutMS);
    })
}