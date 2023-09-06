import type { createClient } from '@vercel/kv';
import valueOf from '../support/value-of';
import { Config, Promisable } from './types';
import CacheDriver from './driver';

export default class VercelKv<Client extends ReturnType<typeof createClient>> extends CacheDriver<Client> {
  constructor(client: Client, config: Partial<Config> = {}) {
    super(client, config);
  }

  public async flush(): Promise<void> {
    void await this.store.flushall();
  }

  public async get<T>(key: string): Promise<T | null>;
  public async get<T, U extends T = T>(key: string, fallback: T): Promise<U>;
  public async get<T, U extends T = T>(key: string, fallback: () => Promisable<T>): Promise<U>;
  public async get<T>(key: string, fallback: T = null as unknown as T): Promise<T | null> {
    // All values will be a string as we JSON.stringify them before storing.
    const cache = await this.store.get<string>(this.key(key));

    try {
      return cache ? JSON.parse(cache) : valueOf(fallback);
    } catch (e) {
      return valueOf(fallback);
    }
  }

  public async has(key: string): Promise<boolean> {
    return !!(await this.store.exists(this.key(key)));
  }

  public async put<T>(key: string | number, value: T, expires: Date | null = this.config.ttl): Promise<T> {
    void await this.store.set(
      this.key(key),
      JSON.stringify(value),
      expires ? { pxat: expires.getTime() } : {}
    );

    return value;
  }

  public async remove(key: string): Promise<void> {
    void await this.store.del(this.key(key));
  }
}
