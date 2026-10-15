/**
 * Servidor Node.js mínimo (sin dependencias) para publicar la versión compilada en `dist/`.
 * Uso: `npm start` (compila y sirve) o `npm run serve` (solo sirve). Puerto: PORT o 3000.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 3000);
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error('No se encontró dist/index.html. Ejecutá primero: npm run build');
  process.exit(1);
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const safe = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
  let file = join(ROOT, safe);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) file = join(ROOT, 'index.html');
  const type = TYPES[extname(file)] ?? 'application/octet-stream';
  const cache = file.includes(`${join(ROOT, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`El costo del equilibrio está disponible en http://localhost:${PORT}`);
});
