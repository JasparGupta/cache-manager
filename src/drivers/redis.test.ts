/**
 * @jest-environment node
 */
import { createClient } from 'redis';
import RedisDriver from './redis';

describe('RedisDriver', () => {
  let driver: RedisDriver;
  let spyConnect: jest.SpyInstance;

  beforeEach(async () => {
    const { default: RedisDriver } = await import('./redis');
    driver = new RedisDriver(createClient());

    // @ts-expect-error protected method.
    spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
  });

  afterEach(() => {
    spyConnect.mockRestore();
  });

  describe('transformers', () => {
    test('uses transformers when provided', async () => {
      const serialize = jest.fn((value: Date) => value.getTime());
      const deserialize = jest.fn((value: number) => new Date(value));

      const { default: RedisDriver } = await import('./redis');
      driver = new RedisDriver(createClient(), {
        transformer: { deserialize, serialize }
      });

      const date = new Date();

      // @ts-expect-error protected method.
      spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      const spySet = jest.spyOn(driver.api(), 'set').mockResolvedValue('OK');
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(true);
      const spyGet = jest.spyOn(driver.api(), 'get').mockResolvedValue(date.getTime().toString(10));

      void await driver.put('foo', date);

      expect(serialize).toHaveBeenCalledWith(date);

      const actual = await driver.get<Date>('foo');

      expect(deserialize).toHaveBeenCalledWith(expect.any(Number));
      expect(actual).toBeInstanceOf(Date);
      expect(actual?.getTime()).toBe(date.getTime());

      spySet.mockRestore();
      spyHas.mockRestore();
      spyGet.mockRestore();
    });
  });

  describe('flush', () => {
    test('removes all keys from redis', async () => {
      const spyFlushDb = jest.spyOn(driver.api(), 'flushDb').mockImplementation();

      await driver.flush();

      expect(driver.api().flushDb).toHaveBeenCalled();

      spyFlushDb.mockRestore();
    });
  });

  describe('get', () => {
    test('returns "null" if no key is found and no fallback is provided', async () => {
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);

      expect(await driver.get('foo')).toBeNull();

      spyHas.mockRestore();
    });

    test('returns given fallback value if given key is not found', async () => {
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);

      expect(await driver.get('foo', 'baz')).toBe('baz');

      spyHas.mockRestore();
    });

    test('returns given fallback callback value if given key is not found', async () => {
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);
      const fallback = jest.fn(async () => 'baz');

      expect(await driver.get('foo', fallback)).toBe('baz');
      expect(fallback).toHaveBeenCalled();

      spyHas.mockRestore();
    });

    test('returns cache for given key', async () => {
      const expected = { test: true };

      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(true);
      const spyApiGet = jest.spyOn(driver.api(), 'get').mockResolvedValue(JSON.stringify(expected));
      const fallback = jest.fn(async () => 'bar');

      expect(await driver.get('foo', fallback)).toEqual(expected);
      expect(fallback).not.toHaveBeenCalled();

      // spyConnect.mockRestore();
      spyHas.mockRestore();
      spyApiGet.mockRestore();
    });
  });

  describe('has', () => {
    test.each([true, false])('[%p] returns whether a key exists in the cache', async (exists) => {
      const spyApiExists = jest.spyOn(driver.api(), 'exists').mockResolvedValue(+exists);

      expect(await driver.has('foo')).toBe(exists);
      expect(spyApiExists).toHaveBeenCalledWith('foo');

      spyApiExists.mockRestore();
    });
  });

  describe('put', () => {
    test.each([null, new Date()])('%# stores an item in the cache with the given key', async (expires) => {
      const spySet = jest.spyOn(driver.api(), 'set').mockResolvedValue('OK');

      const actual = await driver.put('foo', 'bar', expires);

      expect(actual).toBe('bar');
      expect(spySet).toHaveBeenCalledWith('foo', JSON.stringify('bar'), expires ? { PXAT: expires.getTime() } : {});

      spySet.mockRestore();
    });
  });

  describe('remember', () => {
    test.each<[string | null, string]>([
      [null, 'baz'],
      ['bar', 'bar']
    ])('%# returns the cached item if it exists else return the value of the callback', async (cache, expected) => {
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
      const spyDel = jest.spyOn(driver.api(), 'del').mockImplementation();

      await driver.remove('foo');

      expect(spyDel).toHaveBeenCalledWith('foo');

      spyDel.mockRestore();
    });
  });

  describe('connect', () => {
    test('connects to Redis if not already connected and return given callback value', async () => {
      jest.useFakeTimers();

      const { default: RedisDriver } = await import('./redis');
      driver = new RedisDriver(createClient());

      const spyIsOpen = jest.spyOn(driver.api(), 'isOpen', 'get').mockReturnValue(false);

      const spyRedisConnect = jest.spyOn(driver.api(), 'connect').mockImplementation(async () => {
        spyIsOpen.mockReset().mockReturnValue(true);
      });
      const spyQuit = jest.spyOn(driver.api(), 'quit').mockImplementation(async () => {
        spyIsOpen.mockReset().mockReturnValue(false);

        return 'OK';
      });

      const callback = jest.fn().mockResolvedValue('foo');

      // @ts-expect-error private method.
      const actual = await driver.connect(callback);

      expect(spyRedisConnect).toHaveBeenCalled();
      expect(driver.api().isOpen).toBe(true);
      expect(callback).toHaveBeenCalled();
      expect(actual).toBe('foo');

      jest.runAllTimers();

      expect(spyQuit).toHaveBeenCalled();
      expect(driver.api().isOpen).toBe(false);

      spyQuit.mockRestore();
      spyRedisConnect.mockRestore();
    });
  });
});
