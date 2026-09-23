import { describe, it, expect } from 'vitest';
import { MacService } from '../src/main/services/MacService';

describe('MacService Normalization & Validation', () => {
  it('should normalize standard colon-separated lowercase MAC to uppercase', () => {
    expect(MacService.normalize('3c:9c:0f:4a:17:8a')).toBe('3C:9C:0F:4A:17:8A');
  });

  it('should normalize hyphen-separated MAC addresses', () => {
    expect(MacService.normalize('ba-02-f6-d8-64-73')).toBe('BA:02:F6:D8:64:73');
    expect(MacService.normalize('FE-55-51-FF-46-E2')).toBe('FE:55:51:FF:46:E2');
  });

  it('should normalize dot-separated Cisco format', () => {
    expect(MacService.normalize('3aab.e83a.ed56')).toBe('3A:AB:E8:3A:ED:56');
  });

  it('should normalize contiguous hex string', () => {
    expect(MacService.normalize('A60EFB84780E')).toBe('A6:0E:FB:84:78:0E');
  });

  it('should throw on invalid length or malformed input', () => {
    expect(() => MacService.normalize('12:34:56')).toThrow('Invalid MAC address length');
    expect(() => MacService.normalize('invalid-mac-string')).toThrow();
  });

  it('should correctly validate valid and invalid MAC addresses', () => {
    expect(MacService.isValid('3C:9C:0F:4A:17:8A')).toBe(true);
    expect(MacService.isValid('3c-9c-0f-4a-17-8a')).toBe(true);
    expect(MacService.isValid('192.168.1.1')).toBe(false);
    expect(MacService.isValid('')).toBe(false);
    expect(MacService.isValid('ZZ:ZZ:ZZ:ZZ:ZZ:ZZ')).toBe(false);
  });

  it('should identify known vendors from OUI or heuristics', () => {
    expect(MacService.getVendor('BA:02:F6:D8:64:73', 'Redmi-13')).toContain('Xiaomi');
    expect(MacService.getVendor('FE:55:51:FF:46:E2', 'Galaxy-M30s')).toContain('Samsung');
    expect(MacService.getVendor('3C:9C:0F:4A:17:8A')).toContain('FiberHome');
  });
});
