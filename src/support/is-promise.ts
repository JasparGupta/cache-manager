/* eslint-disable @typescript-eslint/no-explicit-any */
export default function isPromise<T = any>(value: any): value is Promise<T> {
  return !!value && typeof value === 'object' && 'then' in value && typeof value.then === 'function';
}
