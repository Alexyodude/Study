---
title: "Photo vs. Video: What Differs"
created: 2026-03-21
updated: 2026-03-21
tags: [c2pa, photo, video, bmff, streaming, fragmented-mp4, cmaf]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://irdeto.com/blog/extending-trust-into-live-video-with-c2pa"
    title: "Extending Trust into Live Video with C2PA — Irdeto"
  - url: "https://dl.acm.org/doi/10.1145/3625468.3652198"
    title: "Integrating Content Authenticity with DASH Video Streaming — ACM MMSys 2024"
  - url: "https://www.qualabs.com/our-work/c2pa-for-live-video-how-to-sign-and-authenticate-content-in-real-time"
    title: "C2PA for Live Video — Qualabs"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work"
---

The seven-step C2PA pipeline — create, assemble, sign, embed, distribute, validate, present — applies to **both photos and videos**. The manifest structure (assertions, claim, COSE_Sign1 signature) is identical. The trust model, certificates, and validation algorithm are the same.

The differences are in **how the hard binding is computed** and **how the manifest is physically embedded**, because image files and video containers have fundamentally different internal structures. Streaming video adds an additional layer of complexity.

## What's Identical

| Component | Photo | Video |
|-----------|-------|-------|
| Assertion Store | Same CBOR assertions | Same CBOR assertions |
| Claim structure | `c2pa.claim.v2` | `c2pa.claim.v2` |
| Claim Signature | COSE_Sign1 | COSE_Sign1 |
| Certificates | X.509 with same EKU | X.509 with same EKU |
| Soft bindings | Perceptual hash / watermark | Perceptual hash / watermark |
| Ingredients | Same `c2pa.ingredient.v3` | Same `c2pa.ingredient.v3` |
| Trust model | C2PA Trust List | C2PA Trust List |
| Validation algorithm | Same 5-phase process | Same 5-phase process |

## Hard Binding: The Key Difference

### Photos — Byte-Range Hashing

Photos (JPEG, PNG, WebP, TIFF) use `c2pa.hash.data`, which computes a SHA-256 hash over **byte ranges** of the file:

```
File bytes:  [header][metadata][MANIFEST REGION][pixel data][footer]
                ↑                                    ↑         ↑
                └────────── hashed ──────────────────┘─────────┘
                          (manifest region excluded)
```

The Claim Generator knows where the manifest will be inserted and excludes those bytes from the hash. Everything else — headers, pixel data, footer — is covered.

### Monolithic Video — Box-Based Hashing

Video files (MP4, MOV, HEIC, AVIF) use the [ISO Base Media File Format (BMFF)](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html), which organizes data into named **boxes** (also called atoms). Instead of byte ranges, C2PA uses `c2pa.hash.bmff.v3`, which hashes all boxes **except** the manifest box:

```
MP4 file structure:
  ┌─────────┐
  │  ftyp   │ ← hashed
  ├─────────┤
  │  moov   │ ← hashed (movie metadata, tracks, timing)
  ├─────────┤
  │  uuid   │ ← EXCLUDED (this is the C2PA manifest)
  ├─────────┤
  │  mdat   │ ← hashed (the actual video/audio data)
  └─────────┘
```

The box exclusion approach is more natural for BMFF files because the format is already organized into discrete, named containers. The hash covers all boxes not on the exclusion list.

### Why the Difference Matters

- **Byte-range hashing** is simpler but requires knowing exact byte offsets — fragile if the file format changes internal layout
- **Box-based hashing** is format-aware and more robust for container formats where box ordering can vary

For a finished, monolithic video file, the experience is nearly identical to signing a photo: hash the content, sign, embed, done.

## Embedding Location by Format

| Format | Container Type | Where the Manifest Goes |
|--------|---------------|------------------------|
| JPEG | Marker-based | APP11 marker segment |
| PNG | Chunk-based | `caBX` chunk |
| WebP | RIFF container | RIFF chunk |
| TIFF/DNG | IFD-based | IFD entry |
| MP4 | BMFF | `uuid` box |
| MOV | BMFF | `uuid` box |
| AVIF | BMFF | `uuid` box |
| HEIC/HEIF | BMFF | `uuid` box |

All BMFF-based formats (MP4, MOV, AVIF, HEIC) use the same embedding mechanism — a `uuid` box with a C2PA-specific UUID. This is a natural extension point in the BMFF container spec.

## The Streaming Problem

For a monolithic video file, signing works just like a photo. But modern video delivery uses **fragmented MP4 (fMP4)** for adaptive streaming (HLS, DASH). This creates a fundamental problem:

> You cannot hash a file that doesn't fully exist yet.

A live stream has no "last byte." Traditional C2PA [Merkle-tree hashing requires the complete file](https://irdeto.com/blog/extending-trust-into-live-video-with-c2pa) from first to last byte before generating cryptographic proofs — impossible for live content.

## C2PA 2.3: Per-Segment Signing

The C2PA 2.3 specification solves streaming with **CMAF segment-level signing**:

### How It Works

```
Live camera feed
    ↓
Encoder/Packager (C2PA-enabled)
    ↓
┌─────────────────────────────────────────────┐
│  Initialization Segment                     │
│  ├── Full C2PA manifest (once per track)    │
│  └── Session key info                       │
├─────────────────────────────────────────────┤
│  Segment 1 (e.g., 2 seconds of video)      │
│  ├── moof (fragment header)                 │
│  ├── mdat (video/audio samples)             │
│  └── emsg (Event Message Box)               │
│       ├── Segment signature                 │
│       └── Position in stream                │
├─────────────────────────────────────────────┤
│  Segment 2                                  │
│  ├── moof + mdat                            │
│  └── emsg (signature + position)            │
├─────────────────────────────────────────────┤
│  Segment 3 ...                              │
└─────────────────────────────────────────────┘
```

### Step by Step

1. **Initialization segment** carries the full C2PA manifest once per media track — assertions, claim, signature, certificate chain
2. **Each CMAF segment** (typically 1–10 seconds of video) is independently hashed
3. An **Event Message Box (`emsg`)** is embedded in each segment carrying:
   - The segment's cryptographic signature
   - Its position in the stream sequence
4. **Session keys** — asymmetric intermediate keys derived from the main signing key — generate per-segment signatures and rotate frequently across tracks
5. The player validates each segment independently as it arrives

### Why Session Keys?

Signing every segment with the main private key would be:
- **Slow** — asymmetric signing is computationally expensive at real-time rates
- **Risky** — frequent use of the main key increases exposure

Session keys solve both: they are derived from the main key, can be verified against the certificate chain, but are cheaper to compute and can be rotated frequently.

### Bandwidth Overhead

Per-segment signing adds approximately [0.56% bandwidth overhead](https://irdeto.com/blog/extending-trust-into-live-video-with-c2pa) — negligible compared to the video data itself. Performance benchmarks show real-time validation on 1080p and 720p streams without playback disruption.

### Compatibility

The streaming C2PA design works transparently with existing infrastructure:

| Component | Changes Needed? |
|-----------|----------------|
| HLS/DASH manifests (M3U8, MPD) | None |
| Video codecs (H.264, H.265, AV1) | None |
| DRM systems (Widevine, FairPlay) | None |
| CDN infrastructure | None |
| Player seeking / quality switching | None |

Non-C2PA-aware players simply ignore the `emsg` boxes — they are defined as skippable in the BMFF spec.

## Validation Differences

### Photo Validation

1. Read the manifest from the metadata region
2. Recompute SHA-256 over file byte ranges
3. Compare with `c2pa.hash.data`

### Monolithic Video Validation

1. Read the manifest from the `uuid` box
2. Enumerate all BMFF boxes
3. Hash all boxes except the manifest box
4. Compare with `c2pa.hash.bmff.v3`

### Streaming Video Validation

1. Read the manifest from the initialization segment
2. For each arriving segment:
   - Read the `emsg` box
   - Hash the segment's `moof` + `mdat` boxes
   - Verify the segment signature against the session key
   - Verify the session key against the certificate chain
3. Detect gaps or reordering via the position field

Streaming validation is **incremental** — each segment is validated as it arrives, rather than waiting for the entire file.

## Summary Comparison

| Aspect | Photo | Monolithic Video | Streaming Video |
|--------|-------|-----------------|-----------------|
| Hard binding type | `c2pa.hash.data` (byte ranges) | `c2pa.hash.bmff.v3` (box exclusion) | Per-segment hash + `emsg` signature |
| Manifest location | Format-specific metadata region | BMFF `uuid` box | Initialization segment |
| Must have complete file? | Yes | Yes | No — per-segment |
| Validation mode | Whole-file | Whole-file | Incremental |
| Signing frequency | Once | Once | Once per segment (1–10 sec) |
| Session keys? | No | No | Yes — for performance |
| Bandwidth overhead | ~2–50 KB total | ~2–50 KB total | ~0.56% of stream |

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — BMFF hashing, box exclusion, fragmented MP4 support
2. [Extending Trust into Live Video with C2PA — Irdeto](https://irdeto.com/blog/extending-trust-into-live-video-with-c2pa) — Session keys, CMAF segment signing, bandwidth overhead
3. [Integrating Content Authenticity with DASH Video Streaming — ACM MMSys 2024](https://dl.acm.org/doi/10.1145/3625468.3652198) — Academic analysis of C2PA streaming integration
4. [C2PA for Live Video — Qualabs](https://www.qualabs.com/our-work/c2pa-for-live-video-how-to-sign-and-authenticate-content-in-real-time) — Real-time signing implementation
5. [How C2PA Content Credentials Work — SoftwareSeni](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Format support overview
