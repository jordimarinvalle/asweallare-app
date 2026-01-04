// Custom server that proxies to both UI and Admin apps
const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

// Ports
const MAIN_PORT = 3000;
const UI_PORT = 8080;
const ADMIN_PORT = 3001;

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  
  // Route /admin/*, /api/*, and /_next/* (when referred from admin) to Admin app
  if (url.startsWith('/admin')) {
    // Strip /admin prefix for admin routes
    req.url = url.replace(/^\/admin/, '') || '/';
    proxy.web(req, res, { target: `http://127.0.0.1:${ADMIN_PORT}` });
  } else if (url.startsWith('/api')) {
    // API routes go to admin
    proxy.web(req, res, { target: `http://127.0.0.1:${ADMIN_PORT}` });
  } else if (url.startsWith('/_next') || url.startsWith('/__nextjs')) {
    // Next.js assets - check referer to determine which app
    const referer = req.headers.referer || '';
    if (referer.includes('/admin')) {
      proxy.web(req, res, { target: `http://127.0.0.1:${ADMIN_PORT}` });
    } else {
      // Default to UI for /_next requests (UI uses Vite, shouldn't have /_next)
      proxy.web(req, res, { target: `http://127.0.0.1:${ADMIN_PORT}` });
    }
  } else {
    // Everything else goes to UI app
    proxy.web(req, res, { target: `http://127.0.0.1:${UI_PORT}` });
  }
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  const url = req.url || '/';
  
  if (url.startsWith('/admin') || url.startsWith('/api') || url.startsWith('/_next')) {
    proxy.ws(req, socket, head, { target: `http://127.0.0.1:${ADMIN_PORT}` });
  } else {
    proxy.ws(req, socket, head, { target: `http://127.0.0.1:${UI_PORT}` });
  }
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway - Backend service unavailable');
  }
});

server.listen(MAIN_PORT, '0.0.0.0', () => {
  console.log(`
========================================
AS WE ALL ARE - Proxy Server
========================================
Main:    http://localhost:${MAIN_PORT}
UI App:  http://localhost:${MAIN_PORT}/
Admin:   http://localhost:${MAIN_PORT}/admin/
API:     http://localhost:${MAIN_PORT}/api/
========================================
  `);
});
