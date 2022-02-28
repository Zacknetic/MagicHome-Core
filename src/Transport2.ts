import net from 'net';
import Queue from 'promise-queue';
import { _ } from 'lodash'
import { bufferFromByteArray, calcChecksum } from './utils/miscUtils';
import { ICommandResponse, ITransportResponse } from './types';

const COMMAND_QUERY_STATE: Uint8Array = Uint8Array.from([0x81, 0x8a, 0x8b]);

const PORT = 5577;

function wait(emitter: net.Socket, eventName: string, timeout: number) {

    return new Promise((resolve, reject) => {
        let transportResponse: ITransportResponse;
        if (timeout <= 0) resolve(_.merge(transportResponse, { eventNumber: 2 }));
        let complete = false;

        const waitTimeout: any = setTimeout(() => {
            complete = true; // mark the job as done
            resolve(null)
            // reject(_.merge(transportResponse, { eventNumber: -6 }));
        }, timeout);

        // listen for the first event, then stop listening (once)
        emitter.once(eventName, (args: any) => {
            clearTimeout(waitTimeout); // stop the timeout from executing
            if (!complete) {
                complete = true; // mark the job as done
                resolve(args)
                // resolve(_.merge(transportResponse, { response: args }));
            }
        });

        emitter.once('close', () => {
            clearTimeout(waitTimeout); // stop the timeout from executing

            // if the socket closed before we resolved the promise, reject the promise
            if (!complete) {
                complete = true;
                reject(null)
                // reject(_.merge(transportResponse, { eventNumber: -2 }));
            }
        });

        // handle the first error and reject the promise
        emitter.on('error', (e) => {
            clearTimeout(waitTimeout); // stop the timeout from executing

            if (!complete) {
                complete = true;
                reject(e)
                // reject(_.merge(transportResponse, { eventNumber: -7 }));
            }
        });

    });
}

export class Transport {
    host: any;
    socket: any;
    queue: any;
    /**
     * @param {string} host - hostname
     * @param {number} timeout - connection timeout (in seconds)
     */
    constructor(host: any) {
        this.host = host;
        this.socket = null;
        this.queue = new Queue(1, Infinity); // 1 concurrent, infinite size
    }

    async connect(fn: any, _timeout = 200) {
        const options = {
            host: this.host,
            port: PORT,
            timeout: _timeout,
        };

        this.socket = net.connect(options);
        await wait(this.socket, 'connect', _timeout = 200);
        return await fn()
    }

    disconnect() {
        this.socket.end();
        this.socket.destroy();
        this.socket = null;
    }

    async send(byteArray: number[], _timeout = 1000, _socketTimeout = 2000) {

        return this.queue.add(async () => (
            this.connect(async () => {
                if (!this.socket) {
                    await this.write(byteArray);
                    // const transportResponse: ITransportResponse = this.read(_timeout);
                    // _.merge(transportResponse, { command: byteArray, queueSize: this.queue.getQueueLength() });
                    return this.read(_timeout);

                } else {
                    await this.write(byteArray);
                    // const transportResponse: ITransportResponse = this.read(_timeout);
                    // _.merge(transportResponse, { command: byteArray, queueSize: this.queue.getQueueLength() });
                    return this.read(_timeout);
                }

            })

        ).finally(() => {
            if (this.queue.getQueueLength() === 0) this.disconnect();
        }));
    }

    async write(buffer: any, useChecksum = true, _timeout = 200) {

        const payload = bufferFromByteArray(buffer);
        const sent = await this.socket.write(payload);

        console.log(sent) //TODO REMOVE

        // wait for drain event which means all data has been sent
        if (sent !== true) {
            await wait(this.socket, 'drain', _timeout);
        }
    }

    async read(_timeout = 200) {
        // const transportResponse: ITransportResponse = {};
        const data = wait(this.socket, 'data', _timeout);
        return data;
        // return _.merge(transportResponse, { reponse: data });
    }

}
