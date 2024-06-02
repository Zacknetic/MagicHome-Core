import net, { Socket } from "net";
import { BASIC_DEVICE_COMMANDS, CancelTokenObject, CommandCancelledError, MaxWaitTimeError, WaitConfig } from "./types";
import { bufferFromByteArray } from "./utils/miscUtils";
import { Mutex } from "./utils/miscUtils";

const PORT = 5577;
const SOCKET_TIMEOUT_MS = 10000;
const IDLE_TIMEOUT_MS = 30 * 1000; // 30 seconds

async function wait(config: WaitConfig): Promise<Buffer> {
  const { emitter, eventName, timeout, writeData, cancellationToken } = config;

  return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout;

      const listener = (data: Buffer) => {
          clearTimeout(timer);
          emitter.removeListener(eventName, listener);
          resolve(data);
      };

      timer = setTimeout(() => {
          emitter.off(eventName, listener);
          // reject(new Error(`timed out while awaiting: ${eventName}. Timeout was: ${timeout}ms`));
          reject(new MaxWaitTimeError());
      }, timeout);

      emitter.on(eventName, listener);

      if (writeData) {
          emitter.write(writeData);
      }

      if (cancellationToken) {
          const cancelListener = () => {
              clearTimeout(timer);
              emitter.off(eventName, listener);
              reject(new CommandCancelledError());
          };
          if (cancellationToken.isCancelled()) {
              console.log("cancelling");
              cancelListener();
          } else {
              cancellationToken.cancel = cancelListener;
          }
      }
  });
}

export class Transport {
  private mutex: Mutex;
  private socket: Socket | undefined;
  private connected = false;
  private idleTimer: NodeJS.Timeout | null = null;
  private currentCancelToken?: CancelTokenObject;

  constructor(private ipAddress: string) {
      this.mutex = new Mutex();
  }

  private createCancelToken(): CancelTokenObject {
      let cancelled = false;
      return {
          cancel: () => {
              cancelled = true;
          },
          isCancelled: () => cancelled
      };
  }

  private async connect(): Promise<void> {
      try {
          this.socket = new net.Socket();
          const options = {
              host: this.ipAddress,
              port: PORT,
              timeout: SOCKET_TIMEOUT_MS,
          };

          this.socket.on("error", () => {});

          this.socket.connect(options, () => {});

          await wait({ emitter: this.socket, eventName: "connect", timeout: SOCKET_TIMEOUT_MS });
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

      if (this.socket && (forceDestroy || this.connected)) {
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
      if (!this.connected || !this.socket) {
          console.log("MHCore send: not connected, connecting...");
          await this.connect();
      }
      this.socket!.write(buffer);
      this.resetIdleTimer();
      release();
  }

  async requestState(timeout: number): Promise<Buffer> {
    
      const release = await this.mutex.lock();
      if (!this.connected) {
          console.log("MHCore requestState: not connected, connecting...");
          await this.connect();
      }
   
      const requestBuffer = bufferFromByteArray(BASIC_DEVICE_COMMANDS.QUERY_STATE);

      if (this.currentCancelToken) {
          this.currentCancelToken.cancel();
      }
      this.currentCancelToken = this.createCancelToken();

      try {
          const data = await wait({
              emitter: this.socket!,
              eventName: "data",
              timeout,
              writeData: requestBuffer,
              cancellationToken: this.currentCancelToken,
          });
          this.resetIdleTimer();
          return data;
      } finally {
          release();
      }
  }
}