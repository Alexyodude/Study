---
title: "Spaced Techniques (AB)"
created: 2026-04-23
updated: 2026-04-23
tags: [audio, stereo, microphones]
status: draft
sources:
  - url: "https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/"
    title: "DPA — Stereo recording techniques"
  - url: "https://www.practical-music-production.com/ab-stereo-microphone-technique/"
    title: "Practical Music Production — AB technique"
---

# Spaced Techniques (AB)

Two microphones placed **parallel, far apart** with no angling. Stereo comes almost entirely from [**ITD**](how-we-hear-stereo.md) — different arrival times at the two mics. This is **the technique that works with omnidirectional mics**, which is why it's the most relevant one for PCB MEMS designs.

## AB with omni mics

- **Spacing:** commonly 30 cm – 3 m depending on source size.
- **Angle:** 0° (both mics parallel, both facing forward).
- **Pattern:** usually omnidirectional.

Gives a wide, spacious, sometimes almost surround-like image. Omnis also give you the **best low-frequency response** because they have no proximity effect and no rear-null cancellations.

## Tradeoffs

**Pros**
- Works with omni mics → compatible with almost any MEMS microphone.
- Rich low-end, airy sense of space.
- Captures room reverb naturally.

**Cons**
- **Comb filtering when summed to mono.** Out-of-phase content cancels at certain frequencies. AB is [generally not mono-compatible](https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/).
- Image can get **vague** — wide but hard to pinpoint where a source is.
- **"Hole in the middle"** effect: sounds dead-center can feel absent when spacing is very wide.

## Spacing vs. feel

| Spacing | Sound | Use case |
|---|---|---|
| < 5 cm | Almost mono, very narrow | Tight stereo, mostly useless |
| 5 – 20 cm | Modest stereo width | Headsets, small devices, close-miked |
| 20 – 50 cm | Natural stereo | Small ensembles, solo instruments |
| 50 cm – 3 m | Wide, spacious | Orchestras, rooms, ambience |
| > 3 m | "Hole in the middle" | Usually combined with a center mic |

A common rule of thumb: **3:1 rule** — the two mics should be at least 3× farther from each other than either mic is from the source, to avoid obvious phase problems when summed.

## Spacing and ITD math

Sound travels ~**343 m/s**. For a sound source hard-panned to one side:

- Spacing 17 cm → max ITD ≈ **495 µs** (close to human ear geometry).
- Spacing 30 cm → max ITD ≈ **875 µs**.
- Spacing 5 cm → max ITD ≈ **146 µs** — noticeable stereo but subtle.
- Spacing 1 cm → max ITD ≈ **29 µs** — barely above the ~10 µs detection threshold; almost mono.

This tells you the **minimum useful spacing** for a PCB stereo mic pair is around **1.5 – 2 cm** if you want anything perceptible, and **5 cm+** for a convincing effect.

## References

1. [DPA — Stereo recording techniques](https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/) — AB configurations and tradeoffs.
2. [Practical Music Production — AB Stereo](https://www.practical-music-production.com/ab-stereo-microphone-technique/) — Practical spacing guidance.
