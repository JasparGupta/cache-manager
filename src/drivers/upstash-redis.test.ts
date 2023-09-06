import { Redis as Client } from '@upstash/redis';

describe('UpstashRedisDriver', () => {

  let client: Client;

  beforeEach(() => {
    client = new Client({
      url: '',
      token: ''
    });
  });

  describe('flush', () => {
    test('removes all keys from redis', async () => {
      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

      // @ts-ignore
      const spyFlushAll = jest.spyOn(driver.api(), 'flushall').mockImplementation();

      await driver.flush();

      // @ts-ignore
      expect(driver.api().flushall).toHaveBeenCalled();

      spyFlushAll.mockRestore();
    });
  });

  describe('get', () => {
    test('returns "null" if no key is found and no fallback is provided', async () => {
      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

      // @ts-ignore
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);

      expect(await driver.get('foo')).toBeNull();

      spyHas.mockRestore();
    });

    test('returns given fallback value if given key is not found', async () => {
      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

      // @ts-ignore
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);

      expect(await driver.get('foo', 'baz')).toBe('baz');

      spyHas.mockRestore();
    });

    test('returns given fallback callback value if given key is not found', async () => {
      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

      // @ts-ignore
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);
      const fallback = jest.fn(async () => 'baz');

      expect(await driver.get('foo', fallback)).toBe('baz');
      expect(fallback).toHaveBeenCalled();

      spyHas.mockRestore();
    });

    test('returns cache for given key', async () => {
      const expected = { test: true };

      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

      // @ts-ignore
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(true);
      // @ts-ignore
      const spyApiGet = jest.spyOn(driver.api(), 'get').mockResolvedValue(JSON.stringify(expected));
      const fallback = jest.fn(() => 'bar');

      expect(await driver.get('foo', fallback)).toEqual(expected);
      expect(fallback).not.toHaveBeenCalled();

      spyHas.mockRestore();
      spyApiGet.mockRestore();
    });
  });

  describe('has', () => {
    test.each([true, false])('[%p] returns whether a key exists in the cache', async (exists) => {
      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

      // @ts-ignore
      const spyApiExists = jest.spyOn(driver.api(), 'exists').mockResolvedValue(Number(exists));

      expect(await driver.has('foo')).toBe(exists);
      expect(spyApiExists).toHaveBeenCalledWith('foo');

      spyApiExists.mockRestore();
    });
  });

  describe('put', () => {
    test.each([null, new Date()])('%# stores an item in the cache with the given key', async (expires) => {
      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

      // @ts-ignore
      const spySet = jest.spyOn(driver.api(), 'set').mockResolvedValue('OK');
      // @ts-ignore
      const spyExpireAt = jest.spyOn(driver.api(), 'expireat').mockResolvedValue('OK');

      const actual = await driver.put('foo', 'bar', expires);

      expect(actual).toBe('bar');
      expect(spySet).toHaveBeenCalledWith('foo', JSON.stringify('bar'));

      if (expires) expect(spyExpireAt).toHaveBeenCalledWith('foo', Math.floor(expires.getTime() / 1000));

      spySet.mockRestore();
      spyExpireAt.mockRestore();
    });
  });

  describe('remember', () => {
    test.each<[string | null, string]>([
      [null, 'baz'],
      ['bar', 'bar']
    ])('%# returns the cached item if it exists else return the value of the callback', async (cache, expected) => {
      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

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
      const { default: UpstashRedisDriver } = await import('./upstash-redis');
      const driver = new UpstashRedisDriver(client);

      // @ts-ignore
      const spyDel = jest.spyOn(driver.api(), 'del').mockImplementation();

      await driver.remove('foo');

      expect(spyDel).toHaveBeenCalledWith('foo');

      spyDel.mockRestore();
    });
  });

});
