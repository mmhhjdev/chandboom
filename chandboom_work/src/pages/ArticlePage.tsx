import React, { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';
import { SEOHead } from '../components/SEOHead';
import { SEOLayout } from '../components/SEOLayout';
import { ARTICLES } from '../data/articles';

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{slug:string}>();
  const article = useMemo(() => ARTICLES.find((item) => item.slug === slug), [slug]);
  if (!article) return <Navigate to="/articles" replace />;
  const related = ARTICLES.filter((item) => item.slug !== article.slug).slice(0, 3);
  const schema = {'@context':'https://schema.org','@type':'Article','headline':article.title,'description':article.description,'image':`https://chandboom.ir/assets/articles/${article.slug}.svg`,'mainEntityOfPage':`https://chandboom.ir/articles/${article.slug}`,'publisher':{'@type':'Organization','name':'چندبوم','url':'https://chandboom.ir'},'inLanguage':'fa-IR'};
  return <SEOLayout>
    <SEOHead title={`${article.title} | مجله چندبوم`} description={article.description} canonicalPath={`/articles/${article.slug}`} structuredData={schema} />
    <article className="mx-auto max-w-3xl">
      <nav className="mb-6 text-xs text-zinc-500"><Link to="/articles" className="hover:text-emerald-700">مجله چندبوم</Link><span className="mx-2">/</span><span>{article.category}</span></nav>
      <header className="mb-8 space-y-5">
        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">{article.category}</span>
        <h1 className="text-3xl sm:text-4xl font-black leading-[1.8] text-zinc-950 dark:text-white">{article.title}</h1>
        <p className="text-base leading-8 text-zinc-600 dark:text-zinc-300">{article.description}</p>
        <img src={`/assets/articles/${article.slug}.svg`} alt={article.alt} className="mt-6 max-h-[430px] w-full rounded-3xl border border-emerald-100 object-cover dark:border-emerald-900/60" width="1200" height="630" fetchPriority="high"/>
      </header>
      <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm leading-8 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100"><strong>در این راهنما:</strong> {article.sections.map(s=>s.heading).join('، ')}.</div>
      <div className="article-body space-y-8">
        {article.sections.map((section, i) => <section key={`${article.slug}-${i}`} className="space-y-3">
          <h2 className="border-r-4 border-emerald-500 pr-4 text-xl sm:text-2xl font-black leading-9 text-zinc-900 dark:text-white">{section.heading}</h2>
          {section.paragraphs.map((paragraph, j) => <p key={j} className="text-[15px] leading-9 text-zinc-700 dark:text-zinc-300">{paragraph}</p>)}
        </section>)}
      </div>
      <aside className="mt-10 flex gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/50"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-600"/><p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">این مطلب آموزشی است و جایگزین بررسی شرایط شخصی یا مشاوره تخصصی مالی نیست. پیش از تصمیم‌گیری، اعداد و اطلاعات خود را بررسی کنید.</p></aside>
      <div className="mt-10 flex items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800"><Link to="/articles" className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300"><ArrowRight className="h-4 w-4"/> همه مقالات</Link><Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-600">ورود به چندبوم <ArrowLeft className="h-4 w-4"/></Link></div>
      <section className="mt-14 space-y-5"><h2 className="text-xl font-black">مطالب مرتبط</h2><div className="grid gap-3 sm:grid-cols-3">{related.map(item=><Link key={item.slug} to={`/articles/${item.slug}`} className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm font-bold leading-7 hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900">{item.title}<span className="mt-2 block text-xs font-semibold text-emerald-700 dark:text-emerald-300">مطالعه مقاله ←</span></Link>)}</div></section>
    </article>
  </SEOLayout>;
};
