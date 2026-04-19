import type { ServerResponse } from 'node:http';

export const setSecurityHeaders = (response: ServerResponse): void => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
};
