// const SLOW_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 20, bufferMS: 0, timeoutMS: 2000 };
// const MEDIUM_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 100 };
// const FAST_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 20 };

import { ICommandOptions, IDeviceCommand, ICompleteResponse, DEFAULT_COMMAND_OPTIONS } from './types';
import * as types from './types'
import { Transport } from './Transport';
import { commandToByteArray } from './utils/coreUtils';
import Queue from 'promise-queue';

import { bufferToDeviceResponse as bufferToCompleteResponse, deepEqual, mergeDeep, sleepTimeout } from './utils/miscUtils';

const RETRY_WAIT_MS = 1000;
const RETRY_QUERY_MS = 1000;
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

    protected transport: Transport;
    cantCancel: boolean = false;
    constructor(transport: Transport) {
        this.transport = transport;
        this.queue = new Queue(1, 50); // 1 concurrent, infinite size

    }



    /**
     * Query the device for state
     * @param timeoutMS (default 500ms) duration to wait for device state before returning null
     * @returns Promise<ICompleteResponse>
     */

    public async queryState(timeoutMS: number): Promise<ICompleteResponse> {

        const commandOptions = { timeoutMS, commandType: QUERY_COMMAND };
        mergeDeep(commandOptions, DEFAULT_COMMAND_OPTIONS);

        const byteArray = commandToByteArray(null, commandOptions as ICommandOptions);
        const { responseMsg }: types.ITransportResponse = await this.transport.send(byteArray, timeoutMS, true);
        const completeResponse: ICompleteResponse = bufferToCompleteResponse(responseMsg);
        return completeResponse;
    }

    public async sendCommand(deviceCommand: IDeviceCommand, commandOptions?: ICommandOptions) {
        const byteArray = commandToByteArray(deviceCommand, commandOptions);
        this.queue.add(async () => {
            this.transport.send(byteArray, commandOptions.timeoutMS ?? 200, false);
            // if(this.queueSize > 50) this.queue.pop()
        });

        // if (!commandOptions.waitForResponse) {
        //     return true;
        // } else {
        if (!commandOptions.maxRetries) commandOptions.maxRetries = commandOptions.remainingRetries;
        return this.handleReponse(commandOptions, deviceCommand);
        // }
    }

    protected handleReponse(commandOptions: ICommandOptions, deviceCommand: IDeviceCommand): Promise<ICompleteResponse> {

        if (!this.cantCancel) this.clearRetryCommandTimeout();
        if (!commandOptions.waitForResponse) return;
            let updatedResponse: ICompleteResponse;
        if (this.queue.getQueueLength() < 1 && commandOptions.remainingRetries > 0) {
            this.cantCancel = true;

            return new Promise(async (resolve, reject) => {
                this.retryCommandTimeout = setTimeout(async () => {

                    updatedResponse = await this.queryState(1000);
                    let deviceState, deviceMetaData, isValidState;
                    if (updatedResponse) {
                        deviceState = updatedResponse.deviceState;
                        deviceMetaData = updatedResponse.deviceMetaData;
                        isValidState = this.isValidState(deviceCommand, updatedResponse, commandOptions)
                    }
                    if (!updatedResponse || updatedResponse == undefined || !isValidState) {
                        commandOptions.remainingRetries--;
                        const byteArray = commandToByteArray(deviceCommand, commandOptions);
                        this.transport.send(byteArray, commandOptions.timeoutMS ?? 200, false);
                        this.handleReponse(commandOptions, deviceCommand).then(ret => { console.log('WHOOPS') });
                    } else {
                        this.cantCancel = false
                        resolve(updatedResponse)
                    }

                }, RETRY_WAIT_MS);
            });

        } else {
            // console.log('oops')
            //     this.cantCancel = false;
            //     updatedResponse = { responseMsg: "waiting", responseCode: 0 }
            //     return 'oops';
        }
    }

    protected isValidState(deviceCommand: IDeviceCommand, deviceResponse: ICompleteResponse, commandOptions?: ICommandOptions): boolean {
        // console.log(deviceCommand, deviceResponse.deviceState)
        let isEqual = false;
        let omitItems;
        if (commandOptions.commandType == POWER_COMMAND) omitItems = ["RGB", "CCT"];
        else if (deviceCommand.colorMask == WHITE) omitItems = ["RGB"];
        else omitItems = ["CCT"]


        isEqual = deepEqual(deviceCommand, deviceResponse.deviceState, ['colorMask', ...omitItems]);

        return isEqual;
    }


    clearRetryCommandTimeout() {
        if (this.retryCommandTimeout) clearTimeout(this.retryCommandTimeout);
        this.retryCommandTimeout = null;
    }

    testLatestPowerCommand(isOn: boolean) {
        // console.log(this.latestPowerCommand)
        if (isOn === this.latestPowerCommand) {
            console.log('DOUBLE POWER COMMAND')
            return false;
        }
        this.latestPowerCommand = isOn;
        clearTimeout(this.testPowerStateTimeout);
        this.testPowerStateTimeout = setTimeout(() => {
            this.latestPowerCommand = null;
        }, RESET_LATEST_POWER_COMMAND_MS);

        return true;
    }
}

function waitforme(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}