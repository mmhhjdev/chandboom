/**
 * Post-build SEO step for chandboom.ir (GitHub Pages, SPA).
 *
 * Why: the app is a single-page app, so every route shares the same HTML shell. Social crawlers
 * (Telegram, WhatsApp, X, LinkedIn) and many search bots do not run JavaScript, so they only see
 * whatever is in the static HTML. This script writes a real HTML file per public route with its
 * own title, description, canonical, Open Graph, Twitter and JSON-LD, and generates sitemap.xml
 * from the same route list, so the sitemap can never point at pages that do not exist.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://chandboom.ir';
const root = process.cwd();
const distDir = path.join(root, 'dist');
const indexPath = path.join(distDir, 'index.html');
const articlesPath = path.join(root, 'src/data/articles.ts');
const today = new Date().toISOString().slice(0, 10);
const DEFAULT_IMAGE = `${SITE}/chandboom-smart-personal-finance-hero.jpg`;

if (!fs.existsSync(indexPath)) throw new Error('dist/index.html missing: run vite build first.');
const template = fs.readFileSync(indexPath, 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('Unexpected index.html shell.');

// The homepage keeps its full site-wide JSON-LD graph; other pages get their own.
const rootGraphMatch = template.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/);
const rootGraphBlock = rootGraphMatch ? rootGraphMatch[0] : '';

const esc = (v) => String(v ?? '')
  .replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const jsonLdBlock = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const PAGES = [
  {
    path: '/',
    title: 'چندبوم | مدیریت مالی هوشمند و مدیریت مالی شخصی با هوش مصنوعی',
    description: 'چندبوم: مدیریت مالی شخصی با هوش مصنوعی، ثبت خودکار پیامک بانکی، تحلیل بودجه و پیش‌بینی جریان نقدینگی، و محاسبه عادلانه دنگ.',
    priority: '1.0', changefreq: 'daily',
  },
  {
    path: '/features',
    title: 'امکانات مدیریت مالی شخصی | چندبوم',
    description: 'ثبت تراکنش با صدا و پیامک بانکی، بودجه‌بندی هوشمند، یادآور اقساط و چک، اهداف مالی و دستیار هوش مصنوعی چندبوم.',
    priority: '0.9', changefreq: 'weekly',
  },
  {
    path: '/pricing',
    title: 'تعرفه و پلن‌های اشتراک | چندبوم',
    description: 'پلن‌های اشتراک چندبوم با پرداخت کارت به کارت و تایید سریع. امکانات هر پلن را مقایسه کنید.',
    priority: '0.9', changefreq: 'weekly',
  },
  {
    path: '/faq',
    title: 'سوالات متداول | چندبوم',
    description: 'پاسخ پرسش‌های رایج درباره حساب کاربری، پرداخت اشتراک، امنیت داده‌ها و کار با دستیار هوش مصنوعی چندبوم.',
    priority: '0.7', changefreq: 'monthly',
  },
  {
    path: '/about',
    title: 'درباره چندبوم | تیم و ماموریت',
    description: 'چندبوم چیست، چرا ساخته شد و چطور به کاربران کمک می‌کند کنترل مالی شخصی خود را در دست بگیرند.',
    priority: '0.6', changefreq: 'monthly',
  },
  {
    path: '/contact',
    title: 'تماس با چندبوم | پشتیبانی',
    description: 'راه‌های ارتباط با تیم پشتیبانی چندبوم و ثبت تیکت برای پرسش، مشکل فنی یا پیشنهاد.',
    priority: '0.5', changefreq: 'monthly',
  },
  {
    path: '/articles',
    title: 'مجله چندبوم | راهنمای مدیریت مالی شخصی',
    description: 'مقالات کاربردی درباره بودجه‌بندی، پس‌انداز، بدهی و استفاده از هوش مصنوعی در مدیریت مالی شخصی.',
    priority: '0.8', changefreq: 'weekly',
  },
];

// Articles come from the same source file the app renders, so the two can never disagree.
const source = fs.readFileSync(articlesPath, 'utf8');
const prefix = 'export const ARTICLES: BlogArticle[] = ';
const start = source.indexOf(prefix);
if (start < 0) throw new Error('Could not locate ARTICLES export in src/data/articles.ts');
const articles = JSON.parse(source.slice(start + prefix.length).trim().replace(/;\s*$/, ''));
const ARTICLE_DATE = '2026-10-30'; // TODO: add a publishedAt field to each article for accurate dates.

const ARTICLE_PAGES = articles.map((a) => ({
  path: `/articles/${a.slug}`,
  title: `${a.title} | مجله چندبوم`,
  description: a.description,
  keywords: a.keywords,
  priority: '0.8',
  changefreq: 'monthly',
  lastmod: ARTICLE_DATE,
  type: 'article',
  jsonLd: {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: a.title,
        description: a.description,
        keywords: a.keywords,
        image: DEFAULT_IMAGE,
        mainEntityOfPage: `${SITE}/articles/${a.slug}`,
        datePublished: ARTICLE_DATE,
        dateModified: ARTICLE_DATE,
        inLanguage: 'fa-IR',
        author: { '@type': 'Organization', name: 'مجله چندبوم' },
        publisher: { '@type': 'Organization', name: 'چندبوم', url: SITE },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'مجله چندبوم', item: `${SITE}/articles` },
          { '@type': 'ListItem', position: 2, name: a.title, item: `${SITE}/articles/${a.slug}` },
        ],
      },
    ],
  },
}));

const ALL_PAGES = [...PAGES, ...ARTICLE_PAGES];

// Remove every head tag this script owns, then write a fresh set for the page.
const stripOwnedHead = (html) => html
  .replace(/<title>[\s\S]*?<\/title>/g, '')
  .replace(/<meta\s+(?:name|property)="(?:description|keywords|robots|googlebot|author|title|og:[^"]*|twitter:[^"]*)"[^>]*>\s*/g, '')
  .replace(/<link rel="canonical"[^>]*>\s*/g, '')
  .replace(/<link rel="alternate"[^>]*>\s*/g, '')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');

const noscriptNav = `<noscript>
      <nav aria-label="صفحات اصلی">
        <a href="/features">امکانات</a> | <a href="/pricing">تعرفه</a> | <a href="/faq">سوالات متداول</a> |
        <a href="/articles">مجله</a> | <a href="/about">درباره ما</a> | <a href="/contact">تماس</a>
      </nav>
      <p>برای استفاده از چندبوم لطفاً جاوااسکریپت را فعال کنید.</p>
    </noscript>
    <div id="root"></div>`;

function buildHtml(page) {
  const canonical = `${SITE}${page.path}`;
  const image = page.image || DEFAULT_IMAGE;
  let html = stripOwnedHead(template);
  const headBlock = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    page.keywords ? `<meta name="keywords" content="${esc(page.keywords)}" />` : '',
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />',
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="${page.type || 'website'}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:site_name" content="چندبوم (Chandboom)" />',
    '<meta property="og:locale" content="fa_IR" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    page.path === '/' ? rootGraphBlock : jsonLdBlock(page.jsonLd || {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: page.title,
      description: page.description,
      url: canonical,
      inLanguage: 'fa-IR',
      isPartOf: { '@type': 'WebSite', name: 'چندبوم', url: SITE },
    }),
  ].filter(Boolean).join('\n    ');
  html = html.replace('</head>', `    ${headBlock}\n  </head>`);
  html = html.replace('<div id="root"></div>', noscriptNav);
  return html;
}

for (const page of ALL_PAGES) {
  const outDir = page.path === '/' ? distDir : path.join(distDir, page.path);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), buildHtml(page), 'utf8');
}

// Sitemap: generated from the same list, so it only contains pages that exist.
const urls = ALL_PAGES.map((p) => `  <url>
    <loc>${SITE}${p.path}</loc>
    <lastmod>${p.lastmod || today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');
fs.writeFileSync(path.join(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');

console.log(`SEO: wrote ${ALL_PAGES.length} pages and sitemap.xml (${ALL_PAGES.length} URLs).`);
