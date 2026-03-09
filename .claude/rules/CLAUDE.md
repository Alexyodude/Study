# Study Site Project

This project is a knowledge management system. Studied material is organized as markdown files in `content/` and compiled into a navigatable static website in `site/`.

## Project Structure

```
content/                    # All study material as markdown
  _registry.json            # Master index: hierarchy, order, metadata
  <topic-slug>/             # One directory per top-level topic
    _meta.json              # Topic metadata (title, order, tags, status, children)
    index.md                # Main overview of the topic
    <subtopic>.md           # Individual subtopic pages
    <subtopic-slug>/        # Nested subtopic directory (for deep hierarchies)
      _meta.json
      index.md
      <detail>.md

site/                       # Generated static website (do not edit by hand)
  index.html                # Landing page with full navigation tree
  styles/                   # CSS
  scripts/                  # JS (search, nav, theme toggle)
  <topic-slug>/             # Mirrors content/ structure as HTML
    index.html
    <subtopic>.html
```

## Rules

### Studying
- Study material can come from any source: user-provided text, PDFs, images, or **the internet**.
- When the user names a topic to study, use `WebSearch` to find authoritative sources (official docs, tutorials, reputable articles), then use `WebFetch` to read the content.
- When the user provides a URL, use `WebFetch` to retrieve and study its content directly.
- Synthesize information from multiple web sources — do not copy-paste. Distill into original, well-structured notes.
- Always record source URLs in the front-matter `sources` field for attribution and future reference.
- **Inline source linking**: When a statement, fact, or explanation draws from a specific source, include an inline hyperlink to that source at the point of use (e.g., "ARM Cortex-M processors use a [full-descending stack](https://developer.arm.com/documentation/...)").
- **References section**: Every markdown file must end with a `## References` section that lists all sources used, formatted as a numbered list of hyperlinks:
  ```markdown
  ## References

  1. [Article Title](https://example.com/article) — Brief description of what this source covers
  2. [Official Guide](https://docs.example.com/guide) — Brief description
  ```
  This section supplements (not replaces) the front-matter `sources` field. The front-matter is for machine use (site generator); the References section is for human readers.
- Extract key concepts and organize them into clear, concise markdown.
- Use simple language. Prefer examples over abstract explanations.
- Each markdown file should cover one focused concept or subtopic.
- Always include a front-matter block at the top of each `.md` file:
  ```yaml
  ---
  title: "Descriptive Title"
  created: 2026-03-08
  updated: 2026-03-08
  tags: [tag1, tag2]
  status: draft | review | complete
  sources:
    - url: "https://example.com/article"
      title: "Article Title"
    - url: "https://docs.example.com/guide"
      title: "Official Guide"
  ---
  ```
- When studying a new topic, invoke the `study-site` skill to scaffold the directory and update the registry.

### Content Organization
- Topic slugs are lowercase, hyphen-separated (e.g., `linear-algebra`, `react-hooks`).
- Keep hierarchy depth to 3 levels max: topic > subtopic > detail.
- Every directory must have an `index.md` that summarizes its children.
- `_registry.json` is the single source of truth for navigation order and hierarchy.
- When adding new content, always update `_meta.json` and `_registry.json`.

### Website Generation
- The site is a single-page-style static site with a persistent sidebar navigation.
- Use vanilla HTML/CSS/JS — no build tools or frameworks unless the user requests one.
- Navigation tree is generated from `_registry.json`.
- Each markdown file becomes one HTML page.
- Include: breadcrumbs, prev/next links, search (client-side), dark/light theme toggle.
- Regenerate the site whenever content changes. Do not manually edit files in `site/`.

### Quality
- Before marking a topic `complete`, ensure it has: a summary, key concepts, at least one example, and links to related topics.
- Use consistent heading levels: H1 for page title (from front-matter), H2 for sections, H3 for subsections.
- Cross-reference related topics using relative links: `[See React Hooks](../react-hooks/index.md)`.
