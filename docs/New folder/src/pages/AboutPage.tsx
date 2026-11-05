import React from 'react';
import { SEOLayout } from '../components/SEOLayout';
import { SEOHead } from '../components/SEOHead';
import { ShieldCheck, Heart, Users, Target, Award, Lightbulb, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <SEOLayout>
      <SEOHead
        title="درباره ما | چندبوم - نوآوری در مدیریت مالی هوشمند شخصی"
        description="داستان چندبوم، رسالت ما در ایجاد آرامش و انضباط مالی برای خانواده‌ها و جوانان ایرانی با ابزارهای نوین هوش مصنوعی و امنیت کامل."
        canonicalPath="/about"
      />

      <div className="space-y-12 animate-in fade-in duration-200">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>رسالت و داستان چندبوم</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
            ما مسیر دستیابی به انضباط و آرامش مالی را هموار می‌کنیم
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            «چندبوم» با هدف پر کردن خلاء میان ابزارهای پیچیده حسابداری سنتی و نیازهای واقعی روزمره مردم متولد شد؛
            سامانه‌ای مدرن، امن و هوشمند که زبان پیامک‌های بانکی و دخل‌وخرج ایرانیان را عمیقاً درک می‌کند.
          </p>
        </div>

        {/* Core Principles Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
              حریم خصوصی در اولویت اول
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              ما هیچ‌گاه رمز یا دسترسی بانکی از شما نمی‌خواهیم. حریم شخصی شما خط قرمز ماست و داده‌های مالی شما به هیچ شخص سومی فروخته یا واگذار نمی‌شود.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
              سادگی و قدرت هوش مصنوعی
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              ثبت تراکنش نباید طاقت‌فرسا باشد. با ورودی صوتی، کپی متن پیامک بانکی و دستیار هوشمند، تمام محاسبات در چند ثانیه انجام می‌پذیرد.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
              بومی‌سازی اصیل ایرانی
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              پشتیبانی دقیق از تقویم خورشیدی (شمسی)، واحد تومان، سیستم تقسیم دنگ سفر و سازگاری با فرمت پیامک تمامی بانک‌های شبکه شتاب کشور.
            </p>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            چرا نام «چندبوم»؟
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            در هنر و نقاشی، «بوم» صفحه‌ای سفید برای به تصویر کشیدن ایده‌ها و خلق واقعیت است.
            در زندگی اقتصادی نیز، هر فرد دارای بوم‌های متفاوتی از اهداف، دنگ‌ها، پس‌اندازها و سرمایه‌گذاری‌هاست.
            «چندبوم» بستری است که تمام بوم‌های مالی شما را در یک بستر هماهنگ، زیبا و قابل سنجش کنار هم قرار می‌دهد تا تصویری شفاف از آینده مالی خود ترسیم کنید.
          </p>
        </div>
      </div>
    </SEOLayout>
  );
};
