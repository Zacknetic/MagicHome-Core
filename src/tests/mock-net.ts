import { MockMagicHomeDevice } from "./MockMagicHomeDevice";

const EventEmitter = require('events')

const TIMEOUT = 1000
const WILL_PASS = true;

export class MockNet {

    protected eventEmitter;
    protected mockDeviceSettings;
    protected mockMagicHomeDevice
    constructor(mockDeviceSettings?) {
        this.mockMagicHomeDevice = new MockMagicHomeDevice();
        // this.mockDeviceSettings = mockDeviceSettings;
        this.eventEmitter = new EventEmitter();
    }

    //https://stackoverflow.com/questions/39820651/node-js-eventemitter-how-to-bind-a-class-context-to-the-event-listener-and-then 
    public connect(port: number, host: string) {
        this.onConnect();
        return this;
    }

    public on(event, callback) {
        this.eventEmitter.on(event, (ret?) => {
            callback(ret);
        });
    }

    public async write(data, dataType, callback?, testCommandOptions?) {
        const response = await this.mockMagicHomeDevice.mockSendDeviceCommand(data)
        if (response) {
            this.emitData(response)
        }
        callback();
    }

    private emitData(data) {
        this.eventEmitter.emit('data', data)
    }

    private async onConnect() {
        //wait for connections and then emit connect event
        setTimeout(() => {
            this.eventEmitter.emit('connect')
        }, TIMEOUT);
    }

    public async end() {
        this.eventEmitter = new EventEmitter();
    }
}



function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}