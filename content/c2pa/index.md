---
title: "C2PA — Content Provenance & Authenticity"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, content-credentials, provenance, cryptography, digital-media]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html"
    title: "C2PA and Content Credentials Explainer v2.3"
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://contentauthenticity.org/how-it-works"
    title: "Content Authenticity Initiative — How It Works"
  - url: "https://c2pa.org/faqs/"
    title: "C2PA FAQ"
  - url: "https://c2pa.org/about/"
    title: "About C2PA"
---

The **Coalition for Content Provenance and Authenticity (C2PA)** is an open technical standard that attaches cryptographically signed metadata — called **Content Credentials** — to digital media files. Its purpose: let anyone verify *who* created a piece of content, *how* it was made, and *whether* it has been tampered with since signing.

C2PA was founded by Adobe, Arm, Intel, Microsoft, and Truepic as a [Joint Development Foundation](https://c2pa.org/about/) project. The specification is royalty-free.

## Why C2PA Exists

The internet has no built-in mechanism to verify whether a photo, video, or document is authentic. Traditional metadata (EXIF, XMP) can be silently altered by anyone. C2PA solves this by **cryptographically binding** provenance data to the content itself — any modification to either the media or the metadata breaks the signature and is immediately detectable.

## The Seven-Step Pipeline

C2PA traces a piece of content from creation to consumption:

| Step | What Happens |
|------|-------------|
| [1. Content Creation](step-1-content-creation.md) | A C2PA-enabled device or tool generates assertions about the asset |
| [2. Claim Assembly](step-2-claim-assembly.md) | Assertions are collected into a structured Claim |
| [3. Signing](step-3-signing.md) | The Claim is signed with COSE_Sign1 using an X.509 certificate |
| [4. Embedding](step-4-embedding.md) | The signed Manifest is packaged as JUMBF and embedded in the file |
| [5. Distribution](step-5-distribution.md) | The asset travels with its credentials; soft bindings add durability |
| [6. Validation](step-6-validation.md) | A validator checks signatures, hashes, certificates, and trust lists |
| [7. End-User Presentation](step-7-end-user.md) | The user sees provenance info and makes their own trust decision |

## Key Properties

- **Tamper-evident, not tamper-proof** — C2PA detects modifications but cannot prevent them.
- **Not DRM** — Content Credentials are about transparency, not access control.
- **Opt-in** — Creators choose whether to attach credentials.
- **Offline-capable** — All certificates travel inside the manifest; verification requires no network.
- **Lightweight** — Manifest overhead is typically measured in kilobytes.

## Subtopics

- [Core Concepts & Terminology](core-concepts.md) — The vocabulary of C2PA
- [Manifest Anatomy](manifest-structure.md) — Inside the data structure
- [Steps 1–7](step-1-content-creation.md) — The full pipeline in detail
- [Trust Infrastructure](trust-model.md) — CAs, trust lists, and conformance
- [Photo vs. Video: What Differs](photo-vs-video.md) — Hard binding, BMFF, and streaming
- [Limitations & Challenges](limitations.md) — What C2PA cannot do

## References

1. [C2PA and Content Credentials Explainer v2.3](https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html) — High-level overview of the standard
2. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — The full technical specification
3. [Content Authenticity Initiative — How It Works](https://contentauthenticity.org/how-it-works) — CAI's explainer for creators and consumers
4. [C2PA FAQ](https://c2pa.org/faqs/) — Official frequently asked questions
5. [About C2PA](https://c2pa.org/about/) — Organization background and membership
