/**
 * Post-build SEO step for chandboom.ir (GitHub Pages, SPA).
 *
 * The app is a single-page app, so every route shares one HTML shell. Crawlers and social bots
 * that do not run JavaScript only see that shell. This script writes a real HTML file per public
 * route with its own title, description, canonical, Open Graph, Twitter and JSON-LD, and builds
 * sitemap.xml from the same route list, so the sitemap cannot point at pages that do not exist.
 *
 * Article data comes from src/data/articles.json, the same file the app renders.
 * The build fails if an article is missing a required field or if two articles share a
 * slug, SEO title or description.
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://chandboom.ir';
const root = process.cwd();
const distDir = path.join(root, 'dist');
const indexPath = path.join(distDir, 'index.html');
const articlesPath = path.join(root, 'src/data/articles.json');
const DEFAULT_IMAGE = `${SITE}/chandboom-smart-personal-finance-hero.jpg`;
// Lastmod for static pages. Update it when a static page's content changes.
const STATIC_LASTMOD = '2026-11-06';

if (!fs.existsSync(indexPath)) throw new Error('dist/index.html missing: run vite build first.');
const template = fs.readFileSync(indexPath, 'utf8');
if (!template.includes('<div id="root"></div>')) throw new Error('Unexpected index.html shell.');

// The homepage keeps its site-wide JSON-LD graph; other pages get their own.
const rootGraphMatch = template.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/);
const rootGraphBlock = rootGraphMatch ? rootGraphMatch[0].replace('<script type="application/ld+json">', '<script type="application/ld+json" data-seo-static>') : '';

const esc = (v) => String(v ?? '')
  .replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const jsonLdBlock = (obj) =>
  `<script type="application/ld+json" data-seo-static>${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

// ---------- Articles: load and validate ----------
const allArticles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));
const articles = allArticles.filter((a) => a.status === 'published' && a.isIndexable);

const REQUIRED = ['slug', 'title', 'seoTitle', 'description', 'keyword', 'keywords', 'category', 'publishedAt', 'updatedAt', 'sections'];
const seen = { slug: new Set(), seoTitle: new Set(), description: new Set() };
for (const a of articles) {
  for (const key of REQUIRED) {
    const v = a[key];
    if (v === undefined || v === null || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '')) {
      throw new Error(`Article "${a.slug ?? '?'}" is missing required field "${key}".`);
    }
  }
  if (!/^[a-z0-9-]+$/.test(a.slug)) throw new Error(`Article slug "${a.slug}" must be lowercase letters, digits and hyphens.`);
  for (const key of Object.keys(seen)) {
    if (seen[key].has(a[key])) throw new Error(`Duplicate ${key} in article "${a.slug}": "${a[key]}".`);
    seen[key].add(a[key]);
  }
  if (a.description.length > 170) console.warn(`SEO: description of "${a.slug}" is ${a.description.length} chars (recommended <= 160).`);
  if (a.seoTitle.length > 65) console.warn(`SEO: seoTitle of "${a.slug}" is ${a.seoTitle.length} chars (recommended <= 60).`);
}

// ---------- Static routes ----------
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
].map((p) => ({ ...p, lastmod: STATIC_LASTMOD }));


// ---------- Prerendered body HTML (crawlers and no-JS readers see the content) ----------
const SITE_NAME = 'چندبوم';
const fa = (v) => String(v).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
const faDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tehran' });
const formatDate = (iso) => faDate.format(new Date(`${iso}T12:00:00Z`));
const anchor = (i) => `section-${i + 1}`;

function renderBlock(b) {
  switch (b.type) {
    case 'p': return `<p>${esc(b.text)}</p>`;
    case 'ul': return `<ul>${b.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    case 'table': return `<table><tbody>${b.rows.map((r, ri) => `<tr>${r.map((c) => (ri === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody></table>`;
    case 'faq': return b.items.map((q) => `<h3>${esc(q.q)}</h3><p>${esc(q.a)}</p>`).join('');
    default: return '';
  }
}

function renderArticleBody(a, all) {
  const toc = a.sections.map((s, i) => `<li><a href="#${anchor(i)}">${esc(s.heading)}</a></li>`).join('');
  const body = a.sections.map((s, i) =>
    `<section id="${anchor(i)}"><h2>${esc(s.heading)}</h2>${s.blocks.map(renderBlock).join('')}</section>`).join('');
  const related = all.filter((x) => x.slug !== a.slug).slice(0, 3)
    .map((x) => `<li><a href="/articles/${x.slug}">${esc(x.title)}</a></li>`).join('');
  return `<main dir="rtl"><article>
<nav aria-label="مسیر راهنما"><ol><li><a href="/articles">مجله ${SITE_NAME}</a></li><li>${esc(a.category)}</li></ol></nav>
<header><p>${esc(a.category)}</p><h1>${esc(a.title)}</h1><p>${esc(a.description)}</p>
<p>انتشار: ${formatDate(a.publishedAt)} · به‌روزرسانی: ${formatDate(a.updatedAt)} · زمان مطالعه: ${fa(a.readingTime)} دقیقه</p></header>
<nav aria-label="فهرست مطالب"><strong>فهرست مطالب</strong><ol>${toc}</ol></nav>
${body}
<aside><p>این مطلب آموزشی است و جایگزین مشاوره تخصصی مالی یا حقوقی نیست.</p></aside>
<p>امکانات مرتبط با این موضوع در <a href="/features">صفحه امکانات چندبوم</a> توضیح داده شده‌اند.</p>
<section><h2>مطالب مرتبط</h2><ul>${related}</ul></section>
<p><a href="/articles">همه مقالات</a> · <a href="/">ورود به چندبوم</a></p>
</article></main>`;
}

function renderBlogIndexBody(all) {
  const cards = all.map((a) => `<li><article><p>${esc(a.category)}</p><h2><a href="/articles/${a.slug}">${esc(a.title)}</a></h2><p>${esc(a.description)}</p><p>${formatDate(a.publishedAt)} · زمان مطالعه: ${fa(a.readingTime)} دقیقه</p></article></li>`).join('');
  return `<main dir="rtl"><header><h1>دانش مالی؛ برای تصمیم‌های هوشمندانه‌تر</h1><p>${fa(all.length)} راهنمای آموزشی درباره بودجه‌بندی، پس‌انداز، مدیریت بدهی و نقش هوش مصنوعی در مدیریت مالی شخصی.</p></header><ul>${cards}</ul><p><a href="/features">امکانات چندبوم</a> · <a href="/">صفحه اصلی</a></p></main>`;
}

const BLOG_INDEX_BODY = renderBlogIndexBody(articles);
for (const p of PAGES) if (p.path === '/articles') p.body = BLOG_INDEX_BODY;


// ---------- Article routes ----------
const ARTICLE_PAGES = articles.map((a) => {
  const url = `${SITE}/articles/${a.slug}`;
  const graph = [
    {
      '@type': 'BlogPosting',
      headline: a.title,
      description: a.description,
      keywords: a.keywords.join(', '),
      image: DEFAULT_IMAGE,
      mainEntityOfPage: url,
      datePublished: a.publishedAt,
      dateModified: a.updatedAt,
      inLanguage: 'fa-IR',
      articleSection: a.category,
      author: { '@type': 'Organization', name: 'مجله چندبوم' },
      publisher: { '@type': 'Organization', name: 'چندبوم', url: SITE },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'مجله چندبوم', item: `${SITE}/articles` },
        { '@type': 'ListItem', position: 2, name: a.title, item: url },
      ],
    },
  ];
  const faq = a.sections.flatMap((s) => s.blocks).flatMap((b) => (b.type === 'faq' ? b.items : []));
  if (faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }
  return {
    path: `/articles/${a.slug}`,
    title: a.seoTitle,
    description: a.description,
    keywords: a.keywords.join(', '),
    priority: '0.8',
    changefreq: 'monthly',
    lastmod: a.updatedAt,
    type: 'article',
    jsonLd: { '@context': 'https://schema.org', '@graph': graph },
    body: renderArticleBody(a, articles),
  };
});


const ALL_PAGES = [...PAGES, ...ARTICLE_PAGES];

// Remove every head tag this script owns, then write a fresh set for the page.
const stripOwnedHead = (html) => html
  .replace(/<title>[\s\S]*?<\/title>/g, '')
  .replace(/<meta\s+(?:name|property)="(?:description|keywords|robots|googlebot|author|title|og:[^"]*|twitter:[^"]*)"[^>]*>\s*/g, '')
  .replace(/<link rel="canonical"[^>]*>\s*/g, '')
  .replace(/<link rel="alternate"[^>]*>\s*/g, '')
  .replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g, '');

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
  const root = page.body ? `<div id="root">${page.body}</div>` : '<div id="root"></div>';
  html = html.replace('<div id="root"></div>', noscriptNav.replace('<div id="root"></div>', root));
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
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n');
fs.writeFileSync(path.join(distDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');

console.log(`SEO: prerendered ${ARTICLE_PAGES.length} article bodies. wrote ${ALL_PAGES.length} pages (${ARTICLE_PAGES.length} articles) and sitemap.xml.`);
