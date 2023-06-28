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
  public get<T>(key: string, fallback: T = null as unknown as T) {
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
  * Remove older items based on a key prefix.
  */
  public popByPrefix(keyPrefix: string, count: number): number {
    console.log(`popByPrefix keyPrefix ${keyPrefix} count ${count}`);
    console.log(`popByPrefix keyPrefix ${keyPrefix} count ${count}`);
    const entries = Object
    .entries(this.store);
    console.log(`popByPrefix entries ${JSON.stringify(entries)}`);
    const byExpire = entries.filter(([_key, item]) => !!item.expires);
    console.log(`popByPrefix byExpire ${JSON.stringify(byExpire)}`);
    const byStarts = entries.filter(([key]) => key.startsWith(keyPrefix));
    console.log(`popByPrefix byStarts ${JSON.stringify(byStarts)}`);
    const bySlice = entries.slice(0, count);
    console.log(`popByPrefix bySlice ${JSON.stringify(bySlice)}`);
    return Object
      .entries(this.store)
      .filter(([_key, item]) => !!item.expires)
      .filter(([key]) => key.startsWith(keyPrefix))
      .sort(([_keyA, itemA], [_keyB, itemB]) => itemA.expires - itemB.expires)
      .slice(0, count)
      .reduce((popped, [key]) => {
        console.log(`keyPrefix ${keyPrefix}`)
        try {
          /**
           * As we are iterating through all the entries of localStorage we know that
           * if `this.has()` returns false it is because the item has expired.
           */
          if (!this.has(key)) {
            return popped + 1;
          }
        } catch (e) {
          // Noop.
        }

        return popped;
      }, 0);
  }

  /**
   * Remove expired cache items.
   */
  public prune(): number {
    return Object.entries(this.store).reduce((pruned, [key]) => {
      /**
       * The underlying logic performs a JSON.parse(), unless a prefix has been provided this will iterate
       * over and prune all local/session storage items whether cached via the cache manager or not.
       * So wrapping in try/catch just in case we encounter a non JSON parsable value.
       */
      try {
        /**
         * As we are iterating through all the entries of localStorage we know that
         * if `this.has()` returns false it is because the item has expired.
         */
        if (!this.has(key.slice(this.key('').length))) {
          return pruned + 1;
        }
      } catch (e) {
        // Noop.
      }

      return pruned;
    }, 0);
  }

  public remove(key: string): void {
    this.store.removeItem(this.key(key));
  }

  /**
   * Determines if the given cache item has expired.
   * If it has expired it removes the cache item from storage.
   */
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
