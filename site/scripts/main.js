// === Theme Toggle ===
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '\u2600' : '\u263E';
}

// === Sidebar Navigation ===
function initNav() {
  // Expand/collapse sections
  document.querySelectorAll('.nav-section-title, .nav-sub-title').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('expanded');
    });
  });

  // Highlight current page and expand its section
  const currentPath = window.location.pathname.replace(/\/$/, '/index.html');
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href');
    if (href && currentPath.endsWith(href.replace('./', ''))) {
      item.classList.add('active');
      // Expand parent sections
      let parent = item.parentElement;
      while (parent) {
        if (parent.classList.contains('nav-children') || parent.classList.contains('nav-sub-children')) {
          const toggle = parent.previousElementSibling;
          if (toggle) toggle.classList.add('expanded');
        }
        parent = parent.parentElement;
      }
    }
  });
}

// === Mobile Hamburger ===
function initHamburger() {
  const hamburger = document.querySelector('.hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
    });
  }
}

// === Search ===
let searchIndex = [];

function initSearch() {
  // Build search index from nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    const title = item.textContent.trim();
    const href = item.getAttribute('href');
    // Build a path from parent sections
    let path = '';
    let parent = item.closest('.nav-section');
    if (parent) {
      const sectionTitle = parent.querySelector('.nav-section-title');
      if (sectionTitle) path = sectionTitle.textContent.trim();
    }
    const subParent = item.closest('.nav-sub-section');
    if (subParent) {
      const subTitle = subParent.querySelector('.nav-sub-title');
      if (subTitle) path += ' > ' + subTitle.textContent.trim();
    }
    searchIndex.push({ title, href, path });
  });

  const input = document.querySelector('.header-search input');
  const results = document.querySelector('.search-results');
  if (!input || !results) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (q.length < 2) {
      results.classList.remove('active');
      return;
    }
    const matches = searchIndex.filter(item =>
      item.title.toLowerCase().includes(q) || item.path.toLowerCase().includes(q)
    ).slice(0, 10);

    if (matches.length === 0) {
      results.classList.remove('active');
      return;
    }

    results.innerHTML = matches.map(m => `
      <div class="search-result-item" data-href="${m.href}">
        <div class="result-title">${highlight(m.title, q)}</div>
        <div class="result-path">${m.path}</div>
      </div>
    `).join('');
    results.classList.add('active');

    results.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        window.location.href = item.dataset.href;
      });
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.header-search')) {
      results.classList.remove('active');
    }
  });

  // Keyboard nav
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      results.classList.remove('active');
      input.blur();
    }
  });
}

function highlight(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.slice(0, idx) + '<strong>' + text.slice(idx, idx + query.length) + '</strong>' + text.slice(idx + query.length);
}

// === Code Language Tabs ===
function initCodeTabs() {
  // Individual tab clicks — local to that block only
  document.querySelectorAll('.code-tabs').forEach(container => {
    const tabs = container.querySelectorAll('.code-tab');
    const panels = container.querySelectorAll('.code-panel');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const lang = tab.dataset.lang;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.lang === lang));
        panels.forEach(p => p.classList.toggle('active', p.dataset.lang === lang));
      });
    });
  });

  // Global language switcher in header
  initGlobalLangSwitcher();
}

function initGlobalLangSwitcher() {
  const switcher = document.querySelector('.lang-switcher');
  if (!switcher) return;

  // Collect all unique languages from code tabs on page
  const langs = new Set();
  document.querySelectorAll('.code-tab').forEach(t => langs.add(t.dataset.lang));

  if (langs.size === 0) {
    switcher.style.display = 'none';
    return;
  }

  const labels = { c: 'C', rust: 'Rust', cpp: 'C++', zig: 'Zig', ada: 'Ada', asm: 'Assembly', python: 'Python' };
  const select = switcher.querySelector('.lang-select');
  // Populate options
  langs.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = labels[lang] || lang;
    select.appendChild(opt);
  });

  // Restore saved preference
  const saved = localStorage.getItem('preferred-lang');
  if (saved && langs.has(saved)) {
    select.value = saved;
    syncAllTabs(saved);
  }

  select.addEventListener('change', () => {
    const lang = select.value;
    localStorage.setItem('preferred-lang', lang);
    syncAllTabs(lang);
  });
}

function syncAllTabs(lang) {
  document.querySelectorAll('.code-tabs').forEach(container => {
    const matchingTab = container.querySelector(`.code-tab[data-lang="${lang}"]`);
    if (matchingTab) {
      container.querySelectorAll('.code-tab').forEach(t => t.classList.toggle('active', t.dataset.lang === lang));
      container.querySelectorAll('.code-panel').forEach(p => p.classList.toggle('active', p.dataset.lang === lang));
    }
  });
}

// === Sidebar Collapse Toggle (header menu icon) ===
function initSidebarToggle() {
  const saved = localStorage.getItem('sidebar-collapsed');
  if (saved === 'true') {
    document.body.classList.add('sidebar-collapsed');
  }

  const btn = document.querySelector('.menu-toggle');
  if (btn) {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sidebar-collapsed', document.body.classList.contains('sidebar-collapsed'));
    });
  }
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initHamburger();
  initSearch();
  initSidebarToggle();
  initCodeTabs();
});
