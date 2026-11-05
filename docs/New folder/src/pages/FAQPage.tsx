import React, { useState } from 'react';
import { SEOLayout } from '../components/SEOLayout';
import { SEOHead } from '../components/SEOHead';
import { ChevronDown, HelpCircle, Search, Shield, Zap, Sparkles } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: 'عمومی و امنیت',
    q: 'سامانه چندبوم چیست و چه کمکی به مدیریت مالی من می‌کند؟',
    a: 'چندبوم یک سامانه هوشمند مدیریت مالی شخصی (PFM) است که با ترکیب تحلیل هوش مصنوعی، ثبت آسان پیامک‌های بانکی، تقسیم عادلانه دنگ گروهی و یادآورهای موعد چک و اقساط، به شما کمک می‌کند بر جریان نقدی، هزینه‌ها و پس‌انداز ماهانه خود تسلط کامل داشته باشید.',
  },
  {
    category: 'عمومی و امنیت',
    q: 'آیا چندبوم به رمز دوم یا اطلاعات حساب بانکی من دسترسی دارد؟',
    a: 'خیر، به هیچ وجه. چندبوم هیچ‌گونه دسترسی به اطلاعات محرمانه بانکی، رمزهای عبور، شماره CVV2 یا حساب‌های شما ندارد. فرآیند ثبت تراکنش بر اساس اطلاعات ارسالی پیامک یا ثبت دستی خود شما انجام می‌شود و تمام داده‌ها در لایه پایگاه داده رمزنگاری می‌شوند.',
  },
  {
    category: 'پیامک بانکی و هوش مصنوعی',
    q: 'قابلیت ثبت خودکار پیامک بانکی چگونه کار می‌کند؟',
    a: 'کافی است متن پیامک واریز یا برداشت از هر بانک ایرانی (ملی، ملت، سامان، بلو، رسالت و ...) را در کادر پیامک بانکی کپی کنید. هوش مصنوعی چندبوم به طور خودکار نوع تراکنش، مبلغ، تاریخ و نام بانک را استخراج کرده و دسته‌بندی مناسب را به شما پیشنهاد می‌دهد.',
  },
  {
    category: 'پیامک بانکی و هوش مصنوعی',
    q: 'دستیار هوش مصنوعی چندبوم چه قابلیت‌هایی دارد؟',
    a: 'دستیار هوشمند چندبوم با مدل‌های زبانی پیشرفته هماهنگ شده و می‌تواند وضعیت بودجه ۳ ماه آینده شما را پیش‌بینی کند، خریدهای تکانه‌ای و هیجانی را مهار کند، و شما را در ساخت اهداف مالی و دنگ گروهی راهنمایی نماید.',
  },
  {
    category: 'دنگ و اهداف مالی',
    q: 'محاسبه دنگ گروهی چگونه کار می‌کند؟',
    a: 'شما می‌توانید برای سفرها، مهمانی‌ها یا خرج‌های اشتراکی خانه یک گروه دنگ بسازید. هر فرد هزینه‌هایی که پرداخت کرده را ثبت می‌کند و سیستم با الگوریتم کمینه‌سازی تسویه، مشخص می‌کند چه کسی باید به چه کسی و چه مبلغی پرداخت کند تا تسویه کامل حاصل شود.',
  },
  {
    category: 'اشتراک و تعرفه‌ها',
    q: 'تفاوت نسخه رایگان و اشتراک طلایی (Pro) چیست؟',
    a: 'نسخه رایگان امکان ثبت تراکنش و بودجه‌بندی پایه را فراهم می‌کند. اشتراک طلایی شامل دسترسی کامل به دستیار هوش مصنوعی بدون محدودیت، پیش‌بینی ۳ ماهه بودجه، ثبت صوتی نامحدود، خروجی گزارش‌های اکسل با فرمت رسمی و پشتیبانی اختصاصی می‌باشد.',
  },
  {
    category: 'اشتراک و تعرفه‌ها',
    q: 'فرآیند فعال‌سازی اشتراک طلایی چگونه است؟',
    a: 'پرداخت از طریق کارت‌به‌کارت مطمئن شتابی انجام می‌پذیرد. پس از ثبت شماره پیگیری و فیش، بررسی در سریع‌ترین زمان توسط کارشناسان انجام شده و اشتراک شما فعال می‌گردد.',
  },
];

export const FAQPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('همه');
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndices, setOpenIndices] = useState<number[]>([0, 1]);

  const categories = ['همه', 'عمومی و امنیت', 'پیامک بانکی و هوش مصنوعی', 'دنگ و اهداف مالی', 'اشتراک و تعرفه‌ها'];

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const matchesCategory = activeCategory === 'همه' || item.category === activeCategory;
    const matchesSearch =
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Schema.org FAQPage structured data
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <SEOLayout>
      <SEOHead
        title="سوالات متداول | چندبوم - سامانه مدیریت مالی شخصی"
        description="پاسخ به متداول‌ترین سوالات درباره مدیریت مالی، امنیت حساب، ثبت پیامک بانکی، هوش مصنوعی چندبوم و محاسبه دنگ سفر."
        canonicalPath="/faq"
        structuredData={faqStructuredData}
      />

      <div className="space-y-8 animate-in fade-in duration-200">
        {/* Page Hero Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>مرکز راهنمایی و پاسخ به پرسش‌ها</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            سوالات متداول کاربران چندبوم
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            پاسخ سریع به رایج‌ترین پرسش‌ها درباره قابلیت‌های سامانه، امنیت حساب کاربری و اشتراک طلایی
          </p>

          {/* Search box */}
          <div className="relative max-w-md mx-auto pt-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در بین سوالات متداول..."
              className="w-full px-4 py-3 pr-10 rounded-2xl bg-white dark:bg-[#111A15] border border-[#E2E8E4] dark:border-[#1E2D25] text-xs sm:text-sm outline-none focus:border-emerald-500 transition shadow-xs text-zinc-900 dark:text-white"
            />
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-5" />
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-[#131F19] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-[#111A15] rounded-3xl border border-[#E2E8E4] dark:border-[#1E2D25]">
              <p className="text-xs text-zinc-500">موردی متناسب با جستجوی شما یافت نشد.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndices.includes(index);
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] overflow-hidden transition shadow-xs"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-right cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#131E18] transition"
                  >
                    <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {faq.q}
                    </h2>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-500' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-[#17231D]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </SEOLayout>
  );
};
