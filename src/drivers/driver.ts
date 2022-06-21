/* eslint-disable @typescript-eslint/no-explicit-any,class-methods-use-this */
import isPromise from '../support/is-promise';
import { Promisable } from './types';

export default abstract class CacheDriver<Store = any> {
  protected store: Store = null as unknown as Store;

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
  public abstract get<T = any>(key: string | number, fallback?: T): Promisable<T | null>;

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
  public remember<T = any>(key: string | number, callback: () => T, expires: Date | null = null): Promisable<T> {
    const cache = this.get(key);

    if (cache !== null) return cache;

    const value = callback();

    return isPromise(value)
      ? value.then(resolved => this.put(key, resolved, expires)) as Promise<T>
      : this.put(key, value, expires) as T;
  }

  /**
   * Remove an item from the cache.
   */
  public abstract remove(key: string): void;

  protected sanatiseKey(key: string | number): string {
    return typeof key === 'number' ? key.toString() : key;
  }
}
