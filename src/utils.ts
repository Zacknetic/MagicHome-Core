//=================================================
// Start checksum //

//a checksum is needed at the end of the byte array otherwise the message is rejected by the light
//add all bytes and chop off the beginning by & with 0xFF
export function checksum(buffer: Uint8Array) {
  let chk = 0;

  for (const byte of buffer) {
    chk += byte;
  }

  return chk & 0xff;
}