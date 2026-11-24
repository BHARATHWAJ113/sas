import { Readable } from 'node:stream';
import { checksum } from '../src/storage.js';
export function memoryStorage() {
  const objects = new Map();
  return {
    objects,
    async stat(key) { const value = objects.get(key); return value ? { size: value.length, sha256: checksum(value) } : null; },
    async put(key, buffer) { if (objects.has(key)) throw Object.assign(new Error(), { name: 'PreconditionFailed' }); objects.set(key, Buffer.from(buffer)); },
    async read(key) { if (!objects.has(key)) throw Object.assign(new Error(), { name: 'NoSuchKey' }); return objects.get(key); },
    async stream(key, input = {}) {
      let value = await this.read(key);
      const match = /^bytes=(\d+)-(\d+)$/.exec(input.Range || '');
      if (match) value = value.subarray(Number(match[1]), Number(match[2]) + 1);
      return Readable.from(value);
    },
    async remove(key) { objects.delete(key); },
  };
}
