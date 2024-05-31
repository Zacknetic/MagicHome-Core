export class DeviceError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "DeviceError";
    }
  }
  
  export class NetworkError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NetworkError";
    }
  }
  
  export class OtherError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "OtherError";
    }
  }
  