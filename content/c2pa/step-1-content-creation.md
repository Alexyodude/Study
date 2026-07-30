---
title: "Step 1: Content Creation & Assertions"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, content-creation, assertions, actions, ingredients]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html"
    title: "C2PA and Content Credentials Explainer v2.3"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work"
---

The pipeline begins when a creator uses a C2PA-enabled tool to produce or modify digital content. At this stage, the tool generates **assertions** — individual statements of fact about the asset.

## What Happens at Creation

A C2PA-enabled device or application:

1. **Captures or generates** the digital content (photo, video, document, AI output)
2. **Collects provenance data** about the creation context
3. **Encodes the data** as one or more assertions in CBOR format

### Example: Camera Capture

A C2PA-enabled camera like the [Leica M11-P](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) (the first camera with hardware C2PA signing):

1. Takes a photo
2. Generates assertions: device info, capture settings, GPS coordinates (if enabled), thumbnail
3. Hashes the image data (hard binding assertion)
4. Signs the manifest using a private key stored in the camera's hardware security module

### Example: AI Generation

A generative AI tool like Adobe Firefly:

1. Generates an image from a text prompt
2. Creates a `c2pa.actions.v2` assertion recording the action as AI-generated
3. Sets the `digitalSourceType` field to indicate AI generation
4. Signs and embeds the manifest

## Types of Assertions Generated

### Actions (`c2pa.actions.v2`)

Records what was done to the asset. Each action includes:

```
{
  "action": "c2pa.created",          // or c2pa.edited, c2pa.cropped, etc.
  "digitalSourceType": "...",        // e.g., trainedAlgorithmicMedia
  "softwareAgent": "Adobe Firefly",
  "when": "2026-03-20T10:30:00Z"
}
```

Common actions: `c2pa.created`, `c2pa.edited`, `c2pa.cropped`, `c2pa.color_adjusted`, `c2pa.filtered`, `c2pa.resized`, `c2pa.drawing`, `c2pa.opened`.

### Ingredients (`c2pa.ingredient.v3`)

When content is derived from other assets (compositing, remixing), each source is recorded:

```
{
  "title": "background.jpg",
  "format": "image/jpeg",
  "instanceID": "...",
  "claimSignature": { ... },         // Hash of the source's manifest
  "dataTypes": [{ "type": "image/jpeg" }]
}
```

Ingredients create a **provenance chain** — you can trace an asset back through every edit to its original sources, each with their own signed manifests.

### Metadata (`c2pa.metadata`)

Standard metadata from the creation context:

- **EXIF** — Camera settings, device info, GPS
- **IPTC** — Creator name, copyright, description
- **XMP** — Extended metadata
- **Schema.org** — Structured data (e.g., `CreativeWork`)

### Thumbnail (`c2pa.thumbnail.claim`)

A visual preview of the asset at the time of signing. This lets validators show users what the content looked like when it was signed, even if the file has since been modified.

### Hard Binding (`c2pa.hash.data`)

A SHA-256 hash computed over the file's byte ranges (excluding the manifest region itself). This is the **cryptographic anchor** that ties the manifest to the content.

## Who Creates Assertions?

Assertions can come from different actors:

| Source | Example | Listed In |
|--------|---------|-----------|
| The signing tool itself | Camera device info, software version | `created_assertions` |
| The creator (opt-in) | Name, copyright notice | `created_assertions` |
| Previous manifests | Inherited metadata from an ingredient | `gathered_assertions` |

The distinction matters for trust: `created_assertions` are attributed to the signer; `gathered_assertions` are explicitly marked as coming from elsewhere.

## Privacy Controls

Assertions are **opt-in** — creators decide what to include. A photographer might:

- Include: camera model, edit history, thumbnail
- Exclude: GPS coordinates, personal name
- Redact: Strip assertions from an ingredient's manifest (recorded in `redacted_assertions`)

The [C2PA specification does not support attribution of content to individuals](https://c2pa.org/faqs/) in the core spec — personal identity is deliberately left as an optional layer.

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — Assertion definitions and encoding
2. [C2PA and Content Credentials Explainer v2.3](https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html) — Creation workflow overview
3. [How C2PA Content Credentials Work](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Real-world signing examples (Leica, Pixel)
