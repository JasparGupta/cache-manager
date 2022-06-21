import CacheDriver from './driver';
import { Cached } from './types';

export default class PlainObjectDriver extends CacheDriver<Record<string, Cached>> {
  constructor(protected store: Record<string, Cached> = {}) {
    super();
  }

  public flush(): void {
    this.store = {};
  }

  public get<T = any>(key: string, fallback: T | null = null): T | null {
    return this.has(key) ? this.store[key].value : fallback;
  }

  public has(key: string): boolean {
    return !!this.store[key] && !this.expired(this.store[key]);
  }

  public put<T = any>(key: string, value: T, expires: Date | null = null): T {
    this.store[key] = { expires, key, value };

    return value;
  }

  public remove(key: string): void {
    delete this.store[key];
  }

  private expired(item: Cached): boolean {
    if (!item.expires) {
      return false;
    }

    const expired = item.expires <= new Date();

    if (expired) this.remove(item.key);

    return expired;
  }
}
