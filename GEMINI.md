# Repository overview

This is a dependency-free static website for Shane Golding, deployed with GitHub Pages.

## Key files

- `index.html` — home, selected projects, contact, and accessible Snake UI
- `about.html`, `privacy.html`, `terms.html`, `404.html` — secondary pages
- `assets/css/site.css` — shared responsive design system
- `assets/js/snake-engine.js` — testable game rules and state
- `assets/js/snake-ui.js` — DOM, Canvas, timers, input, and storage integration
- `scripts/check-site.mjs`, `tests/` — no-dependency quality checks

## Development

Serve the repository rather than opening files directly because the JavaScript uses ES modules:

```bash
python3 -m http.server 8000
npm run check
npm test
```

Keep content factual, preserve accessibility behavior, and run both checks before proposing changes.
