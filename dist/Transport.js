"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transport = void 0;
const net = require("net");
const Queue = require("promise-queue");
const utils_1 = require("./utils");
const COMMAND_QUERY_STATE = Uint8Array.from([0x81, 0x8a, 0x8b]);
const PORT = 5577;
function wait(emitter, eventName, timeout) {
    return new Promise((resolve, reject) => {
        let complete = false;
        const waitTimeout = setTimeout(() => {
            complete = true; // mark the job as done
            resolve(null);
        }, timeout);
        // listen for the first event, then stop listening (once)
        emitter.once(eventName, (args) => {
            clearTimeout(waitTimeout); // stop the timeout from executing
            if (!complete) {
                complete = true; // mark the job as done
                resolve(args);
            }
        });
        emitter.once('close', () => {
            clearTimeout(waitTimeout); // stop the timeout from executing
            // if the socket closed before we resolved the promise, reject the promise
            if (!complete) {
                complete = true;
                reject(null);
            }
        });
        // handle the first error and reject the promise
        emitter.on('error', (e) => {
            clearTimeout(waitTimeout); // stop the timeout from executing
            if (!complete) {
                complete = true;
                reject(e);
            }
        });
    });
}
class Transport {
    /**
     * @param {string} host - hostname
     * @param {number} timeout - connection timeout (in seconds)
     */
    constructor(host) {
        this.host = host;
        this.socket = null;
        this.queue = new Queue(1, Infinity); // 1 concurrent, infinite size
    }
    connect(fn, _timeout = 200) {
        return __awaiter(this, void 0, void 0, function* () {
            const options = {
                host: this.host,
                port: PORT,
                timeout: _timeout,
            };
            let result;
            try {
                this.socket = net.connect(options);
                yield wait(this.socket, 'connect', _timeout = 200);
                result = yield fn();
                return result;
            }
            catch (e) {
                const { code, address, port } = e;
                if (code) {
                    // No need to show error here, shown upstream
                    // this.log.debug(`Unable to connect to ${address} ${port} (code: ${code})`);
                }
                else {
                }
            }
            finally {
                this.socket.end();
                this.socket.destroy();
            }
            return null;
        });
    }
    disconnect() {
        this.socket.end();
        this.socket = null;
    }
    send(buffer, useChecksum = true, _timeout = 2000) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.add(() => __awaiter(this, void 0, void 0, function* () {
                return (this.connect(() => __awaiter(this, void 0, void 0, function* () {
                    yield this.write(buffer, useChecksum, _timeout);
                    return this.read(_timeout);
                })));
            }));
        });
    }
    write(buffer, useChecksum = true, _timeout = 200) {
        return __awaiter(this, void 0, void 0, function* () {
            let sent;
            if (useChecksum) {
                const chk = (0, utils_1.checksum)(buffer);
                const payload = Buffer.concat([buffer, Buffer.from([chk])]);
                sent = this.socket.write(payload, useChecksum, _timeout);
            }
            else {
                sent = this.socket.write(buffer, useChecksum, _timeout);
            }
            // wait for drain event which means all data has been sent
            if (sent !== true) {
                yield wait(this.socket, 'drain', _timeout);
            }
        });
    }
    read(_timeout = 200) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield wait(this.socket, 'data', _timeout);
            return data;
        });
    }
    getState(_timeout = 500) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield this.send(COMMAND_QUERY_STATE, true, _timeout);
                if (data == null) {
                    return null;
                }
                return {
                    debugBuffer: data,
                    controllerHardwareVersion: data.readUInt8(1),
                    isOn: data.readUInt8(2) === 0x23,
                    RGB: {
                        red: data.readUInt8(6),
                        green: data.readUInt8(7),
                        blue: data.readUInt8(8),
                    },
                    whiteValues: {
                        warmWhite: data.readUInt8(9),
                        coldWhite: data.readUInt8(11),
                    },
                    controllerFirmwareVersion: data.readUInt8(10),
                };
            }
            catch (error) {
            }
        });
    }
}
exports.Transport = Transport;
