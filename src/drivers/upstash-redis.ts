import { type Redis } from '@upstash/redis';
import CacheDriver from './driver';
import { Config } from './types';

export default class UpstashRedisDriver<Client extends Redis> extends CacheDriver<Client> {
  constructor(client: Client, config: Partial<Config> = {}) {
    super(client, config);
  }

  public async decrement(key: string, count = 1): Promise<number> {
    const sanatised = this.key(key);

    return count > 1 ? this.store.decrby(sanatised, count) : this.store.decr(sanatised);
  }

  public async flush(): Promise<void> {
    await this.store.flushall();
  }

  public async get<T>(key: string | number): Promise<T | null>;
  public async get<T, U extends T = T>(key: string | number, fallback: T): Promise<U>;
  public async get<T = unknown>(key: string | number, fallback: T = null as T) {
    if (await this.has(key)) {
      const cache = await this.store.get(this.key(key));

      try {
        return JSON.parse(cache as string);
      } catch (error) {
        return cache as unknown as T;
      }
    }

    return fallback;
  }

  public async getMany<T = unknown>(keys: string[] | number[], fallback: T[] = []): Promise<T[]> {
    const response = await this.api().mget(...keys.map(this.key));

    return response.length > 0
      ? response
        .filter((item): item is string => item !== null)
        .map(item => JSON.parse(item))
      : fallback;
  }

  public async has(key: string | number): Promise<boolean> {
    return this.store.exists(this.key(key)).then((res) => !!res);
  }

  public async increment(key: string, count = 1): Promise<number> {
    const sanatised = this.key(key);

    return count > 1 ? this.store.incrby(sanatised, count) : this.store.incr(sanatised);
  }

  public async put<T>(key: string | number, value: T, date: Date | null = null): Promise<T> {
    const sanatised = this.key(key);

    await this.store.set(sanatised, JSON.stringify(value));

    if (date) await this.store.expireat(sanatised, Math.floor(date.getTime() / 1000));

    return value;
  }

  public async remove(key: string | number): Promise<void> {
    await this.store.del(this.key(key));
  }
}
