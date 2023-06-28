/* eslint-disable @typescript-eslint/no-explicit-any,class-methods-use-this */
import isPromise from '../support/is-promise';
import { Config, Promisable } from './types';

export default abstract class CacheDriver<Store = any> {
  protected config: Config;

  protected store: Store;

  constructor(store: Store = null as unknown as Store, config: Partial<Config> = {}, prefix: string = '') {
    this.store = store;
    this.config = {
      prefix,
      ...config,
    };
  }

  /**
   * Return underlying cache API.
   */
  public api(): Store {
    return this.store;
  }

  /**
   * Decrement cache item value. Sets cache to "0" and then decrements if no cache exists.
   */
  public decrement(key: string, count = 1): Promisable<number> {
    const cache = this.get(key, 0) as number;

    return this.put(key, cache - count);
  }

  /**
   * Remove all keys from cache store.
   */
  public abstract flush(): void;

  /**
   * Get item from cache.
   */
  public abstract get<T>(key: string | number): Promisable<T | null>;
  public abstract get<T, U extends T = T>(key: string | number, fallback: T): Promisable<U>;

  /**
   * Return whether item exists in the cache.
   */
  public has(key: string | number): Promisable<boolean> {
    const item = this.get(key);

    return isPromise(item)
      ? item.then(resolved => resolved !== null)
      : item !== null;
  }

  /**
   * Increment cache item value. Sets cache to "0" and then increments if no cache exists.
   */
  public increment(key: string, count = 1): Promisable<number> {
    const cache = this.get(key, 0) as number;

    return this.put(key, cache + count);
  }

  /**
   * Put an item in the cache.
   * Optionally set cache expires at timestamp.
   */
  public abstract put<T = any>(key: string | number, value: T, expires?: Date | null): Promisable<T>;

  /**
   * Callback return-type should be a JSON stringify-able value.
   */
  public remember<T = unknown>(key: string | number, callback: () => T, expires: Date | null = null): Promisable<T> {
    const cache = this.get<T>(key);

    const handle = (result: T | null): Promisable<T> => {
      if (result !== null) return result;

      const value = callback();

      return isPromise(value)
        ? value.then(resolved => this.put(key, resolved, expires))
        : this.put(key, value, expires);
    };

    return isPromise(cache) ? cache.then(handle) : handle(cache);
  }

  /**
   * Remove an item from the cache.
   */
  public abstract remove(key: string): void;

  protected key(key: string | number): string {
    if (!this.config.prefix) {
      return key.toString();
    }

    return /[a-z0-9]$/i.test(this.config.prefix)
      ? `${this.config.prefix}.${key}`
      : this.config.prefix + key.toString();
  }
}
