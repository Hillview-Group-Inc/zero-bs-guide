# Zero B.S. Guide Azure Static Web Apps

This folder is a production-ready Azure Static Web Apps implementation of the original `zero-bs-guide` Express app.

## Architecture

- `public/`: static assets copied straight into the deployed site
- `views/`: source HTML templates reused by the static build
- `data/`: article and FAQ content used at build time
- `scripts/build-static.js`: generates the deployable site into `dist/`
- `src/render/site.js`: rendering helpers that replace the original Express controllers
- `api/contact/`: Azure Function that powers `POST /api/contact`
- `staticwebapp.config.json`: Azure Static Web Apps headers, cache rules, and 404 handling

## Why This Version Works on Azure Static Web Apps

The original app depends on a long-running Express server for:

- serving routes
- rendering article and FAQ pages from JSON
- generating `robots.txt` and `sitemap.xml`
- handling the contact form email endpoint

Azure Static Web Apps is a better fit when we split that behavior into:

- a pre-rendered static site
- a serverless API for the contact form

This project does exactly that.

## Local Build

From this folder:

```bash
npm run build
```

That command generates:

- `dist/index.html`
- `dist/about/index.html`
- `dist/contact/index.html`
- `dist/articles/index.html`
- `dist/articles/<slug>/index.html`
- `dist/faqs/index.html`
- `dist/faqs/<slug>/index.html`
- `dist/robots.txt`
- `dist/sitemap.xml`
- `dist/404.html`

## Azure Deployment Settings

When creating the Azure Static Web App, use these values if this folder remains nested inside the current repository:

- App location: `zero-bs-guide-azure`
- API location: `zero-bs-guide-azure/api`
- Output location: `dist`

If you later move this folder into its own repository, the values become:

- App location: `/`
- API location: `api`
- Output location: `dist`

## Required Application Settings

Set these in Azure Static Web Apps under `Environment variables` / `Application settings`:

- `BASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

Recommended production value:

```env
BASE_URL=https://www.zerobsguide.com
```

## Deployment Flow

1. Push this repository to GitHub.
2. Create a new Azure Static Web App.
3. Connect the GitHub repo and branch.
4. Point Azure to the app and API locations shown above.
5. Add the required application settings.
6. Let Azure create the GitHub Actions deployment workflow.
7. Run the first deployment.
8. Validate the staging URL.
9. Add the custom domain.
10. Cut DNS over after confirming forms, sitemap, and page routes work.

## Notes

- The front-end `fetch('/api/contact')` call already matches the Azure Function route.
- SMTP secrets stay on the server side in the API configuration.
- Security headers moved from Express `helmet()` to `staticwebapp.config.json`.
- Express rate limiting was not migrated directly because in-memory limits are a poor fit for serverless instances. For abuse protection, start with validation plus honeypot and add CAPTCHA or WAF if needed.
