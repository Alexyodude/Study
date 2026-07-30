---
title: "Trust Infrastructure"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, trust, pki, certificate-authority, trust-list, conformance]
status: draft
sources:
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html"
    title: "C2PA Technical Specification v2.3"
  - url: "https://c2pa.org/faqs/"
    title: "C2PA FAQ"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work"
---

C2PA's trust model determines *who* can sign Content Credentials and *how* validators decide whether to trust a signature. It builds on the same **Public Key Infrastructure (PKI)** that secures HTTPS on the web.

## Trust Architecture Overview

```
C2PA Trust List
├── Root CA 1 (e.g., DigiCert)
│   └── Intermediate CA
│       └── Signing Certificate (Leica)  →  Signs manifests
│
├── Root CA 2 (e.g., SSL.com)
│   └── Intermediate CA
│       └── Signing Certificate (Adobe)  →  Signs manifests
│
└── Root CA N ...

C2PA TSA Trust List
├── TSA Root CA 1
│   └── TSA Certificate (DigiCert TSA)   →  Issues time-stamps
└── TSA Root CA 2
    └── TSA Certificate (...)            →  Issues time-stamps
```

## The C2PA Trust List

The **C2PA Trust List** is a [curated list of X.509 root certificate authorities](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) authorized to issue C2PA signing certificates. It's analogous to your browser's built-in list of trusted root CAs for HTTPS.

Key properties:
- Maintained by the C2PA organization
- Only includes CAs that meet C2PA's requirements
- Certificates must have the `c2pa-kp-claimSigning` Extended Key Usage (EKU)
- Validators use this list by default to determine if a signer is "trusted"

### Separate TSA Trust List

A distinct trust list exists for **Time Stamping Authorities** — the services that provide cryptographic proof of when a signature was created. TSA certificates are validated independently from signing certificates.

## Getting on the Trust List

### For Certificate Authorities

CAs apply to be included on the C2PA Trust List. They must demonstrate they can issue certificates that meet the technical requirements (proper EKU, key usage, certificate policies).

### For Signers (Products and Services)

To obtain a trusted C2PA signing certificate, a product must:

1. **Pass the Conformance Program** — The product undergoes [evaluation to meet technical and security requirements](https://c2pa.org/faqs/)
2. **Obtain a certificate from a listed CA** — e.g., DigiCert, SSL.com
3. **Be listed on the Conforming Products List** — Public attestation of conformance

Certificates include fields denoting the product's **Assurance Level**, indicating how rigorously the product was evaluated.

### Certificate Costs

Currently, trusted C2PA signing certificates cost approximately [$289/year](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) from providers like DigiCert or SSL.com. There is **no free CA equivalent** to Let's Encrypt for C2PA signing, which creates a barrier for individual creators and small organizations.

## PKI Fundamentals in C2PA Context

### How Certificate Chains Work

```
Root CA Certificate (self-signed, on the Trust List)
  │
  ├── Signs → Intermediate CA Certificate
  │              │
  │              ├── Signs → Signing Certificate
  │              │              │
  │              │              └── Signs → C2PA Claim (using private key)
  │              │
  │              └── Signs → Another Signing Certificate ...
  │
  └── (Root's public key is pre-trusted by validators)
```

Validation walks the chain upward:
1. Extract the signing certificate from the manifest
2. Verify it was signed by the intermediate CA
3. Verify the intermediate was signed by the root CA
4. Check if the root CA is on the trust list

### Why Not Blockchain?

C2PA is frequently asked about blockchain. The answer: C2PA uses [standard PKI, not blockchain](https://c2pa.org/faqs/). The spec is described as "compatible with blockchain" but does not require it because:

- PKI is a proven, widely-deployed technology
- Certificate chains provide the same trust anchoring without the overhead of a distributed ledger
- Offline verification is a core requirement — blockchain would require network access
- The trust model is deliberately centralized (trusted CAs) rather than decentralized

## Validator-Configured Trust

While the C2PA Trust List is the default, validators can override it with **custom trust lists**:

| Configuration | Use Case |
|--------------|----------|
| C2PA Trust List only | General-purpose consumer applications |
| Custom trust list | Enterprise environments, government agencies |
| Extended trust list | Accept C2PA list + additional roots |
| Restrictive trust list | Only accept specific signers |

A news organization might configure its validators to only trust certificates issued to known news agencies. A government might only trust certificates from its own CA.

## Trust vs. Truth

A critical distinction: **trust in C2PA is about the signer's identity, not the content's truthfulness**.

A manifest signed by a trusted signer proves:
- The signer is who they claim to be (identity)
- The content hasn't been modified since signing (integrity)
- The assertions were made at a proven time (temporality)

It does **not** prove:
- The content depicts reality (a camera can photograph a fake scene)
- The signer's assertions are honest (the signer could lie about AI usage)
- The content is "real" in any absolute sense

Trust in C2PA means: "I believe this entity is who they say they are, and I can verify the content hasn't been tampered with." The leap from there to "I believe this content is authentic" is a human judgment that depends on the signer's reputation.

## References

1. [C2PA Technical Specification v2.3](https://spec.c2pa.org/specifications/specifications/2.3/specs/C2PA_Specification.html) — Trust list specification, certificate requirements, validation states
2. [C2PA FAQ](https://c2pa.org/faqs/) — Conformance program, PKI vs. blockchain, trust list management
3. [How C2PA Content Credentials Work](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Certificate costs and signing approaches
