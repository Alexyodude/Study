---
name: study-site
description: "Manages an organized hierarchy of study materials and generates a navigatable static website. Study material is sourced from the internet via WebSearch and WebFetch, user-provided text, URLs, PDFs, or images. This skill should be used when the user begins a new study topic, adds new material to an existing topic, reorganizes content, or wants to rebuild the study website. Triggers on: study, learn, add topic, new subject, build site, update site, organize notes, research."
---

# Study Site Manager

This skill manages a structured knowledge base stored as markdown in `content/` and generates a navigatable static website in `site/`.

## When to Use

- A new study topic or subject is introduced
- New material is added to an existing topic
- The user wants to reorganize, restructure, or review the content hierarchy
- The site needs to be regenerated after content changes

## Core Workflow

### 0. Research from the Internet

When the user names a topic to study (without providing material directly):

1. Use `WebSearch` to find authoritative sources: official documentation, well-known tutorials, reputable articles, and academic resources.
2. Use `WebFetch` to retrieve content from the top results (aim for 3-5 quality sources).
3. When the user provides a specific URL, use `WebFetch` to retrieve it directly.
4. Synthesize the information — do not copy-paste. Distill into original, well-organized notes written in simple language with examples.
5. Record all source URLs in each markdown file's front-matter `sources` field:
   ```yaml
   sources:
     - url: "https://docs.example.com/guide"
       title: "Official Guide"
     - url: "https://example.com/tutorial"
       title: "Tutorial Name"
   ```
6. If a topic is broad, break the research into subtopics and research each one.
7. When the generated site is built, render source links as a "References" section at the bottom of each page.

### 1. Scaffold a New Topic

When a new topic is introduced:

1. Determine the topic slug (lowercase, hyphen-separated).
2. Create the directory: `content/<topic-slug>/`.
3. Create `content/<topic-slug>/_meta.json`:
   ```json
   {
     "title": "Human-Readable Title",
     "slug": "<topic-slug>",
     "order": <next-available-order>,
     "tags": [],
     "status": "draft",
     "children": []
   }
   ```
4. Create `content/<topic-slug>/index.md` with front-matter and a placeholder summary.
5. Update `content/_registry.json` to include the new topic in the hierarchy.

### 2. Add Subtopics

When material is studied and broken into subtopics:

1. Create `content/<topic-slug>/<subtopic-slug>.md` with front-matter.
2. Update the parent `_meta.json` to add the subtopic to `children`:
   ```json
   { "slug": "<subtopic-slug>", "title": "Subtopic Title", "order": 1 }
   ```
3. Update the parent `index.md` to reference the new subtopic.
4. If a subtopic grows large enough to have its own children, promote it to a directory with its own `_meta.json` and `index.md`.

### 3. Maintain the Registry

`content/_registry.json` is the master navigation index. Its structure:

```json
{
  "site_title": "Study Notes",
  "topics": [
    {
      "slug": "topic-slug",
      "title": "Topic Title",
      "order": 1,
      "status": "draft",
      "children": [
        { "slug": "subtopic-slug", "title": "Subtopic", "order": 1 }
      ]
    }
  ]
}
```

Rules for maintaining the registry:
- Always keep `topics` sorted by `order`.
- When a topic is removed, re-number the order values to stay sequential.
- The registry must always reflect the actual file structure — verify before writing.
- Newly added topics get the next available order number.

### 4. Generate the Website

After content changes, regenerate the static site in `site/`:

1. Read `content/_registry.json` to build the navigation tree.
2. For each `.md` file in `content/`, convert to HTML:
   - Parse YAML front-matter for title, tags, and status.
   - Convert markdown body to HTML.
   - Wrap in the page template with sidebar nav, breadcrumbs, and prev/next links.
3. Generate `site/index.html` as the landing page with the full topic tree.
4. Generate `site/styles/main.css` with clean, readable typography and responsive layout.
5. Generate `site/scripts/main.js` with client-side search and theme toggle.

#### Page Template Structure

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{page_title} - Study Notes</title>
  <link rel="stylesheet" href="/styles/main.css">
</head>
<body>
  <aside class="sidebar">
    <h1><a href="/">Study Notes</a></h1>
    <nav id="nav-tree"><!-- generated from registry --></nav>
    <input type="search" id="search" placeholder="Search...">
    <button id="theme-toggle">Toggle Theme</button>
  </aside>
  <main>
    <nav class="breadcrumbs"><!-- Home > Topic > Subtopic --></nav>
    <article>
      <header>
        <h1>{title}</h1>
        <div class="meta">
          <span class="tags">{tags}</span>
          <span class="status status--{status}">{status}</span>
          <time>{updated}</time>
        </div>
      </header>
      {content}
      <footer class="sources" data-sources="{sources_json}">
        <!-- Rendered from front-matter sources as a "References" list -->
      </footer>
    </article>
    <nav class="page-nav">
      <a href="{prev}" class="prev">Previous</a>
      <a href="{next}" class="next">Next</a>
    </nav>
  </main>
  <script src="/scripts/main.js"></script>
</body>
</html>
```

#### CSS Requirements

- Clean, readable sans-serif typography (system font stack).
- Max content width of 720px, comfortable line height (1.6-1.7).
- Sidebar: fixed, 260px wide, scrollable, collapsible on mobile.
- Light theme: white background, dark text. Dark theme: dark background, light text.
- Status badges: draft (yellow), review (blue), complete (green).
- Code blocks with syntax highlighting colors.
- Responsive: sidebar becomes a hamburger menu below 768px.

#### JS Requirements

- Theme toggle: persist choice in localStorage.
- Client-side search: index all page titles and headings, filter nav tree on input.
- Sidebar toggle for mobile.
- Highlight current page in nav tree.

### 5. Content Quality Checklist

Before marking any topic or subtopic as `complete`, verify:

- [ ] Has a clear summary/introduction
- [ ] Key concepts are listed and explained
- [ ] At least one concrete example is included
- [ ] Related topics are cross-referenced with links
- [ ] Headings follow the hierarchy: H1 (title), H2 (sections), H3 (subsections)
- [ ] Front-matter is accurate (title, tags, dates, status)

### 6. Reorganization

When the user asks to reorganize:

1. Read the current `_registry.json` and all `_meta.json` files.
2. Propose the new hierarchy to the user before making changes.
3. Move files, update all `_meta.json` and `_registry.json`.
4. Fix all cross-reference links in affected markdown files.
5. Regenerate the site.
