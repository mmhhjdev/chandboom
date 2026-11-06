import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ARTICLES } from '../data/articles';

/**
 * Compact internal-link block that points product and FAQ pages to the journal.
 * Shows featured articles; falls back to the newest ones.
 */
export const ArticleLinks: React.FC<{ title?: string; limit?: number }> = ({
  title = 'برای یادگیری بیشتر، از مجله چندبوم بخوانید',
  limit = 3,
}) => {
  const featured = ARTICLES.filter((a) => a.isFeatured);
  const items = (featured.length > 0 ? featured : ARTICLES).slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="article-links-heading" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 sm:p-8 dark:border-emerald-900/50 dark:bg-[#0B1510]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 id="article-links-heading" className="text-lg font-black text-zinc-900 dark:text-white">{title}</h2>
          <Link to="/articles" className="inline-flex items-center gap-1 text-sm font-extrabold text-emerald-700 hover:underline dark:text-emerald-300">
            همه مقالات <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3">
          {items.map((article) => (
            <li key={article.slug}>
              <Link
                to={`/articles/${article.slug}`}
                className="block h-full rounded-2xl border border-zinc-200 p-4 text-sm font-bold leading-7 text-zinc-800 hover:border-emerald-400 dark:border-zinc-800 dark:text-zinc-100"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
