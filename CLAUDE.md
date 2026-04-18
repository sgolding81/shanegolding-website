# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Personal website for Shane Golding, hosted on GitHub Pages at [shanegolding.net](https://shanegolding.net). No build pipeline — pure static HTML/CSS/JS files served directly from the repo root.

## Development

No build step required. Open any `.html` file directly in a browser to preview changes. The site is live at the custom domain configured in `CNAME`.

## Architecture

All pages are self-contained HTML files with inline `<style>` and `<script>` blocks — there are no separate CSS or JS files. The README references `style.css` / `script.js` but those were consolidated into inline code.

**Pages:**
- `index.html` — Main portfolio page (~630 lines). Contains all interactive features.
- `about.html`, `privacy.html`, `terms.html` — Secondary pages sharing the same header/footer pattern.

**`index.html` internals:**
- **Particle background** — Canvas-based animation (80 particles, 100px connection distance)
- **Typing effect** — CSS `animation: typing` on the name heading
- **Snake game** — Full implementation on an 18×18 grid with arrow keys, WASD, and touch/swipe; high score persisted via `localStorage`; speed scales every 5 points; edges wrap

**Styling conventions:**
- Dark theme with cyan/green accents (`#00ff99`, `#00b4ff`)
- Google Fonts: Inter, Open Sans, Roboto Mono
- Mobile breakpoint at `max-width: 900px`

**Deployment:** Pushes to `main` deploy automatically via GitHub Pages. The `CNAME` file maps to `shanegolding.net`.
