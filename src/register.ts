import type CacheDriver from './drivers/driver';

interface Driver<Drivers extends Record<string, CacheDriver>, Fallback extends keyof Drivers> {
  (): Drivers[Fallback],
  <Store extends keyof Drivers>(store: Store): Drivers[Store],
}

export default function register<
  Drivers extends Record<string, CacheDriver>,
  Fallback extends keyof Drivers
>(drivers: Drivers, fallback: Fallback): Driver<Drivers, Fallback> {
  return function cache<Store extends keyof Drivers>(store?: Store) {
    const driver = drivers[store ?? fallback];

    if (!driver) throw new Error(`Cache driver for [${store as string}] not found`);

    return driver;
  };
}
