---
title: "Step 2: Claim Assembly"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, claim, cbor, hashed-uri]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html"
    title: "C2PA and Content Credentials Explainer v2.3"
---

After assertions are generated, the **Claim Generator** assembles them into a **Claim** — the central structure that binds all assertions together and prepares them for signing.

## What the Claim Generator Does

The Claim Generator is the software (or hardware firmware) responsible for:

1. Collecting all assertions into the assertion store
2. Computing a hash of each assertion's bytes
3. Building hashed-URI references to each assertion
4. Assembling the claim structure in deterministic CBOR
5. Passing the claim to the signer for cryptographic signing

## Assembly Process

### 1. Populate the Assertion Store

All assertions generated in [Step 1](step-1-content-creation.md) are placed into the assertion store as individual JUMBF boxes. Each gets a unique label (e.g., `c2pa.hash.data`, `c2pa.actions.v2`).

### 2. Compute Assertion Hashes

For each assertion, the Claim Generator:
- Serializes the assertion to bytes
- Computes a SHA-256 hash
- Creates a **hashed URI** — a JUMBF URI combined with the hash

```
hashed-uri {
  url:  "self#jumbf=c2pa/urn:c2pa:xxxx/c2pa.assertions/c2pa.hash.data"
  hash: "a3b4c5d6..."   // SHA-256 of the assertion bytes
  alg:  "sha256"
}
```

This is critical: the claim doesn't just *list* assertions — it lists their **hashes**. If someone tampers with an assertion, its hash won't match the one in the claim, and the entire manifest becomes invalid.

### 3. Categorize Assertions

Assertions are sorted into three lists:

| List | Meaning |
|------|---------|
| `created_assertions` | Made by the signer — the signer takes responsibility for these |
| `gathered_assertions` | Inherited from other sources (e.g., ingredient manifests) — the signer includes but did not create them |
| `redacted_assertions` | URIs of assertions that were deliberately removed (e.g., for privacy) |

### 4. Build the Claim Structure

The final claim is assembled as a `c2pa.claim.v2` CBOR map:

```
c2pa.claim.v2 {
  instanceID:           "xmp:iid:b1c2d3e4-..."
  claim_generator_info: {
    name:    "Adobe Photoshop"
    version: "25.0"
  }
  signature:            "self#jumbf=c2pa/urn:c2pa:xxxx/c2pa.signature"
  created_assertions: [
    { url: "...c2pa.hash.data",       hash: "...", alg: "sha256" },
    { url: "...c2pa.actions.v2",      hash: "...", alg: "sha256" },
    { url: "...c2pa.thumbnail.claim", hash: "...", alg: "sha256" }
  ]
  gathered_assertions: [
    { url: "...c2pa.ingredient.v3",   hash: "...", alg: "sha256" }
  ]
  redacted_assertions: []
  alg:          "sha256"
  specVersion:  "2.3.0"
}
```

### 5. Deterministic Encoding

The claim **must** use [deterministic CBOR encoding](https://www.rfc-editor.org/rfc/rfc8949#section-4.2.1) (RFC 8949, §4.2.1). This ensures that any compliant implementation produces the **exact same bytes** for the same claim data. This is essential because the signature is computed over the raw bytes — different byte orderings would produce different signatures.

## The Merkle-Like Hash Chain

C2PA uses a layered hashing approach similar to a [Merkle tree](https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html):

```
File Bytes  →  SHA-256  →  Hard Binding Assertion
                                    ↓
                           SHA-256 of assertion
                                    ↓
                           Hashed-URI in Claim
                                    ↓
                           Claim CBOR bytes
                                    ↓
                           COSE_Sign1 Signature
```

Each layer's hash is included in the next layer's hash, and the final signature covers everything. Tampering at **any** level — the file bytes, an assertion, or the claim itself — invalidates the chain.

## Content Binding at Claim Time

The hard binding assertion (`c2pa.hash.data`) must be computed **after** the manifest's position in the file is known, because the hash covers file byte ranges that *exclude* the manifest region. This creates a chicken-and-egg problem:

1. Reserve space for the manifest in the file
2. Compute the hash over the file bytes (skipping the reserved region)
3. Store the hash in the hard binding assertion
4. Assemble the claim referencing this assertion
5. Sign the claim
6. Write the signed manifest into the reserved space

This ordering is why the Claim Generator and the embedding step are tightly coupled in practice.

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — Claim structure, CBOR encoding, hashed-URI format
2. [C2PA and Content Credentials Explainer v2.3](https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html) — Merkle-like hash approach explanation
