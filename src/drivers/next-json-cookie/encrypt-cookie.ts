import { CookieValueTypes } from 'cookies-next/lib/types';
import AES from 'crypto-js/aes';

const COOKIE_ENCRYPTION_KEY = process.env.NEXT_PUBLIC_COOKIE_ENCRYPTION_KEY ?? 'COOKIE_ENCRYPTION_KEY';

const encryptCookie = (cookieValue: string): string => {
  return AES.encrypt(cookieValue, COOKIE_ENCRYPTION_KEY).toString();
}

export default encryptCookie;
