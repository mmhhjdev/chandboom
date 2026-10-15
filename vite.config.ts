import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // بارگذاری متغیرهای محیطی سیستم و گیت‌هاب اکشنز
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './',
    plugins: [react(), tailwindcss()],
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
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
      // تزریق قطعی متغیرهای سوپابیس در زمان بیلد برای جلوگیری از خطای URL نامعتبر
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // تنظیمات دیباگ و دسترسی به سورس‌کدها در مرورگر (Debug Mode / Source Code Access)
      sourcemap: process.env.VITE_ENABLE_SOURCEMAP === 'true' || process.env.NODE_ENV === 'development',
      // کنترل مینیفای کدها
      minify: process.env.VITE_DISABLE_MINIFY === 'true' ? false : ('esbuild' as const),
    },
  };
});