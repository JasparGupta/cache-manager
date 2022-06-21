/* eslint-disable @typescript-eslint/no-explicit-any */
export default interface Cached {
  expires: Date | null,
  key: string,
  value: any,
}
