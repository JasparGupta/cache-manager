import { IncomingMessage, ServerResponse } from 'http';

export interface ServerContext  {
  res?: ServerResponse;
  req?: IncomingMessage & {
    cookies?:{ [key: string]: string; } | Partial<{ [key: string]: string}>
  }
}

export default ServerContext;
