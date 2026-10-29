import React, { useState, useEffect } from 'react';
import {
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
  ChevronUp,
  Laptop,
  CreditCard,
  HelpCircle,
  ShieldCheck,
  Check,
  LogIn,
  Mic,
  Target,
  BarChart3,
  Calendar,
  Wallet,
  Clock,
  Award,
  Globe,
  Smartphone,
  Eye,
  Plus,
  ArrowUp,
  Headphones,
  FileText,
  X,
  Share2,
  Bookmark,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: () => void;
  onOpenSubscription?: () => void;
}

interface ArticleData {
  id: string;
  title: string;
  slug: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  summary: string;
  content: string[];
  keyTakeaways: string[];
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenAuth,
  onOpenSubscription,
}) => {
  const { isAuthenticated, openAuthGuard, openSubscriptionModal, setActiveTab } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleData | null>(null);

  // Scroll listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchApp = () => {
    if (setActiveTab) {
      setActiveTab('dashboard');
    }
    onEnterApp();
  };

  const handleLaunchDong = () => {
    if (setActiveTab) {
      setActiveTab('dong');
    }
    onEnterApp();
  };

  const handleOpenSupport = () => {
    if (setActiveTab) {
      setActiveTab('support');
    }
    onEnterApp();
  };

  const faqItems = [
    {
      q: 'چطور در چندبوم ثبت‌نام کنم؟',
      a: 'خیلی ساده! سامانه چندبوم کاملاً تحت وب و ابری است. بدون نیاز به نصب هرگونه فایل یا اپلیکیشن، فقط کافی است با ایمیل خود در چند ثانیه ثبت‌نام کرده و بلافاصله مدیریت مالی خود را آغاز کنید.',
    },
    {
      q: 'آیا برای استفاده نیاز به دانلود و نصب اپلیکیشن داریم؟',
      a: 'خیر، به هیچ وجه! چندبوم یک وب‌اپلیکیشن (Web Application) فوق‌پیشرفته و ابری است که در مرورگر تمام دستگاه‌ها (موبایل اندروید و آیفون، تبلت و کامپیوتر) بدون اشغال حافظه گوشی یا نیاز به دانلود کار می‌کند.',
    },
    {
      q: 'می‌توانم با دوستان یا اعضای خانواده خرج مشترک داشته باشم؟',
      a: 'بله! بخش «دنگ و خرج جمعی» چندبوم دقیقاً برای همین طراحی شده است. می‌توانید برای سفر، کافه، خانه یا برنامه‌های گروهی گروه‌های هم‌خرج بسازید و تراز سهم هر فرد را با دقت حسابداری مشاهده و تسویه کنید.',
    },
    {
      q: 'آیا استفاده از چندبوم هزینه دارد؟',
      a: 'امکانات پایه شامل ثبت نامحدود درآمدها و هزینه‌ها، دسته‌بندی و محاسبه دنگ کاملاً رایگان است. برای ابزارهای پیشرفته مانند تحلیل پیش‌بینی ۳ ماهه، ثبت صوتی و مشاور هوشمند، پلن‌های اقتصادی برنزی، پرو و VIP در دسترس هستند.',
    },
    {
      q: 'امنیت داده‌های مالی من چگونه تامین می‌شود؟',
      a: 'داده‌های شما روی زیرساخت امن ابری و پایگاه داده رمزنگاری‌شده Supabase نگهداری می‌شوند. تمام تبادلات داده با استانداردهای حفاظتی چندلایه امن شده و کاملاً محرمانه هستند.',
    },
    {
      q: 'در صورت نیاز به راهنمایی چگونه با پشتیبانی در ارتباط باشم؟',
      a: 'می‌توانید با کلیک روی دکمه پشتیبانی در پایین صفحه یا منوی پنل کاربری، مستقیماً تیکت رسمی پشتیبانی ثبت فرمایید تا کارشناسان چندبوم در کوتاه‌ترین زمان به شما پاسخ دهند.',
    },
  ];

  const articles: ArticleData[] = [
    {
      id: 'financial-movies',
      title: '۷ فیلم برتر اقتصادی و مالی که نگرش شما به پول را تغییر می‌دهند',
      slug: 'best-financial-movies',
      date: '۲۲ تیر ۱۴۰۴',
      readTime: '۶ دقیقه مطالعه',
      category: 'هوش مالی و سرمایه',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
      summary: 'آشنایی با برترین فیلم‌های تاریخ سینما در زمینه وال‌استریت، بحران‌های اقتصادی و هوش مالی که هر فرد برای موفقیت مالی باید ببیند.',
      content: [
        'سینما همواره یکی از جذاب‌ترین ابزارها برای درک مفاهیم پیچیده اقتصادی و روان‌شناسی بازار بوده است. فیلم‌هایی چون «گرگ وال استریت»، «رکود بزرگ (The Big Short)» و «در جستجوی خوشبختی» زوایای پنهان قدرت پول و اشتباهات مهلک مالی را نمایش می‌دهند.',
        'در این فیلم‌ها می‌آموزیم که چگونه حرص، ترس و تصمیم‌گیری‌های شتاب‌زده می‌توانند بزرگ‌ترین دارایی‌ها را نابود کنند، در حالی که برنامه‌ریزی منضبط و مدیریت بودجه تضمین‌کننده بقا و رشد پایدار مالی است.',
        'چندبوم با تکیه بر اصول مدیریت بودجه و الگوریتم‌های هوشمند، به شما کمک می‌کند رفتارهای هیجانی مالی خود را مهار کنید و همانند یک مدیر دارایی حرفه‌ای حساب‌هایتان را کنترل نمایید.',
      ],
      keyTakeaways: [
        'شناخت سوگیری‌های هیجانی در هنگام خرید یا سرمایه‌گذاری',
        'اهمیت پایبندی به بودجه ماهانه در دوران بحران اقتصادی',
        'لزوم تنوع‌بخشی به دارایی‌ها و جلوگیری از تمرکز ریسک',
      ],
    },
    {
      id: 'dong-guide',
      title: 'راهنمای کامل محاسبه دنگ و مدیریت هزینه‌های گروهی در سفر',
      slug: 'dong-and-group-expense-guide',
      date: '۱۸ تیر ۱۴۰۴',
      readTime: '۴ دقیقه مطالعه',
      category: 'دنگ و خرج جمعی',
      image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80',
      summary: 'چگونه بدون دلخوری و با شفافیت کامل، مخارج سفرها، کافه‌ها و خریدهای مشترک را بین دوستان تقسیم و تسویه کنیم.',
      content: [
        'یکی از دغدغه‌های همیشگی در سفرهای دوستانه یا خانوادگی، نحوه یادداشت خرج‌ها، مشخص کردن فرد خریدار و در نهایت تراز بدهی‌ها و طلب‌هاست.',
        'استفاده از ابزار دنگ گروهی چندبوم به شما امکان می‌دهد با ثبت ساده هر هزینه، سهم هر نفر را به صورت مساوی یا سفارشی تفکیک کنید و در پایان سفر تنها با یک کلیک، کمترین تعداد تراکنش لازم برای تسویه حساب را دریافت نمایید.',
      ],
      keyTakeaways: [
        'ثبت آنی و لحظه‌ای هزینه‌ها مانع از فراموشی اقلام ریز می‌شود',
        'شفافیت مالی دوستی‌ها را عمیق‌تر و سفرها را لذت‌بخش‌تر می‌کند',
        'کاهش نقل و انتقالات مالی با محاسبه خودکار تراز بدهی/طلب',
      ],
    },
    {
      id: 'personal-budget-rule',
      title: 'قانون طلایی ۵۰/۳۰/۲۰ برای بودجه‌بندی هوشمند درآمد ماهانه',
      slug: '50-30-20-budgeting-rule',
      date: '۱۲ تیر ۱۴۰۴',
      readTime: '۵ دقیقه مطالعه',
      category: 'آموزش بودجه‌بندی',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
      summary: 'فرمول استاندارد جهانی برای تقسیم حقوق ماهانه بین نیازهای ضروری، تفریحات و پس‌انداز بلندمدت.',
      content: [
        'قانون ۵۰/۳۰/۲۰ یکی از ساده‌ترین و کارآمدترین روش‌های بودجه‌بندی شخصی در دنیاست: ۵۰ درصد از درآمد خالص به نیازهای اولیه (اجاره، خوراک، قبوض)، ۳۰ درصد به خواسته‌ها (رستوران، تفریح، خرید شخصی) و ۲۰ درصد به پس‌انداز و سرمایه‌گذاری اختصاص می‌یابد.',
        'در پنل چندبوم، این نسبت‌ها به طور پیوسته روی تراکنش‌های واقعی شما تحلیل شده و هرگاه هزینه‌ای از حد تعیین‌شده فراتر رود، هشدارهای هوشمند برای شما ارسال می‌شود.',
      ],
      keyTakeaways: [
        'تفکیک دقیق مرز بین «نیاز» و «خواسته»',
        'تثبیت سهم ۲۰ درصدی پس‌انداز پیش از شروع هزینه‌کرد ماهانه',
        'ایجاد آرامش روانی و آمادگی کامل برای هزینه‌های پیش‌بینی‌نشده',
      ],
    },
  ];

  return (
    <div
      className="min-h-screen bg-white text-zinc-900 selection:bg-emerald-600 selection:text-white overflow-x-hidden font-cairo"
      dir="rtl"
    >
      {/* Soft Emerald Atmospheric Ambient Light Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[520px] h-[520px] bg-emerald-200/25 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-32 w-[480px] h-[480px] bg-teal-200/20 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-[180px]" />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Right: Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLaunchApp}>
            <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-500/40 p-1 flex items-center justify-center shadow-md shadow-emerald-700/10 group-hover:scale-105 transition shrink-0">
              <img
                src="./logo.png"
                alt="لوگوی رسمی چندبوم"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = './assets/logo.png';
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-brand font-bold text-2xl tracking-tight text-emerald-950">
                چندبوم
              </span>
              <span className="text-[10px] font-cairo font-bold text-emerald-700 -mt-1 tracking-wider">
                سامانه هوشمند مالی و بودجه
              </span>
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-zinc-600 font-cairo">
            <a href="#features" className="hover:text-emerald-700 transition-colors">
              ویژگی‌ها
            </a>
            <a href="#how-it-works" className="hover:text-emerald-700 transition-colors">
              نحوه کار
            </a>
            <a href="#dong" className="hover:text-emerald-700 transition-colors">
              مدیریت دنگ
            </a>
            <a href="#web-app" className="hover:text-emerald-700 transition-colors">
              نسخه تحت وب
            </a>
            <a href="#blog" className="hover:text-emerald-700 transition-colors">
              بلاگ
            </a>
            <a href="#faq" className="hover:text-emerald-700 transition-colors">
              سوالات متداول
            </a>
          </nav>

          {/* Left: Auth CTA Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAuth}
              className="px-6 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isAuthenticated ? 'ورود به پنل' : 'ورود / ثبت‌نام'}
            </button>
          </div>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className="relative z-10 pt-10 pb-20 md:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Visual Interactive Layered Phone & Widgets (Left in RTL, cols 7) */}
            <div className="order-2 lg:order-1 lg:col-span-7 relative flex items-center justify-center">
              {/* Soft Radial Backlight */}
              <div className="absolute w-[440px] h-[440px] bg-gradient-to-tr from-emerald-200/40 via-teal-200/40 to-emerald-100/40 rounded-full blur-[80px] pointer-events-none" />

              {/* Central Phone Mockup Container */}
              <div className="relative z-10 w-[300px] sm:w-[320px] bg-white rounded-[40px] p-3 shadow-2xl border-4 border-emerald-50 ring-1 ring-emerald-200/60">
                {/* Phone Speaker Notch */}
                <div className="w-24 h-4 bg-zinc-200/70 rounded-full mx-auto mb-3" />

                {/* Inside Phone Screen */}
                <div className="space-y-3.5 text-right font-cairo">
                  {/* Month Header */}
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-500 border-b border-zinc-100 pb-2">
                    <span className="text-zinc-400">‹ خرداد</span>
                    <span className="text-emerald-950 font-extrabold text-sm">تیر ۱۴۰۴</span>
                    <span className="text-zinc-400">مرداد ›</span>
                  </div>

                  {/* Expense & Budget Mini Summary */}
                  <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600">مجموع هزینه‌ها:</span>
                      <span className="font-extrabold text-emerald-950 font-mono">۵۱,۰۹۷,۸۸۰ <span className="text-[10px] text-zinc-400 font-normal">تومان</span></span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600">سقف بودجه ماهانه:</span>
                      <span className="font-extrabold text-emerald-700 font-mono">۲۰,۰۰۰,۰۰۰ <span className="text-[10px] text-zinc-400 font-normal">تومان</span></span>
                    </div>
                  </div>

                  {/* Donut Chart Visual */}
                  <div className="p-3 bg-white rounded-2xl border border-zinc-100 shadow-2xs">
                    <p className="text-[11px] font-extrabold text-zinc-700 mb-2">توزیع مخارج تیرماه</p>
                    <div className="flex items-center justify-between gap-2">
                      {/* Donut graphic */}
                      <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#059669" strokeWidth="4" strokeDasharray="38, 100" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#0D9488" strokeWidth="4" strokeDasharray="28, 100" strokeDashoffset="-38" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#F59E0B" strokeWidth="4" strokeDasharray="14, 100" strokeDashoffset="-66" />
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="4" strokeDasharray="20, 100" strokeDashoffset="-80" />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-[10px] font-bold text-zinc-400 block">خوراک</span>
                          <span className="text-xs font-black text-emerald-700">۴۱.۸٪</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="text-[10px] space-y-1 text-zinc-600">
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" /> غذا و خوراکی</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-600" /> حمل و نقل</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> مسکن و قبوض</div>
                        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> پس‌انداز و رشد</div>
                      </div>
                    </div>
                  </div>

                  {/* Category snippet */}
                  <div className="p-2.5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        🍔
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-800">غذا و خوراکی</p>
                        <p className="text-[10px] text-zinc-400">مواد غذایی، کافه و رستوران</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold font-mono text-zinc-800">۴۱.۸٪</span>
                  </div>
                </div>
              </div>

              {/* FLOATING CARD 1: Top-Left "حمل و نقل" */}
              <div className="absolute -top-6 -left-4 sm:left-4 z-20 w-56 p-3.5 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-emerald-100/90 hidden sm:block animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-right">
                    <h5 className="font-bold text-xs text-zinc-900">حمل و نقل</h5>
                    <p className="text-[9px] text-zinc-400">تاکسی، اتوبوس، بنزین، اسنپ</p>
                  </div>
                  {/* Circular gauge */}
                  <div className="relative w-11 h-11 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#FEE2E2" strokeWidth="4" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#EF4444" strokeWidth="4" strokeDasharray="100, 100" />
                    </svg>
                    <span className="absolute text-[10px] font-black text-rose-600">۱۲۰٪</span>
                  </div>
                </div>
                <div className="space-y-1 text-[10px] text-zinc-600 border-t border-zinc-100 pt-1.5">
                  <div className="flex justify-between"><span>بودجه:</span><span className="font-mono font-bold">۱۰۰,۰۰۰</span></div>
                  <div className="flex justify-between text-rose-600 font-bold"><span>هزینه:</span><span className="font-mono">۱۲۰,۰۰۰</span></div>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-[9px] font-bold">
                  <button onClick={handleLaunchApp} className="flex-1 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-center transition">
                    مشاهده تراکنش‌ها
                  </button>
                </div>
              </div>

              {/* FLOATING CARD 2: Bottom-Left "دونگ" screen preview */}
              <div className="absolute -bottom-10 -left-6 sm:left-0 z-20 w-64 p-4 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-emerald-100 hidden md:block">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span className="font-extrabold text-xs text-zinc-900">دونگ و خرج گروهی</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">فعال</span>
                </div>
                <div className="grid grid-cols-3 gap-1 py-2 text-center text-[10px]">
                  <div className="p-1.5 rounded-xl bg-rose-50 text-rose-700">
                    <span className="block text-[8px] text-zinc-400">بدهی</span>
                    <span className="font-bold font-mono">۲,۲۰۸,۴۵۷</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
                    <span className="block text-[8px] text-zinc-400">طلب</span>
                    <span className="font-bold font-mono">۱,۳۰۹,۲۳۲</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-teal-50 text-teal-800">
                    <span className="block text-[8px] text-zinc-400">تراز کل</span>
                    <span className="font-bold font-mono">۸۹۹,۲۲۵</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-50">
                    <span className="font-bold text-zinc-700">بچه‌های شرکت</span>
                    <span className="text-zinc-400 text-[9px]">۶ نفر</span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-xl bg-zinc-50">
                    <span className="font-bold text-zinc-700">تولد سجاد</span>
                    <span className="font-mono font-bold text-emerald-700">۶۹۹,۳۷۵ ت</span>
                  </div>
                </div>
              </div>

              {/* FLOATING CARD 3: Bottom-Right "غذا و خوراکی" Circular Gauge */}
              <div className="absolute -bottom-6 right-2 sm:right-6 z-20 w-44 p-3 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-emerald-100 hidden sm:block">
                <div className="text-center">
                  <p className="text-[11px] font-bold text-zinc-800">غذا و خوراکی</p>
                  <p className="text-[9px] text-zinc-400 mb-1.5">مواد غذایی، رستوران</p>
                  <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#E0F2FE" strokeWidth="4" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#059669" strokeWidth="4" strokeDasharray="60.27, 100" />
                    </svg>
                    <span className="absolute text-[10px] font-black text-emerald-800">۶۰.۲۷٪</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Text & Hero CTA (Right in RTL, cols 5) */}
            <div className="order-1 lg:order-2 lg:col-span-5 text-right space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>نسخه جدید چندبوم با هوش مالی پیشرفته</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-emerald-950 leading-[1.3] tracking-tight">
                مدیریت <span className="text-emerald-700">هوشمندانه</span> مالی
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-zinc-600 font-medium leading-relaxed">
                مدیریت هزینه‌ها، اولین قدم بهبود وضعیت مالی شماست؛ همین حالا با نسخه تحت وب شروع کنید:
              </p>

              {/* Dual Action Buttons (No app downloads!) */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button
                  onClick={handleLaunchApp}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-700/25 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  <Laptop className="w-4 h-4" />
                  <span>ورود به نسخه تحت وب (رایگان)</span>
                </button>

                <a
                  href="#features"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 font-bold text-sm transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>آشنایی با امکانات</span>
                </a>
              </div>

              {/* Social Proof Avatars */}
              <div className="pt-4 flex items-center gap-3">
                <div className="flex -space-x-2.5 space-x-reverse">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces" alt="کاربر چندبوم" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces" alt="کاربر چندبوم" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" alt="کاربر چندبوم" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                  <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces" alt="کاربر چندبوم" className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                </div>
                <div>
                  <span className="font-extrabold text-sm text-emerald-950 block">+۱۲ هزار</span>
                  <span className="text-xs text-zinc-500 font-medium">کاربر فعال ماهانه</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: ویژگی‌های برتر چندبوم (Features Section) */}
      <section id="features" className="relative z-10 py-20 bg-gradient-to-b from-transparent via-emerald-50/40 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950">
              ویژگی‌های <span className="text-emerald-700">برتر</span> چندبوم
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 font-medium">
              دلایلی که چندبوم را به انتخابی متفاوت و برتر برای مدیریت بودجه تبدیل می‌کند:
            </p>
          </div>

          {/* 3-Column Grid: Left Cards | Center Phone | Right Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Right Cards in RTL (2 items) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 1: امنیت داده‌ها */}
              <div className="p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 text-right space-y-3 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-lg text-emerald-950">
                  امنیت داده‌ها
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  با استفاده از استانداردهای امنیتی پیشرفته و رمزنگاری چندلایه، اطلاعات مالی شما کاملاً محرمانه نگه داشته می‌شود.
                </p>
              </div>

              {/* Card 2: کاربردی برای همه */}
              <div className="p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 text-right space-y-3 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-lg text-emerald-950">
                  کاربردی برای همه
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  رابط کاربری کاملاً فارسی و روان؛ مناسب برای تمام اقشار بدون نیاز به دانش تخصصی حسابداری یا مهارت‌های پیچیده.
                </p>
              </div>
            </div>

            {/* Center Phone Mockup (cols 4) */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-[300px] sm:w-[320px] bg-zinc-950 rounded-[48px] p-4 shadow-2xl border-4 border-zinc-900 ring-2 ring-emerald-200">
                {/* Notch */}
                <div className="w-24 h-4 bg-zinc-800 rounded-full mx-auto mb-4" />

                {/* Inner Screen */}
                <div className="bg-gradient-to-b from-emerald-800 to-teal-900 rounded-[36px] p-5 text-white text-center space-y-4 font-cairo shadow-inner">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>دستیار هوش مالی</span>
                  </div>

                  <h4 className="font-extrabold text-xl leading-tight">
                    مدیریت مالی شخصی
                  </h4>

                  <p className="text-xs text-emerald-100 leading-relaxed">
                    مدیریت هزینه‌ها، اولین قدم بهبود وضعیت مالی شماست؛ همین حالا شروع کنید.
                  </p>

                  <button
                    onClick={handleLaunchApp}
                    className="w-full py-2.5 rounded-xl bg-white text-emerald-800 font-extrabold text-xs shadow-md hover:bg-emerald-50 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>شروع کنید</span>
                  </button>

                  {/* Nested White Phone Screen Card */}
                  <div className="bg-white rounded-2xl p-3 text-zinc-900 text-right space-y-2 shadow-lg">
                    <div className="flex justify-between items-center text-[11px] font-bold text-zinc-500 border-b border-zinc-100 pb-1">
                      <span>اردیبهشت ۱۴۰۴</span>
                      <span className="font-mono text-emerald-800">۳۵,۰۰۰,۰۰۰ ت</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-600">مسکن و اجاره:</span>
                      <span className="font-bold text-rose-600 font-mono">۹۴.۷۴٪</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="w-[94%] h-full bg-rose-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Cards in RTL (2 items) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card 3: نسخه تحت وب و بدون نصب */}
              <div className="p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 text-right space-y-3 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <Laptop className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-lg text-emerald-950">
                  دسترسی تحت وب از همه‌جا
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  بدون نیاز به دانلود یا نصب، از طریق مرورگر انواع گوشی‌ها، تبلت و لپ‌تاپ به صورت پایدار و سریع در دسترس است.
                </p>
              </div>

              {/* Card 4: تحلیل مالی و هوش مصنوعی */}
              <div className="p-6 bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 text-right space-y-3 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-lg text-emerald-950">
                  تحلیل مالی و پیش‌بینی هوشمند
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  گزارش‌های دقیق تراز ماهانه، پیش‌بینی هوشمند جریان نقدینگی و تحلیل بودجه برای تصمیم‌گیری آگاهانه و پس‌انداز مستمر.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 3: مدیریت خرج‌های جمعی و دونگی (Dong Management) */}
      <section id="dong" className="relative z-10 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Visual Dong Phone & Breakdown (Left in RTL, cols 6) */}
            <div className="order-2 lg:order-1 lg:col-span-6 flex justify-center relative">
              {/* Backlight orb */}
              <div className="absolute w-80 h-80 bg-emerald-200/40 rounded-full blur-[90px] pointer-events-none" />

              {/* Mobile Dong Mockup */}
              <div className="relative z-10 w-[290px] sm:w-[310px] bg-white rounded-[44px] p-3 shadow-2xl border-4 border-emerald-50">
                <div className="w-20 h-3.5 bg-zinc-200 rounded-full mx-auto mb-3" />
                <div className="space-y-3 text-right">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 text-xs font-bold text-zinc-800">
                    <span>گروه‌های هم‌خرج من</span>
                    <Users className="w-4 h-4 text-emerald-700" />
                  </div>

                  {/* List of groups */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">☕️</span>
                        <div>
                          <p className="font-bold text-zinc-900">کافه و رستوران</p>
                          <p className="text-[10px] text-zinc-400">۲ نفر</p>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500">۱۴۰۳/۱۰/۲۳</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏖️</span>
                        <div>
                          <p className="font-bold text-zinc-900">سفر شمال دوستانه</p>
                          <p className="text-[10px] text-zinc-400">۴ نفر</p>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500">۱۴۰۳/۱۰/۱۵</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏠</span>
                        <div>
                          <p className="font-bold text-zinc-900">شارژ و قبوض ساختمان</p>
                          <p className="text-[10px] text-zinc-400">۸ نفر</p>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-zinc-500">۱۴۰۳/۱۰/۰۱</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLaunchDong}
                    className="w-full py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت گروه دنگ جدید</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dong Description & Stats Grid (Right in RTL, cols 6) */}
            <div className="order-1 lg:order-2 lg:col-span-6 text-right space-y-6">
              <h2 className="text-3xl sm:text-4xl font-black text-emerald-950">
                مدیریت <span className="text-emerald-700">خرج‌های جمعی</span> و دونگی
              </h2>

              <p className="text-sm sm:text-base text-zinc-600 font-medium leading-relaxed">
                چه برای یک سفر دوستانه، چه برای خرید گروهی یا تقسیم هزینه‌های روزمره، مدیریت خرج‌های جمعی را ساده و شفاف کنید. با ابزارهای هوشمند چندبوم، به‌راحتی هزینه‌ها را تقسیم کنید، تراکنش‌ها را ثبت نمایید و از درگیری‌های مالی دور بمانید.
              </p>

              {/* 4 Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-950 block font-mono">+۱۲۵</span>
                    <span className="text-xs text-zinc-500 font-bold">گروه هم‌خرج</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-950 block font-mono">+۶۸۰</span>
                    <span className="text-xs text-zinc-500 font-bold">کاربران هم‌خرج</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-950 block font-mono">+۲۳۰۰</span>
                    <span className="text-xs text-zinc-500 font-bold">تراکنش ثبت‌شده</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-950 block font-mono">۸۷٪</span>
                    <span className="text-xs text-zinc-500 font-bold">تسویه موفق</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleLaunchDong}
                  className="px-8 py-3.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  شروع محاسبه دنگ
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 4: نحوه کار – سه قدم آسان (How it Works) */}
      <section id="how-it-works" className="relative z-10 py-20 bg-gradient-to-b from-transparent via-emerald-50/30 to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950">
              نحوه کار – <span className="text-emerald-700">سه قدم آسان</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 font-medium">
              شروع سریع و آسان برای مدیریت هوشمندانه مالی در سه گام ساده
            </p>
          </div>

          {/* Timeline */}
          <div className="relative space-y-12 before:absolute before:inset-0 before:right-1/2 before:w-0.5 before:bg-emerald-200 before:hidden md:before:block">
            
            {/* Step 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
              <div className="text-right space-y-2 md:pl-12 order-2 md:order-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-900 font-black text-lg mb-2">
                  ۰۱
                </div>
                <h3 className="font-extrabold text-xl text-emerald-950">ورود مستقیم به نسخه تحت وب</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  وارد سامانه ابری چندبوم شوید؛ بدون نیاز به دانلود یا نصب هرگونه نرم‌افزار اضافی.
                </p>
              </div>

              <div className="order-1 md:order-2 flex justify-center">
                <div className="p-4 bg-white rounded-3xl shadow-xl border border-emerald-100 max-w-xs w-full text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                    <Laptop className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 block">دسترسی لحظه‌ای ابری</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
              <div className="order-1 flex justify-center">
                <div className="p-4 bg-white rounded-3xl shadow-xl border border-emerald-100 max-w-xs w-full text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 block">ثبت هوشمند یا پیامکی</span>
                </div>
              </div>

              <div className="text-right space-y-2 md:pr-12 order-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 text-teal-900 font-black text-lg mb-2">
                  ۰۲
                </div>
                <h3 className="font-extrabold text-xl text-emerald-950">ایجاد حساب و ثبت هزینه‌ها</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  با ایمیل خود ثبت‌نام کنید و هزینه‌های روزانه را صوتی، متنی یا با پیامک‌های بانکی با دقت وارد کنید.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
              <div className="text-right space-y-2 md:pl-12 order-2 md:order-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-900 font-black text-lg mb-2">
                  ۰۳
                </div>
                <h3 className="font-extrabold text-xl text-emerald-950">تحلیل هوشمند و پس‌انداز</h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                  گزارش‌های جامع مالی را دریافت کنید، بودجه‌بندی خود را بهینه نمایید و به اهداف مالی خود برسید.
                </p>
              </div>

              <div className="order-1 md:order-2 flex justify-center">
                <div className="p-4 bg-white rounded-3xl shadow-xl border border-emerald-100 max-w-xs w-full text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 block">پیش‌بینی هوشمند بودجه ۳ ماهه</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 5: نسخه تحت وب و سامانه ابری چندبوم (Vibrant Emerald Banner - Pure Web Platform) */}
      <section id="web-app" className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-tr from-[#064E3B] via-[#047857] to-[#059669] rounded-[44px] p-8 sm:p-12 lg:p-16 text-white shadow-2xl overflow-hidden relative">
            
            {/* Background patterns */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-950/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left Side: Web App Interface Preview */}
              <div className="order-2 lg:order-1 lg:col-span-6 flex justify-center relative">
                {/* Screen Card 1 */}
                <div className="w-56 sm:w-64 bg-white rounded-[36px] p-2.5 text-zinc-900 shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                  <div className="w-16 h-3 bg-zinc-200 rounded-full mx-auto mb-2" />
                  <div className="bg-emerald-50/70 p-3 rounded-2xl text-right space-y-2 text-xs">
                    <p className="text-[10px] text-zinc-500">امروز چهارشنبه، ۲۵ تیر</p>
                    <p className="text-xs font-bold text-zinc-700">امروز چقدر خرج کردی؟</p>
                    <p className="text-lg font-black text-emerald-800 font-mono">۱,۲۱۶,۰۰۰ ت</p>
                    <div className="grid grid-cols-3 gap-1 pt-1 text-[9px] font-bold text-center">
                      <span className="p-1 rounded bg-white shadow-2xs">تراکنش‌ها</span>
                      <span className="p-1 rounded bg-white shadow-2xs">بودجه‌بندی</span>
                      <span className="p-1 rounded bg-white shadow-2xs">دونگ‌ها</span>
                    </div>
                  </div>
                </div>

                {/* Screen Card 2 Overlay */}
                <div className="w-52 sm:w-60 bg-white rounded-[36px] p-2.5 text-zinc-900 shadow-2xl absolute -bottom-6 -left-2 sm:left-4 hidden sm:block transform rotate-6 hover:rotate-0 transition-transform duration-300">
                  <div className="w-16 h-3 bg-zinc-200 rounded-full mx-auto mb-2" />
                  <div className="p-3 text-right space-y-1.5 text-xs">
                    <span className="font-extrabold text-xs block text-zinc-800">بودجه تیرماه</span>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">سقف مجاز:</span>
                      <span className="font-bold font-mono">۲۰,۰۰۰,۰۰۰ ت</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
                      <div className="w-[68%] h-full bg-emerald-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Text & Pure Web Badges */}
              <div className="order-1 lg:order-2 lg:col-span-6 text-right space-y-6">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white">
                  سامانه ابری و نسخه تحت وب چندبوم
                </h2>

                <p className="text-emerald-100 text-sm sm:text-base font-medium leading-relaxed">
                  چندبوم کاملاً مبتنی بر وب و بدون نیاز به نصب هرگونه فایل طراحی شده است؛ از طریق مرورگر انواع گوشی‌ها، تبلت و کامپیوتر همیشه و در هر زمان به حساب مالی خود دسترسی دارید.
                </p>

                {/* 4 Feature Badges (Pure Web - No app installation) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <button
                    onClick={handleLaunchApp}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-right cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-emerald-200 block">دسترسی ابری و تحت وب</span>
                      <span className="font-extrabold text-xs text-white">ورود بدون نیاز به نصب فایل</span>
                    </div>
                    <Laptop className="w-6 h-6 text-white" />
                  </button>

                  <button
                    onClick={handleLaunchApp}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-right cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-emerald-200 block">سازگار با مرورگرها</span>
                      <span className="font-extrabold text-xs text-white">موبایل، تبلت و کامپیوتر</span>
                    </div>
                    <Globe className="w-6 h-6 text-white" />
                  </button>

                  <button
                    onClick={handleLaunchApp}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-right cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-emerald-200 block">همگام‌سازی لحظه‌ای</span>
                      <span className="font-extrabold text-xs text-white">پایگاه داده ابری و ایمن</span>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </button>

                  <button
                    onClick={handleLaunchApp}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white text-zinc-900 shadow-lg hover:bg-emerald-50 transition-all text-right cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold block">شروع فوری</span>
                      <span className="font-black text-xs text-emerald-950">ورود به نسخه تحت وب</span>
                    </div>
                    <ArrowLeft className="w-5 h-5 text-emerald-800" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: سوالات متداول (FAQ Accordion) */}
      <section id="faq" className="relative z-10 py-20 bg-gradient-to-b from-transparent via-emerald-50/20 to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950">
              سوالات متداول – <span className="text-emerald-700">پاسخ به سوالات شما</span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 font-medium">
              پاسخ به رایج‌ترین پرسش‌های کاربران درباره سامانه تحت وب چندبوم
            </p>
          </div>

          <div className="space-y-3.5">
            {faqItems.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-xs border border-emerald-100 overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-emerald-950 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <span className="leading-snug">{item.q}</span>
                    <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-700">
                      {isOpen ? (
                        <span className="text-xl font-bold leading-none">−</span>
                      ) : (
                        <span className="text-xl font-bold leading-none">+</span>
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-emerald-50 animate-in fade-in duration-150">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 7: خواندن آخرین مطالب اقتصادی و مدیریت مالی (Blog / Articles) */}
      <section id="blog" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-950">
              خواندن آخرین <span className="text-emerald-700">مطالب اقتصادی</span> و مدیریت مالی
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 font-medium">
              جدیدترین مقالات و راهنمایی‌ها در زمینه مدیریت مالی شخصی، سرمایه‌گذاری و پس‌انداز
            </p>
          </div>

          {/* 3 Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {articles.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 flex flex-col group text-right"
              >
                {/* Article Header Image Graphic */}
                <div className="h-48 bg-gradient-to-tr from-emerald-100 to-teal-100 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  
                  {art.id === 'financial-movies' ? (
                    <div className="w-full h-full bg-cover bg-center flex items-end p-4 text-white relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80')` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <span className="relative z-10 text-xs font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md">
                        {art.date}
                      </span>
                    </div>
                  ) : art.id === 'dong-guide' ? (
                    <div className="w-full h-full bg-cover bg-center flex items-end p-4 text-white relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80')` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <span className="relative z-10 text-xs font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md">
                        {art.date}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-cover bg-center flex items-end p-4 text-white relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80')` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <span className="relative z-10 text-xs font-bold px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md">
                        {art.date}
                      </span>
                    </div>
                  )}

                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-emerald-800 text-[10px] font-extrabold shadow-sm border border-emerald-100">
                    {art.category}
                  </span>
                </div>

                {/* Article Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-base text-emerald-950 group-hover:text-emerald-700 transition-colors leading-snug">
                      {art.title}
                    </h3>
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                      {art.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px] font-medium">{art.readTime}</span>
                    <button
                      onClick={() => setSelectedArticle(art)}
                      className="text-emerald-700 font-bold hover:text-emerald-800 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>ادامه مطلب</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <a href="/articles" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-600">
              مشاهده همه ۷ مقاله آموزشی <ArrowLeft className="h-4 w-4" />
            </a>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-white border-t border-emerald-100 py-12 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-emerald-500/40 p-1 flex items-center justify-center shadow-md shadow-emerald-700/10 shrink-0">
                <img
                  src="./logo.png"
                  alt="لوگوی رسمی چندبوم"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = './assets/logo.png';
                  }}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-brand font-bold text-2xl text-emerald-950 block">چندبوم</span>
                <span className="text-xs text-zinc-500 font-medium">سامانه هوشمند مدیریت مالی شخصی، بودجه‌بندی و دنگ گروهی</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-zinc-600">
              <a href="#features" className="hover:text-emerald-700 transition">ویژگی‌ها</a>
              <a href="#how-it-works" className="hover:text-emerald-700 transition">نحوه کار</a>
              <a href="#dong" className="hover:text-emerald-700 transition">مدیریت دنگ</a>
              <a href="#web-app" className="hover:text-emerald-700 transition">نسخه تحت وب</a>
              <a href="#blog" className="hover:text-emerald-700 transition">بلاگ</a>
              <a href="#faq" className="hover:text-emerald-700 transition">سوالات متداول</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
            <p>© {new Date().toLocaleDateString('fa-IR')} تمامی حقوق مادی و معنوی متعلق به سامانه چندبوم می‌باشد.</p>
            <div className="flex items-center gap-2 text-zinc-600 font-mono" dir="ltr">
              <span className="text-[11px] text-zinc-400 font-sans">پشتیبانی و ارتباط مستقیم:</span>
              <a href="mailto:info.chandboom.app@gmail.com" className="hover:text-emerald-700 font-bold">
                info.chandboom.app@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* FLOATING ACTION BUTTONS */}

      {/* 1. Back to Top Button (Bottom-Left) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          title="بازگشت به ابتدای صفحه"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* 2. Floating Online Support Button (Bottom-Right) -> Opens Support/Tickets */}
      <button
        onClick={handleOpenSupport}
        className="fixed bottom-6 right-6 z-50 p-2.5 rounded-full bg-white hover:bg-emerald-50 shadow-2xl border-2 border-emerald-600/30 flex items-center gap-2.5 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer group"
        title="ارسال تیکت و ارتباط مستقیم با پشتیبانی چندبوم"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
          <Headphones className="w-5 h-5" />
        </div>
        <div className="hidden sm:block text-right pr-1 pl-3">
          <span className="text-[10px] text-zinc-400 block font-bold leading-none">تیکت و راهنما</span>
          <span className="text-xs font-black text-emerald-950">پشتیبانی چندبوم</span>
        </div>
      </button>

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-emerald-100 max-h-[85vh] flex flex-col text-right font-cairo">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">{selectedArticle.readTime}</span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {selectedArticle.category}
                </span>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-emerald-950 leading-snug">
                {selectedArticle.title}
              </h2>

              <p className="text-xs sm:text-sm text-emerald-800 font-bold bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
                {selectedArticle.summary}
              </p>

              <div className="space-y-3 pt-2 text-xs sm:text-sm text-zinc-700 leading-relaxed">
                {selectedArticle.content.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {/* Key takeaways */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2 mt-4">
                <h4 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>نکات کلیدی این مقاله برای مدیریت مالی شما:</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-600 pr-5 list-disc">
                  {selectedArticle.keyTakeaways.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedArticle(null);
                  handleLaunchApp();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                شروع مدیریت مالی با چندبوم
              </button>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 font-bold text-xs hover:bg-zinc-100 transition cursor-pointer"
              >
                بستن
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
