"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Network = void 0;
const os = require("os");
class Network {
    static masks(cidr) {
        var _a;
        const subnet = parseInt(cidr.split('/').pop() || '24', 10);
        const ipaddress = (cidr.split('/').shift() || '').split('.').map((b) => parseInt(b, 10));
        const masks = (_a = (`${('1').repeat(subnet)}${'0'.repeat(32 - subnet)}`).match(/.{1,8}/g)) === null || _a === void 0 ? void 0 : _a.map((b) => parseInt(b, 2));
        const inverted = masks === null || masks === void 0 ? void 0 : masks.map((b) => b ^ 255); // eslint-disable-line no-bitwise
        const base = ipaddress.map((block, index) => block & masks[index]); // eslint-disable-line no-bitwise
        const broadcast = base.map((block, index) => block | inverted[index]); // eslint-disable-line no-bitwise
        return {
            base: base.join('.'),
            broadcast: broadcast.join('.'),
        };
    }
    static network() {
        const ifaces = os.networkInterfaces();
        const results = [];
        Object.keys(ifaces).forEach((ifname) => {
            ifaces[ifname].forEach((iface) => {
                if (iface.family !== 'IPv4' || iface.internal !== false) {
                    return;
                }
                if (results.indexOf(iface.address) === -1) {
                    results.push(`${iface.cidr}`);
                }
            });
        });
        return results;
    }
    static subnets() {
        const network = Network.network();
        const masks = network.map((n) => Network.masks(n));
        return masks;
    }
}
exports.Network = Network;
