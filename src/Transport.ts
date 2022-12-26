import * as net from 'net';
const PORT = 5577;
const SOCKET_TIMEOUT_MS = 2000;
const SOCKET_CONNECTION_RETRIES = 2;

export class Transport {
    private socket: net.Socket;
    private ipAddress: string;
    private port: number;
    private timeout: number;
    private connected: boolean;
    private requestInProgress: boolean;

    constructor(ipAddress: string) {
        this.ipAddress = ipAddress;
        this.connected = false;
        this.requestInProgress = false;
    }

    private connect(): void {

        const options = {
            host: this.ipAddress,
            port: PORT,
            timeout: SOCKET_TIMEOUT_MS,
        };
        this.socket = new net.Socket();
        this.socket.connect(options);
        this.connected = true;
    }

    private disconnect(): void {
        this.socket.end();
        this.connected = false;
    }

    public send(buffer: Buffer): void {
        if (!this.connected) {
            this.connect();
        }
        this.socket.write(buffer);
    }

    public async requestState(): Promise<Buffer> {
        if (this.requestInProgress) {
            throw new Error('Cannot send multiple requests simultaneously');
        }

        this.requestInProgress = true;

        if (!this.connected) {
            this.connect();
        }

        const requestBuffer = Buffer.from([0xFF, 0xFF, 0xFF]);
        this.socket.write(requestBuffer);

        return new Promise((resolve, reject) => {
            this.socket.once('data', (data: Buffer) => {
                this.requestInProgress = false;
                resolve(data);
            });
            this.socket.once('error', (err: Error) => {
                this.requestInProgress = false;
                reject(err);
            });
        });
    }
}