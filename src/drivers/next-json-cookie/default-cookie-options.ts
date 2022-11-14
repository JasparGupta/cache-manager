import { CookieSerializeOptions } from 'cookie';

const DEFAULT_COOKIE_OPTIONS: CookieSerializeOptions = {
  ...(process.env.NEXT_PUBLIC_COOKIE_DOMAIN ? { domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN } : { }),
  expires: new Date(4102444799000), // Thu 31 Dec 2099 23:59:59
  sameSite: true,
  ...(process.env.NEXT_PUBLIC_COOKIE_DOMAIN ? { secure: true } : { }),
}

export default DEFAULT_COOKIE_OPTIONS;
