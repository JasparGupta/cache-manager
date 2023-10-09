export default interface Config {
  /**
   * Cache key prefix.
   */
  prefix: string,
  /**
   * Default number of seconds to cache for.
   */
  ttl: number | (() => Date) | null,
}
