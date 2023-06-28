import JSONValue from '../drivers/types/json';

const isJsonable = <T>(value?: JSONValue | null | T) => {
  if (typeof value === 'number') return true;
  if (typeof value === 'object') return true;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'undefined') return false;
  return (typeof value === 'string') && /^{(([a-zA-Z0-9]+:[a-zA-Z0-9]+)(,[a-zA-Z0-9]+:[a-zA-Z0-9]+)*)?}$/.test(value);
}
export default isJsonable;
