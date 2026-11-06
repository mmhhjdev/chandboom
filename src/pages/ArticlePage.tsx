import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, ShieldCheck } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { SEOLayout } from '../components/SEOLayout';
import { ARTICLES, ArticleBlock, LEGACY_SLUGS, getArticleBySlug } from '../data/articles';
import { formatArticleDate, readingTimeLabel, sectionAnchor } from '../utils/articleFormat';

const SITE = 'https://chandboom.ir';
const DEFAULT_IMAGE = `${SITE}/chandboom-smart-personal-finance-hero.jpg`;

const Block: React.FC<{ block: ArticleBlock }> = ({ block }) => {
  switch (block.type) {
    case 'p':
      return <p className="text-[15px] leading-9 text-zinc-700 dark:text-zinc-300">{block.text}</p>;
    case 'ul':
      return (
        <ul className="list-disc space-y-2 pr-6 text-[15px] leading-8 text-zinc-700 dark:text-zinc-300">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'table':
      return (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[280px] text-right text-sm">
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className={r === 0 ? 'bg-emerald-50 font-bold dark:bg-emerald-950/40' : 'border-t border-zinc-100 dark:border-zinc-800'}>
                  {row.map((cell, c) => (
                    <td key={c} className="px-4 py-3 align-top">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'faq':
      return (
        <div className="space-y-5">
          {block.items.map((item, i) => (
            <div key={i} className="space-y-2">
              <h3 className="text-base font-black leading-7 text-zinc-900 dark:text-white">{item.q}</h3>
              <p className="text-[15px] leading-8 text-zinc-700 dark:text-zinc-300">{item.a}</p>
            </div>
          ))}
        </div>
      );
  }
};

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = useMemo(() => getArticleBySlug(slug), [slug]);
  // Hooks must run before any early return.
  const related = useMemo(() => {
    if (!article) return [];
    const others = ARTICLES.filter((item) => item.slug !== article.slug);
    const sameCategory = others.filter((item) => item.category === article.category);
    const rest = others.filter((item) => item.category !== article.category);
    return [...sameCategory, ...rest].slice(0, 3);
  }, [article]);

  if (!article) {
    const target = slug && LEGACY_SLUGS[slug];
    if (target && getArticleBySlug(target)) return <Navigate to={`/articles/${target}`} replace />;
    return <Navigate to="/articles" replace />;
  }

  const url = `${SITE}/articles/${article.slug}`;
  const faqItems = article.sections.flatMap((s) => s.blocks).flatMap((b) => (b.type === 'faq' ? b.items : []));

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.description,
      keywords: article.keywords.join(', '),
      image: DEFAULT_IMAGE,
      mainEntityOfPage: url,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      inLanguage: 'fa-IR',
      articleSection: article.category,
      author: { '@type': 'Organization', name: 'مجله چندبوم' },
      publisher: { '@type': 'Organization', name: 'چندبوم', url: SITE },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'مجله چندبوم', item: `${SITE}/articles` },
        { '@type': 'ListItem', position: 2, name: article.title, item: url },
      ],
    },
  ];
  if (faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  return (
    <SEOLayout>
      <SEOHead
        title={article.seoTitle}
        description={article.description}
        keywords={article.keywords.join(', ')}
        image={DEFAULT_IMAGE}
        canonicalPath={`/articles/${article.slug}`}
        structuredData={{ '@context': 'https://schema.org', '@graph': graph }}
      />
      <article className="mx-auto max-w-3xl">
        <nav aria-label="مسیر راهنما" className="mb-6 text-xs text-zinc-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/articles" className="hover:text-emerald-700">مجله چندبوم</Link></li>
            <li aria-hidden="true">/</li>
            <li>{article.category}</li>
          </ol>
        </nav>

        <header className="mb-8 space-y-5">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
            {article.category}
          </span>
          <h1 className="text-3xl font-black leading-[1.8] text-zinc-950 sm:text-4xl dark:text-white">{article.title}</h1>
          <p className="text-base leading-8 text-zinc-600 dark:text-zinc-300">{article.description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> انتشار: {formatArticleDate(article.publishedAt)}
            </span>
            {article.updatedAt !== article.publishedAt && (
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
                به‌روزرسانی: {formatArticleDate(article.updatedAt)}
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> {readingTimeLabel(article.readingTime)}
            </span>
          </div>
        </header>

        <nav aria-label="فهرست مطالب" className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm leading-8 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
          <strong className="mb-2 block">فهرست مطالب</strong>
          <ol className="grid list-decimal gap-1 pr-5 sm:grid-cols-2">
            {article.sections.map((section, i) => (
              <li key={sectionAnchor(i)}>
                <a className="hover:underline" href={`#${sectionAnchor(i)}`}>{section.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {article.sections.map((section, i) => (
            <section key={sectionAnchor(i)} id={sectionAnchor(i)} className="scroll-mt-24 space-y-4">
              <h2 className="border-r-4 border-emerald-500 pr-4 text-xl font-black leading-9 text-zinc-900 sm:text-2xl dark:text-white">
                {section.heading}
              </h2>
              {section.blocks.map((block, j) => <Block key={j} block={block} />)}
            </section>
          ))}
        </div>

        <aside className="mt-10 flex gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
          <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
          <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            این مطلب آموزشی است و جایگزین مشاوره تخصصی مالی یا حقوقی نیست. پیش از تصمیم‌گیری، اعداد و شرایط شخصی خود را بررسی کنید.
          </p>
        </aside>

        <p className="mt-6 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
          اگر می‌خواهید این روش‌ها را در عمل امتحان کنید، امکانات ثبت تراکنش، بودجه‌بندی و یادآور در
          {' '}<Link to="/features" className="font-bold text-emerald-700 hover:underline dark:text-emerald-300">صفحه امکانات چندبوم</Link>{' '}
          توضیح داده شده‌اند.
        </p>

        <div className="mt-10 flex items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
            <ArrowRight className="h-4 w-4" aria-hidden="true" /> همه مقالات
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-600">
            ورود به چندبوم <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-14 space-y-5">
            <h2 id="related-heading" className="text-xl font-black">مطالب مرتبط</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/articles/${item.slug}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-bold leading-7 hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {item.title}
                  <span className="mt-2 block text-xs font-semibold text-emerald-700 dark:text-emerald-300">مطالعه مقاله ←</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </SEOLayout>
  );
};
