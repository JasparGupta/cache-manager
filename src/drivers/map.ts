import { Cached } from './types';
import CacheDriver from './driver';

export default class MapDriver extends CacheDriver<Map<string, Cached>> {
  constructor(protected store: Map<string, Cached> = new Map()) {
    super();
  }

  public flush(): void {
    this.store.clear();
  }

  public get<T>(key: string, fallback: T | null = null): T | null {
    const cached = this.store.get(key);

    if (!cached) return fallback;

    const { expires, value } = cached;

    if (expires && expires <= new Date()) return fallback;

    return value;
  }

  public put<T>(key: string, value: T, expires: Date | null = null): T {
    this.store.set(key, { expires, key, value });

    return value;
  }

  public remove(key: string): void {
    this.store.delete(key);
  }
}
