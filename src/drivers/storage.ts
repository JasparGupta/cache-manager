import CacheDriver from './driver';
import { Cached } from './types';

class StorageDriver extends CacheDriver<Storage> {
  constructor(protected store: Storage) {
    super();
  }

  public flush(): void {
    this.store.clear();
  }

  public get<T>(key: string): T | null;
  public get<T, U extends T = T>(key: string, fallback: T): U;
  public get<T>(key: string, fallback: T = null as T) {
    if (this.has(key)) {
      try {
        const cache = this.store.getItem(this.key(key)) as string;
        const { value } = JSON.parse(cache);

        return value;
      } catch (error) {
        return fallback;
      }
    }

    return fallback;
  }

  public has(key: string): boolean {
    const cache = this.store.getItem(this.key(key));

    return !!cache && !this.expired(JSON.parse(cache));
  }

  public put<T>(key: string, value: T, expires: Date | null = null): T {
    this.store.setItem(this.key(key), JSON.stringify({ expires: expires ? expires.getTime() : null, key, value }));

    return value;
  }

  /**
   * Remove expired cache items.
   */
  public prune(): number {
    return Object.entries(this.store).reduce((pruned, [key]) => {
      /**
       * As we are iterating through all the entries of localStorage we know that
       * if `this.has()` returns false it is because the item has expired.
       */
      if (!this.has(key.slice(this.key('').length))) {
        return pruned + 1;
      }

      return pruned;
    }, 0);
  }

  public remove(key: string): void {
    this.store.removeItem(this.key(key));
  }

  private expired(item: Cached): boolean {
    if (!item.expires) {
      return false;
    }

    const expired = new Date(item.expires) <= new Date();

    if (expired) this.remove(item.key);

    return expired;
  }
}

export default StorageDriver;
