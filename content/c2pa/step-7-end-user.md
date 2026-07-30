---
title: "Step 7: End-User Presentation"
created: 2026-03-20
updated: 2026-03-20
tags: [c2pa, end-user, presentation, trust, ui]
status: draft
sources:
  - url: "https://contentauthenticity.org/how-it-works"
    title: "Content Authenticity Initiative — How It Works"
  - url: "https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html"
    title: "C2PA and Content Credentials Explainer v2.3"
  - url: "https://spec.c2pa.org/post/contentcredentials/"
    title: "Introducing Official Content Credentials Icon"
  - url: "https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/"
    title: "How C2PA Content Credentials Work"
---

The final step: a **Manifest Consumer** — an application, browser, or platform — presents the validated provenance information to the end user. The user then makes their own trust decision.

## The Design Philosophy

C2PA deliberately avoids making binary "real" or "fake" judgments. Instead, it provides **transparency** — showing the user the provenance data and letting them decide.

As the [CAI puts it](https://contentauthenticity.org/how-it-works), Content Credentials are "essentially a nutrition label for digital content." They tell you what's inside — the trust decision is yours.

## What the User Sees

A Manifest Consumer typically presents:

### 1. The Content Credentials Icon

C2PA has an [official Content Credentials icon](https://spec.c2pa.org/post/contentcredentials/) (stylized "cr" mark) displayed on or near the content when valid credentials are present. This signals to users that provenance information is available.

### 2. Provenance Summary

When the user clicks the icon, they see:

| Field | Example |
|-------|---------|
| **Signed by** | "Adobe Photoshop 25.0" |
| **Certificate issuer** | "DigiCert" |
| **Signed on** | "2026-03-20 at 10:30 UTC" |
| **Content type** | "Photograph" |
| **AI disclosure** | "No AI generation detected" or "Created with generative AI" |

### 3. Edit History

If the manifest store contains multiple manifests (provenance chain):

```
📷 Original Capture
   Signed by: Leica M11-P (hardware)
   Date: 2026-03-15 09:22 UTC
       ↓
🖌️ Edited
   Signed by: Adobe Photoshop 25.0
   Actions: Cropped, Color adjusted
   Date: 2026-03-16 14:10 UTC
       ↓
📤 Exported
   Signed by: Adobe Lightroom 8.0
   Actions: Resized, Format converted
   Date: 2026-03-20 10:30 UTC
```

### 4. Ingredient Tree

For composite content, the user can see what source materials were used:

```
Final Composite Image
├── Background: landscape.jpg (signed by Canon EOS R5)
├── Subject: portrait.jpg (signed by iPhone 17 Pro)
└── Text overlay: (created in Photoshop, no prior manifest)
```

### 5. Validation Status

The consumer shows whether the credentials passed validation:

| Status | Meaning | Visual |
|--------|---------|--------|
| **Trusted** | Valid signature, certificate on trust list, content unchanged | Green checkmark |
| **Valid but untrusted** | Signature checks out, but signer isn't on the trust list | Yellow warning |
| **Tampered** | Hard binding or signature failed | Red alert |
| **No credentials** | No manifest found | No icon shown |

## Presentation Principles

The C2PA specification and explainer emphasize several UX principles:

### Inform, Don't Judge

The consumer presents **facts** (who signed, when, what tools were used) rather than opinions. A photo signed by a trusted news agency is presented the same way as one signed by an unknown entity — the difference is in the trust level indicator, not in a "trustworthy" vs. "untrustworthy" label.

### Show the Chain

Users should be able to trace the full provenance chain, not just the most recent manifest. This lets a viewer see that a photo was originally captured on a camera, then edited in Photoshop, then resized for web — and verify each step independently.

### Degrade Gracefully

When credentials are absent or invalid, the consumer should:
- Not show the Content Credentials icon (absence of credentials is not evidence of inauthenticity)
- If asked, explain why validation failed (e.g., "Content was modified after signing")
- Not block or hide the content itself

### Respect Privacy

The consumer should:
- Display what the signer chose to include (no more, no less)
- Not expose raw certificate subjects unless the signer intended it
- Handle redacted assertions appropriately (note their absence without implying wrongdoing)

## Real-World Consumers

| Platform/Tool | How It Shows Credentials |
|--------------|-------------------------|
| **Adobe products** | Built-in Content Credentials panel |
| **Content Credentials Verify** | Web-based inspector at [contentcredentials.org](https://contentcredentials.org/) |
| **News organizations** | Inline provenance badges on published photos |
| **Social media** (emerging) | Content Credentials labels on supported platforms |
| **Browsers** (future) | Native support being explored |

## The User's Trust Decision

After seeing the provenance data, the user considers:

1. **Who signed it?** — Do I recognize and trust this entity?
2. **What does the certificate say?** — Is it from a reputable CA? Is it on the C2PA Trust List?
3. **Is the content unchanged?** — Does the hard binding validate?
4. **Was AI involved?** — Does the action history disclose AI generation?
5. **Does the provenance chain make sense?** — Does the edit history seem plausible?

C2PA provides the *information* for this decision. The *judgment* remains human.

## References

1. [Content Authenticity Initiative — How It Works](https://contentauthenticity.org/how-it-works) — End-user experience and "nutrition label" analogy
2. [C2PA and Content Credentials Explainer v2.3](https://spec.c2pa.org/specifications/specifications/2.3/explainer/Explainer.html) — Presentation and verification workflow
3. [Introducing Official Content Credentials Icon](https://spec.c2pa.org/post/contentcredentials/) — The standard icon for signaling credentials
4. [How C2PA Content Credentials Work](https://www.softwareseni.com/how-c2pa-content-credentials-work-and-what-their-limits-are/) — Verification tools and user-facing features
