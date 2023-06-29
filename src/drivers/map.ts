import { Cached, Config } from './types';
import CacheDriver from './driver';

export default class MapDriver extends CacheDriver<Map<string, Cached>> {
  constructor(store: Map<string, Cached> = new Map(), config: Partial<Config> = {}) {
    super(store, config);
  }

  public flush(): void {
    this.store.clear();
  }

  public get<T>(key: string): T | null;
  public get<T, U extends T = T>(key: string, fallback: T): U;
  public get<T>(key: string, fallback = null as unknown as T) {
    const cached = this.store.get(this.key(key));

    if (!cached) return fallback;

    const { expires, value } = cached;

    if (expires && expires <= new Date()) return fallback;

    return value;
  }

  public put<T>(key: string, value: T, expires: Date | null = null): T {
    this.store.set(this.key(key), { expires, key, value });

    return value;
  }

  public remove(key: string): void {
    this.store.delete(this.key(key));
  }
}
