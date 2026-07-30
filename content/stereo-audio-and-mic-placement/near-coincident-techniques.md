---
title: "Near-Coincident Techniques (ORTF, DIN, NOS)"
created: 2026-04-23
updated: 2026-04-23
tags: [audio, stereo, microphones]
status: draft
sources:
  - url: "https://en.wikipedia.org/wiki/ORTF_stereo_technique"
    title: "Wikipedia — ORTF stereo technique"
  - url: "https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/"
    title: "DPA — Stereo recording techniques"
---

# Near-Coincident Techniques (ORTF, DIN, NOS)

Near-coincident techniques **split the difference** between coincident and spaced setups. Two **cardioid** mics are placed a few cm apart and angled apart, producing both **ITD** and **ILD** — which is how human ears actually work.

Think of them as "artificial head" approximations: you're trying to mimic a pair of ears attached to a head.

## ORTF

The most popular near-coincident technique, invented by [**Office de Radiodiffusion Télévision Française**](https://en.wikipedia.org/wiki/ORTF_stereo_technique) in the 1960s.

- **Spacing:** **17 cm** (~7") — approximate width of a human head.
- **Angle:** **110°** total (±55°).
- **Pattern:** cardioid.

Gives a **natural, realistic** stereo image that feels like being there. Wider than XY, tighter than AB, and mostly mono-compatible.

## DIN

German broadcasting standard.

- **Spacing:** 20 cm.
- **Angle:** 90°.
- **Pattern:** cardioid.

Slightly wider feel than ORTF; used for ensembles and pianos at short to medium distance.

## NOS

From Dutch broadcasting ([**Nederlandse Omroep Stichting**](https://en.wikipedia.org/wiki/NOS_stereo_technique)).

- **Spacing:** 30 cm.
- **Angle:** 90°.
- **Pattern:** cardioid.

Widest of the three; a go-to for drum kit overheads and larger sources.

## Summary

| Technique | Spacing | Angle | Feel |
|---|---|---|---|
| ORTF | 17 cm | 110° | Natural, "head-like" |
| DIN | 20 cm | 90° | Slightly wider |
| NOS | 30 cm | 90° | Wider still |

## Why the numbers aren't arbitrary

- **17 cm** is the approximate distance between human ears → ITDs roughly match what the brain expects.
- **~110° splay** simulates the direction your ears would point if they could rotate apart — mimics head shadow.

## PCB applicability

These techniques also need **directional** mics, which most MEMS parts aren't. If you have directional MEMS mics (rare, but they exist) and space for ~15–30 cm between them, ORTF-style placement gives the most natural-sounding result of any stereo technique. For omni MEMS, see [spaced techniques](spaced-techniques.md) and [PCB layout](pcb-mic-layout.md).

## References

1. [Wikipedia — ORTF stereo technique](https://en.wikipedia.org/wiki/ORTF_stereo_technique) — Origins, exact spacing and angle.
2. [DPA — Stereo recording techniques](https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/) — DIN and NOS spec details.
3. [Produce Like A Pro — ORTF Mic Technique](https://producelikeapro.com/blog/ortf-mic-technique/) — Practical ORTF usage guide.
