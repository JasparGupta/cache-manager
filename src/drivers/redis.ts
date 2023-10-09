import { ClientClosedError, type createClient } from 'redis';
import CacheDriver from './driver';
import { Config } from './types';
import valueOf from '../support/value-of';

export default class RedisDriver<Client extends ReturnType<typeof createClient>> extends CacheDriver<Client> {
  private timer?: NodeJS.Timer;

  constructor(client: Client, config: Partial<Config> = {}) {
    super(client, config);
  }

  public async decrement(key: string, count = 1): Promise<number> {
    return this.connect(() => {
      const sanatised = this.key(key);

      return count > 1 ? this.store.decrBy(sanatised, count) : this.store.decr(sanatised);
    });
  }

  public async flush(): Promise<void> {
    await this.connect(() => this.store.flushAll());
  }

  public async get<T>(key: string | number): Promise<T | null>;
  public async get<T, U extends T = T>(key: string | number, fallback: T): Promise<U>;
  public async get<T, U extends T = T>(key: string | number, fallback: () => T): Promise<U>;
  public async get<T>(key: string | number, fallback: T = null as unknown as T) {
    return this.connect(async () => {
      if (await this.has(key)) {
        const cache = await this.store.get(this.key(key));

        try {
          return JSON.parse(cache!);
        } catch (error) {
          return cache;
        }
      }

      return valueOf(fallback);
    });
  }

  public async getMany<T = any>(keys: string[] | number[], fallback: T[] = []): Promise<T[]> {
    return this.connect(async () => {
      const response = await this.api().mGet(keys.map(this.key));

      return response.length > 0
        ? response
          .filter((item): item is string => item !== null)
          .map(item => JSON.parse(item))
        : fallback;
    });
  }

  public async has(key: string | number): Promise<boolean> {
    return !!(await this.connect(() => this.store.exists(this.key(key))));
  }

  public async increment(key: string, count = 1): Promise<number> {
    return this.connect(() => {
      const sanatised = this.key(key);

      return count > 1 ? this.store.incrBy(sanatised, count) : this.store.incr(sanatised);
    });
  }

  public async put<T>(key: string | number, value: T, expires: Date | null = null): Promise<T> {
    return this.connect(async () => {
      void await this.store.set(
        this.key(key),
        JSON.stringify(value),
        expires ? { PXAT: this.expires(expires).getTime() } : {}
      );

      return value;
    });
  }

  public async remove(key: string | number): Promise<void> {
    await this.connect(() => this.store.del(this.key(key)));
  }

  private async connect<T>(callback: () => T): Promise<T> {
    clearTimeout(this.timer);

    if (!this.store.isOpen) {
      void await this.store.connect();
    }

    const result = await callback();

    this.initDisconnect();

    return result;
  }

  private initDisconnect() {
    this.timer = setTimeout(() => {
      if (this.store.isOpen) {
        try {
          this.store.quit();
        } catch (e) {
          if (e instanceof ClientClosedError) return;

          throw e;
        }
      }
    }, 5e3);
  }
}
