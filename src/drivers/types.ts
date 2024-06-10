export interface Cached {
  expires: Date | null,
  key: string,
  value: any,
}

export interface Transformer<Input, Output> {
  deserialize: (value: Output) => Input,
  serialize: (value: Input) => Output,
}

export interface Config {
  /**
   * Cache key prefix.
   */
  prefix: string,
  /**
   * Intercept and serialize/deserialize cache items.
   */
  transformer: Transformer<any, any>,
  /**
   * Default number of seconds to cache for.
   */
  ttl: number | (() => Date) | null,
}

export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>;

export type Promisable<T> = Promise<T> | T;
