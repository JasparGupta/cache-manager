/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/no-explicit-any,class-methods-use-this,@typescript-eslint/no-unused-vars */
import CacheDriver from './driver';

class TestDriver extends CacheDriver<any> {
  flush(): void {
    //
  }

  get<T>(key: string | number, fallback: T | undefined): Promise<T | null> | T | null {
    return null;
  }

  put<T>(key: string | number, value: T, date: Date | null | undefined): Promise<T> | T {
    return value;
  }

  remove(key: string): void {
    //
  }
}

describe('driver', () => {
  let driver: TestDriver;

  beforeEach(() => {
    driver = new TestDriver();
  });

  describe('decrement', () => {
    test('decrements the cache value for the given key by "1" if no count value is give', () => {
      const spyGet = jest.spyOn(driver, 'get').mockReturnValue(0);
      const spyPut = jest.spyOn(driver, 'put');

      expect(driver.decrement('foo')).toBe(-1);
      expect(spyGet).toHaveBeenCalledWith('foo', 0);
      expect(spyPut).toHaveBeenCalledWith('foo', -1);

      spyGet.mockRestore();
      spyPut.mockRestore();
    });

    test.each([
      [0, 1, -1],
      [7, 1, 6],
      [2, 3, -1],
    ])('decrements the cache value for the given key with the given count', (initial, count, expected) => {
      const spyGet = jest.spyOn(driver, 'get').mockReturnValue(initial);
      const spyPut = jest.spyOn(driver, 'put');

      expect(driver.decrement('foo', count)).toBe(expected);
      expect(spyGet).toHaveBeenCalledWith('foo', 0);
      expect(spyPut).toHaveBeenCalledWith('foo', expected);

      spyGet.mockRestore();
      spyPut.mockRestore();
    });
  });

  describe('has', () => {
    test.each<[boolean, any]>([
      [false, null],
      [true, false],
      [true, 0],
      [true, 'foo'],
      [false, Promise.resolve(null)],
      [true, Promise.resolve(false)],
      [true, Promise.resolve(0)],
      [true, Promise.resolve('foo')],
    ])('returns whether a cache item exists for the provided key', (expected, cache) => {
      const spyGet = jest.spyOn(driver, 'get').mockReturnValue(cache);

      cache instanceof Promise
        ? expect(driver.has('key')).resolves.toBe(expected)
        : expect(driver.has('key')).toBe(expected);

      spyGet.mockRestore();
    });
  });

  describe('increment', () => {
    test('increments the cache value for the given key by "1" if no count value is give', () => {
      const spyGet = jest.spyOn(driver, 'get').mockReturnValue(0);
      const spyPut = jest.spyOn(driver, 'put');

      expect(driver.increment('foo')).toBe(1);
      expect(spyGet).toHaveBeenCalledWith('foo', 0);
      expect(spyPut).toHaveBeenCalledWith('foo', 1);

      spyGet.mockRestore();
      spyPut.mockRestore();
    });

    test.each([
      [0, 1, 1],
      [7, 1, 8],
      [2, 3, 5],
    ])('increments the cache value for the given key with the given count', (initial, count, expected) => {
      const spyGet = jest.spyOn(driver, 'get').mockReturnValue(initial);
      const spyPut = jest.spyOn(driver, 'put');

      expect(driver.increment('foo', count)).toBe(expected);
      expect(spyGet).toHaveBeenCalledWith('foo', 0);
      expect(spyPut).toHaveBeenCalledWith('foo', expected);

      spyGet.mockRestore();
      spyPut.mockRestore();
    });
  });

  describe('remember', () => {
    test('caches the callback value if key does not exist', () => {
      const spyGet = jest.spyOn(driver, 'get').mockReturnValue(null);
      const spyPut = jest.spyOn(driver, 'put');

      const callback = jest.fn().mockReturnValue('bar');

      const actual = driver.remember('foo', callback);

      expect(actual).toBe('bar');
      expect(spyGet).toHaveBeenCalledWith('foo');
      expect(spyPut).toHaveBeenCalledWith('foo', 'bar', null);
      expect(callback).toHaveBeenCalled();

      spyGet.mockRestore();
      spyPut.mockRestore();
    });

    test('caches the callback value when result is a "Promise" if key does not exist', async () => {
      const spyGet = jest.spyOn(driver, 'get').mockReturnValue(null);
      const spyPut = jest.spyOn(driver, 'put');

      const callback = jest.fn().mockResolvedValue('bar');

      const actual = await driver.remember('foo', callback);

      expect(actual).toBe('bar');
      expect(spyGet).toHaveBeenCalledWith('foo');
      expect(spyPut).toHaveBeenCalledWith('foo', 'bar', null);
      expect(callback).toHaveBeenCalled();

      spyGet.mockRestore();
      spyPut.mockRestore();
    });
  });

  describe('sanatizeKey', () => {
    test.each([
      ['foo', 'foo'],
      [10, '10']
    ])('converts the given key to a string value', (value, expected) => {
      // @ts-ignore
      expect(driver.sanatiseKey(value)).toBe(expected);
    });
  });
});
