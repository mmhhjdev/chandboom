import raw from './articles.json';

/**
 * Editorial content for the Chandboom journal.
 *
 * Source: src/data/articles.json (generated once from the editorial .docx collection).
 * Static content only: no AI or API call is made to read or render an article.
 *
 * To add or edit an article, change articles.json. Every article must have a unique slug,
 * seoTitle and description; scripts/generate-seo.mjs fails the build if they are not.
 */

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'table'; rows: string[][] }
  | { type: 'faq'; items: { q: string; a: string }[] };

export interface ArticleSection {
  heading: string;
  blocks: ArticleBlock[];
}

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface BlogArticle {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  keyword: string;
  keywords: string[];
  category: string;
  isFeatured: boolean;
  status: ArticleStatus;
  isIndexable: boolean;
  /** ISO date (YYYY-MM-DD). */
  publishedAt: string;
  /** ISO date of the last real content change. */
  updatedAt: string;
  readingTime: number;
  coverImage: string | null;
  sections: ArticleSection[];
}

const ALL_ARTICLES = raw as unknown as BlogArticle[];

/** Only published, indexable articles are shown to visitors. */
export const ARTICLES: BlogArticle[] = ALL_ARTICLES
  .filter((article) => article.status === 'published' && article.isIndexable)
  .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

/** Old slugs that moved to a new article. Used for in-app redirects. */
export const LEGACY_SLUGS: Record<string, string> = {
  'ai-financial-management': 'personal-finance-management-with-ai',
  'simple-monthly-budget': 'personal-budgeting-guide',
};

export const getArticleBySlug = (slug: string | undefined): BlogArticle | undefined =>
  slug ? ARTICLES.find((article) => article.slug === slug) : undefined;
