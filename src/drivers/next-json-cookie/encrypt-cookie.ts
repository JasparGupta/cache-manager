import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import JSONValue from '../types/json';

export const encryptCookie = (value: JSONValue, key: string): string => {
  return AES.encrypt(JSON.stringify(value), key).toString();
};

export const decryptCookie = <T = JSONValue>(value: string, key: string): T => {
  const bytes = AES.decrypt(decodeURIComponent(value), key);
  const decrypted = bytes.toString(Utf8);

  return JSON.parse(decrypted);
};
