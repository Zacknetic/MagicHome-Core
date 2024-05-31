export function calcChecksum(buffer: Uint8Array): Buffer {
    let checksum = 0;
  
    for (const byte of buffer) {
      checksum += byte;
    }
  
    checksum = checksum & 0xff;
    const finalCommand: Buffer = Buffer.concat([buffer, Buffer.from([checksum])]);
  
    return finalCommand;
  }
  
  export function bufferFromByteArray(byteArray: number[], useChecksum = true): Buffer {
    const buffer = Buffer.from(byteArray);
    let payload = buffer;
  
    if (useChecksum) payload = calcChecksum(buffer);
  
    return payload;
  }
  