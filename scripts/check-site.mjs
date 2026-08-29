import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
export const root = path.resolve(path.dirname(scriptPath), '..');
export const canonicalPages = [
  'index.html',
  'about.html',
  'webcam-streaming.html',
  'discord-assistant-bridge.html',
  'accessible-snake.html',
  'privacy.html',
  'terms.html',
];

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function firstMatch(source, pattern) {
  return source.match(pattern)?.[1]?.trim() ?? '';
}

function localTarget(reference, currentPage) {
  const [pathname, fragment] = reference.split('#');
  if (/^(?:[a-z]+:)?\/\//i.test(reference) || reference.startsWith('mailto:')) return null;

  let file;
  if (!pathname) file = currentPage;
  else if (pathname === '/') file = 'index.html';
  else if (pathname.startsWith('/')) file = pathname.slice(1);
  else file = path.posix.normalize(path.posix.join(path.posix.dirname(currentPage), pathname));

  return { file, fragment: fragment || '' };
}

export function invalidAriaCurrentTargets(html, currentPage) {
  const invalid = [];

  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const anchor = match[0];
    if (!/\baria-current\s*=\s*["']page["']/i.test(anchor)) continue;

    const href = firstMatch(anchor, /\bhref\s*=\s*["']([^"']+)["']/i);
    if (!href) continue;

    const target = localTarget(href, currentPage);
    if (target && target.file !== currentPage) invalid.push(href);
  }

  return invalid;
}

function luminance(hex) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const linear = channels.map((value) => value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

export function validateSite() {
  const errors = [];
  const titles = new Set();
  const descriptions = new Set();
  const canonicals = [];
  let primaryLinks = null;

  for (const page of canonicalPages) {
    const html = read(page);
    const fail = (message) => errors.push(`${page}: ${message}`);
    const title = firstMatch(html, /<title>([^<]+)<\/title>/i);
    const description = firstMatch(html, /<meta\s+name="description"\s+content="([^"]+)"/i);
    const canonical = firstMatch(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
    const h1Count = (html.match(/<h1\b/gi) ?? []).length;

    if (!/<html\s+lang="en"/i.test(html)) fail('missing html lang="en"');
    if (!/<meta\s+name="viewport"/i.test(html)) fail('missing viewport metadata');
    if (!title) fail('missing title');
    if (titles.has(title)) fail(`duplicate title: ${title}`);
    titles.add(title);
    if (!description) fail('missing description');
    if (descriptions.has(description)) fail('description must be unique');
    descriptions.add(description);
    if (!canonical) fail('missing canonical URL');
    canonicals.push(canonical);
    if (h1Count !== 1) fail(`expected one h1, found ${h1Count}`);
    if (!/<a\s+class="skip-link"\s+href="#main-content"/i.test(html)) fail('missing skip link');
    if (!/<main\b[^>]*id="main-content"/i.test(html)) fail('missing main-content target');
    if (!/<nav\b[^>]*aria-label="Primary"/i.test(html)) fail('missing labelled primary navigation');
    if (!/<nav\b[^>]*aria-label="Legal"/i.test(html)) fail('missing labelled legal navigation');
    if (/<style\b|\sstyle=/i.test(html)) fail('inline CSS is not allowed');
    if (/<script\b(?![^>]*type="application\/ld\+json")[^>]*>(?!\s*<\/script>)[\s\S]*?<\/script>/i.test(html)) fail('executable inline JavaScript is not allowed');
    if (/(?:more soon|coming soon|on the way|lorem ipsum)/i.test(html)) fail('placeholder copy remains');
    if (/<button\b(?![^>]*\btype=)[^>]*>/i.test(html)) fail('button without an explicit type');

    for (const property of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt']) {
      if (!new RegExp(`<meta\\s+property="${property.replace(':', '\\:')}"`, 'i').test(html)) {
        fail(`missing ${property}`);
      }
    }
    for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
      if (!new RegExp(`<meta\\s+name="${name.replace(':', '\\:')}"`, 'i').test(html)) {
        fail(`missing ${name}`);
      }
    }

    const ids = [...html.matchAll(/\sid="([^"]+)"/gi)].map((match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length) fail(`duplicate ids: ${[...new Set(duplicates)].join(', ')}`);

    for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
      if (!/\balt="[^"]*"/i.test(image[1])) fail('image is missing alt text');
      if (!/\bwidth="\d+"/i.test(image[1]) || !/\bheight="\d+"/i.test(image[1])) {
        fail('image is missing intrinsic width and height');
      }
    }

    const primary = firstMatch(html, /<nav\b[^>]*aria-label="Primary"[^>]*>([\s\S]*?)<\/nav>/i);
    const navLinks = [...primary.matchAll(/href="([^"]+)"/gi)].map((match) => match[1]);
    if (primaryLinks === null) primaryLinks = navLinks;
    else if (JSON.stringify(navLinks) !== JSON.stringify(primaryLinks)) fail('primary navigation destinations differ');

    for (const href of invalidAriaCurrentTargets(html, page)) {
      fail(`aria-current page link points to ${href}`);
    }

    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/gi)) {
      const target = localTarget(match[1], page);
      if (!target) continue;
      const targetPath = path.join(root, target.file);
      if (!fs.existsSync(targetPath)) {
        fail(`missing local target ${match[1]}`);
        continue;
      }
      if (target.fragment && /\.html?$/.test(target.file)) {
        const targetHtml = read(target.file);
        if (!new RegExp(`\\sid="${target.fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`).test(targetHtml)) {
          fail(`missing fragment target ${match[1]}`);
        }
      }
    }
  }

  const index = read('index.html');
  const jsonLd = firstMatch(index, /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  try {
    JSON.parse(jsonLd);
  } catch {
    errors.push('index.html: JSON-LD is missing or invalid');
  }

  const png = fs.readFileSync(path.join(root, 'assets/images/og-image.png'));
  if (png.subarray(1, 4).toString() !== 'PNG') errors.push('OG image is not a PNG');
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630) {
    errors.push(`OG image must be 1200x630, found ${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`);
  }

  const sitemap = read('sitemap.xml');
  for (const canonical of canonicals) {
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) errors.push(`sitemap.xml: missing ${canonical}`);
  }

  if (read('CNAME').trim() !== 'shanegolding.net') errors.push('CNAME must contain only shanegolding.net');

  const css = read('assets/css/site.css');
  const color = (name) => firstMatch(css, new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  const dim = color('--text-dim');
  for (const background of [color('--bg'), color('--surface')]) {
    if (!dim || !background || contrast(dim, background) < 4.5) {
      errors.push(`site.css: --text-dim must meet 4.5:1 against ${background || 'the configured background'}`);
    }
  }

  const snakeUi = read('assets/js/snake-ui.js');
  if (/window\.addEventListener\(['"]keydown/.test(snakeUi)) {
    errors.push('snake-ui.js: keyboard controls must not be bound to window');
  }
  if (/touchmove|preventDefault\(\).*touch/i.test(snakeUi)) {
    errors.push('snake-ui.js: touch scrolling must not be suppressed');
  }

  const workflowDirectory = path.join(root, '.github/workflows');
  for (const filename of fs.readdirSync(workflowDirectory).filter((name) => name.endsWith('.yml'))) {
    const workflow = read(`.github/workflows/${filename}`);
    for (const match of workflow.matchAll(/uses:\s*['"]?([^'"\s]+)['"]?/g)) {
      const action = match[1];
      if (action.startsWith('./')) continue;
      const reference = action.split('@')[1] ?? '';
      if (!/^[0-9a-f]{40}$/i.test(reference)) {
        errors.push(`${filename}: action must use an immutable commit SHA (${action})`);
      }
    }
    for (const match of workflow.matchAll(/ghcr\.io\/[^"\s]+/g)) {
      if (!/@sha256:[0-9a-f]{64}$/i.test(match[0])) {
        errors.push(`${filename}: container must use an immutable digest (${match[0]})`);
      }
    }
  }

  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const errors = validateSite();
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Site checks passed for ${canonicalPages.length} canonical pages.`);
  }
}
