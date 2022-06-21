import type CacheDriver from './drivers/driver';

type Drivers = Record<string, CacheDriver<any>>;

export default function register({ ...drivers }: Drivers, fallback: keyof typeof drivers) {
  return function cache<Store extends keyof typeof drivers>(store: Store = fallback as Store): typeof drivers[Store] {
    const driver = drivers[store];

    if (!driver) throw new Error(`Cache driver for [${store}] not found`);

    return driver;
  };
}
