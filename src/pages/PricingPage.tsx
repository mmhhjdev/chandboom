import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOLayout } from '../components/SEOLayout';
import { SEOHead } from '../components/SEOHead';
import { Crown, Check, Sparkles, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatToman } from '../utils/formatters';

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const monthlyPrice = 89000;
  const annualMonthlyEquivalent = 59000;

  return (
    <SEOLayout>
      <SEOHead
        title="تعرفه‌ها و قیمت اشتراک | چندبوم - سامانه مدیریت مالی هوشمند"
        description="پلن‌های کاربری چندبوم: حساب رایگان همیشگی و اشتراک طلایی (Pro) با دستیار نامحدود هوش مصنوعی و تحلیل پیش‌بینی بودجه."
        canonicalPath="/pricing"
      />

      <div className="space-y-12 animate-in fade-in duration-200">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
            <Crown className="w-3.5 h-3.5" />
            <span>تعرفه شفاف و سرمایه‌گذاری برای آینده مالی</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 dark:text-white leading-tight">
            پلن مناسب با نیازهای مالی خود را انتخاب کنید
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            امکان استفاده رایگان برای همیشه، یا ارتقا به اشتراک طلایی برای تسلط کامل با قدرت هوش مصنوعی
          </p>

          {/* Billing switcher */}
          <div className="pt-3 flex items-center justify-center gap-2">
            <div className="p-1 bg-zinc-100 dark:bg-[#14201A] rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26] flex items-center text-xs font-bold">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white dark:bg-[#1C2C24] text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                ماهانه
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-white dark:bg-[#1C2C24] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                <span>سالانه</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500 text-white font-bold">
                  ۳۵٪ تخفیف
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Comparison (Free, Bronze, Pro, VIP) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {/* Free Tier */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">طرح پایه</h2>
                <span className="text-[10px] px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold">
                  رایگان همیشگی
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                مدیریت سنتی تراکنش‌ها بدون دسترسی به هوش مصنوعی
              </p>

              <div className="mb-4">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">۰</span>
                <span className="text-xs text-zinc-500 mr-2">تومان برای همیشه</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>ثبت نامحدود تراکنش‌های درآمد و هزینه</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>دسترسی به نمودارهای پایه تراز مالی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>ایجاد تا ۲ گروه دنگ و ۲ هدف مالی</span>
                </li>
                <li className="flex items-center gap-2 text-rose-500 font-medium">
                  <span>✕ فاقد دسترسی به هوش مصنوعی</span>
                </li>
              </ul>
            </div>

            <Link
              to="/"
              className="w-full py-2.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-xs font-bold text-center transition cursor-pointer"
            >
              استفاده از نسخه رایگان
            </Link>
          </div>

          {/* Bronze Tier */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1713] border border-amber-300 dark:border-amber-700/60 shadow-xs flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">اشتراک برنزی</h2>
                <span className="text-[10px] px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                  اقتصادی
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                شروع تجربه هوش مصنوعی با سهمیه کنترل‌شده و اقتصادی
              </p>

              <div className="mb-4">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">۳۹,۰۰۰</span>
                <span className="text-xs text-zinc-500 mr-2">تومان / ماهانه</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>۲۰ پرسش ماهانه از هوش مصنوعی چندبوم</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>ثبت صوتی تراکنش با هوش مصنوعی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>استخراج پیامک بانکی با هوش مصنوعی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>دنگ گروهی و یادآورهای اقساط نامحدود</span>
                </li>
              </ul>
            </div>

            <Link
              to="/"
              className="w-full py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold text-center border border-amber-300 dark:border-amber-800 transition cursor-pointer"
            >
              انتخاب پلن برنزی
            </Link>
          </div>

          {/* Pro Tier (Golden) */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#18261F] to-[#0D1812] border-2 border-emerald-500/80 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-3 left-3">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-400 text-zinc-950 font-black flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span>محبوب‌ترین</span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-base font-bold text-white">اشتراک طلایی (Pro)</h2>
              </div>
              <p className="text-xs text-emerald-200/70 mb-4">
                دسترسی گسترده به هوش مصنوعی و پیش‌بینی بودجه ۳ ماهه
              </p>

              <div className="mb-4">
                <span className="text-2xl font-black text-white">
                  {billingCycle === 'monthly'
                    ? formatToman(monthlyPrice).replace(' تومان', '')
                    : formatToman(annualMonthlyEquivalent).replace(' تومان', '')}
                </span>
                <span className="text-xs text-emerald-300 mr-2">تومان / ماهانه</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-200">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>سهمیه ۱۰۰ الی ۱۵۰ پرسش هوش مصنوعی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>پیش‌بینی هوشمند بودجه ۳ ماهه و هشدار کسری</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>سپر ضد خرید هیجانی و مشاور اختصاصی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>خروجی اکسل رسمی با تراز حسابداری</span>
                </li>
              </ul>
            </div>

            <Link
              to="/"
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-zinc-950 text-xs font-black text-center transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>خرید اشتراک طلایی پرو</span>
            </Link>
          </div>

          {/* VIP Tier */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#1F1A07] to-[#120F05] border-2 border-amber-500/90 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-3 left-3">
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-950 font-black flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>حداکثر سهمیه</span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-base font-bold text-white">اشتراک ۶ ماهه VIP</h2>
              </div>
              <p className="text-xs text-amber-200/70 mb-4">
                سقف ۵۰۰ پرسش هوش مصنوعی با اولویت تایید فوری
              </p>

              <div className="mb-4">
                <span className="text-2xl font-black text-amber-400">۳۹۰,۰۰۰</span>
                <span className="text-xs text-amber-200/70 mr-2">تومان / ۶ ماهه</span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-200">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>۵۰۰ پرسش ماهانه هوش مصنوعی اختصاصی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>پیش‌بینی جامع ۶ ماهه جریان نقدینگی</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>بیشترین درصد تخفیف دوره‌ای</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>تایید فوری فیش زیر ۵ دقیقه + پشتیبانی VIP</span>
                </li>
              </ul>
            </div>

            <Link
              to="/"
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 text-xs font-black text-center transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>خرید اشتراک VIP</span>
            </Link>
          </div>
        </div>

        {/* Security & Payment Instructions Note */}
        <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] text-xs space-y-2 text-zinc-600 dark:text-zinc-300">
          <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>نحوه پرداخت و تایید حساب</span>
          </div>
          <p className="leading-relaxed">
            پرداخت اشتراک طلایی از طریق انتقال امن کارت‌به‌کارت بانکی شتاب انجام می‌گیرد. پس از واریز، کافی است در داخل سامانه تصویر یا شناسه پیگیری فیش را ثبت فرمایید تا کارشناسان ما در کوتاه‌ترین زمان اشتراک شما را فعال نمایند.
          </p>
        </div>
      </div>
    </SEOLayout>
  );
};
