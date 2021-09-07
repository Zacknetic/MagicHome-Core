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
exports.DeviceDiscovery = void 0;
const dgram = require("dgram");
const Network_1 = require("./Network");
const BROADCAST_PORT = 48899;
const BROADCAST_MAGIC_STRING = 'HF-A11ASSISTHREAD';
class DeviceDiscovery {
    constructor() {
        this.count = 1;
    }
    scan(timeout = 500) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const userInterfaces = Network_1.Network.subnets();
                const clients = [];
                const socket = dgram.createSocket('udp4');
                socket.on('error', (err) => {
                    socket.close();
                    reject(err);
                });
                socket.on('message', (msg) => {
                    const parts = msg.toString().split(',');
                    if (parts.length !== 3) {
                        return;
                    }
                    const [ipAddress, uniqueId, modelNumber] = parts;
                    if (clients.findIndex((item) => item.uniqueId === uniqueId) === -1) {
                        clients.push({ ipAddress, uniqueId, modelNumber });
                        //this.logs.debug('\n%o - Discovered device...\nUniqueId: %o \nIpAddress %o \nModel: %o\n.', this.count++, uniqueId, ipAddress,modelNumber); 
                    }
                    else {
                        //this.logs.debug('\n%o - A device twice in the same scan. Likely due to a "fun" network layout...\nUniqueId: %o \nIpAddress %o \nModel: %o\n already exists.', this.count++, uniqueId, ipAddress,modelNumber);    
                    }
                });
                socket.on('listening', () => {
                    socket.setBroadcast(true);
                    const addressAlreadyScanned = [];
                    for (const userInterface of userInterfaces) {
                        if (addressAlreadyScanned.includes(userInterface.broadcast)) {
                            //this.logs.debug('Skipping redundant scan of broadcast-address %o for Magichome devices.', userInterface.broadcast);
                            continue;
                        }
                        addressAlreadyScanned.push(userInterface.broadcast);
                        //this.logs.debug('Scanning broadcast-address: %o for Magichome devices...', userInterface.broadcast);
                        socket.send(BROADCAST_MAGIC_STRING, BROADCAST_PORT, userInterface.broadcast);
                    }
                });
                socket.bind(BROADCAST_PORT);
                setTimeout(() => {
                    socket.close();
                    resolve(clients);
                }, timeout);
            });
        });
    }
}
exports.DeviceDiscovery = DeviceDiscovery;
