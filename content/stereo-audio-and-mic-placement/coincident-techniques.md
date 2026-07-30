---
title: "Coincident Techniques (XY, Blumlein, M/S)"
created: 2026-04-23
updated: 2026-04-23
tags: [audio, stereo, microphones]
status: draft
sources:
  - url: "https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/"
    title: "DPA — Stereo recording techniques"
  - url: "https://www.shure.com/en-US/insights/common-techniques-for-stereo-miking"
    title: "Shure — Common Techniques for Stereo Miking"
---

# Coincident Techniques (XY, Blumlein, M/S)

**Coincident** = two mic capsules stacked right on top of each other. Since both capsules are essentially at the same point, sound arrives at **both at the same time** — [ITD is zero](how-we-hear-stereo.md). Stereo comes entirely from **ILD**, produced by the directional pattern of the mics pointing in different directions.

**Key property:** perfectly mono-compatible. When you sum L+R there's no phase cancellation, because both signals are time-aligned.

## XY

Two **directional** (usually cardioid) mics stacked vertically, angled apart.

- **Angle:** typically **90°** (±45° from center). Wider source → narrower angle.
- **Spacing:** 0 — capsules as close as mechanically possible.
- **Pattern:** cardioid.

Sounds **tight and focused**. Good for a single source like a vocalist, guitar, or a small ensemble. Image is narrower and less "deep" than ORTF or AB.

## Blumlein

Two **figure-of-eight** mics crossed at **exactly 90°**. Invented by Alan Blumlein in the 1930s — the original stereo patent.

- **Angle:** 90°.
- **Spacing:** 0.
- **Pattern:** bidirectional (picks up front AND back).

Gives an extremely realistic stereo image of the front stage plus natural room ambience from the rear lobes. Watch out: rear sounds end up **out-of-phase** in the reproduced side image, which can sound strange if the room is bad.

## Mid/Side (M/S)

Two coincident mics: one **Mid** (cardioid or omni, pointing at source) + one **Side** (figure-of-eight, aimed **perpendicular** to the source, so one lobe faces left and one faces right).

You record them as two tracks, then decode:

```
Left  = Mid + Side
Right = Mid − Side
```

- **Angle:** 90° between them (mid straight ahead, side sideways).
- **Spacing:** 0.
- **Width is adjustable after recording** by changing the level of the Side track — this is M/S's superpower.
- **Perfectly mono-compatible.** Dropping the Side channel gives you clean mono Mid.

Used heavily in broadcast and film where mono compatibility and post-adjustable width matter.

## Summary

| Technique | Angle | Spacing | Pattern | Mono-safe | Image |
|---|---|---|---|---|---|
| XY | 90° | 0 | Cardioid | Yes | Focused, narrow |
| Blumlein | 90° | 0 | Figure-8 | Yes | Wide, room-full |
| M/S | 90° | 0 | Card + Fig-8 | Yes | Adjustable in post |

## Why this matters for PCB MEMS mics

These techniques all require **directional** mics and **precise angular alignment**. Most consumer MEMS mics are **omnidirectional** — they pick up equally from every direction, so pointing them apart changes nothing, and coincident placement just gives you the same signal twice. For PCB layouts with MEMS, skip coincident and go straight to [spaced techniques](spaced-techniques.md) unless you specifically chose directional MEMS parts.

## References

1. [DPA — Stereo recording techniques](https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/) — Canonical reference for XY, Blumlein, M/S parameters.
2. [Shure — Common Techniques for Stereo Miking](https://www.shure.com/en-US/insights/common-techniques-for-stereo-miking) — Practical tradeoffs and use cases.
