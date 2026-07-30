---
title: "Manifest Anatomy"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, manifest, jumbf, cbor, assertion-store]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://opensource.contentauthenticity.org/docs/manifest/understanding-manifest/"
    title: "Working with Manifests — CAI Open Source"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work and What Their Limits Are"
---

This page dissects the internal structure of a C2PA Manifest — the data structure that carries provenance information.

## High-Level Structure

A manifest is packaged as a [JUMBF (JPEG Universal Metadata Box Format)](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) container (ISO 19566-5:2023). The hierarchy looks like this:

```
C2PA Manifest Store (JUMBF superbox)
│
├── Manifest 1 (JUMBF box, labeled with c2pa URN)
│   ├── Assertion Store
│   │   ├── c2pa.hash.data          ← hard binding
│   │   ├── c2pa.actions.v2         ← edit history
│   │   ├── c2pa.thumbnail.claim    ← preview image
│   │   ├── c2pa.ingredient.v3      ← source references
│   │   └── c2pa.metadata           ← EXIF/IPTC/XMP
│   │
│   ├── Claim (c2pa.claim.v2)       ← CBOR structure referencing assertions
│   │
│   └── Claim Signature             ← COSE_Sign1 over the claim
│
├── Manifest 2 ...
└── Manifest N (active manifest)
```

## The Assertion Store

The assertion store is a logical collection of all assertions referenced by the claim. Each assertion is stored as its own JUMBF box within the manifest.

Key rules:
- Every assertion in the claim's `created_assertions` or `gathered_assertions` **must** be present in the assertion store
- Multiple assertions of the same type are disambiguated with suffixes: `c2pa.actions.v2`, `c2pa.actions.v2__1`, etc.
- Assertions use CBOR encoding internally

### Standard Assertion Categories

| Category | Labels | Purpose |
|----------|--------|---------|
| **Hard Binding** | `c2pa.hash.data`, `c2pa.hash.boxes`, `c2pa.hash.bmff.v3` | Cryptographic content hash |
| **Soft Binding** | `c2pa.softBinding` | Perceptual hash / watermark |
| **Actions** | `c2pa.actions.v2` | Edit history (crop, filter, etc.) |
| **Ingredients** | `c2pa.ingredient.v3` | Source asset references |
| **Thumbnails** | `c2pa.thumbnail.claim`, `c2pa.thumbnail.ingredient` | Visual previews |
| **Metadata** | `c2pa.metadata` | EXIF, IPTC, XMP, Schema.org |
| **Time** | `c2pa.time-stamp` | RFC 3161 time-stamp evidence |
| **Data** | `c2pa.cloud.data`, `c2pa.embedded.data` | External or inline binary data |
| **Other** | `c2pa.font.info`, `c2pa.depthmap` | Domain-specific metadata |

## The Claim (`c2pa.claim.v2`)

The claim is a [deterministic CBOR](https://www.rfc-editor.org/rfc/rfc8949#section-4.2.1) structure that binds assertions to the signer. Its key fields:

```
c2pa.claim.v2 {
  instanceID:           string       // Unique identifier for this manifest version
  claim_generator_info: {
    name:               string       // Required — e.g. "Adobe Photoshop 25.0"
    version:            string       // Optional
    operating_system:   string       // Optional
    icon:               hashed-uri   // Optional
  }
  signature:            jumbf-uri    // Pointer to the COSE_Sign1 signature box
  created_assertions:   [hashed-uri] // Assertions attributed to the signer
  gathered_assertions:  [hashed-uri] // Assertions from other sources
  redacted_assertions:  [jumbf-uri]  // Assertions intentionally removed
  alg:                  string       // Default hash algorithm (e.g. "sha256")
  alg_soft:             string       // Default soft binding algorithm
  dc:title:             string       // Optional asset name
  specVersion:          semver       // Optional spec version
}
```

Important distinctions:
- **`created_assertions`** — The signer is responsible for these. "All created_assertions are [attributed to the signer](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) as the Trust Model is rooted in the trust of the signer."
- **`gathered_assertions`** — Came from elsewhere (e.g., copied from an ingredient's manifest). The signer did not create them.
- **`redacted_assertions`** — Previously existed but were intentionally removed (e.g., for privacy).

Each assertion reference is a **hashed URI** — a JUMBF URI plus a hash of the assertion's bytes. This means even the *list of assertions* is tamper-evident.

## The Claim Signature

A [COSE_Sign1](https://www.rfc-editor.org/rfc/rfc8152) structure stored in its own JUMBF box. It contains:

1. **Protected headers** — Algorithm identifier, signer's X.509 certificate chain
2. **Payload** — The serialized CBOR bytes of the claim
3. **Signature** — The cryptographic signature over headers + payload

See [Step 3: Signing](step-3-signing.md) for the full signing process.

## Storage Locations

Manifests can live in three places:

| Location | How | When |
|----------|-----|------|
| **Embedded** | JUMBF box inside the file's metadata region | Supported formats (JPEG, PNG, MP4, PDF, WebP, AVIF, HEIC) |
| **Sidecar** | Separate `.c2pa` file alongside the asset | Formats that don't support embedded metadata |
| **Remote** | URL reference in the asset's metadata pointing to an external manifest store | When embedding isn't practical |

## Compression

Manifest data can be [Brotli-compressed](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) into `brob` boxes to reduce file size overhead. URI references bypass the compression wrapper and point directly to the manifest content.

## JSON vs. Binary Format

The spec defines two representations:

- **Binary (JUMBF/CBOR)** — The canonical format for embedding in files. This is what validators read.
- **JSON** — A human-readable abstraction used by tools like [c2patool](https://github.com/contentauth/c2patool). JSON manifests reference binary resources (thumbnails, etc.) via file paths and are converted to binary before embedding.

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — Sections on JUMBF, assertion store, claim structure
2. [Working with Manifests — CAI Open Source](https://opensource.contentauthenticity.org/docs/manifest/understanding-manifest/) — Practical guide to manifest formats
3. [How C2PA Content Credentials Work](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Accessible walkthrough of the three-layer hierarchy
