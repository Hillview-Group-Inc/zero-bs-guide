'use strict';

const fs = require('fs');
const path = require('path');
const {
  build404Page,
  buildRobotsTxt,
  buildSitemap,
  loadSiteSource,
  renderArticlePage,
  renderArticlesPage,
  renderFaqPage,
  renderFaqsPage
} = require('../src/render/site');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const publicDir = path.join(projectRoot, 'public');
const configSource = path.join(projectRoot, 'staticwebapp.config.json');
const baseUrl = (process.env.BASE_URL || 'https://zerobsguide.com').replace(/\/$/, '');

function ensureDir(targetPath) {
  fs.mkdirSync(targetPath, { recursive: true });
}

function writeFile(relativePath, contents) {
  const destination = path.join(distDir, relativePath);
  ensureDir(path.dirname(destination));
  fs.writeFileSync(destination, contents);
}

function copyDirectory(source, destination) {
  fs.cpSync(source, destination, { recursive: true });
}

function build() {
  const { articles, faqs, templates } = loadSiteSource(projectRoot);

  fs.rmSync(distDir, { recursive: true, force: true });
  ensureDir(distDir);

  copyDirectory(publicDir, distDir);
  fs.copyFileSync(configSource, path.join(distDir, 'staticwebapp.config.json'));

  writeFile('index.html', templates.home);
  writeFile(path.join('about', 'index.html'), templates.about);
  writeFile(path.join('contact', 'index.html'), templates.contact);
  writeFile('tech-for-immigrants.html', templates.techForImmigrants);
  writeFile(path.join('articles', 'index.html'), renderArticlesPage(templates, articles));
  writeFile(path.join('faqs', 'index.html'), renderFaqsPage(templates, faqs));

  for (const article of articles) {
    writeFile(
      path.join('articles', article.slug, 'index.html'),
      renderArticlePage(templates, article, articles)
    );
  }

  for (const faq of faqs) {
    writeFile(
      path.join('faqs', faq.slug, 'index.html'),
      renderFaqPage(templates, faq, faqs)
    );
  }

  writeFile('robots.txt', buildRobotsTxt(baseUrl));
  writeFile('sitemap.xml', buildSitemap(baseUrl, articles, faqs));
  writeFile('404.html', build404Page());

  console.log(`Built Zero B.S. Guide static site to ${distDir}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Articles: ${articles.length}`);
  console.log(`FAQs: ${faqs.length}`);
}

build();
