import nextCookies from 'cookies-next';
import AES from 'crypto-js/aes';
import CacheDriver from '../driver';
import { Cached } from '../types';
import isServer from '../../support/is-server';
import ServerContext from '../types/server-context';
import { CookieValueTypes } from 'cookies-next/lib/types';

const DEFAULT_COOKIE_OPTIONS: CookieValueTypes = {
  domain: ,
  encode: ,
  expires: ,
  sameSite: true,
  secure: true
}

class NextCookieDriver extends CacheDriver<Storage> {
  constructor(protected cookies: typeof nextCookies) {
    super();
  }

  public flush(ctx?: ServerContext): void {
    const cookieNamesToFlush = Object.keys(this.cookies.getCookies(isServer() ? ctx : undefined) ?? {}) ??[];
    cookieNamesToFlush.forEach((cookieNameToFlush) => this.cookies.deleteCookie(cookieNameToFlush));
  }

  public get<T = CookieValueTypes>(key: string, fallback: T | null = null, ctx?: ServerContext): T | null {
    if (this.has(key)) {
      try {
        return this.cookies.getCookie(key, isServer() ? ctx : undefined) as unknown as T;
      } catch (error) {
        return fallback;
      }
    }

    return fallback;
  }

  public has(key: string, ctx?: ServerContext): boolean {
    const cache = this.cookies.hasCookie(key, isServer() ? ctx : undefined);

    return this.cookies.hasCookie(key, isServer() ? ctx : undefined);
  }

  public put<T = any>(key: string, value: T, expires: Date | null = null): T {
    this.store.setItem(key, JSON.stringify({ expires: expires ? expires.getTime() : null, key, value }));

    return value;
  }

  public remove(key: string): void {
    this.store.removeItem(key);
  }

  private expired(item: Cached): boolean {
    if (!item.expires) {
      return false;
    }

    const expired = new Date(item.expires) <= new Date();

    if (expired) this.remove(item.key);

    return expired;
  }
}

export default StorageDriver;
