---
title: "Step 4: Embedding & Packaging"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, embedding, jumbf, sidecar, file-formats]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://opensource.contentauthenticity.org/docs/manifest/understanding-manifest/"
    title: "Working with Manifests — CAI Open Source"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work"
---

After signing, the manifest must be placed somewhere a validator can find it. This step packages the signed manifest into JUMBF format and embeds it in the asset file — or stores it alongside.

## JUMBF Packaging

The entire manifest store is serialized as a [JUMBF (JPEG Universal Metadata Box Format)](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) superbox, defined in ISO 19566-5:2023. JUMBF provides:

- A hierarchical box structure (like a file system)
- Typed boxes with URN labels for discovery
- Compatibility with existing media container formats (JPEG, BMFF)

### Box Structure

```
JUMBF Superbox (c2pa manifest store)
├── Description Box
│   └── Label: "c2pa" URN
│
├── Content Box: Manifest 1
│   ├── Assertion Store Box
│   │   ├── c2pa.hash.data box
│   │   ├── c2pa.actions.v2 box
│   │   └── ...
│   ├── c2pa.claim.v2 box
│   └── c2pa.signature box
│
└── Content Box: Manifest N (active)
    └── ...
```

### Compression

To minimize file size overhead, manifests can be Brotli-compressed into `brob` (Brotli Encoded Box) containers. When compressed, URI references bypass the `brob` wrapper and reference the content directly.

## Three Embedding Strategies

### 1. Embedded (Preferred)

The JUMBF manifest store is written directly into the file's metadata region:

| Format | Where It Goes |
|--------|--------------|
| **JPEG** | APP11 marker segment |
| **PNG** | `caBX` chunk |
| **WebP** | RIFF chunk |
| **AVIF/HEIC** | BMFF `uuid` box |
| **MP4/MOV** | BMFF `uuid` box |
| **PDF** | Associated file annotation |
| **TIFF** | IFD entry |

**Advantage**: The manifest travels with the file — no separate files to track.

**Byte-range hashing**: The hard binding hash covers the file bytes *excluding* the manifest region. The Claim Generator must know the manifest's position and size in the file to correctly compute byte ranges.

### 2. Sidecar File

When the file format doesn't support embedded metadata, the manifest is stored in a separate file with the same name and a `.c2pa` extension:

```
photo.raw      ← the asset
photo.raw.c2pa ← the manifest store
```

**Trade-off**: The sidecar can be separated from the asset. If the `.c2pa` file is lost, provenance is gone.

### 3. Remote / External Manifest Store

The asset contains a reference (URL) pointing to an externally hosted manifest store:

```
Asset metadata → "manifest_url": "https://example.com/manifests/abc123.c2pa"
```

**Use case**: Very large assets, streaming media, or platforms that strip embedded metadata but can preserve a URL reference.

**Trade-off**: Requires network access for verification. The remote store must be available and trusted.

## The Embedding Chicken-and-Egg Problem

Embedding creates a circular dependency:

1. The hard binding hash needs to cover the file bytes
2. But the manifest (containing the hash) is part of the file
3. So the hash must exclude the manifest's own byte range

The solution:

```
1. Write the asset file with a placeholder (zeros) where the manifest will go
2. Compute SHA-256 over the file bytes, excluding the placeholder region
3. Store the hash in the c2pa.hash.data assertion
4. Assemble the claim, sign it, package as JUMBF
5. Write the JUMBF into the placeholder region
6. If the JUMBF is smaller than the placeholder, pad with zeros
```

For [BMFF-based formats](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) (MP4, HEIC, AVIF), the spec uses box exclusion lists instead of byte ranges — the hash covers all boxes except the manifest box.

## Supported File Formats

| Format | Type | Embedding Method |
|--------|------|-----------------|
| JPEG | Image | APP11 segment |
| PNG | Image | caBX chunk |
| WebP | Image | RIFF chunk |
| AVIF | Image | BMFF uuid box |
| HEIC/HEIF | Image | BMFF uuid box |
| TIFF/DNG | Image | IFD entry |
| GIF | Image | Application extension |
| MP4 | Video | BMFF uuid box |
| MOV | Video | BMFF uuid box |
| PDF | Document | Annotation |
| WAV | Audio | RIFF chunk |
| MP3 | Audio | ID3 tag |
| SVG | Vector | Metadata element |

Formats not in this list require the **sidecar** approach.

## File Size Impact

Manifest overhead is typically [measured in kilobytes](https://c2pa.org/faqs/):

- Minimal manifest (hash + signature only): ~2-5 KB
- Typical manifest (hash + actions + thumbnail + signature): ~10-50 KB
- Complex manifest (multiple ingredients, large thumbnails): ~100+ KB

For most media files, this is negligible overhead.

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — JUMBF structure, format-specific embedding, byte-range hashing
2. [Working with Manifests — CAI Open Source](https://opensource.contentauthenticity.org/docs/manifest/understanding-manifest/) — Sidecar and remote manifest options
3. [How C2PA Content Credentials Work](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Supported formats and embedding overview
