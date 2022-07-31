// const SLOW_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 20, bufferMS: 0, timeoutMS: 2000 };
// const MEDIUM_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 100 };
// const FAST_COMMAND_OPTIONS: ICommandOptions = { maxRetries: 0, bufferMS: 0, timeoutMS: 20 };

import { ICommandOptions, IDeviceCommand, IDeviceResponse, IDeviceState, ITransportResponse } from './types';
import { Transport } from './Transport';
import { commandToByteArray } from './utils/coreUtils';
import Queue from 'promise-queue';

import * as types from './types';
import { bufferToDeviceResponse, deepEqual, sleepTimeout } from './utils/miscUtils';

const RETRY_WAIT_MS = 2000;
const RETRY_QUERY_MS = 1000;
const RESET_LATEST_POWER_COMMAND_MS = 2000;

const {
    DEVICE_COMMANDS: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND }
} = types;

export class DeviceInterface {

    protected queue;
    protected queueSize = 0;

    protected latestPowerCommand = null;
    protected testPowerStateTimeout: NodeJS.Timeout;
    protected retryCommandTimeout: NodeJS.Timeout = null;

    protected transport;
    cantCancel: boolean = false;
    constructor(transport) {
        this.transport = transport;
        this.queue = new Queue(1, 1); // 1 concurrent, infinite size

    }



    /**
     * Query the device for state
     * @param timeoutMS (default 500ms) duration to wait for device state before returning null
     * @returns ITransportResponse
     */

    public async queryState(timeoutMS: number): Promise<ITransportResponse> {
        const commandOptions = Object.assign({}, {timeoutMS}, types.CommandOptionDefaults, { commandType: QUERY_COMMAND });
        const byteArray = commandToByteArray(null, commandOptions);
        const transportResponse: ITransportResponse = await this.transport.send(byteArray, timeoutMS, true).catch(err => { return false });
        const stateBuffer = transportResponse.responseMsg;
        const deviceResponse: IDeviceResponse = bufferToDeviceResponse(stateBuffer);
        const ret = Object.assign(transportResponse, deviceResponse);
        return ret;
    }

    public sendCommand(deviceCommand: IDeviceCommand, commandOptions?: ICommandOptions) {
        const byteArray = commandToByteArray(deviceCommand, commandOptions);
        this.queue.add(async () => {
            await waitforme(50)
            this.transport.send(byteArray, commandOptions.timeoutMS ?? 200, false);
        });

        return this.handleReponse(commandOptions, deviceCommand)
    }

    protected handleReponse(commandOptions: ICommandOptions, deviceCommand: IDeviceCommand): Promise<ITransportResponse> {
        if (!this.cantCancel) this.clearRetryCommandTimeout();

        let updatedResponse: ITransportResponse;

        return new Promise((resolve) => {
            this.retryCommandTimeout = setTimeout(async () => {
                this.cantCancel = true;
                if (this.queue.getQueueLength() < 1 && commandOptions.remainingRetries > 0) {
                    updatedResponse = await this.queryState(commandOptions.timeoutMS);
                    let deviceState, deviceMetaData, isValidState;
                    if (updatedResponse) {
                        deviceState = updatedResponse.deviceState;
                        deviceMetaData = updatedResponse.deviceMetaData;
                        isValidState = this.isValidState(deviceCommand, updatedResponse, commandOptions)
                    }
                    if (updatedResponse == undefined || (!isValidState ?? null)) {
                        commandOptions.remainingRetries--;
                        return this.sendCommand(deviceCommand, commandOptions);
                    } else {
                        this.cantCancel = false
                        resolve(updatedResponse)
                    }
                } else {
                    this.cantCancel = false;
                    updatedResponse = {responseMsg: "waiting", responseCode: 0}
                    return updatedResponse;
                }
            }, RETRY_WAIT_MS);
        });


    }

    protected isValidState(deviceCommand: IDeviceCommand, deviceResponse: ITransportResponse, commandOptions?: ICommandOptions): boolean {
        const isEqual = deepEqual(deviceCommand, deviceResponse.deviceState, ['colorMask']);
        return isEqual;
    }


    clearRetryCommandTimeout() {
        if (this.retryCommandTimeout) clearTimeout(this.retryCommandTimeout);
        this.retryCommandTimeout = null;
    }

    testLatestPowerCommand(isOn: boolean) {
        console.log(this.latestPowerCommand)
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