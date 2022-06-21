import type CacheDriver from './drivers/driver';

export default function register<Drivers extends Record<string, CacheDriver>>(drivers: Drivers, fallback: keyof Drivers) {
  return function cache<Store extends keyof Drivers>(store: Store = fallback as Store): Drivers[Store] {
    const driver = drivers[store];

    if (!driver) throw new Error(`Cache driver for [${store as string}] not found`);

    return driver;
  };
}
