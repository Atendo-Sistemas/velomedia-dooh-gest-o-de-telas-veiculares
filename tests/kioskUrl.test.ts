import { describe, expect, it } from 'vitest';
import { buildKioskUrl } from '../src/services/kioskUrl';

describe('kiosk launch QR URL', () => {
  it('opens the simplified kiosk player for the selected device', () => {
    const url = new URL(buildKioskUrl('https://beta.example.com', 'TV SP/01'));

    expect(url.origin).toBe('https://beta.example.com');
    expect(url.searchParams.get('tab')).toBe('player');
    expect(url.searchParams.get('kiosk')).toBe('true');
    expect(url.searchParams.get('simple')).toBe('1');
    expect(url.searchParams.get('pwa')).toBe('1');
    expect(url.searchParams.get('device')).toBe('TV SP/01');
  });

  it('does not add a device identifier when one was not selected', () => {
    const url = new URL(buildKioskUrl('https://beta.example.com'));

    expect(url.searchParams.has('device')).toBe(false);
  });
});
