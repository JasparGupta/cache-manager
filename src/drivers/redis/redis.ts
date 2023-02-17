import { ClientClosedError } from '@redis/client/dist/lib/errors';
import type { createClient } from 'redis';
import CacheDriver from '../driver';
import { Config } from './types';

type RedisInstance = ReturnType<typeof createClient>;

export default class RedisDriver<Client extends RedisInstance> extends CacheDriver<Client, Config> {
  constructor(client: Client, config: Partial<Config> = {}) {
    super(client, { keepAlive: false, ...config });
  }

  public async decrement(key: string, count = 1): Promise<number> {
    return this.connect(() => {
      const sanatised = this.key(key);

      return count > 1 ? this.store.decrBy(sanatised, count) : this.store.decr(sanatised);
    });
  }

  public async disconnect(): Promise<void> {
    try {
      return await this.store.quit();
    } catch (e) {
      if (!(e instanceof ClientClosedError)) {
        throw e;
      }
    }
  }

  public async flush(): Promise<void> {
    await this.connect(() => this.store.flushAll());
  }

  public async get<T = any>(key: string | number, fallback: T | null = null): Promise<T | null> {
    return this.connect(async () => {
      if (await this.has(key)) {
        const cache = await this.store.get(this.key(key));

        try {
          return JSON.parse(cache!);
        } catch (error) {
          return cache;
        }
      }

      return fallback;
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

  public async put<T = any>(key: string | number, value: T, date: Date | null = null): Promise<T> {
    return this.connect(async () => {
      const sanatised = this.key(key);

      await this.store.set(sanatised, JSON.stringify(value));

      if (date) await this.store.expireAt(sanatised, Math.floor(date.getTime() / 1000));

      return value;
    });
  }

  public async remember<T = any>(key: string | number, callback: () => T, expires: Date | null = null): Promise<T> {
    return this.run(async () => {
      const cache = await this.get(key);

      return cache !== null ? cache : this.put(key, await callback(), expires);
    });
  }

  public async remove(key: string | number): Promise<void> {
    await this.connect(() => this.store.del(this.key(key)));
  }

  public async run<T>(callback: () => T): Promise<T> {
    this.config.keepAlive = true;

    try {
      return await this.connect(callback);
    } finally {
      this.config.keepAlive = false;
      void await this.disconnect();
    }
  }

  public setConfig(config: Partial<Config>): this {
    this.config = { ...this.config, ...config };

    return this;
  }

  private async connect<T>(callback: () => T): Promise<T> {
    if (!this.store.isOpen) {
      void await this.store.connect();
    }

    try {
      return await callback();
    } finally {
      /**
       * If keepAlive is true, you must remember to manually close the connection.
       */
      if (!this.config.keepAlive && this.store.isOpen) {
        void await this.disconnect();
      }
    }
  }
}
