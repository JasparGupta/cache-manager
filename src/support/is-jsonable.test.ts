/* eslint-disable @typescript-eslint/no-explicit-any */
import isJsonable from './is-jsonable';

describe('isJsonable', () => {
  test.each<[any, boolean]>([
    ['foo', false],
    [1, true],
    ['{}', true],
    ['[]', false],
    [true, true],
    [null, true],
    [undefined, false],
  ])('determines whether given value is a json parseable', (value, expected) => {
    expect(isJsonable(value)).toBe(expected);
  });
});
