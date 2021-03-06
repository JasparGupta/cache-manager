import CacheDriver from './driver';
import { Cached } from './types';

class StorageDriver extends CacheDriver<Storage> {
  constructor(protected store: Storage) {
    super();
  }

  public flush(): void {
    this.store.clear();
  }

  public get<T = any>(key: string, fallback: T | null = null): T | null {
    if (this.has(key)) {
      try {
        const cache = this.store.getItem(key) as string;
        const { value } = JSON.parse(cache);

        return value;
      } catch (error) {
        return fallback;
      }
    }

    return fallback;
  }

  public has(key: string): boolean {
    const cache = this.store.getItem(key);

    return !!cache && !this.expired(JSON.parse(cache));
  }

  public put<T = any>(key: string, value: T, expires: Date | null = null): T {
    this.store.setItem(key, JSON.stringify({ expires: expires ? expires.getTime() : null, key, value }));

    return value;
  }

  public remove(key: string): void {
    this.store.removeItem(key);
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
