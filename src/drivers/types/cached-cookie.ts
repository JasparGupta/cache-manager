import Cached from './cached';
import { CookieValueTypes } from 'cookies-next/lib/types';

export default interface CachedCookie extends Cached {
  value: CookieValueTypes;
}
