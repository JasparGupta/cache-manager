import subMinutes from 'date-fns/subMinutes';
import addMinutes from 'date-fns/addMinutes';
import MapDriver from './map';

describe('MapDriver', () => {
  let driver: MapDriver;

  beforeEach(() => {
    driver = new MapDriver();
  });

  describe('flush', () => {
    test('clears all cached items', () => {
      (new Array(5)).fill('foo').forEach((value, index) => driver.put(index.toString(), value));

      expect(driver.api().size).toBe(5);

      driver.flush();

      expect(driver.api().size).toBe(0);
    });
  });

  describe('get', () => {
    test('returns "null" if not cache is found', () => {
      expect(driver.get('foo')).toBeNull();
    });

    test('returns given fallback value if no cache is found', () => {
      expect(driver.get('foo', 'bar')).toBe('bar');
    });

    test('retrieves a cached item', () => {
      expect(driver.get('foo')).toBeNull();

      driver.put('foo', 'bar');

      expect(driver.get('foo')).toBe('bar');
    });
  });

  describe('has', () => {
    test('returns "false" if the given key does not exist in the cache', () => {
      expect(driver.has('foo')).toBe(false);
    });

    test('returns "true" if the given key exists in the cache', () => {
      driver.put('foo', 'bar');

      expect(driver.has('foo')).toBe(true);
    });

    test.each([
      [addMinutes(Date.now(), 5), true],
      [subMinutes(Date.now(), 5), false],
    ])('determines whether the given key exists in the cache and whether it has expired', (expires, expected) => {
      driver.put('foo', 'bar', expires);

      expect(driver.has('foo')).toBe(expected);
    });
  });

  describe('put', () => {
    test.each([null, new Date()])('stores an item in the cache', (expires) => {
      const cached = driver.put('foo', 'bar', expires);

      expect(cached).toBe('bar');
      expect(driver.api().get('foo')).toEqual({
        expires,
        key: 'foo',
        value: 'bar',
      });
    });
  });

  describe('remove', () => {
    test('removes a cached item', () => {
      driver.put('foo', 'bar');

      expect(driver.has('foo')).toBe(true);

      driver.remove('foo');

      expect(driver.has('foo')).toBe(false);
    });
  });
});
