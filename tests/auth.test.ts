import { afterEach, describe, expect, it } from 'vitest';
import {
  checkLoginRateLimit,
  checkPairingRateLimit,
  recordFailedLogin,
  recordFailedPairing,
  resetLoginRateLimit,
  resetPairingRateLimit,
} from '../server/auth';

const loginKey = `test-login-${Date.now()}`;
const pairingKey = `test-pairing-${Date.now()}`;

afterEach(() => {
  resetLoginRateLimit(loginKey);
  resetPairingRateLimit(pairingKey);
});

describe('authentication throttling', () => {
  it('blocks login after five failed attempts', () => {
    for (let i = 0; i < 5; i += 1) recordFailedLogin(loginKey);

    expect(checkLoginRateLimit(loginKey)).toMatchObject({ allowed: false });
  });

  it('blocks device pairing after five failed attempts', () => {
    for (let i = 0; i < 5; i += 1) recordFailedPairing(pairingKey);

    expect(checkPairingRateLimit(pairingKey)).toMatchObject({ allowed: false });
  });
});
