import CacheDriver from './driver';
import { Cached, Config } from './types';

export default class PlainObjectDriver extends CacheDriver<Record<string, Cached>> {
  constructor(store: Record<string, Cached> = {}, config: Partial<Config> = {}) {
    super(store, config);
  }

  public flush(): void {
    this.store = {};
  }

  public get<T>(key: string): T | null;
  public get<T, U extends T = T>(key: string, fallback: T): U;
  public get<T>(key: string, fallback: T = null as unknown as T) {
    return this.has(key) ? this.store[this.key(key)].value : fallback;
  }

  public has(key: string): boolean {
    const sanatised = this.key(key);

    return !!this.store[sanatised] && !this.expired(this.store[sanatised]);
  }

  public put<T>(key: string, value: T, expires: Date | null = this.config.ttl): T {
    this.store[this.key(key)] = { expires, key, value };

    return value;
  }

  public remove(key: string): void {
    delete this.store[this.key(key)];
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
