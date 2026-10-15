import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // بارگذاری متغیرهای محیطی
  const env = loadEnv(mode, process.cwd(), '');

  // ترکیب متغیرهای محیطی لود شده با متغیرهای تزریق شده توسط گیت‌هاب اکشنز (process.env)
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

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
      // تزریق مستقیم مقادیر خوانده شده از گیت‌هاب سکرتز به داخل import.meta.env در زمان بیلد
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      sourcemap: process.env.VITE_ENABLE_SOURCEMAP === 'true' || process.env.NODE_ENV === 'development',
      minify: process.env.VITE_DISABLE_MINIFY === 'true' ? false : ('esbuild' as const),
    },
  };
});