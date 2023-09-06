import valueOf from './value-of';

describe('valueOf', () => {
  test.each([
    'foo',
    () => 'foo'
  ])('%# returns the given value', (value) => {
    expect(valueOf(value)).toBe('foo');
  });
});
