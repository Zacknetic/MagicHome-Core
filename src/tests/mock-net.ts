import { MockMagicHomeDevice } from "./MockMagicHomeDevice";

const EventEmitter = require('events')

const TIMEOUT = 500
const WILL_PASS = true;

namespace net {

    export interface Socket {
        on,
        once,
        end,
        write,
        destroy,
    }

    export function connect({port, host, timeout}){
            const netSocket = new NetSocket()
            netSocket.onConnect();
            return netSocket;
    }

    export class NetSocket implements Socket {
        protected host: number;
        protected port: number;
        protected timeout: number;
        protected eventEmitter;
        protected mockDeviceSettings;
        protected mockMagicHomeDevice
        constructor(mockDeviceSettings?) {
            this.mockMagicHomeDevice = new MockMagicHomeDevice();
            // this.mockDeviceSettings = mockDeviceSettings;
            this.eventEmitter = new EventEmitter();
            this.eventEmitter.setMaxListeners(100)
        }

        //https://stackoverflow.com/questions/39820651/node-js-eventemitter-how-to-bind-a-class-context-to-the-event-listener-and-then 

        public once(event, callback, timeout) {
            this.eventEmitter.once(event, (ret?) => {
                callback(ret);
            });
        }

        public on(event, callback) {
            this.eventEmitter.on(event, (ret?) => {
                callback(ret);
            });
        }

        public async write(data, dataType?, callback?, testCommandOptions?) {
            const response = await this.mockMagicHomeDevice.mockSendDeviceCommand(data)
            if (response) {
                this.emitData(response)
            }
            callback();
        }

        private emitData(data) {
            this.eventEmitter.emit('data', data)
        }

        public async onConnect() {
            //wait for connections and then emit connect event
            setTimeout(() => {
                // console.warn("ERROR HERE?", this.eventEmitter)

                this.eventEmitter.emit('connect')
            }, TIMEOUT);
        }

        public async end() {
            this.eventEmitter = new EventEmitter();
        }

        public async destroy() {
            // this.eventEmitter = null;
        }
    }





}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export default net;