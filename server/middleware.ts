import type { IncomingMessage, ServerResponse } from 'node:http';

import { getDashboard, getDashboardSection } from './api';
import { setSecurityHeaders } from './headers';

const getRequestTimeZone = (request: IncomingMessage): string | undefined => {
  const value = request.headers['x-time-zone'];
  return Array.isArray(value) ? value[0] : value;
};

const sendJson = (response: ServerResponse, statusCode: number, payload: unknown): void => {
  response.statusCode = statusCode;
  setSecurityHeaders(response);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(payload));
};

export const handleApiRequest = async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
  const url = new URL(request.url ?? '/', 'http://localhost');

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  if (url.pathname === '/dashboard' || url.pathname === '/api/dashboard') {
    try {
      sendJson(response, 200, await getDashboard(getRequestTimeZone(request)));
    } catch (error) {
      console.error(error);
      sendJson(response, 500, {
        error: 'Dashboard request failed'
      });
    }
    return;
  }

  const sectionMatch = url.pathname.match(/^\/(?:api\/)?dashboard\/([^/]+)$/);
  if (sectionMatch) {
    try {
      const section = await getDashboardSection(sectionMatch[1] ?? '', getRequestTimeZone(request));
      if (!section) {
        sendJson(response, 404, { error: 'Dashboard section not found' });
        return;
      }

      sendJson(response, 200, section);
    } catch (error) {
      console.error(error);
      sendJson(response, 500, {
        error: 'Dashboard section request failed'
      });
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
};
