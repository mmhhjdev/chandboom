import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, Clock3, Search } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { SEOLayout } from '../components/SEOLayout';
import { ARTICLES, BlogArticle } from '../data/articles';
import { formatArticleDate, readingTimeLabel, toPersianDigits } from '../utils/articleFormat';

const ALL = 'همه';

const ArticleCard: React.FC<{ article: BlogArticle; featured?: boolean }> = ({ article, featured = false }) => (
  <article
    className={`group flex flex-col overflow-hidden rounded-3xl border bg-white dark:bg-[#0B1510] transition-shadow hover:shadow-lg ${
      featured ? 'border-emerald-300 dark:border-emerald-700' : 'border-zinc-200 dark:border-zinc-800'
    }`}
  >
    <Link to={`/articles/${article.slug}`} className="flex flex-1 flex-col gap-4 p-6" aria-label={`مطالعه ${article.title}`}>
      <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
        {article.category}
      </span>
      <h2 className="text-lg font-black leading-8 text-zinc-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
        {article.title}
      </h2>
      <p className="line-clamp-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{article.description}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatArticleDate(article.publishedAt)}</span>
          <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />{readingTimeLabel(article.readingTime)}</span>
        </span>
        <span className="inline-flex items-center gap-1 font-extrabold text-emerald-700 dark:text-emerald-300">
          ادامه مطلب <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  </article>
);

export const BlogPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(() => [ALL, ...Array.from(new Set(ARTICLES.map((a) => a.category)))], []);
  const featured = useMemo(() => ARTICLES.filter((a) => a.isFeatured).slice(0, 3), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ARTICLES.filter((a) => {
      if (category !== ALL && a.category !== category) return false;
      if (!q) return true;
      return [a.title, a.description, a.keyword, ...a.keywords].some((text) => text.toLowerCase().includes(q));
    });
  }, [query, category]);

  return (
    <SEOLayout>
      <SEOHead
        title="مجله مدیریت مالی شخصی | مقالات آموزشی چندبوم"
        description="راهنماهای آموزشی مدیریت مالی شخصی درباره بودجه‌بندی، پس‌انداز، مدیریت بدهی، صندوق اضطراری و استفاده از هوش مصنوعی در مجله چندبوم."
        canonicalPath="/articles"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'مجله مدیریت مالی چندبوم',
          url: 'https://chandboom.ir/articles',
          inLanguage: 'fa-IR',
        }}
      />
      <div className="space-y-12">
        <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-6 py-10 text-white sm:px-10 sm:py-14">
          <div className="relative max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> مجله چندبوم
            </span>
            <h1 className="text-3xl font-black leading-tight sm:text-5xl">
              دانش مالی؛ برای تصمیم‌های <span className="text-emerald-200">هوشمندانه‌تر</span>
            </h1>
            <p className="max-w-xl text-sm leading-8 text-emerald-50 sm:text-base">
              {toPersianDigits(ARTICLES.length)} راهنمای آموزشی درباره بودجه‌بندی، پس‌انداز، مدیریت بدهی و نقش هوش مصنوعی در مدیریت مالی شخصی.
              هر مقاله آدرس اختصاصی دارد و با مثال‌های ساده توضیح داده شده است.
            </p>
          </div>
        </header>

        {featured.length > 0 && (
          <section aria-labelledby="featured-heading" className="space-y-5">
            <h2 id="featured-heading" className="text-xl font-black">مقالات منتخب</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {featured.map((article) => <ArticleCard key={article.slug} article={article} featured />)}
            </div>
          </section>
        )}

        <section aria-labelledby="all-heading" className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="all-heading" className="text-xl font-black">همه مقالات</h2>
            <label className="relative w-full sm:w-72">
              <span className="sr-only">جست‌وجوی مقالات</span>
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جست‌وجو در مقالات"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pr-10 pl-4 text-sm outline-none focus:border-emerald-500 dark:border-zinc-800 dark:bg-[#0B1510]"
              />
            </label>
          </div>

          <div role="group" aria-label="فیلتر دسته‌بندی" className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                  category === item
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-400 dark:border-zinc-800 dark:bg-[#0B1510] dark:text-zinc-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((article) => <ArticleCard key={article.slug} article={article} />)}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              مقاله‌ای با این مشخصات پیدا نشد.
            </p>
          )}
        </section>
      </div>
    </SEOLayout>
  );
};
