---
title: "How We Hear Stereo (ITD & ILD)"
created: 2026-04-23
updated: 2026-04-23
tags: [audio, psychoacoustics, localization]
status: draft
sources:
  - url: "https://en.wikipedia.org/wiki/Sound_localization"
    title: "Wikipedia — Sound localization"
  - url: "https://www.sciencedirect.com/topics/engineering/interaural-time-difference"
    title: "ScienceDirect — Interaural Time Difference"
  - url: "https://pressbooks.umn.edu/sensationandperception/chapter/interaural-level-difference-draft/"
    title: "Sensation and Perception — Interaural Level Difference"
---

# How We Hear Stereo (ITD & ILD)

Stereo only works because of **how the brain localizes sound**. Two mechanisms do most of the work — together called the [**Duplex Theory**](https://en.wikipedia.org/wiki/Sound_localization) of sound localization.

## ITD — Interaural Time Difference

A sound to your right reaches your **right ear first**. Your brain measures that tiny delay and decodes it as direction.

- Humans can detect ITDs as small as [**~10 microseconds**](https://en.wikipedia.org/wiki/Sound_localization).
- Maximum ITD (sound fully to one side) is about **± 700 µs** — set by the distance between the ears (~17 cm / speed of sound).
- **Dominant below ~1000 Hz.** At low frequencies the wavelength is longer than your head, so the brain can track phase delay.

## ILD — Interaural Level Difference

Your head is a physical obstacle. A sound from the right hits your right ear loudly, but the left ear sits in the **acoustic shadow** of your skull and hears it quieter.

- **Dominant above ~1500 Hz.** At high frequencies the wavelength is small enough that the head significantly attenuates sound.
- Below ~1 kHz the wavelength is too long to be blocked by the head — ILD barely exists.

## The crossover

| Frequency | Primary cue |
|---|---|
| < 1000 Hz | ITD (time) |
| 1000 – 1500 Hz | Transition, both used |
| > 1500 Hz | ILD (level) |

This is why **different stereo mic techniques sound different** — they capture different mixes of these two cues.

## Pinna and HRTF (bonus)

Duplex theory doesn't explain **front vs. back** or **up vs. down** (the "cone of confusion"). That's the job of the **pinna** — the outer ear's folds filter sound direction-dependently. The full brain model is called the **Head-Related Transfer Function (HRTF)**.

For a **two-mic stereo recording played back on speakers or headphones**, you can only fake ITD and ILD. Pinna/HRTF cues require binaural recording (e.g. dummy-head mics) and are out of scope for a standard stereo pair.

## Why this matters for mic placement

Every stereo mic technique is really answering: **how much ITD vs. ILD do I want in my two channels?**

- Two mics touching each other → almost zero ITD → ILD-only stereo → **XY, M/S, Blumlein**.
- Two mics ~17 cm apart at ±55° → ITD and ILD roughly matching real ears → **ORTF**.
- Two mics meters apart → huge ITD, little ILD → **AB**, wide but phasey.

## References

1. [Wikipedia — Sound localization](https://en.wikipedia.org/wiki/Sound_localization) — Duplex theory, ITD/ILD, pinna, HRTF.
2. [ScienceDirect — Interaural Time Difference](https://www.sciencedirect.com/topics/engineering/interaural-time-difference) — ITD ranges and resolution.
3. [Sensation and Perception — ILD](https://pressbooks.umn.edu/sensationandperception/chapter/interaural-level-difference-draft/) — How head shadowing creates ILD.
