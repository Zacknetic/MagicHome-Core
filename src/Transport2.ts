const RESPONSE_TIMEOUT = 500; // 0.5 sec
const PORT = 5577;
import * as net from 'net';
import * as Queue from 'promise-queue';

export class Transport2 {
    protected address;
    protected commandQueue = []
    protected socket = null;
    protected receivedData = Buffer.alloc(0);
    protected receiveTimeout = null;
    protected connectTimeout = null;
    protected commandTimeout = null;
    protected preventDataSending = false;
    protected lastColor = { red: 0, green: 0, blue: 0 };
    protected lastWW = 0;
    protected lastCW = 0;
    constructor(_address) {
        this.address = _address;
    }


    static ackMask(mask) {
        return {
            power: (mask & 0x01) > 0,
            color: (mask & 0x02) > 0,
            pattern: (mask & 0x04) > 0,
            custom_pattern: (mask & 0x08) > 0
        };
    }

    _receiveData(empty, data?) {
        if (this.commandTimeout !== null) { // we have received _something_ so the command cannot timeout anymore
            clearTimeout(this.commandTimeout);
            this.commandTimeout = null;
        }

        if (empty) {
            // no data, so request is instantly finished
            // this can happend when a command is sent without waiting for a reply or when a timeout is reached
            let finished_command = this.commandQueue[0];

            if (finished_command != undefined) {
                const resolve = finished_command.resolve;
                if (resolve != undefined) {
                    resolve(this.receivedData);
                }
            }

            // clear received data
            this.receivedData = Buffer.alloc(0);

            this.commandQueue.shift();

            this._handleNextCommand();
        } else {
            this.receivedData = Buffer.concat([this.receivedData, data]);

            if (this.receiveTimeout != null) clearTimeout(this.receiveTimeout);

            // since we don't know how long the response is going to be, set a timeout after which we consider the
            // whole message to be received
            this.receiveTimeout = setTimeout(() => {
                this._receiveData(true);
            }, RESPONSE_TIMEOUT);
        }
    }

    _handleCommandTimeout() {
        this.commandTimeout = null;

        let timedout_command = this.commandQueue[0];

        if (timedout_command !== undefined) {
            const reject = timedout_command.reject;
            if (reject != undefined) {
                reject(new Error("Command timed out"));
            }
        }

        this.receivedData = Buffer.alloc(0); // just for good measure

        this.commandQueue.shift();

        this._handleNextCommand();
    }

    _handleNextCommand(timeout = null) {
        if (this.commandQueue.length == 0) {
            if (this.socket != null) this.socket.end();
            this.socket = null;
        } else {
            let cmd = this.commandQueue[0];

            if (!cmd.expect_reply) {
                this.socket.write(cmd.command, "binary", () => {
                    this._receiveData(true);
                });
            } else {
                this.socket.write(cmd.command, "binary", () => {
                    if (timeout === null) return;

                    this.commandTimeout = setTimeout(() => {
                        this._handleCommandTimeout();
                    }, timeout);
                });
            }
        }
    }

    _sendCommand(buf, expect_reply, resolve, reject, timeout = null) {
        // calculate checksum
        let checksum = 0;
        for (let byte of buf.values()) {
            checksum += byte;
        }
        checksum &= 0xFF;

        // append checksum to command buffer
        let command = Buffer.concat([buf, Buffer.from([checksum])]);

        if (this.commandQueue.length == 0 && this.socket == null) {
            this.commandQueue.push({ expect_reply, resolve, reject, command });

            this.preventDataSending = false;

            this.socket = net.connect(PORT, this.address, () => {
                if (this.connectTimeout != null) {
                    clearTimeout(this.connectTimeout);
                    this.connectTimeout = null;
                }

                if (!this.preventDataSending) { // prevent "write after end" errors
                    this._handleNextCommand(); // which is the "first" command in this case
                }
            });

            this.socket.on('error', (err) => {
                this._socketErrorHandler(err, reject);
            });

            this.socket.on('data', (data) => {
                this._receiveData(false, data);
            });

            if (timeout) {
                this.connectTimeout = setTimeout(() => {
                    this._socketErrorHandler(new Error("Connection timeout reached"), reject);
                }, timeout );
            }
        } else {
            this.commandQueue.push({ expect_reply, resolve, reject, command });
        }
    }

    _socketErrorHandler(err, reject) {
        this.preventDataSending = true;

        reject(err);

        if (this.socket != null) this.socket.end();
        this.socket = null;

        // also reject all commands currently in the queue
        for (let c of this.commandQueue) {
            let reject = c.reject;
            if (reject != undefined) {
                reject(err);
            }
        }

        this.commandQueue = []; // reset commandqueue so commands dont get stuck if the controller becomes unavailable
    }



    /**
     * Queries the controller for it's current state
     * This method stores the color and ww values for future calls to setColor, setWarmWhite, etc.
     * It will also set apply_masks to true for controllers which require it.
     * @param {function} callback
     * @returns {Promise<QueryResponse>}
     */
    async queryState() {
        let cmd_buf = Buffer.from([0x81, 0x8a, 0x8b]);

        return new Promise((resolve, reject) => {
            this._sendCommand(cmd_buf, true, resolve, reject);
        }).then(data => {
    
            return data;
        });

    }
}