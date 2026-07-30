---
title: "Step 3: Cryptographic Signing"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, signing, cose, x509, certificates, time-stamp]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work"
  - url: "https://c2pa.org/faqs/"
    title: "C2PA FAQ"
---

Once the claim is assembled, it is cryptographically signed. This is the step that makes C2PA tamper-evident — the signature proves the manifest was created by a specific entity and has not been modified.

## The Signing Process

### 1. Serialize the Claim

The claim (assembled in [Step 2](step-2-claim-assembly.md)) is serialized to deterministic CBOR bytes. These bytes become the **payload** of the signature.

### 2. Create COSE_Sign1 Structure

C2PA uses [COSE_Sign1](https://www.rfc-editor.org/rfc/rfc8152) (CBOR Object Signing and Encryption, single-signer mode) as defined in RFC 8152. The structure is a four-element CBOR array:

```
COSE_Sign1_Tagged = Tag(18, [
  protected_headers,    // Algorithm ID + certificate chain
  unprotected_headers,  // Time-stamp token (if present)
  payload,              // The serialized claim CBOR bytes
  signature             // The actual cryptographic signature
])
```

### 3. Build Protected Headers

The protected headers (signed along with the payload) include:

| Header | Value |
|--------|-------|
| `alg` | Signing algorithm (e.g., ES256, ES384, PS256, Ed25519) |
| `x5chain` | The signer's X.509 certificate chain (formatted per [RFC 9360](https://www.rfc-editor.org/rfc/rfc9360)) |

The **full certificate chain** — from the signing certificate up to (but not including) the root CA — is embedded in the header. This is why [verification requires no network call](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/).

### 4. Sign

The signer:
1. Constructs the `Sig_structure` (the bytes-to-be-signed, combining protected headers and payload)
2. Signs with their **private key**
3. Writes the resulting signature bytes into the COSE_Sign1 structure

### 5. Add Time-Stamp (Optional but Recommended)

After signing, the signer can request a **time-stamp** from a Time Stamping Authority (TSA):

1. Send a hash of the signature to an [RFC 3161](https://www.rfc-editor.org/rfc/rfc3161)-compliant TSA
2. The TSA returns a signed time-stamp token proving the signature existed at a specific time
3. The token is stored in the COSE_Sign1 unprotected headers

Time-stamps are critical for **long-term validation** — they prove the signature was created while the certificate was still valid, even after the certificate expires.

## Certificate Requirements

### X.509 Certificates

C2PA only accepts [X.509 certificates](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) for signing. The signing certificate must include:

- **Extended Key Usage (EKU)**: Must contain `id-kp-claimSigning` (C2PA-specific) or `id-kp-documentSigning`
- **Key Usage**: Digital signature
- **Subject**: Identifies the signing entity

### Certificate Chain

```
Root CA (on the Trust List)
  └── Intermediate CA
        └── Signing Certificate (has EKU for claim signing)
              └── Private Key (held by the signer)
```

All intermediate certificates must be included in the COSE_Sign1 protected headers. The root CA is not included — it must already be on the validator's trust list.

### Getting a Certificate

To get a trusted C2PA signing certificate, organizations must:

1. Complete the [C2PA Conformance Program](https://c2pa.org/faqs/) evaluation
2. Obtain a certificate from an accredited CA (e.g., [DigiCert](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/), SSL.com)
3. Certificates cost approximately **$289/year** — there is no free equivalent to Let's Encrypt for C2PA yet

## Signing Approaches

### Hardware Signing (Strongest Trust)

The private key is stored in a **hardware security module (HSM)** or trusted execution environment:

- **Cameras**: Leica M11-P, Google Pixel 10 (Titan M2 chip)
- **Benefit**: The key never leaves the hardware — it cannot be copied or extracted
- **Trust level**: Highest, because the signature is bound to a specific physical device

### Software Signing

The private key is stored in software (encrypted keystore, cloud HSM):

- **Applications**: Adobe Photoshop, Lightroom, Firefly
- **Benefit**: Flexible, works with any tool
- **Trade-off**: Key could potentially be compromised if the system is breached

### Cloud Signing

A remote signing service holds the key and signs on behalf of the creator:

- **Use case**: Web applications, mobile apps without HSM
- **Trade-off**: Introduces a chain-of-custody question — the creator trusts the cloud service to sign correctly

## Supported Algorithms

| Algorithm | Type | Key Size |
|-----------|------|----------|
| ES256 | ECDSA with P-256 | 256-bit |
| ES384 | ECDSA with P-384 | 384-bit |
| ES512 | ECDSA with P-521 | 521-bit |
| PS256 | RSASSA-PSS with SHA-256 | 2048+ bit |
| PS384 | RSASSA-PSS with SHA-384 | 2048+ bit |
| PS512 | RSASSA-PSS with SHA-512 | 2048+ bit |
| Ed25519 | EdDSA | 256-bit |

## What the Signature Proves

After signing, the COSE_Sign1 structure proves:

1. **Integrity** — The claim (and thus all assertion hashes) has not been modified
2. **Authentication** — The claim was signed by the holder of the private key matching the certificate
3. **Non-repudiation** — The signer cannot deny having signed (their certificate is in the signature)
4. **Time** — (If time-stamped) The signature existed at a proven point in time

It does **not** prove:
- The content is truthful (a camera can photograph a screen showing a deepfake)
- The signer is trustworthy (that's the [trust model's](trust-model.md) job)

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — COSE_Sign1 structure, certificate requirements, algorithms
2. [How C2PA Content Credentials Work](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Hardware vs. software signing, certificate costs
3. [C2PA FAQ](https://c2pa.org/faqs/) — Conformance program and certificate issuance
