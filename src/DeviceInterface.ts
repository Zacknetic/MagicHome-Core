import { ICommandOptions, IDeviceCommand, ICompleteResponse } from './types';

import { Transport } from './Transport';
import { commandToByteArray, isStateEqual } from './utils/coreUtils';

import { bufferToDeviceResponse as bufferToCompleteResponse } from './utils/miscUtils';

const RETRY_WAIT_MS = 3000;

export class DeviceInterface {
    // Declare a global variable to store the resolve function of the Promise
    // returned by the first call to sendCommand
    private sendCommandResolve: (value?: ICompleteResponse | PromiseLike<ICompleteResponse>) => void;

    // Declare a global variable to store the Promise returned by the first call to sendCommand
    private sendCommandPromise: Promise<ICompleteResponse>;

    protected queue;
    protected queueSize = 0;

    protected latestPowerCommand = null;
    protected transport: Transport;

    protected commandQueue: Array<{ deviceCommand: IDeviceCommand, commandOptions: ICommandOptions }>;
    private processingCommand: boolean;
    private retryCount: number;
    protected processing = false;
    protected timeoutId;
    resolve: (value: unknown) => void;
    constructor(transport: Transport) {
        console.time('sendCommand')
        this.transport = transport;
        this.commandQueue = [];
        this.processingCommand = false;
        this.retryCount = 0;
    }

    public async queryState(timeoutMS = 100): Promise<ICompleteResponse> {
        const responseMsg: Buffer = await this.transport.queryState(timeoutMS).catch(e => { throw e });
        const completeResponse: ICompleteResponse = bufferToCompleteResponse(responseMsg);
        return completeResponse;
    }

    public async sendCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions) {

        this.sendCommandToTransport(deviceCommand, commandOptions);
        if (this.processing) this.resolve('exited early')
        return new Promise(async (_resolve, _reject) => {
            this.resolve = _resolve;
            if (this.processing) {
                this.abort();
            }
            this.processing = true;
            this.timeoutId = setTimeout(async () => {
                this.processing = false;
                const result: ICompleteResponse | void = await this.processCommand(deviceCommand, commandOptions).catch(e => { _reject(e) });
                _resolve(result);
            }, 500);
        }).catch(e => { throw e });

    }



    private async processCommand(deviceCommand: IDeviceCommand, commandOptions: ICommandOptions): Promise<ICompleteResponse> {
        try {
            let state: ICompleteResponse = null;
            let isValidState = false;
            let retryCount = commandOptions.maxRetries || 0;
            while (!isValidState && retryCount > 0) {
                await new Promise((resolve) => setTimeout(resolve, 3000));
                state = await this.queryState(500);
                isValidState = isStateEqual(deviceCommand, state, commandOptions.commandType);
                if (!isValidState) {
                    await this.sendCommandToTransport(deviceCommand, commandOptions);
                }
                retryCount--;
            }
            if (!isValidState) {
                throw new Error('Invalid state');
            }
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

    abort() {
        clearTimeout(this.timeoutId);
        this.processing = false;
    }
}