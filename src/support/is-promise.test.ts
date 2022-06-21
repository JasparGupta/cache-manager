/* eslint-disable @typescript-eslint/no-explicit-any */
import isPromise from './is-promise';

describe('isPromise', () => {
  test.each<[any, boolean]>([
    [null, false],
    [1, false],
    ['foo', false],
    [{}, false],
    [[], false],
    [{ then: '' }, false],
    [{ then: 1 }, false],
    [{ then: jest.fn() }, true],
    [Promise.resolve(), true],
    [new Promise(resolve => resolve('foo')), true],
  ])('determines whether given value is a promise', (value, expected) => {
    expect(isPromise(value)).toBe(expected);
  });
});
