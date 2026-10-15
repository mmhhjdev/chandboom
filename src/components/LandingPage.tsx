import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  TrendingUp,
  PieChart,
  Users,
  Bell,
  Lock,
  Star,
  ChevronDown,
  Crown,
  Laptop,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  Check,
  LogIn,
  Mic,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: () => void;
  onOpenSubscription?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenAuth,
  onOpenSubscription,
}) => {
  const { isAuthenticated, openAuthGuard, openSubscriptionModal } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [interactiveInput, setInteractiveInput] = useState('');
  const [demoParsed, setDemoParsed] = useState<{ amount: string; cat: string; desc: string } | null>(null);

  // Sync document attributes for Persian RTL
  useEffect(() => {
    const html = document.documentElement;
    html.lang = 'fa';
    html.dir = 'rtl';
    document.title = 'چندبوم | مدیریت مالی شخصی با هوش مصنوعی پیشرفته';
  }, []);

  const handleSubscriptionClick = () => {
    if (!isAuthenticated) {
      openAuthGuard('برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.');
    } else {
      if (onOpenSubscription) {
        onOpenSubscription();
      } else {
        openSubscriptionModal();
      }
    }
  };

  const handleTestDemoAI = (sampleText?: string) => {
    const text = sampleText || interactiveInput;
    if (!text) return;
    if (text.includes('گوشت') || text.includes('غذا') || text.includes('شام')) {
      setDemoParsed({ amount: '۳۵۰,۰۰۰ تومان', cat: 'خوراک و غذا 🥩', desc: text });
    } else if (text.includes('بنزین') || text.includes('اسنپ') || text.includes('کرایه')) {
      setDemoParsed({ amount: '۸۵,۰۰۰ تومان', cat: 'حمل و نقل 🚗', desc: text });
    } else {
      setDemoParsed({ amount: '۱۲۰,۰۰۰ تومان', cat: 'خرید روزمره 🛍️', desc: text });
    }
  };

  const isRtl = true;
  const ArrowIcon = ArrowLeft;

  return (
    <div
      className={`min-h-screen bg-[#070B09] text-zinc-100 selection:bg-emerald-500 selection:text-black overflow-x-hidden ${
        isRtl ? 'font-cairo' : 'font-inter'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 md:w-[600px] h-96 md:h-[600px] bg-emerald-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-80 md:w-[500px] h-80 md:h-[500px] bg-amber-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-20 left-1/4 w-96 md:w-[600px] h-96 md:h-[600px] bg-teal-500/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      </div>

      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#070B09]/85 border-b border-emerald-950/60 transition-all font-cairo w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-4 flex-nowrap w-full">
          {/* Logo with Bahman Font */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-800 p-0.5 shadow-lg shadow-emerald-950/50 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#090F0C] rounded-[10px] sm:rounded-[14px] flex items-center justify-center overflow-hidden">
                <img
                  src="./logo.png"
                  alt={isRtl ? 'لوگوی رسمی چندبوم' : 'Chandboom Official Logo'}
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = './assets/logo.png';
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-brand text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                {isRtl ? 'چندبوم' : 'Chandboom'}
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 inline-block animate-pulse shrink-0" />
              </span>
              <span className="hidden md:block text-[10px] font-bold text-emerald-400 tracking-wider uppercase whitespace-nowrap">
                {isRtl ? 'سامانه هوشمند مالی و بودجه' : 'AI Financial Operating System'}
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-sm font-semibold text-zinc-300">
            <a
              href="#features"
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              {isRtl ? 'امکانات هوشمند' : 'Features'}
            </a>
            <a
              href="#mockup"
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              {isRtl ? 'پیش‌نمایش اپ' : 'Preview'}
            </a>
            <a
              href="#pricing"
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              {isRtl ? 'تعرفه‌ها' : 'Pricing'}
            </a>
            <a
              href="#faq"
              className="hover:text-emerald-400 transition-colors cursor-pointer py-1"
            >
              {isRtl ? 'پرسش‌های متداول' : 'FAQ'}
            </a>
          </nav>

          {/* Left Action Buttons in RTL */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-nowrap">
            {!isAuthenticated ? (
              /* Guest State: Golden subscription hidden, show elegant ورود / ثبت‌نام button */
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-black text-xs sm:text-xs shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all cursor-pointer shrink-0"
              >
                <LogIn className="w-4 h-4 text-zinc-950 shrink-0" />
                <span className="whitespace-nowrap">ورود / ثبت‌نام</span>
              </button>
            ) : (
              /* Logged-in State */
              <>
                {/* Prominent Golden Pro Button in Navbar */}
                <button
                  onClick={handleSubscriptionClick}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-black text-[11px] sm:text-xs transition cursor-pointer shadow-md hover:shadow-amber-500/20 active:scale-95 shrink-0"
                  title="خرید اشتراک طلایی"
                >
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">خرید اشتراک طلایی</span>
                  <span className="sm:hidden whitespace-nowrap">اشتراک طلایی</span>
                </button>

                {/* Enter App Button */}
                <button
                  onClick={onEnterApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-zinc-900/90 text-white hover:bg-zinc-800 transition cursor-pointer border border-zinc-800 shrink-0"
                >
                  <span>ورود به سامانه</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10">
        {/* 2. HERO SECTION */}
        <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center">
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-6 backdrop-blur-md shadow-xs animate-in fade-in slide-in-from-top-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">
              {isRtl ? 'سامانه مدیریت مالی هوشمند و تسلط بر جریان پول' : 'Next-Generation AI Wealth Operating System'}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 inline" />
              {isRtl ? 'هوش مصنوعی چندبوم' : 'Chandboom AI'}
            </span>
          </div>

          {/* Main Headline with Bahman Font */}
          <h1 className="font-bahman text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.25] sm:leading-[1.2] max-w-5xl mx-auto mb-6">
            {isRtl ? (
              <>
                مدیریت مالی شخصی با <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">هوش مصنوعی</span> چندبوم
              </>
            ) : (
              <>
                Master Your Wealth with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">Chandboom AI</span> Intelligence
              </>
            )}
          </h1>

          {/* Subheadline */}
          <p className="text-zinc-400 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mb-10 font-medium">
            {isRtl
              ? 'سامانه مدیریت مالی هوشمند: ثبت تراکنش با صدا و پیامک بانکی، تحلیل هوشمند هزینه‌ها و درآمدها، پیش‌بینی ۳ ماهه جریان نقدینگی و سپر ضد خرید هیجانی.'
              : 'Smart personal finance management: natural voice transaction entry, bank SMS parsing, AI cash flow insights, 3-month forecasting, and impulse buy shield.'}
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-12">
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-base shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-1 active:translate-y-0 cursor-pointer"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>{isRtl ? 'شروع رایگان و ثبت پیامک بانکی' : 'Start Free in 1 Minute'}</span>
              <ArrowIcon className="w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-white font-bold text-sm border border-emerald-900/40 hover:border-emerald-600 transition shadow-lg cursor-pointer"
            >
              <Laptop className="w-4 h-4 text-emerald-400" />
              <span>{isRtl ? 'مشاهده دموی زنده اپلیکیشن' : 'Explore Live App'}</span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-zinc-400 pb-4 border-b border-emerald-950/40 max-w-3xl mx-auto mb-12">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isRtl ? 'امنیت ابری پیشرفته و رمزنگاری بانکی' : 'Bank-Grade Encryption & Cloud Security'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>{isRtl ? 'امتیاز ۴.۹ از ۵ (بیش از ۵۰,۰۰۰ تراکنش)' : '4.9/5 Rating (50K+ Transactions)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>{isRtl ? 'حفظ کامل حریم خصوصی' : '100% Private & Anonymous'}</span>
            </div>
          </div>

          {/* Hero Campaign Visual Showcase */}
          <div className="relative max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-emerald-500/30 via-emerald-900/20 to-transparent shadow-2xl shadow-emerald-950/80 overflow-hidden group">
            <div className="relative rounded-[22px] bg-[#0A100D] border border-emerald-900/60 overflow-hidden backdrop-blur-xl">
              <picture>
                <source srcSet="./assets/chandboom-smart-personal-finance-hero.webp" type="image/webp" />
                <source srcSet="./assets/chandboom-smart-personal-finance-hero.jpg" type="image/jpeg" />
                <img
                  src="./assets/chandboom-smart-personal-finance-hero.webp"
                  alt="داشبورد مدیریت مالی هوشمند چندبوم با هوش مصنوعی و نمودارهای تحلیلی ثروت و جریان نقدینگی"
                  width={1376}
                  height={768}
                  loading="eager"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-cover rounded-[22px] transition-transform duration-700 group-hover:scale-[1.01]"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A100D]/90 via-[#0A100D]/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-6 flex flex-wrap items-center justify-between gap-3 bg-[#070B09]/85 backdrop-blur-md px-4 py-3 rounded-2xl border border-emerald-900/60 text-xs">
                <div className="flex items-center gap-2 text-right">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span className="font-bold text-white">مدیریت مالی هوشمند با تحلیل آینده‌نگر چندبوم</span>
                  <span className="hidden md:inline text-zinc-500">•</span>
                  <span className="hidden md:inline text-zinc-300">ثبت تراکنش با صدا و تحلیل هوشمند هزینه‌ها و درآمدها</span>
                </div>
                <button
                  onClick={onEnterApp}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-zinc-950 font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shrink-0"
                >
                  <span>ورود به سامانه</span>
                  <ArrowIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 2.1 INTERACTIVE DASHBOARD MOCKUP */}
        <section id="mockup" className="max-w-6xl mx-auto px-4 sm:px-6 mb-24">
          <div className="relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500/30 via-emerald-900/20 to-transparent shadow-2xl shadow-emerald-950/60">
            <div className="rounded-[22px] bg-[#0A100D] border border-emerald-900/50 overflow-hidden backdrop-blur-xl p-4 sm:p-7">
              {/* Mockup Header Bar */}
              <div className="flex items-center justify-between border-b border-emerald-950/80 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                    chandboom.ir/app/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/40">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'موتور زنده هوش مصنوعی چندبوم' : 'Live Chandboom AI Engine'}</span>
                </div>
              </div>

              {/* Mockup Grid Inside */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Balance & Overview Card */}
                <div className="rounded-2xl bg-zinc-950/80 border border-emerald-900/40 p-5 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-zinc-400 font-medium">
                      {isRtl ? 'موجودی خالص دارایی‌ها' : 'Total Net Balance'}
                    </span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-bahman text-3xl font-black text-white">
                        {isRtl ? '۴۸,۳۵۰,۰۰۰' : '$1,208.50'}
                      </span>
                      <span className="text-xs text-emerald-400 font-bold">
                        {isRtl ? 'تومان' : 'USD'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg w-fit border border-emerald-800/30">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{isRtl ? '+۱۲.۴٪ رشد پس‌انداز این ماه' : '+12.4% Net Savings Growth'}</span>
                    </div>
                  </div>

                  {/* Cash Flow mini bars */}
                  <div className="mt-6 pt-4 border-t border-zinc-900">
                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
                      <span>{isRtl ? 'درآمد این ماه' : 'Monthly Income'}</span>
                      <span className="text-emerald-400 font-bold">{isRtl ? '۳۵,۰۰۰,۰۰۰ ت' : '$875'}</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden mb-3">
                      <div className="bg-emerald-500 h-full rounded-full w-[78%]" />
                    </div>

                    <div className="flex justify-between text-xs text-zinc-400 mb-1.5 font-medium">
                      <span>{isRtl ? 'مخارج ثبت‌شده' : 'Expenses'}</span>
                      <span className="text-amber-400 font-bold">{isRtl ? '۱۹,۴۰۰,۰۰۰ ت' : '$485'}</span>
                    </div>
                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full w-[44%]" />
                    </div>
                  </div>
                </div>

                {/* AI Predictive Insight Banner */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 to-zinc-950 border border-emerald-500/40 p-5 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-3">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{isRtl ? 'پیش‌بینی هوشمند بودجه (هوش مصنوعی چندبوم)' : 'AI Budget Forecast (Chandboom AI)'}</span>
                    </div>
                    <h3 className="font-bahman text-base font-bold text-white mb-2 leading-relaxed">
                      {isRtl
                        ? 'بودجه شما با الگوی فعلی تا ۲۶ روز آینده کاملاً پایدار است.'
                        : 'Your cash flow is safely on track for the next 26 days.'}
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {isRtl
                        ? 'بیشترین سهم هزینه مربوط به دسته‌بندی «خوراک و خرید» بوده است. با کاهش ۱۰ درصدی هزینه‌های تفریح، می‌توانید سقف پس‌انداز طلایی خود را لمس کنید.'
                        : 'Dining expenses accounted for 38% of outflows. Trimming leisure by 10% secures your quarterly savings target.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-emerald-900/50 flex items-center justify-between text-xs">
                    <span className="text-emerald-400 font-bold">
                      {isRtl ? 'وضعیت پایداری: عالی (۹۴٪)' : 'Stability Score: 94%'}
                    </span>
                    <button
                      onClick={onEnterApp}
                      className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isRtl ? 'مشاهده جزئیات' : 'View Deep Dive'}</span>
                      <ArrowIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Interactive AI Transaction Quick Logger Test */}
                <div className="rounded-2xl bg-zinc-950/80 border border-emerald-900/40 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-zinc-400 font-bold flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        {isRtl ? 'تست زنده ثبت تراکنش با هوش مصنوعی' : 'Live AI Natural Entry'}
                      </span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        {isRtl ? 'فقط تایپ کن' : 'Natural Text'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <input
                        type="text"
                        value={interactiveInput}
                        onChange={(e) => setInteractiveInput(e.target.value)}
                        placeholder={
                          isRtl
                            ? 'مثال: ۲۵۰ تومن خرید سوپرمارکت و میوه'
                            : 'e.g. $45 groceries at Trader Joe\'s'
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-emerald-900/60 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition font-cairo"
                      />
                      <button
                        onClick={() => handleTestDemoAI()}
                        className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'تحلیل با هوش مصنوعی چندبوم' : 'Parse with Chandboom AI'}</span>
                      </button>
                    </div>

                    {/* Quick sample chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <button
                        onClick={() => {
                          const txt = isRtl ? '۱۵۰ تومن بنزین ماشین' : '$35 gas station fuel';
                          setInteractiveInput(txt);
                          handleTestDemoAI(txt);
                        }}
                        className="text-[11px] px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition cursor-pointer"
                      >
                        {isRtl ? 'بنزین ماشین' : 'Gas Fill'}
                      </button>
                      <button
                        onClick={() => {
                          const txt = isRtl ? '۴۲۰ تومن شام فست‌فود با بچه‌ها' : '$60 family dinner';
                          setInteractiveInput(txt);
                          handleTestDemoAI(txt);
                        }}
                        className="text-[11px] px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition cursor-pointer"
                      >
                        {isRtl ? 'شام رستوران' : 'Dinner Out'}
                      </button>
                    </div>

                    {/* Result Card */}
                    {demoParsed && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-xs animate-in fade-in">
                        <div className="flex justify-between items-center text-white font-bold mb-1">
                          <span>{demoParsed.cat}</span>
                          <span className="text-emerald-400">{demoParsed.amount}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {demoParsed.desc}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onEnterApp}
                    className="w-full mt-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-800 transition cursor-pointer"
                  >
                    {isRtl ? 'ورود به پنل و همگام‌سازی ابری' : 'Sync with Secure Cloud'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FEATURES GRID (بخش ویژگی‌ها و قابلیت‌ها) */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-emerald-950/40">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
              <Zap className="w-3.5 h-3.5" />
              <span>{isRtl ? 'امکانات مدیریت مالی هوشمند' : 'Built for Effortless Financial Mastery'}</span>
            </div>
            <h2 className="font-bahman text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              {isRtl
                ? 'مدیریت مالی شخصی با هوش مصنوعی چندبوم'
                : 'Everything You Need for Total Financial Control'}
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              {isRtl
                ? 'چندبوم فراتر از یک حسابداری ساده است؛ یک دستیار هوشمند و سیستم جامع تصمیم‌گیری مالی برای آرامش خاطر شما.'
                : 'Replace confusing spreadsheets and dated accounting tools with intuitive, AI-driven automation.'}
            </p>
          </div>

          {/* Visual Spotlight A: Voice Transaction Entry */}
          <div className="mb-14 rounded-3xl p-1 bg-gradient-to-r from-emerald-500/20 via-teal-900/20 to-zinc-900 border border-emerald-900/40 shadow-xl overflow-hidden">
            <div className="rounded-[22px] bg-[#0A100D] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Text / Copy Column */}
              <div className="space-y-4 text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-xs font-bold">
                  <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>{isRtl ? 'ثبت تراکنش با صدا' : 'Voice-Powered Entry'}</span>
                </div>
                <h3 className="font-bahman text-2xl sm:text-3xl font-black text-white leading-tight">
                  {isRtl ? 'تنها با صدا صحبت کنید؛ هوش مصنوعی ثبت می‌کند' : 'Speak Naturally. Chandboom AI Logs the Rest.'}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {isRtl
                    ? 'بدون اتلاف وقت برای پر کردن فرم‌های خسته‌کننده یا انتخاب دستی دسته‌بندی‌ها؛ کافیست بگویید «خرید میوه ۲۰۰ تومن و کرایه تاکسی ۴۵ تومن». موتور چندبوم در کسری از ثانیه مبلغ، نوع هزینه و دسته‌بندی دقیق را استخراج کرده و حساب شما را به‌روز می‌کند.'
                    : 'Skip the friction of tedious dropdowns. Just speak or write freely. Our fine-tuned AI extracts precise amounts in Toman, auto-categorizes, and registers transactions seamlessly.'}
                </p>
                <ul className="space-y-2.5 text-xs text-zinc-300 pt-2">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'تبدیل مستقیم گفتار فارسی به تراکنش معتبر به تومان' : 'Accurate Persian speech-to-transaction parsing'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'شناسایی و ثبت گروهی چند تراکنش هم‌زمان در یک پیام' : 'Batch multi-transaction extraction from single voice message'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'بدون نیاز به دسترسی‌های ناامن و بدون اتصال به رمز بانک' : '100% private with zero insecure banking access'}</span>
                  </li>
                </ul>
              </div>

              {/* Visual Asset Column */}
              <div className="relative rounded-2xl overflow-hidden border border-emerald-900/50 shadow-2xl bg-zinc-950">
                <picture>
                  <source srcSet="./assets/chandboom-voice-transaction-entry.webp" type="image/webp" />
                  <source srcSet="./assets/chandboom-voice-transaction-entry.jpg" type="image/jpeg" />
                  <img
                    src="./assets/chandboom-voice-transaction-entry.webp"
                    alt="مفهوم پردازش صوت و تبدیل پیام صوتی به تراکنش مالی هوشمند در چندبوم"
                    width={1200}
                    height={896}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover rounded-2xl transition-transform duration-500 hover:scale-[1.02]"
                  />
                </picture>
                <div className="absolute bottom-3 right-3 bg-[#070B09]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-900/60 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <Mic className="w-3 h-3 text-emerald-400" />
                  <span>{isRtl ? 'ثبت تراکنش با صدا و هوش مصنوعی' : 'Voice Transaction Flow'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Spotlight B: AI Financial Insights & Spending Analysis */}
          <div className="mb-16 rounded-3xl p-1 bg-gradient-to-l from-emerald-500/20 via-amber-900/15 to-zinc-900 border border-emerald-900/40 shadow-xl overflow-hidden">
            <div className="rounded-[22px] bg-[#0A100D] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Visual Asset Column (Shown first on desktop in LTR / second in RTL) */}
              <div className="order-2 lg:order-1 relative rounded-2xl overflow-hidden border border-emerald-900/50 shadow-2xl bg-zinc-950">
                <picture>
                  <source srcSet="./assets/chandboom-ai-financial-insights.webp" type="image/webp" />
                  <source srcSet="./assets/chandboom-ai-financial-insights.jpg" type="image/jpeg" />
                  <img
                    src="./assets/chandboom-ai-financial-insights.webp"
                    alt="تحلیل بصری دسته‌بندی مخارج، جریان نقدینگی و بینش‌های مالی هوش مصنوعی چندبوم"
                    width={1200}
                    height={896}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover rounded-2xl transition-transform duration-500 hover:scale-[1.02]"
                  />
                </picture>
                <div className="absolute bottom-3 left-3 bg-[#070B09]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-900/60 text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-amber-400" />
                  <span>{isRtl ? 'تحلیل هوشمند هزینه‌ها و درآمدها' : 'Predictive Financial Insights'}</span>
                </div>
              </div>

              {/* Text / Copy Column */}
              <div className="order-1 lg:order-2 space-y-4 text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isRtl ? 'تحلیل هوشمند هزینه‌ها و درآمدها' : 'Predictive Financial Intelligence'}</span>
                </div>
                <h3 className="font-bahman text-2xl sm:text-3xl font-black text-white leading-tight">
                  {isRtl ? 'پیش‌بینی ۳ ماهه جریان نقدینگی و رادار کنترل بودجه' : '3-Month Cash Flow Forecasting & Budget Guardrails'}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {isRtl
                    ? 'چندبوم به جای نگاه به گذشته، آینده مالی شما را ترسیم می‌کند. هوش مصنوعی با شبیه‌سازی نرخ مصرف روزانه به شما هشدار می‌دهد که تا چه تاریخی پول شما پایدار است و چگونه با مهار خریدهای احساسی، تا ۳۰ درصد به پس‌انداز ماهانه خود بیفزایید.'
                    : 'Move from reactive bookkeeping to proactive wealth protection. Chandboom calculates your exact cash runway, highlights burn rates, and helps shield against emotional impulse spending.'}
                </p>
                <ul className="space-y-2.5 text-xs text-zinc-300 pt-2">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'رادار تصویری مخارج بر اساس دسته‌بندی‌های استاندارد' : 'Visual categorical breakdown across essentials and leisure'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'سپر ضد خرید تکانه‌ای و تبدیل قیمت کالا به ساعات کار مفید' : 'Impulse buy shield converting price tags into work hours'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'خروجی اکسل استاندارد و پیش‌بینی هوشمند روز اتمام بودجه' : 'Automated styled Excel exports with runway forecasting'}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Bank SMS & Receipt Parser */}
            <div className="rounded-3xl p-7 bg-zinc-950/70 border border-emerald-900/30 hover:border-emerald-500/50 transition-all group backdrop-blur-sm hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-teal-500/10 border border-blue-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg">
                <CreditCard className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="font-bahman text-xl font-bold text-white mb-3">
                {isRtl ? 'پردازش هوشمند پیامک بانکی و فیش' : 'Instant Bank SMS & Receipt Parser'}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {isRtl
                  ? 'پیامک واریز یا برداشت هر بانکی را پیست کنید؛ سامانه مبلغ، نوع، بانک و تاریخ را استخراج کرده و دسته‌بندی را با تأیید دستی شما نهایی می‌کند.'
                  : 'Paste any banking notification or receipt. Our parser deterministically extracts amount, type, bank, and date with zero intrusive phone permissions.'}
              </p>
            </div>

            {/* Feature 2: 30-Day Daily Quests */}
            <div className="rounded-3xl p-7 bg-zinc-950/70 border border-emerald-900/30 hover:border-emerald-500/50 transition-all group backdrop-blur-sm hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg">
                <Star className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="font-bahman text-xl font-bold text-white mb-3">
                {isRtl ? 'چالش ۳۰ روزه مدیریت پول و تسک‌های روزانه' : '30-Day Daily Financial Quests & Streaks'}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {isRtl
                  ? 'تقویم گیمیفای شده ماهانه با ریزاهداف کاربردی روزانه (مثل روز بدون هزینه غیرضروری)، ویجت تسک امروز در داشبورد و شمارنده زنجیره تداوم (Streak).'
                  : 'An interactive 30-day quest calendar with micro-habits, dashboard Today’s Quest widget, celebratory animations, and active streak counters.'}
              </p>
            </div>

            {/* Feature 3: Impulse Buy Shield */}
            <div className="rounded-3xl p-7 bg-zinc-950/70 border border-emerald-900/30 hover:border-emerald-500/50 transition-all group backdrop-blur-sm hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg">
                <ShieldCheck className="w-7 h-7 text-rose-400" />
              </div>
              <h3 className="font-bahman text-xl font-bold text-white mb-3">
                {isRtl ? 'سپر ضد خرید تکانه‌ای (Impulse Buy Shield)' : 'Subtle Impulse Buy Shield'}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {isRtl
                  ? 'محاسبه خودکار ساعت کار معادل برای هر هدف خرید بر اساس درآمد ساعتی شما، و مشاوره‌های هوشمندانه تامل ۴۸ ساعته پیش از خریدهای هیجانی.'
                  : 'Translates any purchase target into equivalent working hours based on your hourly wage, preventing emotional gadget purchases.'}
              </p>
            </div>

            {/* Feature 4: Smart Timeline & 3-Month View */}
            <div className="rounded-3xl p-7 bg-zinc-950/70 border border-emerald-900/30 hover:border-emerald-500/50 transition-all group backdrop-blur-sm hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="font-bahman text-xl font-bold text-white mb-3">
                {isRtl ? 'تایم‌لاین ۳ ماهه و گروه‌بندی روزانه' : 'Smart Timeline & Quarterly Views'}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {isRtl
                  ? 'نمایش پیش‌فرض تمیز ماه جاری با تب‌های سریع ماه گذشته و ۳ ماه اخیر، به همراه گروه‌بندی روزانه و سرجمع سود و زیان هر روز.'
                  : 'Clean monthly default view with 1-click quarterly filters, grouped by exact dates with daily subtotal headers and totals.'}
              </p>
            </div>

            {/* Feature 5: AI Advisor */}
            <div className="rounded-3xl p-7 bg-zinc-950/70 border border-emerald-900/30 hover:border-emerald-500/50 transition-all group backdrop-blur-sm hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg">
                <Sparkles className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="font-bahman text-xl font-bold text-white mb-3">
                {isRtl ? 'تحلیل و مشاوره مالی با دستیار هوشمند چندبوم' : 'Chandboom AI Financial Advisor'}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {isRtl
                  ? 'تحلیل عمیق دخل و خرج، پیش‌بینی روز اتمام بودجه، ارائه راهکارهای افزایش پس‌انداز و پاسخ به سوالات مالی شما با هوش مصنوعی.'
                  : 'AI-powered budgeting insights, cash flow runway calculations, and custom financial advice tailored to your goals.'}
              </p>
            </div>

            {/* Feature 6: Group Dong & Bill Splitting */}
            <div className="rounded-3xl p-7 bg-zinc-950/70 border border-emerald-900/30 hover:border-emerald-500/50 transition-all group backdrop-blur-sm hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-teal-500/10 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition shadow-lg">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="font-bahman text-xl font-bold text-white mb-3">
                {isRtl ? 'محاسبه عادلانه دنگ سفر و رستوران' : 'Group Bill & Travel Expense Splitting'}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {isRtl
                  ? 'محاسبه بدون دلخوری دنگ دورهمی‌ها و سفر با فرمول بهینه حداقل تراکنش، بدون نیاز به کاغذ و ماشین‌حساب.'
                  : 'Split group trips and dining bills fairly with minimized transactions and clear individual balances.'}
              </p>
            </div>
          </div>
        </section>

        {/* 4. PRICING SECTION (بخش معرفی پلن‌های اشتراک) */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-emerald-950/40">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>{isRtl ? 'تعرفه‌های اشتراک طلایی پرو' : 'Flexible Pro & VIP Plans'}</span>
            </div>
            <h2 className="font-bahman text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
              {isRtl ? 'سرمایه‌گذاری روی آرامش و انضباط مالی' : 'Invest in Clarity and Financial Freedom'}
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              {isRtl
                ? 'پلن مورد نظرتان را انتخاب کنید و به قدرتمندترین امکانات هوش مصنوعی چندبوم دسترسی نامحدود پیدا کنید.'
                : 'Select the right plan for your workflow and unlock unlimited Chandboom AI intelligence.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Plan 1: 1 Month */}
            <div className="rounded-3xl bg-zinc-950/80 border border-zinc-800 p-8 flex flex-col justify-between hover:border-emerald-600 transition shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bahman text-2xl font-bold text-white">
                    {isRtl ? 'اشتراک ۱ ماهه' : '1 Month Pass'}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-bold">
                    {isRtl ? 'شروع هوشمند' : 'Starter'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-6">
                  {isRtl ? 'مناسب برای تست و شروع تسلط بر مخارج روزمره' : 'Ideal for testing out automated tracking and budgeting.'}
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-bahman text-4xl font-black text-white">
                    {isRtl ? '۹۹,۰۰۰' : '$2.99'}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold">
                    {isRtl ? 'تومان / ماهانه' : '/ month'}
                  </span>
                </div>

                <ul className="space-y-3.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'ثبت هوشمند با هوش مصنوعی چندبوم (۵۰ در روز)' : '50 Chandboom AI entries per day'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'تحلیل و پیش‌بینی ۱ ماهه بودجه' : '1-Month cash flow forecast'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'ثبت نامحدود یادآور اقساط و چک' : 'Unlimited reminders for loans & checks'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'محاسبه دنگ سفر و رستوران' : 'Group bill splitting module'}</span>
                  </li>
                </ul>
              </div>

              {/* Requirement 4: Auth Guard triggered if not logged in */}
              <button
                onClick={handleSubscriptionClick}
                className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-zinc-700 hover:border-emerald-500 transition cursor-pointer"
              >
                {isRtl ? 'انتخاب اشتراک ۱ ماهه' : 'Select 1 Month'}
              </button>
            </div>

            {/* Plan 2: 3 Months (POPULAR - GOLD / BLACK LUXURY) */}
            <div className="rounded-3xl bg-gradient-to-b from-zinc-950 via-[#0E1511] to-zinc-950 border-2 border-amber-500/80 p-8 flex flex-col justify-between shadow-2xl shadow-amber-500/10 relative transform md:-translate-y-2">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-black text-xs shadow-md uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>{isRtl ? 'محبوب‌ترین انتخاب' : 'Most Popular'}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <span className="font-bahman text-2xl font-black text-white flex items-center gap-2">
                    {isRtl ? 'اشتراک ۳ ماهه' : '3 Months Pro'}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      {isRtl ? '۱۶٪ تخفیف' : '16% Off'}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mb-6">
                  {isRtl ? 'بهترین دوره برای شکل‌گیری عادت انضباط مالی پایدار' : 'The sweet spot for establishing lifelong money discipline.'}
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-bahman text-4xl font-black text-amber-400">
                    {isRtl ? '۲۴۹,۰۰۰' : '$6.99'}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold">
                    {isRtl ? 'تومان / کل دوره ۳ ماه' : '/ 3 months'}
                  </span>
                </div>

                <ul className="space-y-3.5 text-xs text-zinc-200 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-bold text-white">{isRtl ? 'دسترسی نامحدود به هوش مصنوعی چندبوم' : 'Unlimited Chandboom AI Assistant'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{isRtl ? 'پیش‌بینی هوشمند ۳ ماهه جریان نقدینگی' : 'Full 3-Month cash flow forecast'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{isRtl ? 'هشدار لحظه‌ای عبور از سقف بودجه' : 'Instant budget cap trigger alerts'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{isRtl ? 'تفکیک دسته‌بندی‌های اختصاصی نامحدود' : 'Custom unlimited categories & tags'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{isRtl ? 'پشتیبانی تیکتی دارای اولویت' : 'Priority support response'}</span>
                  </li>
                </ul>
              </div>

              {/* Requirement 4: Auth Guard triggered if not logged in */}
              <button
                onClick={handleSubscriptionClick}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                {isRtl ? 'خرید اشتراک ۳ ماهه طلایی' : 'Get 3 Months Golden Pro'}
              </button>
            </div>

            {/* Plan 3: 6 Months VIP */}
            <div className="rounded-3xl bg-zinc-950/80 border border-emerald-900/40 p-8 flex flex-col justify-between hover:border-emerald-500 transition shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bahman text-2xl font-bold text-white flex items-center gap-2">
                    {isRtl ? 'اشتراک ۶ ماهه VIP' : '6 Months VIP'}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      {isRtl ? '۲۵٪ تخفیف ویژه' : '25% Max Savings'}
                    </span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-6">
                  {isRtl ? 'حداکثر صرفه‌جویی مالی با تمام قابلیت‌های سازمانی' : 'Ultimate value pass with VIP status and custom advisory tools.'}
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="font-bahman text-4xl font-black text-white">
                    {isRtl ? '۴۴۹,۰۰۰' : '$11.99'}
                  </span>
                  <span className="text-xs text-zinc-400 font-bold">
                    {isRtl ? 'تومان / کل دوره ۶ ماه' : '/ 6 months'}
                  </span>
                </div>

                <ul className="space-y-3.5 text-xs text-zinc-300 mb-8">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'تمام امکانات طلایی بدون محدودیت' : 'Everything in Golden Pro unrestricted'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'نشان افتخاری VIP در پروفایل کاربری' : 'VIP Badge across all community tools'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'تحلیل‌های عمیق ۶ ماهه روند دارایی' : '6-Month deep financial trajectory report'}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{isRtl ? 'پشتیبانی اختصاصی مستقیم در تیکت' : 'Direct VIP channel assistance'}</span>
                  </li>
                </ul>
              </div>

              {/* Requirement 4: Auth Guard triggered if not logged in */}
              <button
                onClick={handleSubscriptionClick}
                className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs border border-emerald-800/60 hover:border-emerald-500 transition cursor-pointer"
              >
                {isRtl ? 'انتخاب اشتراک ۶ ماهه VIP' : 'Select 6 Months VIP'}
              </button>
            </div>
          </div>
        </section>

        {/* 5. TESTIMONIALS & STATS (نظرات و اعتماد کاربران) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 border-t border-emerald-950/40">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-16">
            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-emerald-950/60">
              <span className="font-bahman text-3xl sm:text-4xl font-black text-emerald-400 block mb-1">
                +۵۰,۰۰۰
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {isRtl ? 'تراکنش امن ثبت‌شده' : 'Transactions Securely Logged'}
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-emerald-950/60">
              <span className="font-bahman text-3xl sm:text-4xl font-black text-amber-400 block mb-1">
                ۹۹.۸٪
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {isRtl ? 'دقت هوش مصنوعی چندبوم' : 'Chandboom AI Accuracy'}
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-emerald-950/60">
              <span className="font-bahman text-3xl sm:text-4xl font-black text-teal-400 block mb-1">
                ۴.۹ / ۵
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {isRtl ? 'رضایت کاربران فعال' : 'User Satisfaction'}
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-950/60 border border-emerald-950/60">
              <span className="font-bahman text-3xl sm:text-4xl font-black text-white block mb-1">
                ۱۰۰٪
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {isRtl ? 'محرمانگی اطلاعات مالی' : 'Private & Secure'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl p-6 bg-zinc-950/70 border border-zinc-900">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-6 font-medium">
                {isRtl
                  ? '«فوق‌العاده است! فقط می‌نویسم چقدر خرج کردم و هوش مصنوعی همه‌چیز رو تمیز دسته‌بندی می‌کنه. در پایان ماه برای اولین بار متوجه شدم چقدر پولم هدر می‌رفت.»'
                  : '"Incredible experience. I just write down my expense as a text and Chandboom organizes everything. Found over 20% savings in my first month."'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center font-bold text-white text-xs">
                  ام
                </div>
                <div>
                  <span className="font-bold text-xs text-white block">
                    {isRtl ? 'امید رادمنش' : 'Omid Rad'}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {isRtl ? 'برنامه‌نویس و فریلنسر' : 'Senior Software Engineer'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6 bg-zinc-950/70 border border-zinc-900">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-6 font-medium">
                {isRtl
                  ? '«قابلیت پیش‌بینی ۳ ماهه جریان نقدینگی چندبوم بی‌نظیره. قبل از اینکه به مشکل بخورم بهم اطلاع میده تا هزینه‌هام رو کنترل کنم.»'
                  : '"The 3-month forecast gives me immense peace of mind. It tells me weeks in advance if my burn rate is creeping too high."'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-900/60 border border-amber-500/40 flex items-center justify-center font-bold text-white text-xs">
                  سم
                </div>
                <div>
                  <span className="font-bold text-xs text-white block">
                    {isRtl ? 'سارا محمدی' : 'Sara Mohammadi'}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {isRtl ? 'مدیر محصول استارتاپ' : 'Startup Product Lead'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl p-6 bg-zinc-950/70 border border-zinc-900">
              <div className="flex items-center gap-1 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-6 font-medium">
                {isRtl
                  ? '«محاسبه دنگ سفر برای گروه ما همیشه دردسر بود. با چندبوم در سفر شمال بدون حتی یک بحث، سهم هر نفر با کمترین تعداد تراکنش حل شد.»'
                  : '"Bill splitting on our road trip was effortless. Zero math arguments, zero confusion, settled instantly."'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-900/60 border border-teal-500/40 flex items-center justify-center font-bold text-white text-xs">
                  پک
                </div>
                <div>
                  <span className="font-bold text-xs text-white block">
                    {isRtl ? 'پرهام کمالی' : 'Parham Kamali'}
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    {isRtl ? 'مشاور کسب‌وکار' : 'Management Consultant'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. FAQ (پرسش‌های متداول) */}
        <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 py-20 border-t border-emerald-950/40">
          <div className="text-center mb-12">
            <h2 className="font-bahman text-3xl font-black text-white mb-3">
              {isRtl ? 'پرسش‌های متداول' : 'Frequently Asked Questions'}
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium">
              {isRtl ? 'پاسخ به سوالات متداول کاربران چندبوم' : 'Everything you need to know about getting started.'}
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: isRtl ? 'آیا استفاده از چندبوم نیاز به اتصال به حساب بانکی دارد؟' : 'Does Chandboom require access to my bank account credentials?',
                a: isRtl
                  ? 'خیر، به هیچ وجه! امنیت و حریم خصوصی شما خط قرمز ماست. شما نیازی به ارائه رمز یا اطلاعات حساس بانکی ندارید. ثبت تراکنش‌ها از طریق تایپ متن ساده یا ثبت دستی انجام می‌شود.'
                  : 'No, absolutely not. We never ask for your banking passwords or credentials. Transactions are tracked safely through natural text logging or manual input.',
              },
              {
                q: isRtl ? 'هوش مصنوعی چگونه جملات من را به تراکنش تبدیل می‌کند؟' : 'How does the AI parse my natural language statements?',
                a: isRtl
                  ? 'چندبوم مجهز به موتور هوش مصنوعی اختصاصی چندبوم (Chandboom AI) است که با درک پیشرفته زبان فارسی و انگلیسی، مبلغ، نوع هزینه، دسته‌بندی و توضیحات را در کسری از ثانیه استخراج می‌کند.'
                  : 'We utilize proprietary Chandboom AI fine-tuned to extract amounts, dates, and spending categories from unstructured natural sentences.',
              },
              {
                q: isRtl ? 'اشتراک طلایی (پرو) چه مزیتی نسبت به حساب عادی دارد؟' : 'What is the key advantage of the Pro / VIP subscription?',
                a: isRtl
                  ? 'کاربران پرو به هوش مصنوعی چندبوم، پیش‌بینی ۳ ماهه جریان نقدینگی، ثبت نامحدود دنگ و اقساط، و پشتیبانی اختصاصی دسترسی نامحدود دارند.'
                  : 'Pro members enjoy unlimited Chandboom AI queries, 3-month predictive cash runway forecasting, and unlimited group splitting.',
              },
              {
                q: isRtl ? 'آیا می‌توانم روی چند دستگاه همزمان استفاده کنم؟' : 'Can I use Chandboom across multiple devices?',
                a: isRtl
                  ? 'بله، چندبوم متصل به پایگاه داده ابری امن و مقیاس‌پذیر است و به عنوان یک وب‌اپلیکیشن فوق‌العاده مدرن (PWA) روی گوشی‌های اندروید، آیفون، تبلت و کامپیوتر بدون نیاز به نصب هیچ برنامه جانبی همگام می‌شود.'
                  : 'Yes! Chandboom is backed by high-speed secure cloud architecture and runs as a progressive web app (PWA) syncing across iOS, Android, macOS, and Windows.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-zinc-950/70 border border-zinc-900 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-right flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-emerald-400 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-900/60 pt-3 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 7. BOTTOM CALL TO ACTION */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div className="rounded-3xl p-8 sm:p-14 bg-gradient-to-br from-emerald-950/70 via-zinc-950 to-zinc-950 border border-emerald-500/30 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="font-bahman text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
                {isRtl ? 'آماده‌اید کنترل پول خود را در دست بگیرید؟' : 'Ready to Take Full Control of Your Wealth?'}
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-medium">
                {isRtl
                  ? 'همین حالا در چندبوم شروع کنید و در کمتر از یک دقیقه اولین تراکنش هوشمند خود را به ثبت برسانید.'
                  : 'Join Chandboom today and experience the future of personal wealth management.'}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onOpenAuth}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-base shadow-xl shadow-emerald-500/30 transition transform hover:-translate-y-1 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-zinc-950" />
                  <span>{isRtl ? 'شروع رایگان و پیوستن به چندبوم' : 'Join Chandboom Free Today'}</span>
                </button>
                <button
                  onClick={handleSubscriptionClick}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-black text-base shadow-xl shadow-amber-500/25 transition transform hover:-translate-y-1 cursor-pointer"
                >
                  <Crown className="w-5 h-5 text-zinc-950" />
                  <span>{isRtl ? 'خرید اشتراک طلایی' : 'Buy Pro Pass'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 8. FOOTER */}
      <footer className="border-t border-emerald-950/60 bg-[#060A08] py-12 px-4 sm:px-6 text-xs text-zinc-400 font-cairo">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#0A100D] rounded-[10px] flex items-center justify-center">
                <img
                  src="./logo.png"
                  alt="Chandboom"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = './assets/logo.png';
                  }}
                />
              </div>
            </div>
            <div>
              <span className="font-brand text-lg font-bold text-white block">
                {isRtl ? 'چندبوم (Chandboom)' : 'Chandboom Technologies'}
              </span>
              <span className="text-[10px] text-zinc-500">
                {isRtl ? 'سامانه نسل بعد مدیریت هوشمند مالی و بودجه' : 'Next-Gen Financial Intelligence Operating System'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold">
            <button
              onClick={onEnterApp}
              className="hover:text-emerald-400 transition cursor-pointer"
            >
              {isRtl ? 'داشبورد اپلیکیشن' : 'App Dashboard'}
            </button>
            <button
              onClick={handleSubscriptionClick}
              className="text-amber-400 hover:text-amber-300 transition cursor-pointer font-bold flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>{isRtl ? 'خرید اشتراک طلایی' : 'Buy Pro Pass'}</span>
            </button>
            <a href="#features" className="hover:text-emerald-400 transition">
              {isRtl ? 'امکانات' : 'Features'}
            </a>
            <a href="#pricing" className="hover:text-emerald-400 transition">
              {isRtl ? 'تعرفه‌ها' : 'Pricing'}
            </a>
            <a href="#faq" className="hover:text-emerald-400 transition">
              {isRtl ? 'پرسش‌های متداول' : 'FAQ'}
            </a>
          </div>

          <div className="text-center md:text-left text-[11px] text-zinc-500 font-mono" dir="ltr">
            Chandboom © {new Date().getFullYear()} • AI Wealth & Finance System
          </div>
        </div>
      </footer>
    </div>
  );
};
