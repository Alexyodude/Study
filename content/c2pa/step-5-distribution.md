---
title: "Step 5: Distribution & Durability"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, distribution, soft-binding, watermark, durability]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html"
    title: "C2PA and Content Credentials Explainer v2.3"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work"
  - url: "https://c2pa.org/faqs/"
    title: "C2PA FAQ"
---

After embedding, the asset goes out into the world — shared on social media, sent via messaging apps, published on websites, distributed through CDNs. This step is where the durability of Content Credentials is tested.

## The Distribution Challenge

When an asset with embedded credentials is shared, several things can happen:

| Scenario | Impact on Credentials |
|----------|----------------------|
| File shared as-is (email, download) | Credentials preserved — everything works |
| Platform preserves C2PA metadata | Credentials preserved |
| Platform re-encodes the file | **Hard binding breaks** — hash no longer matches |
| Platform strips metadata | **Manifest removed entirely** |
| File is screenshot/screen-captured | **All credentials lost** |

### The Metadata Stripping Problem

Many major platforms [re-encode images on upload](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/), silently removing embedded Content Credentials:

- **WhatsApp** — re-encodes and strips metadata
- **iMessage** — re-encodes images
- **Facebook/Instagram** — re-encode and resize
- **Twitter/X** — re-encodes images

This is the biggest practical challenge for C2PA adoption. A signed photo from a journalist loses its credentials the moment it's shared on most social platforms.

## Soft Bindings: The Durability Layer

To address metadata stripping, C2PA defines **soft bindings** — content-based identifiers that survive format changes.

### What Soft Bindings Are

Unlike hard bindings (exact byte hashes), soft bindings are computed from the **perceptual properties** of the content:

| Technique | How It Works |
|-----------|-------------|
| **Perceptual hash** | Generates a fingerprint from the visual/audio content that remains similar after resizing, compression, or format conversion |
| **Invisible watermark** | Embeds an imperceptible signal in the pixel/sample data that survives most transformations |

### How Soft Bindings Enable Recovery

```
Original photo (with manifest)
    │
    ├── Hard binding: SHA-256 of file bytes
    └── Soft binding: perceptual hash / watermark
          │
          ↓ (platform strips manifest, re-encodes)
          │
    Re-encoded photo (no manifest)
          │
          ↓ (validator detects soft binding)
          │
    Manifest recovered from repository
```

The recovery workflow:

1. Creator signs the asset with both hard and soft bindings
2. The manifest is also stored in a **manifest repository** (cloud service)
3. The platform strips the manifest during upload
4. A viewer encounters the image without credentials
5. Validation software computes the perceptual hash or reads the watermark
6. Looks up the hash/watermark in the manifest repository
7. Retrieves the original manifest and presents it to the viewer

### Soft Binding Rules

From the [specification](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html):

- A soft binding **shall not** be used as a hard binding (it's not unique enough for tamper-evidence)
- A manifest may contain **zero or more** soft bindings (unlike hard bindings, which are limited to exactly one)
- Soft bindings are stored as `c2pa.softBinding` assertions

### Limitations of Soft Bindings

- Perceptual hashes can produce false matches on visually similar but different content
- Watermarks can be removed with targeted adversarial techniques
- Recovery requires access to a manifest repository — not all implementations offer this

## Platform Adoption

For C2PA to work at distribution scale, platforms need to either:

1. **Preserve** embedded manifests (don't strip metadata during re-encoding)
2. **Support soft binding recovery** (look up manifests by perceptual hash)
3. **Display** Content Credentials to users (show the provenance info)

As of 2026, adoption is growing:
- Major social media platforms are beginning to preserve or display Content Credentials
- Adobe's Content Authenticity Initiative provides manifest repository services
- The [Content Credentials Verify](https://contentcredentials.org/) site lets anyone check an asset

## The Provenance Chain Across Edits

When an asset is legitimately edited by a C2PA-aware tool:

```
Original Photo (Manifest 1: camera signed)
    ↓
Edited in Photoshop (Manifest 2: records edits, references Manifest 1 as ingredient)
    ↓
Exported for web (Manifest 3: records resize/format change, references Manifest 2)
```

Each edit adds a new manifest to the manifest store. The chain of ingredients lets a validator trace the asset all the way back to the original capture.

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — Soft binding definition, recovery mechanism
2. [C2PA and Content Credentials Explainer v2.3](https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html) — Durability and soft binding overview
3. [How C2PA Content Credentials Work](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Platform stripping problem, real-world examples
4. [C2PA FAQ](https://c2pa.org/faqs/) — Durable credentials and soft binding FAQ
