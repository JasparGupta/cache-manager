import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import JSONValue from '../types/json';
import isJsonable from '../../support/is-jsonable';

const COOKIE_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_COOKIE_ENCRYPTION_KEY ?? 'COOKIE_ENCRYPTION_KEY';

export const encryptCookie = <T = JSONValue>(value: T, crypto?: typeof AES, encoder?: typeof Utf8): string => {
  const valueToEncrypt = (typeof value === 'string') ? value : JSON.stringify(value);
  if (!crypto || !encoder) return valueToEncrypt;
  return crypto.encrypt(valueToEncrypt, COOKIE_ENCRYPTION_KEY).toString();
}
export const decryptCookie = <T = JSONValue>(value: string, crypto?: typeof AES, encoder?: typeof Utf8): T => {
  const valueToDecrypt = isJsonable<T>(value) ? JSON.parse(value) : value;
  if (!crypto || !encoder) return valueToDecrypt;
  const bytes = crypto.decrypt(valueToDecrypt, COOKIE_ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(encoder) ?? '{}');
}
