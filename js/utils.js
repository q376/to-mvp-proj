// TON Address Converter: Raw to User-Friendly Format

export class TONAddressConverter {
  constructor() {
    // CRC16 lookup table for XMODEM variant
    this.crcTable = this.generateCRC16Table();
  }

  generateCRC16Table() {
    const table = [];
    const poly = 0x1021;
    
    for (let i = 0; i < 256; i++) {
      let crc = i << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc << 1) ^ ((crc & 0x8000) ? poly : 0);
      }
      table[i] = crc & 0xFFFF;
    }
    return table;
  }

  crc16(data) {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
      crc = ((crc << 8) ^ this.crcTable[((crc >> 8) ^ data[i]) & 0xFF]) & 0xFFFF;
    }
    return crc;
  }

  base64ToBytes(base64) {
    const bin = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  }

  bytesToBase64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  rawToUserFriendly(rawAddress, options = {}) {
    const {
      isBounceable = true,
      isTestOnly = false
    } = options;

    try {
      // Parse raw address format: workchain:hash
      const parts = rawAddress.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid raw address format. Expected "workchain:hash"');
      }

      const workchain = parseInt(parts[0]);
      const hash = parts[1];

      if (isNaN(workchain) || workchain < -128 || workchain > 127) {
        throw new Error('Invalid workchain');
      }

      if (!/^[0-9a-fA-F]{64}$/.test(hash)) {
        throw new Error('Invalid hash. Must be 64 hex characters');
      }

      // Convert hex hash to bytes
      const hashBytes = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        hashBytes[i] = parseInt(hash.substr(i * 2, 2), 16);
      }

      // Build address
      const addressData = new Uint8Array(34);
      
      // Tag byte
      let tag = 0x11; // bounceable
      if (!isBounceable) {
        tag = 0x51; // non-bounceable
      }
      if (isTestOnly) {
        tag |= 0x80;
      }
      
      addressData[0] = tag;
      addressData[1] = workchain & 0xFF;
      addressData.set(hashBytes, 2);

      // Calculate CRC16
      const crc = this.crc16(addressData);
      const result = new Uint8Array(36);
      result.set(addressData);
      result[34] = crc >> 8;
      result[35] = crc & 0xFF;

      // Convert to base64url
      return this.bytesToBase64(result);
    } catch (error) {
      throw new Error(`Failed to convert address: ${error.message}`);
    }
  }

  // Helper method to convert user-friendly back to raw (for verification)
  userFriendlyToRaw(address) {
    try {
      const bytes = this.base64ToBytes(address);
      
      if (bytes.length !== 36) {
        throw new Error('Invalid address length');
      }

      // Verify CRC
      const crc = (bytes[34] << 8) | bytes[35];
      const calcCrc = this.crc16(bytes.subarray(0, 34));
      
      if (crc !== calcCrc) {
        throw new Error('CRC mismatch');
      }

      const tag = bytes[0];
      const workchain = bytes[1] > 127 ? bytes[1] - 256 : bytes[1];
      const hash = Array.from(bytes.subarray(2, 34))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return {
        raw: `${workchain}:${hash}`,
        isBounceable: (tag & 0x11) === 0x11,
        isTestOnly: (tag & 0x80) !== 0
      };
    } catch (error) {
      throw new Error(`Failed to parse address: ${error.message}`);
    }
  }

  // Convert any address format to non-bounceable user-friendly (recommended for UI)
  toNonBounceable(address) {
    // Check if it's already user-friendly format
    if (address.length === 48 && !address.includes(':')) {
      // Parse existing user-friendly address
      const parsed = this.userFriendlyToRaw(address);
      // Convert to non-bounceable
      return this.rawToUserFriendly(parsed.raw, { 
        isBounceable: false, 
        isTestOnly: parsed.isTestOnly 
      });
    }
    
    // Assume it's raw format
    return this.rawToUserFriendly(address, { isBounceable: false });
  }

  // Convert any address format to bounceable user-friendly (for contract interactions)
  toBounceable(address) {
    // Check if it's already user-friendly format
    if (address.length === 48 && !address.includes(':')) {
      // Parse existing user-friendly address
      const parsed = this.userFriendlyToRaw(address);
      // Convert to bounceable
      return this.rawToUserFriendly(parsed.raw, { 
        isBounceable: true, 
        isTestOnly: parsed.isTestOnly 
      });
    }
    
    // Assume it's raw format
    return this.rawToUserFriendly(address, { isBounceable: true });
  }

  // Normalize address to raw format (useful for comparisons)
  toRaw(address) {
    if (address.includes(':')) {
      return address; // Already raw
    }
    return this.userFriendlyToRaw(address).raw;
  }
}
