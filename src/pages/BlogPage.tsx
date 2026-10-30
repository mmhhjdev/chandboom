import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock3 } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { SEOLayout } from '../components/SEOLayout';
import { ARTICLES } from '../data/articles';

export const BlogPage: React.FC = () => (
  <SEOLayout>
    <SEOHead title="مجله مدیریت مالی شخصی | مقالات آموزشی چندبوم" description="هفت راهنمای جامع مدیریت مالی شخصی، بهترین اپلیکیشن مدیریت مالی، مدیریت مالی با هوش مصنوعی، کنترل دخل‌وخرج، بودجه‌بندی، پس‌انداز و دنگ گروهی در مجله چندبوم." keywords="بهترین اپلیکیشن مدیریت مالی شخصی، مدیریت مالی با هوش مصنوعی، مدیریت دخل و خرج، مدیریت دنگ، بودجه بندی ماهانه، پس انداز" image="https://chandboom.ir/assets/articles/best-personal-finance-app.svg" canonicalPath="/articles" structuredData={{'@context':'https://schema.org','@type':'Blog','name':'مجله مدیریت مالی چندبوم','url':'https://chandboom.ir/articles','inLanguage':'fa-IR'}} />
    <section className="space-y-10">
      <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-6 py-10 sm:px-10 sm:py-14 text-white">
        <div className="absolute -left-12 -top-16 h-56 w-56 rounded-full border-[35px] border-white/10" />
        <div className="relative max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold"><BookOpen className="h-4 w-4"/> مجله چندبوم</span>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">دانش مالی؛ برای تصمیم‌های <span className="text-emerald-200">هوشمندانه‌تر</span></h1>
          <p className="max-w-xl text-sm sm:text-base leading-8 text-emerald-50">هفت راهنمای جامع و کاربردی درباره مدیریت دخل‌وخرج، بودجه‌بندی، پس‌انداز، هوش مصنوعی و تقسیم منصفانه دنگ؛ هر مقاله با مسیر اختصاصی، تصویر موضوعی و ساختار خوانا.</p>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((article, index) => <article key={article.slug} className="group overflow-hidden rounded-3xl border border-emerald-100 dark:border-emerald-900/60 bg-white dark:bg-[#0B1510] shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all">
          <Link to={`/articles/${article.slug}`} className="block" aria-label={`مطالعه ${article.title}`}>
            <div className={`relative h-48 overflow-hidden bg-gradient-to-br ${['from-teal-100 to-emerald-300','from-amber-100 to-emerald-200','from-cyan-100 to-teal-300','from-lime-100 to-emerald-300','from-orange-100 to-rose-200','from-sky-100 to-teal-200','from-emerald-100 to-lime-300'][index]}`}>
              <img src={`/assets/articles/${article.slug}.svg`} alt={article.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
              <span className="absolute right-4 top-4 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-[11px] font-extrabold text-emerald-900">{article.category}</span>
            </div>
            <div className="space-y-4 p-5">
              <h2 className="text-lg font-black leading-8 text-zinc-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{article.title}</h2>
              <p className="line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{article.summary}</p>
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-4 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-400"><Clock3 className="h-3.5 w-3.5"/> حدود ۱۰ دقیقه مطالعه</span>
                <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 dark:text-emerald-300">ادامه مطلب <ArrowLeft className="h-4 w-4"/></span>
              </div>
            </div>
          </Link>
        </article>)}
      </div>
    </section>
  </SEOLayout>
);
