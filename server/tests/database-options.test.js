import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { databaseOptions } from '../src/database.js';

describe('database authentication options', () => {
  const url = 'mysql://test:encoded%40password@127.0.0.1:3306/testdb';
  it('does not enable unauthenticated RSA key retrieval and retains verified TLS', () => {
    const options = databaseOptions(url, { DATABASE_SSL: 'true' });
    expect(options.allowPublicKeyRetrieval).toBeUndefined();
    expect(options.ssl.rejectUnauthorized).toBe(true);
    expect(options.password).toBe('encoded@password');
    expect(options.connectTimeout).toBe(5000);
  });
  it('pins only an explicitly configured local public key for both MySQL SHA2 methods', () => {
    const directory = mkdtempSync(join(tmpdir(), 'school-public-key-test-'));
    try {
      const path = join(directory, 'public.pem');
      writeFileSync(path, 'PUBLIC KEY TEST FIXTURE');
      const options = databaseOptions(url, { DATABASE_RSA_PUBLIC_KEY: path });
      expect(options.cachingRsaPublicKey).toBe('PUBLIC KEY TEST FIXTURE');
      expect(options.rsaPublicKey).toEqual(options.cachingRsaPublicKey);
      expect(options.allowPublicKeyRetrieval).toBeUndefined();
    } finally { unlinkSync(join(directory, 'public.pem')); rmdirSync(directory); }
  });
  it('fails closed for an unavailable configured key or a non-MySQL URL', () => {
    expect(() => databaseOptions(url, { DATABASE_RSA_PUBLIC_KEY: 'nonexistent-school-public-key.pem' })).toThrow();
    expect(() => databaseOptions('postgres://localhost/test', {})).toThrow('mysql://');
  });
});
