const OUI_VENDORS: Record<string, string> = {
  // Common vendors
  '3C:9C:0F': 'FiberHome Telecommunication',
  'BA:02:F6': 'Xiaomi Communications',
  'FE:55:51': 'Samsung Electronics',
  '3A:AB:E8': 'Samsung Electronics',
  'A6:0E:FB': 'Transsion (Infinix/Tecno)',
  'BC:D0:74': 'Apple, Inc.',
  'AC:BC:32': 'Apple, Inc.',
  'F4:D4:88': 'Apple, Inc.',
  '50:8A:CB': 'Apple, Inc.',
  '00:1A:11': 'Google, Inc.',
  'D8:6C:63': 'Google, Inc.',
  '54:60:09': 'Google, Inc.',
  '08:00:27': 'PCS Systemtechnik (VirtualBox)',
  '00:0C:29': 'VMware, Inc.',
  '00:50:56': 'VMware, Inc.',
  '58:24:29': 'ASUSTek Computer',
  'B0:6E:BF': 'TP-Link Corporation',
  '50:C7:BF': 'TP-Link Corporation',
  'C0:25:E9': 'TP-Link Corporation',
  '00:09:B0': 'Onkyo Corporation',
  '70:4F:57': 'Huawei Technologies',
  '00:E0:4C': 'Realtek Semiconductor',
  'A4:BB:6D': 'Intel Corporate'
};

export const MacService = {
  /**
   * Normalizes any MAC format (e.g. aa-bb-cc-dd-ee-ff, aabb.ccdd.eeff, etc.)
   * to standard uppercase format: AA:BB:CC:DD:EE:FF
   */
  normalize(mac: string): string {
    if (!mac) return '';
    const cleaned = mac.trim().replace(/[^a-fA-F0-9]/g, '').toUpperCase();
    if (cleaned.length !== 12) {
      throw new Error(`Invalid MAC address length: "${mac}"`);
    }
    const parts = cleaned.match(/.{1,2}/g);
    return parts ? parts.join(':') : '';
  },

  /**
   * Checks if string is a valid MAC address format
   */
  isValid(mac: string): boolean {
    if (!mac) return false;
    try {
      const normalized = this.normalize(mac);
      return /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(normalized);
    } catch {
      return false;
    }
  },

  /**
   * Identifies device vendor based on OUI or known manufacturer prefix
   */
  getVendor(mac: string, hostname?: string): string {
    try {
      const norm = this.normalize(mac);
      const prefix = norm.substring(0, 8); // e.g. "FE:55:51"
      if (OUI_VENDORS[prefix]) {
        return OUI_VENDORS[prefix];
      }

      // Fallback heuristics based on hostname
      if (hostname) {
        const lower = hostname.toLowerCase();
        if (lower.includes('galaxy') || lower.includes('samsung') || lower.includes('sm-')) return 'Samsung Electronics';
        if (lower.includes('redmi') || lower.includes('xiaomi') || lower.includes('poco')) return 'Xiaomi';
        if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('macbook') || lower.includes('apple')) return 'Apple';
        if (lower.includes('infinix') || lower.includes('tecno')) return 'Transsion (Infinix)';
        if (lower.includes('oppo') || lower.includes('realme')) return 'OPPO / Realme';
        if (lower.includes('vivo')) return 'Vivo';
        if (lower.includes('pixel')) return 'Google Pixel';
        if (lower.includes('huawei') || lower.includes('honor')) return 'Huawei';
      }

      // Check if randomized/private MAC (2nd least significant bit of first octet is 1: x2, x6, xA, xE)
      const firstOctet = parseInt(norm.substring(0, 2), 16);
      if ((firstOctet & 0x02) !== 0) {
        return 'Private / Randomized MAC';
      }
    } catch {
      // Ignore
    }
    return 'Unknown Vendor';
  }
};
