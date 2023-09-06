export default function valueOf<T>(value: (() => T) | T): T {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return typeof value === 'function' ? value() : value;
}
