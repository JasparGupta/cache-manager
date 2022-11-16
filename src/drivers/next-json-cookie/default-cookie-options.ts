import { CookieSerializeOptions } from 'cookie';

const DEFAULT_COOKIE_OPTIONS: CookieSerializeOptions = {
  expires: new Date(4102444799000), // Thu 31 Dec 2099 23:59:59
  sameSite: true,
}

export default DEFAULT_COOKIE_OPTIONS;
