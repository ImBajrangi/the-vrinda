import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Dynamic SSR & SEO Dev Middleware
 * Intercepts search bot requests and ?ssr=1/?seo=1 queries during development
 * to render real-time SSR HTML and dynamic JSON-LD Schema on demand.
 */
function dynamicSsrPlugin(): Plugin {
  return {
    name: 'dynamic-ssr-seo',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '/';
        // Only intercept HTML navigation requests (skip static files, assets, @vite, etc.)
        if (
          req.method !== 'GET' ||
          url.startsWith('/@') ||
          url.startsWith('/src/') ||
          url.startsWith('/node_modules/') ||
          /\.(js|jsx|ts|tsx|css|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|json|xml|txt)$/.test(url.split('?')[0])
        ) {
          return next();
        }

        const userAgent = req.headers['user-agent'] || '';
        const isBot = /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|twitterbot|facebookexternalhit|facebot|whatsapp|telegrambot|linkedinbot|slackbot|discordbot|bot|crawler|spider/i.test(userAgent);
        const hasSsrParam = url.includes('ssr=1') || url.includes('bot=1') || url.includes('seo=1');

        if (isBot || hasSsrParam) {
          try {
            const rawTemplate = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
            const template = await server.transformIndexHtml(url, rawTemplate);
            const { render } = await server.ssrLoadModule('/src/entry-server.tsx');
            const { html, seo } = render(url);

            let rendered = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
            const startMarker = '<!-- SSR_HEAD_START -->';
            const endMarker = '<!-- SSR_HEAD_END -->';
            const startIndex = rendered.indexOf(startMarker);
            const endIndex = rendered.indexOf(endMarker);

            if (startIndex !== -1 && endIndex !== -1 && seo?.htmlHead) {
              rendered =
                rendered.substring(0, startIndex) +
                startMarker +
                '\n    ' +
                seo.htmlHead +
                '\n    ' +
                rendered.substring(endIndex);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('X-Render-Mode', isBot ? 'vite-dynamic-ssr-bot' : 'vite-dynamic-ssr-preview');
            res.end(rendered);
            return;
          } catch (e) {
            console.error('Vite Dynamic SSR error:', e);
            return next();
          }
        }

        return next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dynamicSsrPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
