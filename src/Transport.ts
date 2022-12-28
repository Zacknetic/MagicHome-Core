import net, { Socket } from 'net';
import { DEVICE_COMMAND_BYTES, ICompleteResponse, ITransportResponse } from './types';
import { bufferFromByteArray, bufferToDeviceResponse as bufferToCompleteResponse, mergeDeep, overwriteDeep, ValidationError } from './utils/miscUtils';
// import net from './tests/mock-net';
import { Mutex } from './utils/miscUtils';

const PORT = 5577;
const SOCKET_TIMEOUT_MS = 10000;
const SOCKET_CONNECTION_RETRIES = 2;
const IDLE_TIMEOUT_MS = 30000; // 30 seconds

export class Transport {
    private mutex: Mutex;
    private socket: Socket;
    private connected = false;
    private idleTimer: NodeJS.Timeout;
    constructor(private ipAddress: string) {
        this.mutex = new Mutex();
    }

    private async connect(): Promise<void> {
        this.socket = new net.Socket();
        const options = {
            host: this.ipAddress,
            port: PORT,
            timeout: SOCKET_TIMEOUT_MS,
        };
        this.socket.connect(options);

        try {
            await wait(this.socket, 'connect', SOCKET_TIMEOUT_MS);
            this.connected = true;
            this.startIdleTimer();
        } catch (err) {
            this.connected = false;
            throw err;
        }
    }

    private disconnect(): void {
        this.socket.end();
        this.connected = false;
        this.stopIdleTimer();
    }

    private startIdleTimer(): void {
        this.stopIdleTimer();
        this.idleTimer = setTimeout(() => {
            console.log(`Connection has been idle for ${IDLE_TIMEOUT_MS}ms. Disconnecting.`);
            this.disconnect();
        }, IDLE_TIMEOUT_MS);
    }

    private stopIdleTimer(): void {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    public send(byteArray: number[]): void {
        const buffer = bufferFromByteArray(byteArray);
        if (!this.connected) {
            this.connect();
        }
        this.socket.write(buffer);
        this.resetIdleTimer();
    }

    async requestState(timeout: number): Promise<Buffer> {
        const release = await this.mutex.lock();
        if (!this.connected) await this.connect();

        const requestBuffer = bufferFromByteArray(DEVICE_COMMAND_BYTES.COMMAND_QUERY_STATE);

        try {
            const data = await wait(this.socket, 'data', timeout, requestBuffer);
            this.resetIdleTimer();
            return data;
        } catch (err) {
            throw err;
        } finally {
            release();
        }
    }
    private resetIdleTimer(): void {
        this.stopIdleTimer();
        this.startIdleTimer();
    }
}

async function wait(emitter: Socket, eventName: string, timeout: number, writeData: Buffer = null): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        let timer: NodeJS.Timeout;

        const listener = (data: Buffer) => {
            clearTimeout(timer);
            emitter.removeListener(eventName, listener); // remove the listener
            resolve(data);
        };

        timer = setTimeout(() => {
            emitter.off(eventName, listener);
            reject(`timed out while awaiting: ${eventName}.Timeout: ${timeout}ms`);
        }, timeout);

        emitter.on(eventName, listener);

        if (writeData) emitter.write(writeData);
    });
}
