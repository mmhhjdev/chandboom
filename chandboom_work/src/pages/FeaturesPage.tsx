import React from 'react';
import { Link } from 'react-router-dom';
import { SEOLayout } from '../components/SEOLayout';
import { SEOHead } from '../components/SEOHead';
import {
  MessageSquareText,
  Bot,
  Users,
  Target,
  BellRing,
  FileSpreadsheet,
  BarChart3,
  Mic,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const FEATURES_LIST = [
  {
    icon: MessageSquareText,
    title: 'ثبت خودکار پیامک بانکی',
    description:
      'تشخیص هوشمند تراکنش‌های پیامکی تمامی بانک‌های شتاب ایران؛ کافیست متن پیامک را کپی کنید تا مبلغ، دسته، تاریخ و نوع به طور خودکار استخراج شود.',
    tag: 'محبوب‌ترین',
  },
  {
    icon: Bot,
    title: 'هوش مصنوعی مشاور و تحلیل بودجه',
    description:
      'پیش‌بینی تراز مالی ۳ ماه آینده، بررسی خریدهای احساسی با سپر ضد خرید تکانه‌ای، و پاسخ به تمامی ابهامات مدیریت مالی با زبان فارسی.',
    tag: 'ویژه پرو',
  },
  {
    icon: Users,
    title: 'محاسبه عادلانه دنگ گروهی',
    description:
      'تقسیم هزینه‌های سفر، مهمانی و مخارج مشترک خانوادگی یا دوستانه با الگوریتم کمینه‌سازی تعداد تراکنش‌های تسویه.',
    tag: 'کاربردی',
  },
  {
    icon: BarChart3,
    title: 'نمودارهای تعاملی و تحلیل تصویری',
    description:
      'نمودارهای زنده مقایسه درآمد در برابر هزینه، روند مخارج روزانه، و تفکیک درصدی دسته‌بندی‌ها با کتابخانه قدرتمند Recharts.',
    tag: 'جدید',
  },
  {
    icon: Target,
    title: 'اهداف مالی و برنامه‌ریزی پس‌انداز',
    description:
      'تعریف هدف خرید خودرو، لپ‌تاپ، یا صندوق اضطراری و رهگیری پیشرفت پله‌پله با واریزهای مرحله‌ای.',
    tag: 'انگیزشی',
  },
  {
    icon: BellRing,
    title: 'یادآور سررسید اقساط و قبوض',
    description:
      'جلوگیری از جریمه دیرکرد با تنظیم یادآورهای دقیق برای موعد چک‌های صیادی، اقساط وام‌های بانکی و شارژ ماهانه ساختمان.',
    tag: 'ضروری',
  },
  {
    icon: Mic,
    title: 'ثبت صوتی تراکنش با گفتار فارسی',
    description:
      'فقط بگویید «خرید میوه ۲۵۰ هزار تومن از کارت اصلی»؛ صدا با مدل هوش مصنوعی پردازش و بدون نیاز به تایپ ثبت می‌شود.',
    tag: 'سریع',
  },
  {
    icon: FileSpreadsheet,
    title: 'خروجی اکسل حرفه‌ای با فرمت ارزی',
    description:
      'دریافت گزارش تفصیلی تراکنش‌ها در قالب فایل اکسل با فرمت ریالی/تومانی، استایل‌بندی رنگی و شیت خلاصه مدیریتی.',
    tag: 'حسابداری',
  },
];

export const FeaturesPage: React.FC = () => {
  return (
    <SEOLayout>
      <SEOHead
        title="امکانات و قابلیت‌ها | چندبوم - سامانه جامع مدیریت مالی شخصی"
        description="بررسی قابلیت‌های پیشرفته چندبوم: استخراج هوشمند پیامک بانکی، هوش مصنوعی، دنگ گروهی، یادآور اقساط و نمودارهای مالی تعاملی."
        canonicalPath="/features"
      />

      <div className="space-y-12 animate-in fade-in duration-200">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ابزارهای مدرن حسابداری شخصی</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
            تمام ابزارهای مورد نیاز برای مهار مخارج در یک بستر
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            امکاناتی که به شما قدرت می‌دهند بدون نیاز به دانش پیچیده حسابداری، کنترل کامل دارایی‌های خود را به دست بگیرید.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {FEATURES_LIST.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] shadow-xs hover:border-emerald-500/40 transition space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-[#182620] text-zinc-600 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-[#20342B]">
                    {feat.tag}
                  </span>
                </div>

                <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                  {feat.title}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-900 to-zinc-900 text-white text-center space-y-4 shadow-xl">
          <h3 className="text-lg sm:text-2xl font-black">
            آماده‌اید دخل‌وخرج خود را متحول کنید؟
          </h3>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-md mx-auto leading-relaxed">
            به جمع هزاران کاربر چندبوم بپیوندید و آرامش مالی را به زندگی اقتصادی خود هدیه دهید.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-lg transition cursor-pointer"
            >
              <span>ورود و شروع رایگان</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </SEOLayout>
  );
};
