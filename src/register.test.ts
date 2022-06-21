/* eslint-disable @typescript-eslint/ban-ts-comment */
import PlainObjectDriver from './drivers/plain-object';
import register from './register';

describe('register', () => {
  afterEach(jest.resetModules);

  test('returns a function that allows you to access a cache driver by key', () => {
    const cache = register({
      foo: new PlainObjectDriver(),
      bar: new PlainObjectDriver(),
    }, 'foo');

    expect(cache).toBeInstanceOf(Function);
  });

  test('returns the cache driver for the given key', () => {
    const drivers = {
      foo: new PlainObjectDriver(),
      bar: new PlainObjectDriver(),
    };

    const cache = register(drivers, 'foo');
    const actual = cache('bar');

    expect(actual).toBe(drivers.bar);
  });

  test('returns the fallback cache driver if no key is provided', () => {
    const drivers = {
      foo: new PlainObjectDriver(),
      bar: new PlainObjectDriver(),
    };

    const cache = register(drivers, 'bar');
    const actual = cache();

    expect(actual).toBe(drivers.bar);
  });

  test('throws an error if no cache driver is found for the given key', () => {
    const drivers = {
      foo: new PlainObjectDriver(),
      bar: new PlainObjectDriver(),
    };

    const cache = register(drivers, 'bar');

    // @ts-ignore
    expect(() => cache('fail')).toThrow();
  });
});
