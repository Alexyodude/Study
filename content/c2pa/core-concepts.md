---
title: "Core Concepts & Terminology"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, terminology, concepts]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html"
    title: "C2PA and Content Credentials Explainer v2.3"
  - url: "https://c2pa.org/faqs/"
    title: "C2PA FAQ"
---

Before diving into the pipeline, here are the fundamental terms used throughout the C2PA specification.

## Content Credential

The user-facing name for what the spec calls a **C2PA Manifest**. Think of it as a ["nutrition label for digital content"](https://contentauthenticity.org/how-it-works) — it tells you who made the content, with what tool, and whether it was modified.

## Asset

Any digital media file: a JPEG photo, MP4 video, PDF document, audio file, etc. The asset is the thing the Content Credential describes.

## Manifest

A data structure containing all provenance information for one operation on an asset. A manifest consists of three parts:

1. **Assertion Store** — a collection of individual assertions
2. **Claim** — a CBOR structure that references the assertions and binds them to the content
3. **Claim Signature** — a COSE_Sign1 digital signature over the claim

## Manifest Store

A container holding **one or more manifests**. When an asset is edited multiple times by different tools, each edit adds a new manifest to the store. The most recently added manifest is called the **active manifest**.

```
Manifest Store
├── Manifest 1 (original camera capture)
├── Manifest 2 (Photoshop edit)
└── Manifest 3 (active — most recent export)  ← Active Manifest
```

## Assertion

A single statement of fact about the asset, stored as labeled [CBOR](https://cbor.io/) data. Examples:

| Assertion Label | What It Says |
|----------------|-------------|
| `c2pa.actions.v2` | "This image was cropped and color-corrected" |
| `c2pa.hash.data` | "Here's the SHA-256 hash of the file bytes" |
| `c2pa.ingredient.v3` | "This asset was derived from these source files" |
| `c2pa.thumbnail.claim` | "Here's a thumbnail preview" |
| `c2pa.metadata` | "Here's the EXIF/IPTC/XMP metadata" |

All assertions are **optional** — a valid manifest can have as few or as many as the signer chooses.

## Claim

The Claim is the core structure that ties everything together. It:

- Lists all assertions (split into `created_assertions` and `gathered_assertions`)
- Specifies the hashing algorithm (typically SHA-256)
- Identifies the claim generator (the software that created the manifest)
- Points to the claim signature

The Claim uses [deterministic CBOR encoding](https://www.rfc-editor.org/rfc/rfc8949#section-4.2.1) so that any implementation produces identical bytes for the same data.

## Content Binding

The mechanism that ties the manifest to the actual file content. Two types:

- **Hard binding** — A cryptographic hash (SHA-256) over the file bytes. Any change to the file breaks the hash. Each manifest has exactly one hard binding.
- **Soft binding** — A perceptual hash or invisible watermark computed from the content's visual/audio properties. Survives format conversions and minor edits. Used for recovery and cross-rendition matching.

## Ingredient

When content is composed from multiple sources (e.g., a Photoshop composite), each source is recorded as an **ingredient**. Ingredients can reference the source asset's own manifest, creating a recursive provenance chain.

## Actors and Roles

The spec defines several roles in the C2PA ecosystem:

| Role | Description |
|------|-------------|
| **Claim Generator** | Software/hardware that assembles and signs the manifest |
| **Signer** | The entity whose private key signs the claim |
| **Validator** | Software that checks signatures, hashes, and certificates |
| **Manifest Consumer** | Application that presents provenance info to the end user |

## Key Acronyms

| Acronym | Full Name | Role in C2PA |
|---------|-----------|-------------|
| **CBOR** | Concise Binary Object Representation | Data serialization format for claims and assertions |
| **COSE** | CBOR Object Signing and Encryption | Signature format (COSE_Sign1) |
| **JUMBF** | JPEG Universal Metadata Box Format | Container format for embedding manifests in files |
| **PKI** | Public Key Infrastructure | X.509 certificates and certificate authorities |
| **TSA** | Time Stamping Authority | Provides cryptographic proof of signing time |
| **EKU** | Extended Key Usage | Certificate field that authorizes claim signing |

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — Formal definitions of all terms
2. [C2PA and Content Credentials Explainer v2.3](https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html) — Accessible overview of core concepts
3. [C2PA FAQ](https://c2pa.org/faqs/) — Definitions and common questions
