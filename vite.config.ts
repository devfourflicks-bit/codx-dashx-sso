import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'serve-tmp-frontend',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url) {
              const parsedUrl = req.url.split('?')[0];
              
              // 1. Redirect "/tmp_frontend" to "/tmp_frontend/"
              if (parsedUrl === '/tmp_frontend') {
                const query = req.url.split('?')[1] ? '?' + req.url.split('?')[1] : '';
                res.writeHead(302, { Location: '/tmp_frontend/' + query });
                res.end();
                return;
              }

              // Serve configuration files as raw text/json to prevent Vite from compiling them as client modules when fetched
              if (parsedUrl === '/vite.config.ts' || parsedUrl === '/package.json' || parsedUrl === '/tsconfig.json') {
                const filePath = path.join(__dirname, parsedUrl.slice(1));
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                  const ext = path.extname(filePath);
                  const contentType = ext === '.json' ? 'application/json' : 'text/plain';
                  res.writeHead(200, {
                    'Content-Type': contentType + '; charset=utf-8',
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                  });
                  fs.createReadStream(filePath).pipe(res);
                  return;
                }
              }
              
              // 2. Serve files under "/tmp_frontend/"
              if (parsedUrl.startsWith('/tmp_frontend/')) {
                let cleanUrl = parsedUrl;
                if (cleanUrl === '/tmp_frontend/') {
                  cleanUrl = '/tmp_frontend/index.html';
                }
                const filePath = path.join(__dirname, cleanUrl);
                if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                  const ext = path.extname(filePath);
                  let contentType = 'text/plain';
                  if (ext === '.html') contentType = 'text/html';
                  else if (ext === '.js') contentType = 'application/javascript';
                  else if (ext === '.css') contentType = 'text/css';
                  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                  else if (ext === '.png') contentType = 'image/png';
                  else if (ext === '.svg') contentType = 'image/svg+xml';
                  else if (ext === '.json') contentType = 'application/json';
                  
                  res.writeHead(200, {
                    'Content-Type': contentType,
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                  });
                  fs.createReadStream(filePath).pipe(res);
                  return;
                }
              }
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
