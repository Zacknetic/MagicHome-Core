import { ICommandOptions, IDeviceCommand, ICompleteResponse, DEFAULT_COMMAND_OPTIONS, ITransportResponse, DEFAULT_COMPLETE_RESPONSE, DEFAULT_COMMAND } from './types';

import { Transport } from './Transport';
import { commandToByteArray, isStateEqual } from './utils/coreUtils';
import Queue from 'promise-queue';

import { bufferToDeviceResponse as bufferToCompleteResponse, deepEqual, mergeDeep, overwriteDeep, sleepTimeout, ValidationError } from './utils/miscUtils';

const RETRY_WAIT_MS = 2000;
const RESET_LATEST_POWER_COMMAND_MS = 2000;


export class DeviceInterface {

    protected queue;
    protected queueSize = 0;

    protected latestPowerCommand = null;
    protected testPowerStateTimeout: NodeJS.Timeout;
    protected retryCommandTimeout: NodeJS.Timeout = null;
    protected latestPromiseReject;
    protected transport: Transport;


    constructor(transport: Transport) {
        this.transport = transport;
        this.queue = new Queue(1, Infinity); // 1 concurrent, infinite size
        this.latestPromiseReject = null;

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

        // mergeDeep(commandOptions, DEFAULT_COMMAND_OPTIONS)
        // mergeDeep(deviceCommand, DEFAULT_COMMAND)
        const byteArray = commandToByteArray(deviceCommand, commandOptions);
        // await this.queue.add(
        //     async () => {
        await this.transport.quickSend(byteArray).then(res => res).catch(e => { throw e });
        // });
        return await this.handleReponse(deviceCommand, commandOptions).then(res => res).catch(e => { throw e });

    }

    protected handleReponse(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse> {
        this.clearRetryCommandTimeout();

        //TODO, create default
        return new Promise<ICompleteResponse>((resolve, reject) => {
            if (this.queue.getQueueLength() > 0) {
                reject(new ValidationError({ responseMsg: "queue not empty", commandOptions }, 0));
                return;
            }
            else if (!commandOptions.waitForResponse) {
                reject(new ValidationError({ responseMsg: "query not requested", commandOptions }, 0));
                return
            }
            this.latestPromiseReject = { reject, commandOptions };

            this.retryCommandTimeout = setTimeout(async () => {

                if (!commandOptions.remainingRetries) commandOptions.remainingRetries = commandOptions.maxRetries;
                while (this.queue.getQueueLength() < 1 && commandOptions.remainingRetries > 0) {
                    const updatedResponse: ICompleteResponse | void = await this.queryState(500).catch(e => {
                        reject(new ValidationError({ responseMsg: "query not requested", commandOptions }, 0));
                        return;
                    });
                    if (typeof updatedResponse == 'undefined') {
                        reject(new ValidationError({ responseMsg: "no response", commandOptions }, -1));
                        return;
                    }

                    let isValidState = isStateEqual(deviceCommand, updatedResponse, commandOptions.commandType);

                    if (!isValidState) {
                        // this.transport.quickSend(types.DEVICE_COMMAND_BYTES.COMMAND_POWER_OFF)
                        commandOptions.remainingRetries--;
                        const byteArray = commandToByteArray(deviceCommand, commandOptions);
                        this.transport.quickSend(byteArray);

                    } else {
                        const ret = (mergeDeep(updatedResponse, { commandOptions, responseCode: 1 }));
                        resolve(ret);
                        return;
                    }
                    await sleep(RETRY_WAIT_MS);
                };
                reject(new ValidationError({ responseMsg: "max retries used", commandOptions }, -2));
            }, RETRY_WAIT_MS);
        }).catch(e => {
            throw e;
        })
    }

    clearRetryCommandTimeout() {

        if (this.latestPromiseReject) {
            const completeResponse: ICompleteResponse = { responseMsg: "canceled by new command", responseCode: 0, deviceState: null, deviceMetaData: null, commandOptions: this.latestPromiseReject.commandOptions }
            this.latestPromiseReject.reject(completeResponse)
        };

        if (this.retryCommandTimeout) clearTimeout(this.retryCommandTimeout);

        // this.retryCommandTimeout = null;
    }

    testLatestPowerCommand(isOn: boolean) {
        if (isOn === this.latestPowerCommand) return false;

        this.latestPowerCommand = isOn;
        clearTimeout(this.testPowerStateTimeout);
        this.testPowerStateTimeout = setTimeout(() => {
            this.latestPowerCommand = null;
        }, RESET_LATEST_POWER_COMMAND_MS);

        return true;
    }
}

function sleep(timeoutMS) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true)
        }, timeoutMS);
    })
}