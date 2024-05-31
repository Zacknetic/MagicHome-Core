import { LightResponse } from './types/Types';
import { NetworkError, DeviceError } from './errors/Errors';
import SocketManager from './SocketManager';
import dgram from 'dgram';

class LightController {
  private lights = new Map<string, LightResponse>();
  private socketManager: SocketManager;

  private constructor() {
    this.socketManager = SocketManager.getInstance();
    this.socketManager.onMessage(this.handleResponse.bind(this));
  }

  public static getInstance(): LightController {
    return new LightController();
  }

  public async discoverLights(): Promise<void> {
    try {
      await this.socketManager.send(Buffer.from('HF-A11ASSISTHREAD'), 48899, '255.255.255.255');
    } catch (error) {
      throw error;
    }
  }

  private async handleResponse(msg: Buffer, rinfo: dgram.RemoteInfo): Promise<void> {
    try {
      const [ipAddress, uniqueId, modelNumber] = msg.toString().split(',');
      const response: LightResponse = { ipAddress, uniqueId, modelNumber };
      this.lights.set(uniqueId, response);

      await this.requestMoreInfo(response);
    } catch (error) {
      throw new DeviceError(`Error processing response from ${rinfo.address}: ${error.message}`);
    }
  }

  private async requestMoreInfo(response: LightResponse): Promise<void> {
    try {
      await this.socketManager.send(Buffer.from([0xAA, 0xBB, 0xCC]), 48899, response.ipAddress);
    } catch (error) {
      throw new NetworkError(`Network error during info request to ${response.ipAddress}: ${error.message}`);
    }
  }
}

export default LightController;
