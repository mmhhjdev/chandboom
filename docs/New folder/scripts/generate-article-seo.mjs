import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'src/data/articles.ts');
const htmlPath = path.join(root, 'dist/index.html');
if (!fs.existsSync(dataPath) || !fs.existsSync(htmlPath)) {
  console.error('Article SEO generation skipped: source data or dist/index.html is missing.');
  process.exit(1);
}

const source = fs.readFileSync(dataPath, 'utf8');
const prefix = 'export const ARTICLES: BlogArticle[] = ';
const start = source.indexOf(prefix);
if (start < 0) throw new Error('Could not locate ARTICLES data export.');
const jsonText = source.slice(start + prefix.length).trim().replace(/;\s*$/, '');
const articles = JSON.parse(jsonText);
const baseHtml = fs.readFileSync(htmlPath, 'utf8');
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

for (const article of articles) {
  const url = `https://chandboom.ir/articles/${article.slug}`;
  const image = `https://chandboom.ir/assets/articles/${article.slug}.svg`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        keywords: article.keywords,
        image,
        mainEntityOfPage: url,
        datePublished: '2026-10-30',
        dateModified: '2026-10-30',
        inLanguage: 'fa-IR',
        author: { '@type': 'Organization', name: 'مجله چندبوم' },
        publisher: { '@type': 'Organization', name: 'چندبوم', url: 'https://chandboom.ir' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'مجله چندبوم', item: 'https://chandboom.ir/articles' },
          { '@type': 'ListItem', position: 2, name: article.title, item: url },
        ],
      },
    ],
  };
  let html = baseHtml;
  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(article.title)} | مجله چندبوم</title>`);
  const headTags = [
    `<meta name="description" content="${escapeHtml(article.description)}">`,
    `<meta name="keywords" content="${escapeHtml(article.keywords)}">`,
    '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="article">',
    `<meta property="og:title" content="${escapeHtml(article.title)} | مجله چندبوم">`,
    `<meta property="og:description" content="${escapeHtml(article.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeHtml(article.title)} | مجله چندبوم">`,
    `<meta name="twitter:description" content="${escapeHtml(article.description)}">`,
    `<meta name="twitter:image" content="${image}">`,
    `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${headTags}\n  </head>`);
  const outDir = path.join(root, 'dist/articles', article.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
}
console.log(`Generated SEO entry pages for ${articles.length} articles.`);
