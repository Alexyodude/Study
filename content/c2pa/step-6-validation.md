---
title: "Step 6: Validation & Verification"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, validation, verification, trust-list, certificate]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work"
  - url: "https://c2pa.org/faqs/"
    title: "C2PA FAQ"
---

When someone receives an asset with Content Credentials, a **Validator** checks whether the credentials are authentic, unmodified, and trustworthy. This is the most technically complex step in the pipeline.

## The Five Phases of Validation

### Phase 1: Manifest Discovery

1. **Locate the manifest store** — Check for embedded JUMBF data, a sidecar `.c2pa` file, or a remote manifest URL
2. **Identify the active manifest** — The last manifest in the store is the active one
3. **Parse the JUMBF structure** — Extract the assertion store, claim, and claim signature

### Phase 2: Claim & Signature Validation

4. **Parse the claim** — Deserialize the `c2pa.claim.v2` CBOR structure
5. **Validate the COSE_Sign1 signature**:
   - Extract the protected headers (algorithm, certificate chain)
   - Reconstruct the `Sig_structure` (the bytes-to-be-signed)
   - Verify the signature against the signer's public key from the certificate
6. **Validate the time-stamp** (if present):
   - Verify the RFC 3161 time-stamp token's signature
   - Confirm the time-stamp covers the claim signature
   - Check that the TSA certificate is on the [TSA trust list](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html)

### Phase 3: Credential & Revocation Checking

7. **Extract the signer certificate** from the COSE_Sign1 protected headers
8. **Validate the certificate chain**:
   - Verify each certificate's signature up to a trusted root
   - Check that the signing certificate has the correct EKU (`id-kp-claimSigning`)
   - Confirm the certificate was valid at signing time (using the time-stamp)
9. **Check revocation status**:
   - Query OCSP (Online Certificate Status Protocol) responders, or
   - Check Certificate Revocation Lists (CRLs)
   - If the certificate was revoked *before* the time-stamp, the manifest is invalid

### Phase 4: Assertion & Content Validation

10. **Validate assertion hashes** — For each assertion in `created_assertions` and `gathered_assertions`:
    - Recompute the SHA-256 hash of the assertion's bytes
    - Compare with the hash stored in the claim's hashed-URI
    - Any mismatch → assertion was tampered with
11. **Validate the hard binding**:
    - Recompute the SHA-256 hash over the file bytes (excluding the manifest region)
    - Compare with the hash in `c2pa.hash.data`
    - Any mismatch → **the file content has been modified since signing**
12. **Validate ingredients recursively**:
    - For each `c2pa.ingredient.v3` assertion, locate and validate the ingredient's manifest
    - This creates a recursive validation of the entire provenance chain
13. **Verify redacted assertions** — Confirm redacted assertion URIs match expected entries

### Phase 5: Trust Determination

14. **Check the trust list** — Does the signing certificate's root CA appear on:
    - The [C2PA Trust List](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) (default), or
    - A validator-configured custom trust list
15. **Return validation results** with status codes

## Validation States

The spec defines three progressive levels of validity:

```
Well-formed Manifest
    ↓ (+ valid signature + unrevoked certificate)
Valid Manifest
    ↓ (+ signer is on the trust list)
Trusted Manifest
```

| State | Meaning |
|-------|---------|
| **Well-formed** | Structurally correct JUMBF/CBOR — parses without errors |
| **Valid** | Signature is cryptographically correct, certificate chain is valid, content hash matches |
| **Trusted** | All of the above, AND the signer's root CA is on the validator's trust list |

A manifest can be **valid but not trusted** — e.g., signed with a self-signed certificate. The cryptography checks out, but there's no trusted authority vouching for the signer.

## Offline Verification

A key design decision: [all required certificates travel inside the manifest](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/). This means basic validation (phases 1-2, 4) works **without any network access**.

Network is only needed for:
- Certificate revocation checking (OCSP/CRL) — Phase 3
- Remote manifest retrieval — if the manifest isn't embedded
- Soft binding recovery — looking up manifests in a repository

## Verification Tools

| Tool | Type | Use Case |
|------|------|----------|
| [Content Credentials Verify](https://contentcredentials.org/) | Web app | Browser-based verification (uses WebAssembly) |
| [c2patool](https://github.com/contentauth/c2patool) | CLI | Inspect and sign manifests from the command line |
| [C2PA Viewer](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) | Debug tool | Raw JSON manifest inspection |
| [c2pa-rs](https://github.com/contentauth/c2pa-rs) | Rust library | Build verification into your own applications |
| [c2pa-node](https://github.com/contentauth/c2pa-node) | Node.js library | JavaScript/TypeScript integration |

## What a Failed Validation Means

| Failure | Likely Cause |
|---------|-------------|
| Signature invalid | Manifest was modified after signing |
| Hard binding mismatch | File content was modified after signing |
| Assertion hash mismatch | An individual assertion was tampered with |
| Certificate expired (no time-stamp) | Signing certificate is past its validity period |
| Certificate revoked | The CA revoked the signer's certificate |
| Not on trust list | Signer used a certificate from an unrecognized CA |

A failed hard binding doesn't necessarily mean malice — it could mean a non-C2PA-aware tool re-saved the file, inadvertently changing bytes.

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — Complete validation algorithm, trust list specification
2. [How C2PA Content Credentials Work](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Verification tools and offline capabilities
3. [C2PA FAQ](https://c2pa.org/faqs/) — Trust list and conformance program details
