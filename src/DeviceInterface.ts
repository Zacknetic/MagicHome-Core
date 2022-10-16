import { ICommandOptions, IDeviceCommand, ICompleteResponse, DEFAULT_COMMAND_OPTIONS, ITransportResponse, DEFAULT_COMPLETE_RESPONSE, DEFAULT_COMMAND } from './types';
import * as types from './types'
import { Transport } from './Transport';
import { commandToByteArray } from './utils/coreUtils';
import Queue from 'promise-queue';

import { bufferToDeviceResponse as bufferToCompleteResponse, deepEqual, mergeDeep, overwriteDeep, sleepTimeout } from './utils/miscUtils';

const RETRY_WAIT_MS = 2000;
const RESET_LATEST_POWER_COMMAND_MS = 2000;

const {
    COLOR_MASKS: { WHITE, COLOR, BOTH },
    DEVICE_COMMAND_BYTES: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND }
} = types;

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
        try {
            const { responseMsg }: ITransportResponse = await this.transport.queryState(timeoutMS).catch(e => {
                // throw new Error(e);
            }) as ITransportResponse;
            // if (typeof responseMsg == 'undefined') throw ('updated Response undefiend')

            const completeResponse: ICompleteResponse = bufferToCompleteResponse(responseMsg);
            return completeResponse;
        } catch (error) {
            // throw Error(error);
        }
    }

    /**
     * 
     * @param deviceCommand 
     * @param commandOptions 
     * @returns 
     */
    public async sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse | void> {

        // mergeDeep(commandOptions, DEFAULT_COMMAND_OPTIONS)
        // mergeDeep(deviceCommand, DEFAULT_COMMAND)
        const byteArray = commandToByteArray(deviceCommand, commandOptions);
        await this.queue.add(
            async () => {
                await this.transport.quickSend(byteArray);
            });
        return await this.handleReponse(deviceCommand, commandOptions).catch(e => {return { responseMsg: "error", responseCode: 0, deviceState: null, deviceMetaData: null, commandOptions }});

    }

    protected handleReponse(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse> {
        this.clearRetryCommandTimeout();

        //TODO, create default
        const completeResponse: ICompleteResponse = { responseMsg: "queue not empty", responseCode: 0, deviceState: null, deviceMetaData: null, commandOptions }


        return new Promise((resolve, reject) => {
            if (this.queue.getQueueLength() > 0) {
                resolve(completeResponse);
                return;
            }
            else if (!commandOptions.waitForResponse) {
                overwriteDeep(completeResponse, { responseMsg: "query not requested", responseCode: 0, commandOptions });
                resolve(completeResponse);
                return
            }
            this.latestPromiseReject = { reject, commandOptions };

            this.retryCommandTimeout = setTimeout(async () => {

                if (!commandOptions.remainingRetries) commandOptions.remainingRetries = commandOptions.maxRetries;
                while (this.queue.getQueueLength() < 1 && commandOptions.remainingRetries > 0) {
                    const updatedResponse: ICompleteResponse | void = await this.queryState(500).catch(e => {
                        overwriteDeep(completeResponse, { responseMsg: "query not requested", responseCode: 0, commandOptions });
                        resolve(completeResponse)
                        return;
                    });
                    if (typeof updatedResponse == 'undefined') {
                        overwriteDeep(completeResponse, { responseMsg: "no response", responseCode: -1, commandOptions });
                        resolve(completeResponse)
                        return;
                    }

                    let isValidState = this.isValidState(deviceCommand, updatedResponse, commandOptions);

                    if (!isValidState) {
                        this.transport.quickSend(types.DEVICE_COMMAND_BYTES.COMMAND_POWER_OFF)
                        commandOptions.remainingRetries--;
                        const byteArray = commandToByteArray(deviceCommand, commandOptions);
                        this.transport.quickSend(byteArray);

                    } else {
                        const ret = (mergeDeep(updatedResponse, { commandOptions, responsCode: 1 }));
                        resolve(ret);
                        return;
                    }
                    await sleep(RETRY_WAIT_MS);
                };
                overwriteDeep(completeResponse, { responseMsg: "max retries used", responseCode: -2, commandOptions });
                resolve(completeResponse)
            }, RETRY_WAIT_MS);
        })
    }

    protected isValidState(deviceCommand: IDeviceCommand, deviceResponse: ICompleteResponse, commandOptions: ICommandOptions): boolean {
        try {
            const { deviceState } = deviceResponse;
            // console.log("COMMAND: ", deviceCommand, "\nSTATE: ", deviceState)
            // console.log(deviceCommand.colorMask, " ", commandOptions.commandType)
            let isEqual = false;
            let omitItems;
            if (commandOptions.commandType == POWER_COMMAND) omitItems = ["RGB", "CCT"];
            else if (deviceCommand.colorMask == WHITE) omitItems = ["RGB"];
            else omitItems = ["CCT"]

            isEqual = deepEqual(deviceCommand, deviceState, ['colorMask', ...omitItems]);

            return isEqual;
        } catch (error) {
            // throw Error(error);
        }
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