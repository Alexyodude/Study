---
title: "Stereo Audio & Mic Placement"
created: 2026-04-23
updated: 2026-04-23
tags: [audio, stereo, microphones, psychoacoustics, pcb]
status: draft
sources:
  - url: "https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/"
    title: "DPA — Stereo recording techniques and setups"
  - url: "https://en.wikipedia.org/wiki/Sound_localization"
    title: "Wikipedia — Sound localization"
---

# Stereo Audio & Mic Placement

Stereo is the trick of using **two channels** to make a listener perceive sound coming from **different directions in space**. It works because our brain localizes sound using two inter-ear cues: **time difference** (ITD) and **level difference** (ILD). A stereo recording setup is, at heart, a way to **encode those differences into two channels** with two microphones.

## The big picture

Two mics + two speakers (or headphones) = one illusion of space. The microphone technique you pick determines **which cue** ends up in your two channels:

| Technique family | What it encodes | Feel |
|---|---|---|
| Coincident (XY, Blumlein, M/S) | Level only | Tight, focused, mono-safe |
| Near-coincident (ORTF, DIN, NOS) | Level + small time | Natural, like human ears |
| Spaced (AB) | Time-dominant | Wide, spacious, less mono-safe |

## For your PCB project

If you're laying out **two PCB-mounted MEMS mics** for stereo capture, the core decisions are:

1. **How far apart** to space them (affects ITD and low-end phase behavior).
2. **Whether to aim them apart** (only matters if the mics are directional — most MEMS mics are omni).
3. **How well-matched** the two mics are (sensitivity and phase).
4. **How the acoustic ports interact** with the enclosure and any nearby PCB features.

Most MEMS mics are omnidirectional, so you can't do XY or ORTF in the classical sense — you can only do a **spaced pair (AB-style)**. The choice then becomes: how much spacing? See [PCB Layout for Dual MEMS Mics](pcb-mic-layout.md) for practical numbers.

## Subtopics

1. [How We Hear Stereo (ITD & ILD)](how-we-hear-stereo.md) — the psychoacoustic foundation.
2. [Coincident Techniques](coincident-techniques.md) — XY, Blumlein, Mid/Side.
3. [Near-Coincident Techniques](near-coincident-techniques.md) — ORTF, DIN, NOS.
4. [Spaced Techniques](spaced-techniques.md) — AB pair, why omni-only.
5. [PCB Layout for Dual MEMS Mics](pcb-mic-layout.md) — spacing, matching, port design.

## References

1. [DPA — Stereo recording techniques and setups](https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/) — Reference rundown of every standard technique with distances and angles.
2. [Wikipedia — Sound localization](https://en.wikipedia.org/wiki/Sound_localization) — Duplex theory, ITD/ILD, pinna effects.
3. [Shure — Common Techniques for Stereo Miking](https://www.shure.com/en-US/insights/common-techniques-for-stereo-miking) — Practical engineering-oriented overview.
