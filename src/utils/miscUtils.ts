export function parseDeviceState(data: Buffer) {
  let state = {
    LEDState: {
      isOn: data.readUInt8(2) === 0x23,
      RGB: {
        red: data.readUInt8(6),
        green: data.readUInt8(7),
        blue: data.readUInt8(8),
      },
      CCT: {
        warmWhite: data.readUInt8(9),
        coldWhite: data.readUInt8(11),
      },
    },
    controllerHardwareVersion: data.readUInt8(1),
    controllerFirmwareVersion: data.readUInt8(10),
    rawData: data,
  }
  return state;
}

export function calcChecksum(buffer: Uint8Array) {
  let checksum = 0;

  for (const byte of buffer) {
    checksum += byte;
  }

  return checksum & 0xff;
}