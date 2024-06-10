import addMinutes from 'date-fns/addMinutes';
import subMinutes from 'date-fns/subMinutes';
import superjson from 'superjson';
import type { Cached } from './types';
import StorageDriver from './storage';

describe.each<[string, Storage]>([
  ['LocalStorageDriver', window.localStorage],
  ['SessionStorageDriver', window.sessionStorage],
])('%s', (_, store) => {
  let driver: StorageDriver;

  beforeEach(() => {
    store.clear();
    driver = new StorageDriver(store);
  });

  describe('transformers', () => {
    test('uses transformers when provided', () => {
      const serialize = jest.fn((value: Date) => value.getTime());
      const deserialize = jest.fn((value: number) => new Date(value));

      driver = new StorageDriver(store, {
        transformer: { deserialize, serialize }
      });

      const date = new Date();

      driver.put('foo', date);

      expect(serialize).toHaveBeenCalledWith(date);

      const actual = driver.get<Date>('foo');

      expect(deserialize).toHaveBeenCalledWith(expect.any(Number));
      expect(actual).toBeInstanceOf(Date);
      expect(actual?.getTime()).toBe(date.getTime());
    });

    test('superjson works', () => {
      driver = new StorageDriver(store, { transformer: superjson });

      const data = {
        date: new Date(),
        number: 1001,
        regexp: /foo/,
        string: 'hello',
      };

      driver.put('foo', data);

      expect(driver.api().getItem('foo')).toBe(
        JSON.stringify({ expires: null, key: 'foo', value: superjson.serialize(data) })
      );

      const actual = driver.get<typeof data>('foo');

      expect(actual).toEqual(data);
    });
  });

  describe('flush', () => {
    test('clears all values from cache', () => {
      driver.api().setItem('foo', 'a');
      driver.api().setItem('bar', 'b');
      driver.api().setItem('baz', 'c');

      expect(Object.keys(driver.api()).length).toBe(3);

      driver.flush();

      expect(Object.keys(driver.api()).length).toBe(0);
    });
  });

  describe('expired', () => {
    test('returns "false" if "expires" is falsy', () => {
      const item: Cached = {
        expires: null,
        key: 'foo',
        value: 'bar',
      };

      // @ts-ignore
      expect(driver.expired(item)).toBe(false);
    });

    test('returns "false" if cached item has not expired', () => {
      const item: Cached = {
        expires: addMinutes(Date.now(), 5),
        key: 'foo',
        value: 'bar',
      };

      // @ts-ignore
      expect(driver.expired(item)).toBe(false);
    });

    test('returns "true" if cached item has expired', () => {
      const spy = jest.spyOn(driver, 'remove');

      const item: Cached = {
        expires: subMinutes(Date.now(), 5),
        key: 'foo',
        value: 'bar',
      };

      // @ts-ignore
      expect(driver.expired(item)).toBe(true);
      expect(spy).toHaveBeenCalledWith(item.key);
    });
  });

  describe('has', () => {
    test('returns "false" if key does not exist', () => {
      expect(driver.has('foo')).toBe(false);
    });

    test('returns "false" if key exists but has expired', () => {
      driver.put('foo', 'bar', subMinutes(Date.now(), 5));

      expect(driver.has('foo')).toBe(false);
    });

    test.each([
      addMinutes(Date.now(), 5),
      null,
    ])('%# returns "true" if key exists in cache and item has not expired', (expires) => {
      expect(driver.has('foo')).toBe(false);

      driver.put('foo', 'bar', expires);

      expect(driver.has('foo')).toBe(true);
    });
  });

  describe('get', () => {
    test('returns "null" if no cache is found', () => {
      expect(driver.get<string>('foo')).toBeNull();
    });

    test('returns given fallback value if no cache is found', () => {
      expect(driver.get<string>('foo', 'baz')).toBe('baz');
    });

    test('returns given fallback callback value if no cache is found', () => {
      const fallback = jest.fn(() => 'baz');
      expect(driver.get<string>('foo', fallback)).toBe('baz');
      expect(fallback).toHaveBeenCalled();
    });

    test('returns cache value if key exists', () => {
      driver.put('foo', 'bar');

      const fallback = jest.fn(() => 'baz');
      expect(driver.get('foo', fallback)).toBe('bar');
      expect(fallback).not.toHaveBeenCalled();
    });

    test('returns null/given fallback value if cache exists but has expired', () => {
      driver.put('foo', 'bar', subMinutes(Date.now(), 5));

      expect(driver.get('foo')).toBeNull();
    });
  });

  describe('put', () => {
    test('stores the given value in the cache under the given key', () => {
      const actual = driver.put('foo', 'bar');

      expect(driver.api().getItem('foo')).toBeTruthy();
      expect(actual).toBe('bar');
    });
  });

  describe('pruned', () => {
    test.each(['', 'prefix', 'prefix-'])('removes expired cache items', (prefix) => {
      // @ts-ignore
      driver.config.prefix = prefix;

      expect(driver.prune()).toBe(0);

      driver.put('foo1', 'bar', addMinutes(Date.now(), 10));
      driver.put('foo2', 'bar', subMinutes(Date.now(), 10));
      driver.put('foo3', 'bar', subMinutes(Date.now(), 10));
      driver.put('foo4', 'bar', addMinutes(Date.now(), 10));
      driver.put('foo5', 'bar', subMinutes(Date.now(), 10));

      expect(driver.prune()).toBe(3);
    });
  });

  describe('remove', () => {
    test('removes the given key from the cache', () => {
      expect(driver.get('foo')).toBeNull();

      driver.put('foo', 'bar');

      expect(driver.get('foo')).toBe('bar');

      driver.remove('foo');

      expect(driver.get('foo')).toBeNull();
    });
  });
});
