/**
 * Builds site/mcu-products/index.html from content/mcu-products/catalog.json
 * (the data) and content/mcu-products/index.md (the overview text).
 * Called by build.js for the catalog topic; do not edit the generated page by hand.
 */

const fs = require('fs');
const path = require('path');

const CONTENT = path.join(__dirname, 'content', 'mcu-products');
const OUT_DIR = path.join(__dirname, 'site', 'mcu-products');

const CAT_LABEL = {
  'ultra-low-cost': 'Ultra-low-cost', 'general-purpose': 'General purpose', 'low-power': 'Low power',
  'wireless': 'Wireless', 'high-performance': 'High performance', 'ai-edge': 'AI / NPU',
  'motor-control': 'Motor control', 'automotive-safety': 'Automotive / safety',
  'mixed-signal': 'Mixed-signal', 'legacy-8bit': 'Classic 8-bit',
};
const ARCH_LABEL = {
  'arm': 'Arm', 'risc-v': 'RISC-V', 'xtensa': 'Xtensa', '8051': '8051', 'avr': 'AVR', 'pic': 'PIC',
  'msp430': 'MSP430', 'rx': 'Renesas RX', 'rl78': 'RL78', 'c2000': 'TI C28x', 'other': 'Other',
};

// Shared by the build (which options to offer) and the page (filtering). Source strings, compiled in both places.
const RADIO_SRC = {
  wifi: String.raw`wi-?fi|802\.11`,
  ble: String.raw`\bble\b|bluetooth`,
  '154': String.raw`802\.15\.4|thread|zigbee|matter`,
  subghz: String.raw`sub-?ghz|lora|\b(?:433|868|915)\b`,
  cell: String.raw`lte|nb-?iot|cellular`,
};
const RADIO_RE = Object.fromEntries(Object.entries(RADIO_SRC).map(([k, v]) => [k, new RegExp(v)]));

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function build({ md2html, parseFrontMatter }) {
  const catalog = JSON.parse(fs.readFileSync(path.join(CONTENT, 'catalog.json'), 'utf8'));
  const mcus = catalog.mcus;
  const raw = fs.readFileSync(path.join(CONTENT, 'index.md'), 'utf8').replace(/\r\n/g, '\n');
  const { body } = parseFrontMatter(raw);
  // The page hero already carries the title and intro: the overview starts at the first H2.
  const firstH2 = body.search(/^## /m);
  const overviewHtml = md2html(firstH2 >= 0 ? body.slice(firstH2) : body);

  const cats = Object.keys(CAT_LABEL).filter(c => mcus.some(m => m.category === c));
  const arches = Object.keys(ARCH_LABEL).filter(a => mcus.some(m => m.arch === a));
  const vendors = [...new Set(mcus.map(m => m.vendor))].sort((a, b) => a.localeCompare(b));
  const vendorCount = vendors.length;
  const priced = mcus.filter(m => m.price != null).length;
  // Radio filter options: offer only those that match at least one part (same tests as the page).
  const radioText = m => (m.wireless || []).join(' ').toLowerCase();
  const radioOpts = [['wifi', 'Wi-Fi'], ['ble', 'Bluetooth LE'], ['154', '802.15.4 (Thread/Zigbee/Matter)'], ['subghz', 'Sub-GHz / LoRa'], ['cell', 'Cellular (LTE-M / NB-IoT)']]
    .filter(([k]) => mcus.some(m => RADIO_RE[k].test(radioText(m))));
  const mhzMax = Math.ceil(Math.max(...mcus.map(m => m.mhz || 0)) / 25) * 25;

  // Embedded data: escape "</", "<!--" and U+2028/9 so a value can never break out of the script.
  // Built from char codes: no backslash or u-escape in this source (tooling here mangles them).
  const BS = String.fromCharCode(92), LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
  const dataJson = JSON.stringify(mcus).split('</').join('<' + BS + '/').split('<!--').join('<' + BS + '!--')
    .split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCU Product Catalog — Study Notes</title>
  <link rel="stylesheet" href="../styles/main.css">
  <style>
    .catalog-wrap { flex: 1; max-width: 80rem; padding: 2rem 3rem 4rem; margin: 0 auto; margin-top: var(--header-height); }
    .cat-hero { margin-bottom: 1.5rem; }
    .cat-hero h1 { font-size: 2rem; font-weight: 800; line-height: 1.2; margin-bottom: 0.5rem; }
    .cat-hero p { color: var(--text-secondary); max-width: 62rem; }
    .cat-criteria { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.8rem; }
    .crit-chip { font-size: 0.75rem; padding: 0.25rem 0.7rem; border-radius: 999px; background: var(--accent-light); color: var(--accent); font-weight: 600; }

    .filters { background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; padding: 1.1rem 1.25rem; margin: 1.25rem 0;
      display: grid; grid-template-columns: repeat(auto-fit, minmax(185px, 1fr)); gap: 1rem 1.5rem; align-items: end; }
    .filter-field { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
    .filter-field label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
    .filter-field input[type="text"], .filter-field select { padding: 0.45rem 0.6rem; border: 1px solid var(--border); border-radius: 7px;
      background: var(--bg); color: var(--text); font-size: 0.88rem; font-family: var(--font-sans); outline: none; width: 100%; }
    .filter-field input[type="text"]:focus, .filter-field select:focus { border-color: var(--accent); }
    .range-val { font-size: 0.8rem; color: var(--text); font-weight: 600; }
    .filter-field input[type="range"] { width: 100%; accent-color: var(--accent); cursor: pointer; }
    .seg-group { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .seg-btn { padding: 0.4rem 0.7rem; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); color: var(--text-secondary);
      font-size: 0.8rem; cursor: pointer; font-family: var(--font-sans); white-space: nowrap; transition: all 0.15s; }
    .seg-btn:hover { border-color: var(--accent); color: var(--text); }
    .seg-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
    .toggle-row { display: flex; align-items: center; gap: 0.5rem; }
    .toggle-row input { width: 1rem; height: 1rem; accent-color: var(--accent); cursor: pointer; }
    .toggle-row label { text-transform: none; letter-spacing: 0; font-weight: 600; color: var(--text-secondary); font-size: 0.82rem; cursor: pointer; }
    .toggles { display: flex; flex-wrap: wrap; gap: 0.4rem 1.1rem; }
    .btn-reset { padding: 0.45rem 0.9rem; border: 1px solid var(--border); border-radius: 7px; background: var(--bg); color: var(--text);
      font-size: 0.82rem; cursor: pointer; font-family: var(--font-sans); font-weight: 600; }
    .btn-reset:hover { border-color: var(--accent); color: var(--accent); }

    .result-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem; margin: 0.4rem 0 0.5rem;
      font-size: 0.85rem; color: var(--text-secondary); }
    .result-count strong { color: var(--text); font-size: 1.05rem; }
    .price-legend { display: flex; flex-wrap: wrap; gap: 0.6rem 1.1rem; font-size: 0.76rem; color: var(--text-muted); margin-bottom: 1.1rem;
      padding: 0.6rem 0.8rem; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 8px; }
    .price-legend b { color: var(--text); }
    .conf-dot { display: inline-block; width: 0.6rem; height: 0.6rem; border-radius: 50%; margin-right: 0.3rem; vertical-align: middle; }
    .conf-dot.verified { background: #16a34a; } .conf-dot.listed { background: #2563eb; } .conf-dot.est { background: #9ca3af; }

    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 1.1rem; }
    .mcu-card { border: 1px solid var(--border); border-radius: 12px; background: var(--bg-secondary); padding: 1.1rem 1.15rem;
      display: flex; flex-direction: column; gap: 0.7rem; transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s; position: relative; overflow: hidden; }
    .mcu-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
    .mcu-card.cheapest { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .badge-best { position: absolute; top: 0; right: 0; background: var(--accent); color: #fff; font-size: 0.66rem; font-weight: 800;
      padding: 0.2rem 0.6rem; border-bottom-left-radius: 8px; letter-spacing: 0.03em; }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; }
    .mcu-card.cheapest .card-top { padding-top: 0.6rem; }
    .mcu-name { font-size: 1rem; font-weight: 700; line-height: 1.25; word-break: break-word; }
    .mcu-vendor { font-size: 0.76rem; color: var(--text-muted); margin-top: 0.15rem; }
    .price-tag { text-align: right; flex-shrink: 0; }
    .price-tag .amount { font-size: 1.25rem; font-weight: 800; color: var(--text); white-space: nowrap; }
    .price-tag .qty { font-size: 0.66rem; color: var(--text-muted); }
    .price-conf { font-size: 0.66rem; font-weight: 700; cursor: help; }
    .price-conf.verified { color: #16a34a; } .price-conf.listed { color: #2563eb; } .price-conf.est, .price-conf.none { color: var(--text-muted); }
    .spec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 0.8rem; font-size: 0.8rem; }
    .spec { display: flex; flex-direction: column; min-width: 0; }
    .spec .k { color: var(--text-muted); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.03em; }
    .spec .v { color: var(--text); font-weight: 600; word-break: break-word; }
    .pill-row { display: flex; flex-wrap: wrap; gap: 0.3rem; }
    .pill { font-size: 0.68rem; padding: 0.15rem 0.5rem; border-radius: 6px; background: var(--code-bg); border: 1px solid var(--code-border);
      color: var(--text-secondary); font-weight: 600; }
    .pill.cat { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .pill.radio { background: #ecfeff; color: #0e7490; border-color: #a5f3fc; }
    .pill.hl { background: #fef3c7; color: #92400e; border-color: #fde68a; }
    [data-theme="dark"] .pill.cat { background: #1e3a5f; color: #93c5fd; border-color: #1e40af; }
    [data-theme="dark"] .pill.radio { background: #083344; color: #67e8f9; border-color: #155e75; }
    [data-theme="dark"] .pill.hl { background: #422006; color: #fcd34d; border-color: #78350f; }
    .mcu-notes { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; }
    .mcu-checked { font-size: 0.7rem; color: var(--text-muted); line-height: 1.4; }
    .jlc-row { font-size: 0.74rem; color: var(--text-secondary); font-weight: 600; }
    .jlc-row .oos { color: #dc2626; }
    .mcu-link { margin-top: auto; font-size: 0.82rem; font-weight: 600; align-self: flex-start; }
    .mcu-link::after { content: " ↗"; }
    .no-results { text-align: center; padding: 3rem 1rem; color: var(--text-muted); border: 1px dashed var(--border); border-radius: 12px; }

    details.overview { margin: 1.25rem 0; border: 1px solid var(--border); border-radius: 12px; background: var(--bg-secondary); }
    details.overview > summary { cursor: pointer; padding: 0.9rem 1.2rem; font-weight: 700; }
    details.overview .overview-body { padding: 0 1.4rem 1.2rem; overflow-x: auto; }
    details.overview table { font-size: 0.85rem; }

    .back-home { font-size: 0.85rem; }
    .cat-footer { margin-top: 2.5rem; padding-top: 1.25rem; border-top: 2px solid var(--border); font-size: 0.85rem; color: var(--text-muted); }
    @media (max-width: 768px) { .catalog-wrap { padding: 1.25rem 1rem 3rem; } .cat-hero h1 { font-size: 1.5rem; } }
  </style>
</head>
<body>
  <header class="header">
    <button class="hamburger" aria-label="Toggle sidebar">&#9776;</button>
    <div class="header-title"><a href="../index.html" style="color:inherit;text-decoration:none;">Study Notes</a></div>
    <div style="flex:1;"></div>
    <a class="back-home" href="../index.html">&larr; All topics</a>
    <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">&#9790;</button>
  </header>

  <div class="catalog-wrap">
    <nav class="breadcrumbs">
      <a href="../index.html">Home</a><span class="sep">›</span>
      <span>MCU Products — Catalog</span>
    </nav>

    <div class="cat-hero">
      <h1>MCU Product Catalog</h1>
      <p>${mcus.length} microcontrollers from ${vendorCount} vendors — from sub-10-cent 8-bit parts to NPU-equipped crossover MCUs — with core, clock, memory, radios, interfaces and distributor price. Sorted low price first. Each card shows where its price came from and what the fact-checker verified.</p>
      <div class="cat-criteria">
        <span class="crit-chip">${mcus.length} parts</span>
        <span class="crit-chip">${vendorCount} vendors</span>
        <span class="crit-chip">${priced} with a price</span>
        <span class="crit-chip">Arm · RISC-V · Xtensa · 8-bit</span>
        <span class="crit-chip">Fact-checked against datasheets</span>
      </div>
    </div>

    <details class="overview">
      <summary>Market overview &amp; how to pick (click to open)</summary>
      <div class="overview-body">${overviewHtml}</div>
    </details>

    <div class="filters" id="filters">
      <div class="filter-field" style="grid-column: 1 / -1;">
        <label for="f-search">Search (part · family · vendor · core · feature)</label>
        <input type="text" id="f-search" placeholder="e.g. CH32V003, RP2350, Cortex-M33, NPU, CAN-FD, ESP32-C6…" autocomplete="off">
      </div>
      <div class="filter-field" style="grid-column: 1 / -1;">
        <label>Category</label>
        <div class="seg-group" id="f-category">
          <button class="seg-btn active" data-val="all">All</button>
          ${cats.map(c => `<button class="seg-btn" data-val="${c}">${CAT_LABEL[c]}</button>`).join('\n          ')}
        </div>
      </div>
      <div class="filter-field">
        <label for="f-arch">Architecture</label>
        <select id="f-arch"><option value="all">All architectures</option>${arches.map(a => `<option value="${a}">${ARCH_LABEL[a]}</option>`).join('')}</select>
      </div>
      <div class="filter-field">
        <label for="f-vendor">Vendor</label>
        <select id="f-vendor"><option value="all">All vendors</option>${vendors.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select>
      </div>
      <div class="filter-field">
        <label for="f-radio">Wireless</label>
        <select id="f-radio">
          <option value="all">Any</option>
          <option value="none">No radio</option>
          <option value="any">Any radio</option>
          ${radioOpts.map(([k, label]) => `<option value="${k}">${label}</option>`).join('\n          ')}
        </select>
      </div>
      <div class="filter-field">
        <label for="f-flash">Min flash</label>
        <select id="f-flash">
          <option value="0">Any</option><option value="8">8 KB</option><option value="32">32 KB</option><option value="64">64 KB</option>
          <option value="128">128 KB</option><option value="256">256 KB</option><option value="512">512 KB</option><option value="1024">1 MB</option><option value="2048">2 MB</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="f-ram">Min RAM</label>
        <select id="f-ram">
          <option value="0">Any</option><option value="2">2 KB</option><option value="8">8 KB</option><option value="32">32 KB</option>
          <option value="64">64 KB</option><option value="128">128 KB</option><option value="256">256 KB</option><option value="512">512 KB</option><option value="1024">1 MB</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="f-mhz">Min clock: <span class="range-val" id="f-mhz-val">any</span></label>
        <input type="range" id="f-mhz" min="0" max="${mhzMax}" step="25" value="0">
      </div>
      <div class="filter-field">
        <label for="f-price">Max price</label>
        <select id="f-price">
          <option value="Infinity">Any</option><option value="0.1">$0.10</option><option value="0.25">$0.25</option><option value="0.5">$0.50</option>
          <option value="1">$1</option><option value="2">$2</option><option value="5">$5</option><option value="10">$10</option><option value="20">$20</option>
        </select>
      </div>
      <div class="filter-field">
        <label for="f-sort">Sort by</label>
        <select id="f-sort">
          <option value="price-asc">Price — low to high</option>
          <option value="price-desc">Price — high to low</option>
          <option value="mhz-desc">Clock — high to low</option>
          <option value="flash-desc">Flash — high to low</option>
          <option value="ram-desc">RAM — high to low</option>
          <option value="year-desc">Newest first</option>
          <option value="vendor">Vendor (A–Z)</option>
        </select>
      </div>
      <div class="filter-field" style="grid-column: 1 / -1;">
        <label>Must have</label>
        <div class="toggles">
          <div class="toggle-row"><input type="checkbox" id="f-usb"><label for="f-usb">USB</label></div>
          <div class="toggle-row"><input type="checkbox" id="f-can"><label for="f-can">CAN / CAN-FD</label></div>
          <div class="toggle-row"><input type="checkbox" id="f-eth"><label for="f-eth">Ethernet</label></div>
          <div class="toggle-row"><input type="checkbox" id="f-fpu"><label for="f-fpu">Hardware FPU</label></div>
          <div class="toggle-row"><input type="checkbox" id="f-cam"><label for="f-cam">Camera input (DVP / DCMI / CSI)</label></div>
          <div class="toggle-row"><input type="checkbox" id="f-priced"><label for="f-priced">Verified / listed price only</label></div>
          <div class="toggle-row"><input type="checkbox" id="f-jlc"><label for="f-jlc">In stock at JLCPCB</label></div>
          <div class="toggle-row"><input type="checkbox" id="f-basic"><label for="f-basic">JLC Basic part (no loading fee)</label></div>
          <button class="btn-reset" id="f-reset">Reset filters</button>
        </div>
      </div>
    </div>

    <div class="result-bar">
      <div class="result-count"><strong id="r-count">0</strong> MCUs match</div>
      <div>Unit prices in USD at the quantity shown; parts without a price sort last.</div>
    </div>

    <div class="price-legend">
      <span><b>Price confidence:</b></span>
      <span><span class="conf-dot verified"></span><b>Verified</b> — read from the JLCPCB/LCSC parts API (exact part number, 100 pcs)</span>
      <span><span class="conf-dot listed"></span><b>Listed</b> — seen in a search result for a named distributor</span>
      <span><span class="conf-dot est"></span><b>Est.</b> — approximate, for comparison only</span>
    </div>

    <div class="cards" id="cards"></div>
    <div class="no-results" id="no-results" style="display:none;">No MCUs match these filters. Try widening price, memory or clock.</div>

    <footer class="cat-footer">
      Data: vendor product pages and datasheets for specs; LCSC, JLCPCB, DigiKey, Mouser and vendor stores for prices. Researched ${esc(catalog.schema.researched)}.
      Source data: <code>content/mcu-products/catalog.json</code>. Prices move — check stock before you design a part in.
    </footer>
  </div>

  <script src="../scripts/main.js"></script>
  <script>
    // ===== Catalog data (generated from content/mcu-products/catalog.json) =====
    const MCUS = ${dataJson};
    const CAT_LABEL = ${JSON.stringify(CAT_LABEL)};
    const ARCH_LABEL = ${JSON.stringify(ARCH_LABEL)};
    const CONF_LABEL = { verified: "● verified", listed: "● listed", est: "est.", none: "no price" };
    const DEFAULTS = { search: "", category: "all", arch: "all", vendor: "all", radio: "all", flash: 0, ram: 0, mhz: 0,
      price: Infinity, sort: "price-asc", usb: false, can: false, eth: false, fpu: false, cam: false, priced: false, jlc: false, basic: false };
    const TOGGLES = ["usb", "can", "eth", "fpu", "cam", "priced", "jlc", "basic"];
    const hasCam = m => !!m.camera && !/^(no|none|-)$/i.test(String(m.camera).trim());
    const state = { ...DEFAULTS };
    const el = id => document.getElementById(id);
    const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const radios = m => (m.wireless || []).join(" ").toLowerCase();

    const RADIO_RE = Object.fromEntries(Object.entries(${JSON.stringify(RADIO_SRC)}).map(([k, v]) => [k, new RegExp(v)]));
    function matchRadio(m) {
      const r = radios(m);
      if (state.radio === "all") return true;
      if (state.radio === "none") return !r;
      if (state.radio === "any") return !!r;
      return RADIO_RE[state.radio].test(r);
    }
    const SAFE_URL = /^https?:\\/\\//i;
    const hasUsb = m => m.usb && !/^(no|none|-)$/i.test(m.usb.trim());
    const hasCan = m => m.can && !/^(no|none|-)$/i.test(m.can.trim());

    function applyFilters() {
      const q = state.search.toLowerCase();
      const list = MCUS.filter(m => {
        if (state.category !== "all" && m.category !== state.category) return false;
        if (state.arch !== "all" && m.arch !== state.arch) return false;
        if (state.vendor !== "all" && m.vendor !== state.vendor) return false;
        if (!matchRadio(m)) return false;
        if (state.flash && !((m.flashKB || 0) >= state.flash)) return false;
        if (state.ram && !((m.sramKB || 0) >= state.ram)) return false;
        if (state.mhz && !((m.mhz || 0) >= state.mhz)) return false;
        if (state.price !== Infinity && !(m.price != null && m.price <= state.price)) return false;
        if (state.usb && !hasUsb(m)) return false;
        if (state.can && !hasCan(m)) return false;
        if (state.eth && !m.ethernet) return false;
        if (state.fpu && !(m.fpu === "sp" || m.fpu === "dp")) return false;
        if (state.cam && !hasCam(m)) return false;
        if (state.priced && !(m.price != null && (m.priceConf === "verified" || m.priceConf === "listed"))) return false;
        if (state.jlc && !(m.jlcStock > 0)) return false;
        if (state.basic && m.jlcLibrary !== "Basic") return false;
        if (q) {
          const hay = [m.part, m.family, m.vendor, m.core, (m.highlights || []).join(" "), radios(m), m.notes, m.lcsc, m.camera].join(" ").toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      const num = (v, dflt) => (v == null ? dflt : v);
      const sorters = {
        "price-asc": (a, b) => num(a.price, Infinity) - num(b.price, Infinity),
        "price-desc": (a, b) => num(b.price, -1) - num(a.price, -1),
        "mhz-desc": (a, b) => num(b.mhz, -1) - num(a.mhz, -1),
        "flash-desc": (a, b) => num(b.flashKB, -1) - num(a.flashKB, -1),
        "ram-desc": (a, b) => num(b.sramKB, -1) - num(a.sramKB, -1),
        "year-desc": (a, b) => num(b.year, 0) - num(a.year, 0),
        "vendor": (a, b) => a.vendor.localeCompare(b.vendor) || a.part.localeCompare(b.part),
      };
      return list.sort(sorters[state.sort]);
    }

    const kb = v => v == null ? "—" : v >= 1024 ? (+(v / 1024).toFixed(2)) + " MB" : v < 1 ? Math.round(v * 1024) + " B" : v + " KB";
    const money = v => v < 1 ? "$" + v.toFixed(v < 0.1 ? 3 : 2) : "$" + (+v.toFixed(2));

    function card(m, isCheapest) {
      const price = m.price == null ? "—" : (m.priceConf === "est" ? "~" : "") + money(m.price);
      const radioPills = (m.wireless || []).map(w => '<span class="pill radio">' + esc(w) + "</span>").join("");
      const hl = (m.highlights || []).slice(0, 6).map(h => '<span class="pill hl">' + esc(h) + "</span>").join("");
      const volts = m.vMin != null && m.vMax != null ? esc(m.vMin) + "–" + esc(m.vMax) + " V" : "—";
      const core = esc(m.core) + (m.cores && m.cores > 1 ? " ×" + m.cores : "");
      return '<div class="mcu-card' + (isCheapest ? " cheapest" : "") + '">' +
        (isCheapest ? '<div class="badge-best">★ LOWEST PRICE</div>' : "") +
        '<div class="card-top"><div><div class="mcu-name">' + esc(m.part) + '</div><div class="mcu-vendor">' + esc(m.vendor) + " · " + esc(m.family) + "</div></div>" +
        '<div class="price-tag"><div class="amount">' + price + "</div>" +
        (m.priceQty ? '<div class="qty">@ ' + esc(m.priceQty) + " pcs</div>" : "") +
        '<div class="price-conf ' + esc(m.priceConf) + '" title="' + esc(m.priceSource || "") + '">' + (CONF_LABEL[m.priceConf] || CONF_LABEL.none) + "</div></div></div>" +
        '<div class="pill-row"><span class="pill cat">' + (CAT_LABEL[m.category] || esc(m.category)) + '</span><span class="pill">' + (ARCH_LABEL[m.arch] || esc(m.arch)) + "</span>" +
        radioPills + (hasUsb(m) ? '<span class="pill">USB ' + esc(m.usb) + "</span>" : "") + (hasCan(m) ? '<span class="pill">' + esc(m.can) + "</span>" : "") +
        (m.ethernet ? '<span class="pill">Ethernet</span>' : "") +
        (m.status && m.status !== "active" ? '<span class="pill cat" title="' + esc(m.statusNote || "") + '">' + esc(m.status === "nrnd" ? "NRND" : m.status === "eol" ? "EOL" : m.status[0].toUpperCase() + m.status.slice(1)) + "</span>" : "") +
        (hasCam(m) ? '<span class="pill radio">Camera: ' + esc(m.camera) + "</span>" : "") + "</div>" +
        (m.lcsc ? '<div class="jlc-row">LCSC <a href="https://www.lcsc.com/product-detail/' + esc(m.lcsc) + '.html" target="_blank" rel="noopener">' + esc(m.lcsc) + "</a> · " +
          (m.jlcStock > 0 ? m.jlcStock.toLocaleString("en-US") + " in stock" : '<span class="oos">out of stock</span>') + " · JLC " + esc(m.jlcLibrary) + "</div>" : "") +
        '<div class="spec-grid">' +
        '<div class="spec"><span class="k">Core</span><span class="v">' + core + "</span></div>" +
        '<div class="spec"><span class="k">Clock</span><span class="v">' + (m.mhz != null ? esc(m.mhz) + " MHz" : "—") + "</span></div>" +
        '<div class="spec"><span class="k">Flash</span><span class="v">' + kb(m.flashKB) + "</span></div>" +
        '<div class="spec"><span class="k">RAM</span><span class="v">' + kb(m.sramKB) + "</span></div>" +
        '<div class="spec"><span class="k">ADC</span><span class="v">' + (m.adcBits != null ? esc(m.adcBits) + "-bit" : "—") + "</span></div>" +
        '<div class="spec"><span class="k">GPIO</span><span class="v">' + (m.gpio != null ? esc(m.gpio) : "—") + "</span></div>" +
        '<div class="spec"><span class="k">Supply</span><span class="v">' + volts + "</span></div>" +
        '<div class="spec"><span class="k">Package</span><span class="v">' + esc((m.packages || []).slice(0, 3).join(", ") || "—") + "</span></div>" +
        "</div>" +
        (hl ? '<div class="pill-row">' + hl + "</div>" : "") +
        (m.notes ? '<div class="mcu-notes">' + esc(m.notes) + "</div>" : "") +
        (m.checked ? '<div class="mcu-checked">Checked: ' + esc(m.checked) + "</div>" : "") +
        (SAFE_URL.test(m.url || "") ? '<a class="mcu-link" href="' + esc(m.url) + '" target="_blank" rel="noopener">Product page / datasheet</a>' : "") + "</div>";
    }

    function render() {
      const list = applyFilters();
      el("r-count").textContent = list.length;
      // The badge goes to one part, the cheapest with a verified or listed price (estimates don't count).
      const firm = list.filter(m => m.price != null && (m.priceConf === "verified" || m.priceConf === "listed"));
      const best = firm.length ? firm.reduce((a, b) => (b.price < a.price ? b : a)) : null;
      if (!list.length) { el("cards").innerHTML = ""; el("no-results").style.display = "block"; return; }
      el("no-results").style.display = "none";
      el("cards").innerHTML = list.map(m => card(m, m === best)).join("");
    }

    function initCatalog() {
      el("f-search").addEventListener("input", e => { state.search = e.target.value.trim(); render(); });
      el("f-category").querySelectorAll(".seg-btn").forEach(btn => btn.addEventListener("click", () => {
        el("f-category").querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active"); state.category = btn.dataset.val; render();
      }));
      for (const k of ["arch", "vendor", "radio", "sort"]) el("f-" + k).addEventListener("change", e => { state[k] = e.target.value; render(); });
      for (const k of ["flash", "ram", "price"]) el("f-" + k).addEventListener("change", e => { state[k] = +e.target.value; render(); });
      el("f-mhz").addEventListener("input", e => { state.mhz = +e.target.value; el("f-mhz-val").textContent = state.mhz ? state.mhz + " MHz" : "any"; render(); });
      for (const k of TOGGLES) el("f-" + k).addEventListener("change", e => { state[k] = e.target.checked; render(); });
      el("f-reset").addEventListener("click", () => {
        Object.assign(state, DEFAULTS);
        el("f-search").value = "";
        for (const k of ["arch", "vendor", "radio", "sort"]) el("f-" + k).value = DEFAULTS[k];
        el("f-flash").value = "0"; el("f-ram").value = "0"; el("f-price").value = "Infinity";
        el("f-mhz").value = 0; el("f-mhz-val").textContent = "any";
        for (const k of TOGGLES) el("f-" + k).checked = false;
        el("f-category").querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.val === "all"));
        render();
      });
      render();
    }
    document.addEventListener("DOMContentLoaded", initCatalog);
  </script>
</body>
</html>
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  return outPath;
}

module.exports = { build };
