import * as nextCookies from 'cookies-next';
import { CookieSerializeOptions } from 'cookie';
import { Config as BaseConfig } from '../types';
import JSONValue from '../types/json';
import CacheDriver from '../driver';
import { OptionsType } from 'cookies-next/lib/types';
import DEFAULT_COOKIE_OPTIONS from './default-cookie-options';
import { decryptCookie, encryptCookie } from './encrypt-cookie';

interface Config extends BaseConfig, CookieSerializeOptions {
  encrypt?: boolean,
  encryptionKey?: string,
}

export default class NextCookieDriver extends CacheDriver<typeof nextCookies> {

  #encrypt: boolean;

  #encryptionKey: string;

  constructor(_store?: null, { encrypt, encryptionKey, ...config }: Partial<Config> = {}) {
    super(nextCookies, { prefix: 'hs', ...config });

    this.#encrypt = encrypt ?? false;
    /**
     * NEXT_PUBLIC_COOKIE_ENCRYPTION_KEY for backwards compatibility.
     * Prefer constructor argument.
     */
    this.#encryptionKey = encryptionKey ?? process.env.NEXT_PUBLIC_COOKIE_ENCRYPTION_KEY ?? '';
  }

  public flush(options?: OptionsType): void {
    Object.keys(this.getAll()).forEach((name) => this.remove(name));
  }

  public get<T = JSONValue>(key: string, fallback: T | null = null, options?: OptionsType): T | null {
    if (this.has(key)) {
      try {
        const cookie = this.store.getCookie(this.key(key), options) as string;

        return this.#encrypt
          ? decryptCookie<T>(cookie, this.#encryptionKey)
          : JSON.parse(cookie);
      } catch (error) {
        return fallback;
      }
    }

    return fallback;
  }

  public getAll(): Record<string, any> {
    return Object.entries(this.store.getCookies()).reduce((cookies, [name, value]) => {
      const cookie = this.config.prefix ? name.substring(this.config.prefix.length + 1) : name;

      return {
        ...cookies,
        [cookie]: this.#encrypt ? decryptCookie<any>(value ?? '', this.#encryptionKey) : value
      };
    }, {});
  }

  public has(key: string, options?: OptionsType): boolean {
    return this.store.hasCookie(this.key(key), options);
  }

  public put<T>(key: string, value: T, expires?: Date | null, options?: OptionsType): T {
    const cookie = this.#encrypt
      ? encryptCookie(value as unknown as JSONValue, this.#encryptionKey)
      : JSON.stringify(value);

    this.store.setCookie(this.key(key), cookie, expires
      ? { ...DEFAULT_COOKIE_OPTIONS, ...this.config, ...options, expires }
      : { ...DEFAULT_COOKIE_OPTIONS, ...this.config, ...options }
    );

    return value;
  }

  public remove(key: string): void {
    this.store.deleteCookie(this.key(key));
  }
}
