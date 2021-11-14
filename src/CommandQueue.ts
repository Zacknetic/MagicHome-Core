import { Transport } from ".";
import { ICommandOptions, ICommandResponse, IDeviceCommand, IPromiseOptions, IQueueOptions } from "./types";
import * as types from './types'
const {
    DEVICE_COMMANDS: { COMMAND_POWER_OFF, COMMAND_POWER_ON, COMMAND_QUERY_STATE },
    COMMAND_TYPE: { POWER_COMMAND, COLOR_COMMAND, ANIMATION_FRAME, QUERY_COMMAND }
} = types;

export class CommandQueue {

    protected transport: Transport;
    protected timeout: number;
    protected autoStart: boolean;
    protected interval: number

    protected commandQueue = [];
    protected retryQueue = [];
    protected commandTimeoutList = [];

    protected canStart: boolean;

    queueActive: boolean;
    retryTimeoutList: any;

    constructor(queueOptions?: IQueueOptions) {
        const { timeout, autoStart, interval } = queueOptions ?? {};
        this.timeout = timeout ?? 500;
        this.autoStart = autoStart ?? true;
        this.interval = interval ?? 500;
        const transport = new Transport('localhost');

        if (this.autoStart) {
            this.canStart = true;
            this.start();
        }
    }

    public add(byteArray: number[], commandOptions: ICommandOptions, promiseOptions: IPromiseOptions): Promise<any> {
        const commandBuffer = Buffer.from(byteArray)
        const expect_reply = commandOptions.commandType == QUERY_COMMAND ? true : false
        let promise;
        if (this.commandQueue.length == 0) {

            promise = new Promise((resolve, reject) => {
                const eventEmitter = this.transport.createEventListener(commandBuffer, false, resolve, reject, _timeout);
                this.commandQueue.push({ buffer: commandBuffer, expect_reply, resolve, reject });


            })
            promiseOptions.remainingRetries = promiseOptions?.maxRetries ?? 0;
        } else {
            promise = new Promise((resolve, reject) => {
                const buffer = Buffer.from(byteArray)
                const eventEmitter = this.transport.createEventListener(buffer, false, resolve, reject, _timeout);
                this.commandQueue.push({ deviceCommand, expect_reply, resolve, reject });


                eventEmitter.on('error', (err) => {
                    this._socketErrorHandler(err, reject);
                });

                eventEmitter.on('data', (data) => {
                    this._receiveData(false, data);
                });
            })
        }

        return promise;  
    }


    public start() {
        this.canStart = true;
        this.autoStart = true;
    }

    public stop() {
        this.canStart = false;
        this.clearTimeouts(this.commandTimeoutList);
    }

    public hardClear() {
        this.commandQueue.splice(0, this.commandQueue.length)
        this.queueActive = false;
        this.mediumClear();
    }

    public mediumClear() {
        this.activeTasks.splice(0, this.activeTasks.length);
        this.clearTimeouts(this.commandTimeoutList);

        this.softClear();
    }
    public softClear() {
        // this.taskQueue.push(...this.activeTasks);
        this.retryQueue.splice(0, this.retryQueue.length); //stop the retry queue
        this.clearTimeouts(this.retryTimeoutList);
    }

    public iterateNextTask() {
        this.runTask();
    }

    public length(): number {
        return this.commandQueue.length + this.retryQueue.length
    }

    protected runTask() {

        if (this.canStart && this.commandQueue.length > 0) {

            //TODO add asynchronous option for concurrency
            let task, timeoutList;
            if (this.retryQueue.length > 0) {
                task = this.retryQueue.shift();
                timeoutList = this.retryTimeoutList;
            } else {
                task = this.commandQueue.shift();
                timeoutList = this.commandTimeoutList;
            }
            this.activeTasks.push(task);
            const { resolve, reject, fn, promiseOptions } = task;
            const { timeout, interval, remainingRetries, maxRetries } = promiseOptions ?? {};
            let _timeout = timeout ?? this.timeout
            let _interval = interval ?? this.interval;

            if (!this.queueActive) {
                this.queueActive = true;
                _interval = 0;
            }

            timeoutList.push(setTimeout(async () => {
                console.log('go')

                try {
                    timeoutList.push(setTimeout(() => {
                        const commandResponse: ICommandResponse = { eventNumber: -6, deviceCommand: null, deviceResponse: null }
                        promiseOptions.remainingRetries = 0;
                        console.log('timed out')
                        reject(commandResponse);
                        return;
                    }, _timeout));
                    const result = await fn();
                    result.eventNumber = 1;
                    this.clearTimeouts(timeoutList)
                    console.log('final resolve')
                    resolve('test')
                } catch (commandResponse) {
                    if (this.commandQueue.length <= 0 && remainingRetries > 0) {
                        this.retryQueue.push(task);
                        promiseOptions.remainingRetries--;
                        console.log('retrying')
                    } else {
                        commandResponse.eventNumber = maxRetries > 0 ? -4 : -3;
                        reject(commandResponse);
                    }
                }
                if (this.autoStart) return this.runTask();
            }, _interval));
        } else {
            // this.softClear();
        }

    }

    protected clearTimeouts(timeoutList) {
        if (timeoutList?.length > 0) {
            for (const timeout of timeoutList) {
                clearTimeout(timeout);
            }
        }
    }
}