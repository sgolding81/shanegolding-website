# Repository guidance

This repository contains Shane Golding's static personal website. It is deployed to GitHub Pages without a framework or compilation step.

## Architecture

- HTML pages remain complete and navigable without JavaScript.
- `assets/css/site.css` contains the shared visual system and responsive rules.
- `assets/js/site.js` provides small site-wide enhancements.
- `assets/js/snake-engine.js` contains deterministic game state with no DOM dependencies.
- `assets/js/snake-ui.js` owns Canvas rendering, storage, timers, and accessible controls.
- `scripts/check-site.mjs` validates local links, metadata, key semantics, image dimensions, and colour contrast.
- `tests/` uses Node's built-in test runner; there are no test dependencies.

## Commands

```bash
python3 -m http.server 8000
npm run check
npm test
```

## Conventions

- Keep shared styling and behavior out of inline `style` and executable inline `script` blocks. JSON-LD is the intentional exception.
- Preserve visible `:focus-visible` states, 44px control targets, reduced-motion behavior, and normal page scrolling outside the focused game region.
- Do not bind game keyboard controls to `window` or suppress touch scrolling over the Canvas.
- Treat personal biography, client relationships, results, and external project links as facts that require confirmation before publication.
- Update metadata, sitemap dates, privacy disclosures, tests, and documentation when behavior changes.
