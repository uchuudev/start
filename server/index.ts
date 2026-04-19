import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

import { setSecurityHeaders } from './headers';
import { handleApiRequest } from './middleware';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const root = path.resolve(import.meta.dirname, '../dist');

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

const sendStatic = async (urlPath: string, response: import('node:http').ServerResponse): Promise<void> => {
  let decodedPath = '/';
  try {
    decodedPath = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  } catch {
    response.statusCode = 400;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.end('Bad request.');
    return;
  }

  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const candidate = path.normalize(path.join(root, requestedPath));
  const relativePath = path.relative(root, candidate);
  const isInsideRoot = relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  const safePath = isInsideRoot ? candidate : path.join(root, 'index.html');

  const filePath = await stat(safePath)
    .then((details) => (details.isFile() ? safePath : path.join(root, 'index.html')))
    .catch(() => path.join(root, 'index.html'));
  const extension = path.extname(filePath);

  response.statusCode = 200;
  response.setHeader('Content-Type', contentTypes[extension] ?? 'application/octet-stream');
  if (filePath !== path.join(root, 'index.html')) {
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }

  createReadStream(filePath).pipe(response);
};

const server = createServer((request, response) => {
  setSecurityHeaders(response);

  if (request.url?.startsWith('/api')) {
    void handleApiRequest(request, response);
    return;
  }

  void sendStatic(request.url ?? '/', response);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Start dashboard listening on http://0.0.0.0:${port}`);
});
