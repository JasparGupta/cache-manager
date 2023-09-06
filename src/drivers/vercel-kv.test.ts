import { createClient } from '@vercel/kv';
import type { RedisConfigNodejs } from '@upstash/redis';

const config: RedisConfigNodejs = { token: '', url: '' };

describe('RedisDriver', () => {
  describe('flush', () => {
    test('removes all keys from redis', async () => {
      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      const spyFlushAll = jest.spyOn(driver.api(), 'flushall').mockImplementation();
      // @ts-ignore
      // const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());

      await driver.flush();

      // @ts-ignore
      expect(driver.api().flushall).toHaveBeenCalled();

      spyFlushAll.mockRestore();
      // spyConnect.mockRestore();
    });
  });

  describe('get', () => {
    test('returns "null" if no key is found and no fallback is provided', async () => {
      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      // const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);
      const spyApiGet = jest.spyOn(driver.api(), 'get').mockResolvedValue(null);

      expect(await driver.get('foo')).toBeNull();

      // spyConnect.mockRestore();
      // spyHas.mockRestore();
      spyApiGet.mockRestore();
    });

    test('returns given fallback value if given key is not found', async () => {
      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      // const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);
      const spyApiGet = jest.spyOn(driver.api(), 'get').mockResolvedValue(null);

      expect(await driver.get('foo', 'baz')).toBe('baz');

      // spyConnect.mockRestore();
      // spyHas.mockRestore();
      spyApiGet.mockRestore();
    });

    test('returns given fallback callback value if given key is not found', async () => {
      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      // const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);
      const spyApiGet = jest.spyOn(driver.api(), 'get').mockResolvedValue(null);
      const fallback = jest.fn(async () => 'baz');

      expect(await driver.get('foo', fallback)).toBe('baz');
      expect(fallback).toHaveBeenCalled();

      // spyConnect.mockRestore();
      // spyHas.mockRestore();
      spyApiGet.mockRestore();
    });

    test('returns cache for given key', async () => {
      const expected = { test: true };

      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      // const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(true);
      // @ts-ignore
      const spyApiGet = jest.spyOn(driver.api(), 'get').mockResolvedValue(JSON.stringify(expected));
      const fallback = jest.fn(async () => 'bar');

      expect(await driver.get('foo', fallback)).toEqual(expected);
      expect(fallback).not.toHaveBeenCalled();

      // spyConnect.mockRestore();
      // spyHas.mockRestore();
      spyApiGet.mockRestore();
    });
  });

  describe('has', () => {
    test.each([true, false])('[%p] returns whether a key exists in the cache', async (exists) => {
      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      // const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // @ts-ignore
      const spyApiExists = jest.spyOn(driver.api(), 'exists').mockResolvedValue(exists);

      expect(await driver.has('foo')).toBe(exists);
      expect(spyApiExists).toHaveBeenCalledWith('foo');

      // spyConnect.mockRestore();
      spyApiExists.mockRestore();
    });
  });

  describe('put', () => {
    test.each([null, new Date()])('%# stores an item in the cache with the given key', async (expires) => {
      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      // const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // @ts-ignore
      const spySet = jest.spyOn(driver.api(), 'set').mockResolvedValue('OK');
      // @ts-ignore

      const actual = await driver.put('foo', 'bar', expires);

      expect(actual).toBe('bar');
      expect(spySet).toHaveBeenCalledWith('foo', JSON.stringify('bar'), expires ? { pxat: expires.getTime() } : {});

      // spyConnect.mockRestore();
      spySet.mockRestore();
    });
  });

  describe('remember', () => {
    test.each<[string | null, string]>([
      [null, 'baz'],
      ['bar', 'bar']
    ])('%# returns the cached item if it exists else return the value of the callback', async (cache, expected) => {
      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      const spyGet = jest.spyOn(driver, 'get').mockResolvedValue(cache);
      const spyPut = jest.spyOn(driver, 'put').mockImplementation((_key, value, _expires) => Promise.resolve(value));

      const callback = jest.fn(() => 'baz');

      const actual = await driver.remember('foo', callback);

      expect(actual).toBe(expected);
      expect(spyGet).toHaveBeenCalledWith('foo');

      if (cache === null) {
        expect(spyPut).toHaveBeenCalledWith('foo', 'baz', null);
        expect(callback).toHaveBeenCalled();
      } else {
        expect(spyPut).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
      }

      spyGet.mockRestore();
      spyPut.mockRestore();
    });
  });

  describe('remove', () => {
    test('removes a key from the cache', async () => {
      const { default: VercelKvDriver } = await import('./vercel-kv');
      const driver = new VercelKvDriver(createClient(config));

      // @ts-ignore
      // const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // @ts-ignore
      const spyDel = jest.spyOn(driver.api(), 'del').mockImplementation();

      await driver.remove('foo');

      expect(spyDel).toHaveBeenCalledWith('foo');

      // spyConnect.mockRestore();
      spyDel.mockRestore();
    });
  });
});
