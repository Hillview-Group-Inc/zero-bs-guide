'use strict';

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readTemplate(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDisplayDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function buildArticleCard(article) {
  return `
    <article class="article-card fade-in" role="article">
      <div class="article-card__header"></div>
      <div class="article-card__body">
        <div class="article-card__meta">
          <span class="article-card__category">${esc(article.category)}</span>
          <span class="article-card__date">${esc(formatDisplayDate(article.date))}</span>
          <span class="article-card__read-time">${esc(article.readTime)}</span>
        </div>
        <h2 class="article-card__title">
          <a href="/articles/${esc(article.slug)}">${esc(article.title)}</a>
        </h2>
        <p class="article-card__excerpt">${esc(article.excerpt)}</p>
        <a href="/articles/${esc(article.slug)}" class="article-card__link" aria-label="Read ${esc(article.title)}">
          Read Article →
        </a>
      </div>
    </article>`;
}

function buildArticleContent(contentArray, allArticles, currentSlug) {
  let html = '';
  const faqItems = [];
  let inlineCTAInserted = false;
  let blockCount = 0;

  for (const block of contentArray) {
    blockCount += 1;

    if (blockCount === Math.floor(contentArray.length / 2) && !inlineCTAInserted) {
      html += `
        <div class="inline-cta">
          <div class="inline-cta__text">
            <h3>Want the full playbook?</h3>
            <p>This is a preview of the Zero B.S. framework. Get everything in the book.</p>
          </div>
          <a href="https://books.by/hillview/the-ultimate-zero-bs-guide-t" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Get the Book →</a>
        </div>`;
      inlineCTAInserted = true;
    }

    switch (block.type) {
      case 'h2':
        html += `<h2>${esc(block.text)}</h2>`;
        break;
      case 'h3':
        html += `<h3>${esc(block.text)}</h3>`;
        break;
      case 'p':
        html += `<p>${esc(block.text)}</p>`;
        break;
      case 'faq':
        faqItems.push({ question: block.question, answer: block.answer });
        html += `
          <div class="article-faq-block">
            <p class="article-faq-block__q">Q: ${esc(block.question)}</p>
            <p class="article-faq-block__a">${esc(block.answer)}</p>
          </div>`;
        break;
      default:
        break;
    }
  }

  const faqSchema = faqItems.length > 0
    ? `<script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        ${faqItems.map((item) => `{
          "@type": "Question",
          "name": ${JSON.stringify(item.question)},
          "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(item.answer)} }
        }`).join(',')}
      ]
    }
    </script>`
    : '';

  const relatedHtml = allArticles
    .filter((article) => article.slug !== currentSlug)
    .slice(0, 3)
    .map((article) => `<li><a href="/articles/${esc(article.slug)}">${esc(article.title)}</a></li>`)
    .join('');

  return { html, faqSchema, relatedHtml };
}

function buildFaqCard(faq) {
  return `
    <div class="faq-card" role="listitem">
      <div class="faq-card__q">
        <div>
          <span class="faq-card__q-cat">${esc(faq.category)}</span>
          <h2 class="faq-card__q-text">${esc(faq.question)}</h2>
        </div>
      </div>
      <p class="faq-card__excerpt">${esc(faq.excerpt)}</p>
      <a href="/faqs/${esc(faq.slug)}" class="faq-card__link">Read Full Answer →</a>
    </div>`;
}

function build404Page() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found — Zero B.S. Guide</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px;">
  <div>
    <span style="font-family:var(--font-display);font-size:120px;color:rgba(201,168,76,0.1);display:block;line-height:1;">404</span>
    <h1 style="font-family:var(--font-serif);font-size:36px;margin-bottom:12px;">Page Not Found</h1>
    <p style="color:var(--white-dim);margin-bottom:28px;">Even the best navigators occasionally take a wrong turn.</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
      <a href="/" class="btn btn-primary">Go Home</a>
      <a href="/articles" class="btn btn-ghost">Read Articles</a>
    </div>
  </div>
</body>
</html>`;
}

function buildRobotsTxt(baseUrl) {
  return `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}

function buildSitemap(baseUrl, articles, faqs) {
  const today = new Date().toISOString().split('T')[0];

  const articleUrls = articles.map((article) =>
    `  <url><loc>${baseUrl}/articles/${article.slug}</loc><lastmod>${article.date}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`
  ).join('\n');

  const faqUrls = faqs.map((faq) =>
    `  <url><loc>${baseUrl}/faqs/${faq.slug}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/about</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/articles</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/faqs</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/contact</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${baseUrl}/tech-for-immigrants.html</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>
${articleUrls}
${faqUrls}
</urlset>`;
}

function renderArticlesPage(templates, articles) {
  return templates.articlesListing.replace(
    '{{ARTICLES_HTML}}',
    articles.map(buildArticleCard).join('')
  );
}

function renderArticlePage(templates, article, articles) {
  const { html: contentHtml, faqSchema, relatedHtml } = buildArticleContent(
    article.content,
    articles,
    article.slug
  );

  return templates.articleTemplate
    .replace(/\{\{TITLE\}\}/g, esc(article.title))
    .replace(/\{\{META_DESCRIPTION\}\}/g, esc(article.metaDescription))
    .replace(/\{\{CATEGORY\}\}/g, esc(article.category))
    .replace(/\{\{DATE\}\}/g, formatDisplayDate(article.date))
    .replace(/\{\{READ_TIME\}\}/g, esc(article.readTime))
    .replace(/\{\{EXCERPT\}\}/g, esc(article.excerpt))
    .replace(/\{\{ARTICLE_CONTENT\}\}/g, contentHtml)
    .replace(/\{\{RELATED_ARTICLES\}\}/g, relatedHtml)
    .replace(/\{\{FAQ_SCHEMA\}\}/g, faqSchema);
}

function renderFaqsPage(templates, faqs) {
  const faqPageSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }, null, 2);

  return templates.faqsListing
    .replace('{{FAQS_HTML}}', faqs.map(buildFaqCard).join(''))
    .replace('{{FAQ_PAGE_SCHEMA}}', faqPageSchema);
}

function renderFaqPage(templates, faq, faqs) {
  const followUpHtml = (faq.followUp || []).map((item) => `
      <div class="faq-followup__item">
        <p class="faq-followup__q">Q: ${esc(item.question)}</p>
        <p class="faq-followup__a">${esc(item.answer)}</p>
      </div>`
  ).join('');

  const otherFaqsHtml = faqs
    .filter((entry) => entry.slug !== faq.slug)
    .slice(0, 4)
    .map((entry) => `
        <li>
          <a href="/faqs/${esc(entry.slug)}" style="color:var(--white-dim);font-size:15px;display:flex;align-items:flex-start;gap:8px;transition:color 0.2s;">
            <span style="color:var(--gold);flex-shrink:0;">→</span>
            ${esc(entry.question)}
          </a>
        </li>`
    ).join('');

  return templates.faqTemplate
    .replace(/\{\{QUESTION\}\}/g, esc(faq.question))
    .replace(/\{\{META_DESCRIPTION\}\}/g, esc(faq.metaDescription))
    .replace(/\{\{CATEGORY\}\}/g, esc(faq.category))
    .replace(/\{\{ANSWER\}\}/g, esc(faq.answer))
    .replace(/\{\{FOLLOWUP_HTML\}\}/g, followUpHtml)
    .replace(/\{\{OTHER_FAQS\}\}/g, otherFaqsHtml);
}

function loadSiteSource(projectRoot) {
  const dataDir = path.join(projectRoot, 'data');
  const viewsDir = path.join(projectRoot, 'views');

  return {
    articles: readJson(path.join(dataDir, 'articles.json')),
    faqs: readJson(path.join(dataDir, 'faqs.json')),
    templates: {
      home: readTemplate(path.join(viewsDir, 'home.html')),
      about: readTemplate(path.join(viewsDir, 'about.html')),
      contact: readTemplate(path.join(viewsDir, 'contact.html')),
      techForImmigrants: readTemplate(path.join(viewsDir, 'tech-for-immigrants.html')),
      articlesListing: readTemplate(path.join(viewsDir, 'articles.html')),
      articleTemplate: readTemplate(path.join(viewsDir, 'article-template.html')),
      faqsListing: readTemplate(path.join(viewsDir, 'faqs.html')),
      faqTemplate: readTemplate(path.join(viewsDir, 'faq-template.html'))
    }
  };
}

module.exports = {
  build404Page,
  buildRobotsTxt,
  buildSitemap,
  loadSiteSource,
  renderArticlePage,
  renderArticlesPage,
  renderFaqPage,
  renderFaqsPage
};
