#!/usr/bin/env node
/**
 * Static site generator for the MCU Study Guide.
 * Reads content/_registry.json + markdown files, outputs site/ HTML pages.
 * Dependencies: none (uses built-in Node.js modules only + a simple markdown parser).
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const SITE_DIR = path.join(__dirname, 'site');

// ============================================================
// Minimal Markdown → HTML converter (no dependencies)
// ============================================================
function md2html(md) {
  let html = md;

  // Tabbed code blocks: <!-- tabs --> ... <!-- /tabs -->
  html = html.replace(/<!-- tabs -->\n([\s\S]*?)<!-- \/tabs -->/g, (_, inner) => {
    const blocks = [];
    const re = /```(\w*)\n([\s\S]*?)```/g;
    let m;
    while ((m = re.exec(inner)) !== null) {
      const lang = m[1] || 'text';
      const code = escapeHtml(m[2].trimEnd());
      const label = langLabel(lang);
      blocks.push({ lang, label, code });
    }
    if (blocks.length === 0) return inner;
    const tabs = blocks.map((b, i) =>
      `<button class="code-tab${i === 0 ? ' active' : ''}" data-lang="${b.lang}">${b.label}</button>`
    ).join('');
    const panels = blocks.map((b, i) =>
      `<div class="code-panel${i === 0 ? ' active' : ''}" data-lang="${b.lang}"><pre><code class="language-${b.lang}">${b.code}</code></pre></div>`
    ).join('\n');
    return `<div class="code-tabs"><div class="code-tab-bar">${tabs}</div>${panels}</div>`;
  });

  // Fenced code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = escapeHtml(code.trimEnd());
    return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_, headerRow, _sep, bodyRows) => {
    const headers = headerRow.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links (but not image links)
  html = html.replace(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    // Convert .md links to .html
    href = href.replace(/\.md(#|$)/, '.html$1');
    return `<a href="${href}">${text}</a>`;
  });

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Unordered lists
  html = html.replace(/^(?:- (.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^- /, '');
      return `<li>${content}</li>`;
    }).join('\n');
    return `<ul>\n${items}\n</ul>`;
  });

  // Ordered lists
  html = html.replace(/^(?:\d+\. (.+)\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(line => {
      const content = line.replace(/^\d+\. /, '');
      return `<li>${content}</li>`;
    }).join('\n');
    return `<ol>\n${items}\n</ol>`;
  });

  // Paragraphs: wrap remaining lines not already wrapped in tags
  const lines = html.split('\n');
  const result = [];
  let inPara = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inPara) { result.push('</p>'); inPara = false; }
      continue;
    }
    const isBlock = /^<(h[1-6]|ul|ol|li|pre|code|table|thead|tbody|tr|th|td|blockquote|hr|img|div)/.test(trimmed)
      || /^<\/(ul|ol|pre|table|thead|tbody|blockquote|div)>/.test(trimmed);
    if (isBlock) {
      if (inPara) { result.push('</p>'); inPara = false; }
      result.push(line);
    } else {
      if (!inPara) { result.push('<p>'); inPara = true; }
      result.push(line);
    }
  }
  if (inPara) result.push('</p>');

  return result.join('\n');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function langLabel(lang) {
  const labels = {
    c: 'C', rust: 'Rust', cpp: 'C++', zig: 'Zig', ada: 'Ada',
    asm: 'Assembly', python: 'Python', text: 'Text',
    makefile: 'Makefile', linker: 'Linker Script', bash: 'Bash',
  };
  return labels[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
}

// ============================================================
// Front-matter parser
// ============================================================
function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  let currentKey = null;
  let inArray = false;
  let inSources = false;
  let currentSource = {};

  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      if (value.startsWith('[') && value.endsWith(']')) {
        meta[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
      } else if (value === '' || value === undefined) {
        currentKey = key;
        if (key === 'sources') { meta[key] = []; inSources = true; }
        else { meta[key] = []; }
        inArray = true;
      } else {
        meta[key] = value.replace(/^["']|["']$/g, '');
        currentKey = null; inArray = false; inSources = false;
      }
    } else if (inSources) {
      const urlMatch = line.match(/^\s+-?\s*url:\s*["']?(.+?)["']?\s*$/);
      const titleMatch = line.match(/^\s+title:\s*["']?(.+?)["']?\s*$/);
      const dashMatch = line.match(/^\s+-\s*$/);
      if (urlMatch) { currentSource.url = urlMatch[1]; }
      else if (titleMatch) {
        currentSource.title = titleMatch[1];
        meta.sources.push({ ...currentSource });
        currentSource = {};
      } else if (dashMatch) { currentSource = {}; }
      // Handle "- url:" on same line as dash
      const dashUrl = line.match(/^\s+-\s+url:\s*["']?(.+?)["']?\s*$/);
      if (dashUrl) { currentSource = { url: dashUrl[1] }; }
    } else if (inArray && line.match(/^\s+-\s+(.+)$/)) {
      meta[currentKey].push(line.match(/^\s+-\s+(.+)$/)[1].replace(/^["']|["']$/g, ''));
    }
  }

  return { meta, body: match[2] };
}

// ============================================================
// Build page list from registry + meta files
// ============================================================
function buildPageList() {
  const registry = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, '_registry.json'), 'utf8'));
  const pages = [];

  for (const topic of registry.topics.sort((a, b) => a.order - b.order)) {
    const topicDir = path.join(CONTENT_DIR, topic.slug);
    const meta = JSON.parse(fs.readFileSync(path.join(topicDir, '_meta.json'), 'utf8'));

    for (const child of meta.children) {
      if (child.type === 'directory') {
        const subDir = path.join(topicDir, child.slug);
        const subMeta = JSON.parse(fs.readFileSync(path.join(subDir, '_meta.json'), 'utf8'));
        for (const subChild of subMeta.children) {
          const filePath = path.join(subDir, subChild.slug + '.md');
          if (fs.existsSync(filePath)) {
            pages.push({
              slug: subChild.slug,
              filePath,
              urlPath: `${topic.slug}/${child.slug}/${subChild.slug}.html`,
              topicSlug: topic.slug,
              topicTitle: topic.title,
              subSlug: child.slug,
              subTitle: child.title,
              title: subChild.title
            });
          }
        }
      } else {
        const filePath = path.join(topicDir, child.slug + '.md');
        if (fs.existsSync(filePath)) {
          pages.push({
            slug: child.slug,
            filePath,
            urlPath: `${topic.slug}/${child.slug}.html`,
            topicSlug: topic.slug,
            topicTitle: topic.title,
            subSlug: null,
            subTitle: null,
            title: child.title
          });
        }
      }
    }
  }

  return { registry, pages };
}

// ============================================================
// Build navigation HTML
// ============================================================
function buildNavHtml(registry, pages, currentUrlPath) {
  let nav = '';
  const grouped = {};

  for (const p of pages) {
    if (!grouped[p.topicSlug]) grouped[p.topicSlug] = { title: p.topicTitle, items: [], subs: {} };
    if (p.subSlug) {
      if (!grouped[p.topicSlug].subs[p.subSlug]) {
        grouped[p.topicSlug].subs[p.subSlug] = { title: p.subTitle, items: [] };
      }
      grouped[p.topicSlug].subs[p.subSlug].items.push(p);
    } else {
      grouped[p.topicSlug].items.push(p);
    }
  }

  for (const topic of registry.topics.sort((a, b) => a.order - b.order)) {
    const g = grouped[topic.slug];
    if (!g) continue;

    const isTopicActive = pages.some(p => p.topicSlug === topic.slug && p.urlPath === currentUrlPath);
    const expanded = isTopicActive || pages.some(p => p.topicSlug === topic.slug && p.urlPath === currentUrlPath);

    nav += `<div class="nav-section">`;
    nav += `<button class="nav-section-title${expanded ? ' expanded' : ''}"><span class="chevron">&#9654;</span>${g.title}</button>`;
    nav += `<div class="nav-children">`;

    for (const item of g.items) {
      const rel = relativePath(currentUrlPath, item.urlPath);
      const active = item.urlPath === currentUrlPath ? ' active' : '';
      nav += `<a class="nav-item${active}" href="${rel}">${item.title}</a>`;
    }

    for (const [subSlug, sub] of Object.entries(g.subs)) {
      const isSubActive = sub.items.some(i => i.urlPath === currentUrlPath);
      nav += `<div class="nav-sub-section">`;
      nav += `<button class="nav-sub-title${isSubActive ? ' expanded' : ''}"><span class="chevron">&#9654;</span>${sub.title}</button>`;
      nav += `<div class="nav-sub-children">`;
      for (const item of sub.items) {
        const rel = relativePath(currentUrlPath, item.urlPath);
        const active = item.urlPath === currentUrlPath ? ' active' : '';
        nav += `<a class="nav-item${active}" href="${rel}">${item.title}</a>`;
      }
      nav += `</div></div>`;
    }

    nav += `</div></div>`;
  }

  return nav;
}

function relativePath(from, to) {
  const fromParts = from.split('/');
  const toParts = to.split('/');
  fromParts.pop(); // remove filename

  let common = 0;
  while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
    common++;
  }

  const ups = fromParts.length - common;
  const rel = '../'.repeat(ups) + toParts.slice(common).join('/');
  return rel || './';
}

// ============================================================
// Generate HTML page
// ============================================================
function generatePage(page, pages, registry, pageIndex) {
  const raw = fs.readFileSync(page.filePath, 'utf8');
  const { meta, body } = parseFrontMatter(raw);
  const contentHtml = md2html(body);
  const title = meta.title || page.title;

  // Depth for CSS/JS paths
  const depth = page.urlPath.split('/').length - 1;
  const prefix = '../'.repeat(depth);

  // Breadcrumbs
  let crumbs = `<a href="${prefix}index.html">Home</a><span class="sep">/</span>`;
  if (page.topicSlug) {
    crumbs += `<a href="${prefix}${page.topicSlug}/index.html">${page.topicTitle}</a><span class="sep">/</span>`;
  }
  if (page.subSlug) {
    crumbs += `<a href="${prefix}${page.topicSlug}/${page.subSlug}/index.html">${page.subTitle}</a><span class="sep">/</span>`;
  }
  crumbs += `<span>${title}</span>`;

  // Tags
  const tags = (meta.tags || []).map(t => `<span class="tag">${t}</span>`).join('');

  // Sources
  let sourcesHtml = '';
  if (meta.sources && meta.sources.length > 0) {
    sourcesHtml = `<div class="sources"><h2>References</h2><ul>`;
    for (const src of meta.sources) {
      if (src.url) {
        sourcesHtml += `<li><a href="${src.url}" target="_blank" rel="noopener">${src.title || src.url}</a></li>`;
      }
    }
    sourcesHtml += `</ul></div>`;
  }

  // Prev/Next
  let pageNav = '<div class="page-nav">';
  if (pageIndex > 0) {
    const prev = pages[pageIndex - 1];
    const prevRel = relativePath(page.urlPath, prev.urlPath);
    pageNav += `<a href="${prevRel}"><span class="nav-label">\u2190 Previous</span><span class="nav-title">${prev.title}</span></a>`;
  } else {
    pageNav += '<span></span>';
  }
  if (pageIndex < pages.length - 1) {
    const next = pages[pageIndex + 1];
    const nextRel = relativePath(page.urlPath, next.urlPath);
    pageNav += `<a class="next" href="${nextRel}"><span class="nav-label">Next \u2192</span><span class="nav-title">${next.title}</span></a>`;
  }
  pageNav += '</div>';

  // Nav
  const navHtml = buildNavHtml(registry, pages, page.urlPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — MCU Study Guide</title>
  <link rel="stylesheet" href="${prefix}styles/main.css">
</head>
<body>
  <header class="header">
    <button class="hamburger" aria-label="Toggle sidebar">&#9776;</button>
    <button class="menu-toggle" aria-label="Toggle sidebar"><div class="menu-toggle-icon"><span></span><span></span><span></span></div></button>
    <div class="header-title">MCU Study Guide</div>
    <div class="header-search">
      <span class="search-icon">&#128269;</span>
      <input type="text" placeholder="Search topics..." aria-label="Search">
      <div class="search-results"></div>
    </div>
    <div class="lang-switcher" aria-label="Code language"><select class="lang-select"></select></div>
    <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">&#9790;</button>
  </header>
  <div class="layout">
    <nav class="sidebar">${navHtml}</nav>
    <div class="sidebar-overlay"></div>
    <main class="content">
      <div class="breadcrumbs">${crumbs}</div>
      <h1>${title}</h1>
      ${tags ? '<div class="tags">' + tags + '</div>' : ''}
      ${contentHtml}
      ${sourcesHtml}
      ${pageNav}
    </main>
  </div>
  <script src="${prefix}scripts/main.js"></script>
</body>
</html>`;
}

// ============================================================
// Generate landing page
// ============================================================
function generateLandingPage(registry, pages) {
  const navHtml = buildNavHtml(registry, pages, 'index.html');

  let topicsHtml = '';
  for (const topic of registry.topics.sort((a, b) => a.order - b.order)) {
    const topicPages = pages.filter(p => p.topicSlug === topic.slug);
    const count = topicPages.length;
    topicsHtml += `
      <div class="topic-card">
        <h3><a href="${topic.slug}/index.html">${topic.title}</a></h3>
        <p>${count} pages</p>
      </div>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCU Study Guide</title>
  <link rel="stylesheet" href="styles/main.css">
  <style>
    .topic-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
    .topic-card { padding: 1.5rem; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-secondary); transition: border-color 0.2s; }
    .topic-card:hover { border-color: var(--accent); }
    .topic-card h3 { margin-bottom: 0.5rem; }
    .topic-card p { color: var(--text-muted); font-size: 0.9rem; }
    .landing-hero { text-align: center; padding: 3rem 1rem 2rem; }
    .landing-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .landing-hero p { color: var(--text-secondary); font-size: 1.1rem; max-width: 600px; margin: 0 auto; }
  </style>
</head>
<body>
  <header class="header">
    <button class="hamburger" aria-label="Toggle sidebar">&#9776;</button>
    <button class="menu-toggle" aria-label="Toggle sidebar"><div class="menu-toggle-icon"><span></span><span></span><span></span></div></button>
    <div class="header-title">MCU Study Guide</div>
    <div class="header-search">
      <span class="search-icon">&#128269;</span>
      <input type="text" placeholder="Search topics..." aria-label="Search">
      <div class="search-results"></div>
    </div>
    <div class="lang-switcher" aria-label="Code language"><select class="lang-select"></select></div>
    <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">&#9790;</button>
  </header>
  <div class="layout">
    <nav class="sidebar">${navHtml}</nav>
    <div class="sidebar-overlay"></div>
    <main class="content">
      <div class="landing-hero">
        <h1>MCU Study Guide</h1>
        <p>Deep study of microcontrollers — bare-metal control of computation and memory. No Arduino abstractions, just register-level understanding.</p>
      </div>
      <div class="topic-cards">${topicsHtml}</div>
    </main>
  </div>
  <script src="scripts/main.js"></script>
</body>
</html>`;
}

// ============================================================
// Main
// ============================================================
function main() {
  console.log('Building site...');
  const { registry, pages } = buildPageList();
  console.log(`Found ${pages.length} pages`);

  // Create output directories
  for (const page of pages) {
    const outDir = path.dirname(path.join(SITE_DIR, page.urlPath));
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Generate each page
  for (let i = 0; i < pages.length; i++) {
    const html = generatePage(pages[i], pages, registry, i);
    const outPath = path.join(SITE_DIR, pages[i].urlPath);
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`  ${pages[i].urlPath}`);
  }

  // Generate landing page
  const landing = generateLandingPage(registry, pages);
  fs.writeFileSync(path.join(SITE_DIR, 'index.html'), landing, 'utf8');
  console.log('  index.html');

  console.log(`\nDone! Generated ${pages.length + 1} HTML files.`);
}

main();
