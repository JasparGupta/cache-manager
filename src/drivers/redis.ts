import type { createClient } from 'redis';
import CacheDriver from './driver';

export default class RedisDriver<Client extends ReturnType<typeof createClient>> extends CacheDriver<Client> {
  private connected = false;

  private timer?: number;

  constructor(client: Client) {
    super();

    this.store = client;

    this.store.on('end', () => {
      this.connected = false;
    });

    this.store.on('error', () => {
      this.connected = false;
    });
  }

  public async decrement(key: string, count = 1): Promise<number> {
    return this.connect(() => {
      return count > 1 ? this.store.decrBy(key, count) : this.store.decr(key);
    });
  }

  public async flush(): Promise<void> {
    await this.connect(() => this.store.flushAll());
  }

  public async get<T = any>(key: string | number, fallback: T | null = null): Promise<T | null> {
    const sanatisedKey = this.sanatiseKey(key);

    return this.connect(async () => {
      if (await this.has(sanatisedKey)) {
        const cache = await this.store.get(sanatisedKey);

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
      const response = await this.api().mGet(keys.map(this.sanatiseKey));

      return response.length > 0
        ? response
          .filter((item): item is string => item !== null)
          .map(item => JSON.parse(item))
        : fallback;
    });
  }

  public async has(key: string | number): Promise<boolean> {
    return !!(await this.connect(() => this.store.exists(this.sanatiseKey(key))));
  }

  public async increment(key: string, count = 1): Promise<number> {
    return this.connect(() => {
      return count > 1 ? this.store.incrBy(key, count) : this.store.incr(key);
    });
  }

  public async put<T = any>(key: string | number, value: T, date: Date | null = null): Promise<T> {
    const sanatisedKey = this.sanatiseKey(key);

    return this.connect(async () => {
      await this.store.set(sanatisedKey, JSON.stringify(value));

      if (date) await this.store.expireAt(sanatisedKey, date.getTime());

      return value;
    });
  }

  public async remember<T = any>(key: string | number, callback: () => T, expires: Date | null = null): Promise<T> {
    const cache = await this.get(key);

    return cache !== null ? cache : this.put(key, await callback(), expires);
  }

  public async remove(key: string | number): Promise<void> {
    await this.connect(() => this.store.del(this.sanatiseKey(key)));
  }

  private async connect<T>(callback: () => T): Promise<T> {
    if (!this.connected) {
      await this.store.connect();
      this.connected = true;
    }

    try {
      return callback();
    } finally {
      clearTimeout(this.timer);

      this.timer = setTimeout(async () => {
        await this.store.disconnect();
      }, 5e3) as unknown as number; // Stupid TypeScript.
    }
  }
}
