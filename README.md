# Shane Golding's website

Source for [shanegolding.net](https://shanegolding.net), a lightweight personal site for selected software projects and browser experiments.

## What is included

- Responsive, hand-written HTML and CSS with no framework or build step
- Shared navigation, project-card, case-study, About, contact, and legal-page styles
- Three internal case studies with original SVG architecture and interface visuals
- Accessible keyboard navigation, visible focus states, skip links, and reduced-motion support
- A Canvas-based Snake game with a deterministic engine, scoped keyboard controls, touch-friendly direction buttons, and local high-score storage
- Canonical, Open Graph, Twitter/X, JSON-LD, sitemap, robots, favicon, and social-card metadata
- A custom 404 page
- No analytics, advertising trackers, external fonts, or runtime third-party dependencies

## Project structure

```text
.
├── index.html
├── about.html
├── webcam-streaming.html
├── discord-assistant-bridge.html
├── accessible-snake.html
├── privacy.html
├── terms.html
├── 404.html
├── assets/
│   ├── css/site.css
│   ├── images/
│   │   ├── og-image.{svg,png}
│   │   ├── webcam-streaming.svg
│   │   ├── discord-assistant-bridge.svg
│   │   └── accessible-snake.svg
│   └── js/
│       ├── site.js
│       ├── snake-engine.js
│       └── snake-ui.js
├── scripts/check-site.mjs
├── tests/
├── robots.txt
├── sitemap.xml
├── favicon.svg
└── CNAME
```

## Local development

No dependency installation is required. Serve the repository root so ES modules and root-relative links behave like production:

```bash
python3 -m http.server 8000
```

Then open `http://127.0.0.1:8000`.

Run the structural checks and game-engine tests with Node.js 20 or newer:

```bash
npm run check
npm test
```

## Content guidance

Project summaries and case studies describe verifiable architecture and published features without inventing client results, employment history, performance metrics, or usage claims. External links are limited to destinations that can be verified, including Shane's GitHub profile and this site's source repository.

When content changes, keep the page description, Open Graph text, Twitter/X text, JSON-LD, sitemap date, and social image aligned with the visible page.

## Deployment

`.github/workflows/pages.yml` validates and deploys an explicit allowlist of HTML, CSS, JavaScript, image, and root metadata files on pushes to `main`.

GitHub repository settings still need to be configured once:

1. Open **Settings → Pages**.
2. Set the source to **GitHub Actions**.
3. Add `shanegolding.net` as the custom domain.
4. Wait for certificate provisioning, then enable **Enforce HTTPS**.
5. Verify the domain in the account's Pages settings.

The `CNAME` file alone does not enable GitHub Pages or attach the custom domain.
