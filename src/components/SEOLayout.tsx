import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface SEOLayoutProps {
  children: React.ReactNode;
}

export const SEOLayout: React.FC<SEOLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#070B09] text-zinc-900 dark:text-zinc-100 flex flex-col font-cairo selection:bg-emerald-600 selection:text-white" dir="rtl">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#090E0C]/80 backdrop-blur-md border-b border-[#E2E8E4] dark:border-[#1A2621]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="لوگوی چندبوم"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = './logo.png';
              }}
            />
            <span className="font-brand font-black text-xl text-zinc-900 dark:text-white tracking-wide">
              چندبوم
            </span>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            <Link to="/features" className="text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              امکانات
            </Link>
            <Link to="/pricing" className="text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              تعرفه‌ها
            </Link>
            <Link to="/faq" className="text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              سوالات متداول
            </Link>
            <Link to="/about" className="text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              درباره ما
            </Link>
            <Link to="/contact" className="text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
              تماس با ما
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ورود به سامانه</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>

      {/* Shared Footer */}
      <footer className="border-t border-[#E2E8E4] dark:border-[#1A2621] bg-white dark:bg-[#0A100D] py-10 text-xs text-zinc-500 font-cairo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/logo.png" alt="چندبوم" className="w-6 h-6 object-contain" />
                <span className="font-brand font-bold text-base text-zinc-900 dark:text-white">
                  چندبوم (Chandboom)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mb-3">
                سامانه هوشمند مدیریت مالی شخصی، ثبت خودکار پیامک بانکی، هوش مصنوعی تحلیل بودجه و تقسیم عادلانه دنگ سفر.
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>حفاظت از حریم خصوصی و امنیت داده‌ها</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-200 mb-3 text-xs">صفحات اصلی</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-emerald-500 transition">داشبورد و ورود</Link>
                </li>
                <li>
                  <Link to="/features" className="hover:text-emerald-500 transition">قابلیت‌ها و امکانات</Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-emerald-500 transition">طرح‌ها و قیمت‌گذاری</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-200 mb-3 text-xs">پشتیبانی و راهنما</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/faq" className="hover:text-emerald-500 transition">سوالات متداول (FAQ)</Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-emerald-500 transition">تماس با پشتیبانی</Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-emerald-500 transition">داستان و تیم چندبوم</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-200 mb-3 text-xs">ارتباط با ما</h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                پاسخگویی روزانه از ساعت ۸ الی ۲۲
              </p>
              <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-mono" dir="ltr">
                support@chandboom.ir
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E2E8E4] dark:border-[#1A2621] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-400">
            <span>تمامی حقوق برای سامانه مدیریت مالی «چندبوم» محفوظ است.</span>
            <span className="font-mono" dir="ltr">chandboom.ir © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
