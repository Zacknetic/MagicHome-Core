import { ICommandOptions, IDeviceCommand, ICompleteResponse, DEFAULT_COMMAND_OPTIONS, ITransportResponse, DEFAULT_COMPLETE_RESPONSE, DEFAULT_COMMAND } from './types';
import * as types from './types'
import { Transport } from './Transport';
import { commandToByteArray } from './utils/coreUtils';
import Queue from 'promise-queue';

import { bufferToDeviceResponse as bufferToCompleteResponse, deepEqual, mergeDeep, overwriteDeep, sleepTimeout } from './utils/miscUtils';

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
        this.queue = new Queue(1, Infinity); // 1 concurrent, infinite size
    }



    /**
     * Query the device for state
     * @param timeoutMS (default 500ms) duration to wait for device state before returning null
     * @returns Promise<ICompleteResponse>
     */

    public async queryState(timeoutMS = 100): Promise<ICompleteResponse> {

        const commandOptions: ICommandOptions = mergeDeep({ timeoutMS, commandType: QUERY_COMMAND }, DEFAULT_COMMAND_OPTIONS);

        const byteArray = commandToByteArray(null, commandOptions);
        const { responseMsg }: ITransportResponse = await this.transport.send(byteArray, timeoutMS, true);
        const completeResponse: ICompleteResponse = bufferToCompleteResponse(responseMsg);
        return completeResponse;
    }

    public async sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {
        mergeDeep(commandOptions, DEFAULT_COMMAND_OPTIONS)
        mergeDeep(deviceCommand, DEFAULT_COMMAND)
        console.log(commandOptions)
        const byteArray = commandToByteArray(deviceCommand, commandOptions);
        this.queue.add(() => { this.transport.send(byteArray, commandOptions.timeoutMS ?? 200, false); });

        // if (!commandOptions.waitForResponse) {
        //     return true;
        // } else {
        if (!commandOptions.maxRetries) commandOptions.maxRetries = commandOptions.remainingRetries;
        return this.handleReponse(commandOptions, deviceCommand);
        // }
    }

    protected handleReponse(commandOptions: ICommandOptions, deviceCommand: IDeviceCommand): Promise<ICompleteResponse> {

        if (!this.cantCancel) this.clearRetryCommandTimeout();
        if (!commandOptions.waitForResponse) return new Promise(resolve => resolve(DEFAULT_COMPLETE_RESPONSE));

        let updatedResponse: ICompleteResponse;
        if (this.queue.getQueueLength() < 1 && commandOptions.remainingRetries > 0) {


            return new Promise(async (resolve, reject) => {
                console.log("INSIDE CHECKING FUNCTION PROMISE");
                this.retryCommandTimeout = setTimeout(async () => {
                    // this.cantCancel = true;
                    updatedResponse = await this.queryState(1000).catch(e => {
                        console.log("NO UPDATED RESPONSE", e);
                        throw ('NO UPDATED RESPONSE')
                    })
                    let isValidState;
                    if (updatedResponse) {

                        isValidState = this.isValidState(deviceCommand, updatedResponse, commandOptions)
                    }
                    if (!updatedResponse || updatedResponse == undefined || !isValidState) {
                        commandOptions.remainingRetries--;
                        const byteArray = commandToByteArray(deviceCommand, commandOptions);
                        this.transport.send(byteArray, commandOptions.timeoutMS ?? 200, false);
                        this.handleReponse(commandOptions, deviceCommand);
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

    protected isValidState(deviceCommand: IDeviceCommand, deviceResponse: ICompleteResponse, commandOptions: ICommandOptions): boolean {
        console.log("COMMAND: ", deviceCommand, "\nSTATE: ", deviceResponse.deviceState)
        console.log(deviceCommand.colorMask, " ", commandOptions.commandType)
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