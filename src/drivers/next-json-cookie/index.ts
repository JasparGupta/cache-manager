import nextCookies from 'cookies-next';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import CacheDriver from '../driver';
import { CookieValueTypes, OptionsType } from 'cookies-next/lib/types';
import DEFAULT_COOKIE_OPTIONS from './default-cookie-options';
import { decryptCookie, encryptCookie } from './encrypt-cookie';
import JSONValue from '../types/json';

class NextCookieDriver<TmpCookiesObj> extends CacheDriver<typeof nextCookies> {

  #crypto?: typeof AES;
  #encoder?: typeof Utf8;

  constructor(protected store: typeof nextCookies, crypto?: typeof AES, encoder?: typeof Utf8) {
    super();
    this.#crypto = crypto;
    this.#encoder = encoder;
  }

  public flush(options?: OptionsType): void {
    const cookieNamesToFlush = Object.keys(this.store.getCookies(options) ?? {}) ??[];
    cookieNamesToFlush.forEach((cookieNameToFlush) => this.store.deleteCookie(cookieNameToFlush));
  }

  public get<T = JSONValue>(key: string, fallback: T | null = null, options?: OptionsType): T | null {
    if (this.has(key)) {
      try {
        const cookieValue = this.store.getCookie(key, options) as string;
        return decryptCookie(cookieValue, this.#crypto, this.#encoder) as unknown as T;
      } catch (error) {
        return fallback;
      }
    }

    return fallback;
  }

  public getAll<T = JSONValue>() {
    return Object.entries(this.store.getCookies()).reduce((cookies, [name, value]) => {
      return { ...cookies, [name]: decryptCookie(value) };
    }, {});
  }

  public has(key: string, options?: OptionsType): boolean {
    return this.store.hasCookie(key, options);
  }

  public put<T = CookieValueTypes>(key: string, value: T, expires?: Date | null, options?: OptionsType): T {
    const cookieValue = encryptCookie(value, this.#crypto, this.#encoder);
    this.store.setCookie(key,cookieValue, expires
      ? { ...DEFAULT_COOKIE_OPTIONS, ...options, expires  }
      : { ...DEFAULT_COOKIE_OPTIONS, ...options }
    );
    return value;
  }

  public remove(key: string): void {
    this.store.deleteCookie(key);
  }

}

export default NextCookieDriver;
