import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';


// Content-Security-Policy is injected into the production HTML only. The dev server uses inline
// scripts for React Fast Refresh, which a strict CSP would block.
const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const cspMetaPlugin = (): Plugin => ({
  name: 'chandboom-csp-meta',
  apply: 'build',
  transformIndexHtml(html) {
    return html.replace('<!-- CSP_META -->', `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
  },
});

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss(), cspMetaPlugin()],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve((import.meta as any).dirname || __dirname, '.'),
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        '@google/genai',
        '@supabase/supabase-js',
        'lucide-react',
        'xlsx',
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // تنظیمات دیباگ و دسترسی به سورس‌کدها در مرورگر (Debug Mode / Source Code Access)
      // در حالت توسعه یا در صورت تنظیم VITE_ENABLE_SOURCEMAP=true سورس‌مپ فعال می‌شود تا دسترسی کامل به کدهای اصلی فراهم باشد
      sourcemap: process.env.VITE_ENABLE_SOURCEMAP === 'true' || process.env.NODE_ENV === 'development',
      // کنترل مینیفای کدها: در صورت نیاز به دیباگ دقیق‌تر می‌توانید minifyEnabled را به false تغییر دهید
      minify: process.env.VITE_DISABLE_MINIFY === 'true' ? false : ('esbuild' as const),
    },
  };
});
