/**
 * @jest-environment jsdom
 */
import addMinutes from 'date-fns/addMinutes';
import subMinutes from 'date-fns/subMinutes';
import NextCookieDriver from './next-json-cookie';

describe.each<[string, () => NextCookieDriver]>([
  ['NextCookieDriver', () => new NextCookieDriver()],
  ['Encrypted NextCookieDriver', () => new NextCookieDriver(null, { encrypt: true })],
])('%s', (_, init) => {
  let driver: NextCookieDriver;

  beforeEach(() => {
    driver = init();
  });

  afterEach(() => {
    driver.flush();
  });

  describe(`${_} flush`, () => {
    test('clears all values from next cookies', () => {
      driver.put('foo', 'a');
      driver.put('bar', 'b');
      driver.put('baz', 'c');

      expect(Object.keys(driver.getAll()).length).toBe(3);

      driver.flush();

      expect(Object.keys(driver.getAll()).length).toBe(0);
    });
  });

  describe(`${_} has`, () => {
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

  describe(`${_} get`, () => {
    test('returns "null" if no cache is found', () => {
      expect(driver.get('foo')).toBeNull();
    });

    test('returns given fallback value if no cache is found', () => {
      expect(driver.get('foo', 'baz')).toBe('baz');
    });

    test('returns cache value if key exists', () => {
      driver.put('foo', 'bar');

      expect(driver.get('foo')).toBe('bar');
    });

    test('returns null/given fallback value if cache exists but has expired', () => {
      driver.put('foo', 'bar', subMinutes(Date.now(), 5));

      expect(driver.get('foo')).toBeNull();
    });
  });

  describe(`${_} put`, () => {
    test('stores the given value in the cache under the given key', () => {
      const actual = driver.put('foo', 'bar');

      expect(driver.get('foo')).toBeTruthy();
      expect(actual).toBe('bar');
    });

    test('stores the given json in the cache under the given key', () => {
      const actual = driver.put('foo', { fizz: true });

      expect(driver.get('foo')).toBeTruthy();
      expect(actual).toStrictEqual({ fizz: true });
    });
  });

  describe(`${_} remove`, () => {
    test('removes the given key from the cache', () => {
      expect(driver.get('foo')).toBeNull();

      driver.put('foo', 'bar');

      expect(driver.get('foo')).toBe('bar');

      driver.remove('foo');

      expect(driver.get('foo')).toBeNull();
    });
  });
});
