import { ICommandResponse, IPromiseOptions, IQueueOptions } from "./types";

export class PromiseQueue {
    protected concurrency: number;
    protected timeout: number;
    protected autoStart: boolean;
    protected interval: number

    protected taskQueue = [];
    protected retryQueue = [];
    protected activeTasks = [];
    protected taskTimeoutList = [];

    protected canStart = false;
    queueActive: boolean;
    retryTimeoutList: any;

    constructor(queueOptions?: IQueueOptions) {
        const { concurrency, timeout, autoStart, interval } = queueOptions ?? {};
        this.concurrency = concurrency ?? 1;
        this.timeout = timeout ?? 500;
        this.autoStart = autoStart ?? true;
        this.interval = interval ?? 500;
        console.log(interval)

        if (this.autoStart) {
            this.canStart = true;
            this.start();
        }
    }

    addPoop(string){
        return string + 'poop';
    }

    public add(fn, promiseOptions: IPromiseOptions): Promise<any> {
        this.softClear();

        promiseOptions.remainingRetries = promiseOptions?.maxRetries ?? 0;

        const promise = new Promise((resolve, reject) => { this.taskQueue.push({ resolve, reject, fn, promiseOptions }) });
        if (!this.queueActive) {
            this.runTask();
        }
        return promise;
    }


    public start() {
        this.canStart = true;
        this.autoStart = true;
    }

    public stop() {
        this.canStart = false;
        this.clearTimeouts(this.taskTimeoutList);
    }

    public hardClear() {
        this.taskQueue.splice(0, this.taskQueue.length)
        this.queueActive = false;
        this.mediumClear();
    }

    public mediumClear() {
        this.activeTasks.splice(0, this.activeTasks.length);
        this.clearTimeouts(this.taskTimeoutList);

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
        return this.taskQueue.length + this.retryQueue.length
    }

    protected runTask() {

        if (this.canStart && this.taskQueue.length > 0) {

            //TODO add asynchronous option for concurrency
            let task, timeoutList;
            if (this.retryQueue.length > 0) {
                task = this.retryQueue.shift();
                timeoutList = this.retryTimeoutList;
            } else {
                task = this.taskQueue.shift();
                timeoutList = this.taskTimeoutList;
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
                    if (this.taskQueue.length <= 0 && remainingRetries > 0) {
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