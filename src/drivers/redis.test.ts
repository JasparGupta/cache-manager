import { createClient } from 'redis';

describe('RedisDriver', () => {
  describe('constructor', () => {
    test('creates "end" and "error" redis event listeners', async () => {
      const client = createClient();
      const spy = jest.spyOn(client, 'on');

      const { default: RedisDriver } = await import('./redis');

      const driver = new RedisDriver(client);

      const [[end], [error]] = spy.mock.calls;

      expect(spy).toHaveBeenCalled();
      // Assert that first call to "redis.on" is "end".
      expect(end).toBe('end');
      // Assert that second call to "redis.on" is "error".
      expect(error).toBe('error');
    });
  });

  describe('flush', () => {
    test('removes all keys from redis', async () => {
      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

      // @ts-ignore
      const spyFlushAll = jest.spyOn(driver.api(), 'flushAll').mockImplementation();
      // @ts-ignore
      const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());

      await driver.flush();

      // @ts-ignore
      expect(driver.api().flushAll).toHaveBeenCalled();

      spyFlushAll.mockRestore();
      spyConnect.mockRestore();
    });
  });

  describe('get', () => {
    test('returns "null" if no key is found and no fallback is provided', async () => {
      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

      // @ts-ignore
      const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);

      expect(await driver.get('foo')).toBeNull();

      spyConnect.mockRestore();
      spyHas.mockRestore();
    });

    test('returns given fallback value if given key is not found', async () => {
      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

      // @ts-ignore
      const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(false);

      expect(await driver.get('foo', 'baz')).toBe('baz');

      spyConnect.mockRestore();
      spyHas.mockRestore();
    });

    test('returns cache for given key', async () => {
      const expected = { test: true };

      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

      // @ts-ignore
      const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      const spyHas = jest.spyOn(driver, 'has').mockResolvedValue(true);
      // @ts-ignore
      const spyApiGet = jest.spyOn(driver.api(), 'get').mockResolvedValue(JSON.stringify(expected));

      expect(await driver.get('foo')).toEqual(expected);

      spyConnect.mockRestore();
      spyHas.mockRestore();
      spyApiGet.mockRestore();
    });
  });

  describe('has', () => {
    test.each([true, false])('[%p] returns whether a key exists in the cache', async (exists) => {
      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

      // @ts-ignore
      const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // @ts-ignore
      const spyApiExists = jest.spyOn(driver.api(), 'exists').mockResolvedValue(exists);

      expect(await driver.has('foo')).toBe(exists);
      expect(spyApiExists).toHaveBeenCalledWith('foo');

      spyConnect.mockRestore();
      spyApiExists.mockRestore();
    });
  });

  describe('put', () => {
    test.each([null, new Date()])('%# stores an item in the cache with the given key', async (expires) => {
      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

      // @ts-ignore
      const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // @ts-ignore
      const spySet = jest.spyOn(driver.api(), 'set').mockResolvedValue('OK');
      // @ts-ignore
      const spyExpireAt = jest.spyOn(driver.api(), 'expireAt').mockResolvedValue('OK');

      const actual = await driver.put('foo', 'bar', expires);

      expect(actual).toBe('bar');
      expect(spySet).toHaveBeenCalledWith('foo', JSON.stringify('bar'));

      if (expires) expect(spyExpireAt).toHaveBeenCalledWith('foo', expires.getTime());

      spyConnect.mockRestore();
      spySet.mockRestore();
      spyExpireAt.mockRestore();
    });
  });

  describe('remember', () => {
    test.each<[string | null, string]>([
      [null, 'baz'],
      ['bar', 'bar']
    ])('%# returns the cached item if it exists else return the value of the callback', async (cache, expected) => {
      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

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
      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

      // @ts-ignore
      const spyConnect = jest.spyOn(driver, 'connect').mockImplementation(callback => callback());
      // @ts-ignore
      const spyDel = jest.spyOn(driver.api(), 'del').mockImplementation();

      await driver.remove('foo');

      expect(spyDel).toHaveBeenCalledWith('foo');

      spyConnect.mockRestore();
      spyDel.mockRestore();
    });
  });

  describe('connect', () => {
    test('connects to Redis if not already connected and return given callback value', async () => {
      jest.useFakeTimers();

      const { default: RedisDriver } = await import('./redis');
      const driver = new RedisDriver(createClient());

      // @ts-ignore
      const spyConnect = jest.spyOn(driver.api(), 'connect').mockResolvedValue('OK');
      const spyDisconnect = jest.spyOn(driver.api(), 'disconnect').mockImplementation(async () => {
        /**
         * In reality the Redis event "end" would be triggered by calling "disconnect".
         * But for brevity, I'm making the disconnect function physically set "connected" to "false".
         */
        // @ts-ignore
        driver.connected = false;
      });

      const callback = jest.fn().mockResolvedValue('foo');

      // @ts-ignore
      await driver.connect(callback);

      expect(spyConnect).toHaveBeenCalled();
      // @ts-ignore
      expect(driver.connected).toBe(true);
      expect(callback).toHaveBeenCalled();

      jest.runAllTimers();

      expect(spyDisconnect).toHaveBeenCalled();
      // @ts-ignore
      expect(driver.connected).toBe(false);

      spyConnect.mockRestore();
      spyDisconnect.mockRestore();
    });
  });
});
