import fs from 'node:fs';
import FileDriver from './file';

describe('FileDriver', () => {
  const path = './.cache.file';

  afterEach(() => {
    if (fs.existsSync(path)) fs.unlinkSync(path);
  });

  describe('constructor', () => {
    test('creates the cache file if it does not exist', () => {
      expect(fs.existsSync(path)).toBe(false);

      void new FileDriver(path);

      expect(fs.existsSync(path)).toBe(true);
    });
  });

  describe('methods', () => {
    let driver: FileDriver;

    beforeEach(() => {
      driver = new FileDriver(path);
    });

    describe('flush', () => {
      test('clears all cached items', () => {
        const cache = JSON.stringify({
          foo: { expires: null, key: 'foo', value: true },
        });

        const file = fs.openSync(path, 'w');
        fs.writeSync(file, cache);
        fs.closeSync(file);

        expect(fs.readFileSync(path, { encoding: 'utf-8' })).toBe(cache);

        driver.flush();

        expect(fs.readFileSync(path, { encoding: 'utf-8' })).toBe('{}');
      });
    });

    describe('get', () => {
      test('returns null if no cache exists for given key', () => {
        expect(driver.get('foo')).toBeNull();
      });

      test('returns fallback value if no cache exists for given key', () => {
        expect(driver.get('foo', 'bar')).toBe('bar');
      });

      test('returns fallback callback value if no cache exists for given key', () => {
        expect(driver.get('foo', () => 'bar')).toBe('bar');
      });

      test('returns null if cache has expired', () => {
        const file = fs.openSync(path, 'w');
        fs.writeSync(file, JSON.stringify({ foo: { expires: Date.now() - 1000, key: 'foo', value: 'bar' } }));
        fs.closeSync(file);

        expect(driver.get('foo')).toBeNull();
      });

      test('returns cached value if given key exists in cache', () => {
        const file = fs.openSync(path, 'w');
        fs.writeSync(file, JSON.stringify({ foo: { expires: null, key: 'foo', value: 'bar' } }));
        fs.closeSync(file);

        expect(driver.get('foo')).toBe('bar');
      });
    });

    describe('put', () => {
      test('puts the given value in the cache', () => {
        expect(driver.get('foo')).toBeNull();

        driver.put('foo', 'bar');

        expect(JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))).toEqual({
          foo: { expires: null, key: 'foo', value: 'bar' }
        });
      });

      test('puts the given value in the cache with the given expiration timestamp', () => {
        expect(driver.get('foo')).toBeNull();

        const expires = new Date(Date.now() + (60 * 1000));
        driver.put('foo', 'bar', expires);

        expect(JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }))).toEqual({
          foo: { expires: expires.getTime(), key: 'foo', value: 'bar' }
        });
      });
    });

    describe('remove', () => {
      test('deletes cache for given key', () => {
        driver.put('foo', 'bar');

        expect(driver.get('foo')).toBe('bar');

        driver.remove('foo');

        expect(driver.get('foo')).toBeNull();
      });
    });
  });
});
