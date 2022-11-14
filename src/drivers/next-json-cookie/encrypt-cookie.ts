import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import JSONValue from '../types/json';
import isJsonable from '../../support/is-jsonable';

const COOKIE_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_COOKIE_ENCRYPTION_KEY ?? 'COOKIE_ENCRYPTION_KEY';

export const encryptCookie = <T = JSONValue>(value: T, crypto?: typeof AES, encoder?: typeof Utf8): string => {
  console.log(`encryptCookie 1 --> ${value}`);
  const valueToEncrypt = (typeof value === 'string') ? value : JSON.stringify(value);
  console.log(`encryptCookie 1 --> ${valueToEncrypt}`);
  if (!crypto || !encoder) return valueToEncrypt;
  return crypto.encrypt(valueToEncrypt, COOKIE_ENCRYPTION_KEY).toString();
}
export const decryptCookie = <T = JSONValue>(value: string, crypto?: typeof AES, encoder?: typeof Utf8): T => {
  console.log(`decryptCookie 1 --> ${value}`);
  const valueToDecrypt = isJsonable<T>(value) ? JSON.parse(value) : value;
  console.log(`decryptCookie 2 --> ${valueToDecrypt}`);
  if (!crypto || !encoder) return valueToDecrypt;
  console.log(`decryptCookie 3 --> ${valueToDecrypt} ${COOKIE_ENCRYPTION_KEY}`);
  const bytes = crypto.decrypt(valueToDecrypt, COOKIE_ENCRYPTION_KEY);
  console.log(`decryptCookie 4 --> ${bytes}`);
  const foo = bytes.toString(encoder);
  console.log(`decryptCookie 5 --> ${foo}`);
  const result = JSON.parse(foo ?? '{}');
  console.log(`decryptCookie 6 --> ${result}`);
  return result;
}
