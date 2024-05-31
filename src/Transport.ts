import net, { Socket } from "net";
import { BASIC_DEVICE_COMMANDS } from "./types";
import { bufferFromByteArray } from "./utils/miscUtils";
import { Mutex } from "./utils/miscUtils";

const PORT = 5577;
const SOCKET_TIMEOUT_MS = 10000;
const IDLE_TIMEOUT_MS = 30 * 1000; // 30 seconds

export class Transport {
  private mutex: Mutex;
  private socket: Socket;
  private connected = false;
  private idleTimer: NodeJS.Timeout;
  constructor(private ipAddress: string) {
    this.mutex = new Mutex();
  }

  private async connect(): Promise<void> {
    
    try {
    this.socket = new net.Socket();
    const options = {
      host: this.ipAddress,
      port: PORT,
      timeout: SOCKET_TIMEOUT_MS,
    };

    this.socket.on("error", () => {
    });

    this.socket.connect(options, () => {
    });
    
      await wait(this.socket, "connect", SOCKET_TIMEOUT_MS, null, null);
      this.connected = true;
      this.startIdleTimer();
    } catch (e) {
      await this.disconnect(true);
      throw new Error("MHCore ConnectError: " + e);
    }
  }

  private async disconnect(forceDestroy = false): Promise<void> {
    this.stopIdleTimer();
    const release = await this.mutex.lock();

    if (forceDestroy || this.connected) {
      this.socket.destroy();
      this.socket.removeAllListeners();
      this.connected = false;
    }
    release();
  }

  private startIdleTimer(): void {
    this.stopIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.disconnect();
    }, IDLE_TIMEOUT_MS);
  }

  private stopIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private resetIdleTimer(): void {
    this.stopIdleTimer();
    this.startIdleTimer();
  }

  public async send(byteArray: number[]): Promise<void> {
    const release = await this.mutex.lock();
    const buffer = bufferFromByteArray(byteArray);
    if (!this.connected) {
      console.log("MHCore send: not connected, connecting...");
      await this.connect();
    }
    this.socket.write(buffer);
    this.resetIdleTimer();
    release();
  }

  async requestState(timeout: number): Promise<Buffer> {
    const release = await this.mutex.lock();
    if (!this.connected) {
      console.log("MHCore requestState: not connected, connecting...")
      await this.connect();

    }

    const requestBuffer = bufferFromByteArray(BASIC_DEVICE_COMMANDS.QUERY_STATE);

    try {
      const data = await wait(this.socket, "data", timeout, requestBuffer, null);
      this.resetIdleTimer();
      return data;
    } catch (e) {
      throw new Error("MHCore requestState: " + e);
    } finally {
      release();
    }
  }
}

async function wait(emitter: Socket, eventName: string, timeout: number, writeData: Buffer, callback): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout;

    const listener = (data: Buffer) => {
      clearTimeout(timer);
      emitter.removeListener(eventName, listener);
      resolve(data);
    };

    timer = setTimeout(() => {
      emitter.off(eventName, listener);
      reject(`timed out while awaiting: ${eventName}. Timeout was: ${timeout}ms`);
    }, timeout);

    emitter.on(eventName, listener);

    if (writeData) emitter.write(writeData);
    if (callback) callback();
  });
}
