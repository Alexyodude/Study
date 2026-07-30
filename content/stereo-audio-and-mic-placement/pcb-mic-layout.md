---
title: "PCB Layout for Dual MEMS Mics"
created: 2026-04-23
updated: 2026-04-23
tags: [audio, stereo, microphones, pcb, mems]
status: draft
sources:
  - url: "https://puiaudio.com/generic-press-releases/wide-band-mems-microphones-application-guide/"
    title: "PUI Audio — Wide-Band MEMS Microphones Application Guide"
  - url: "https://invensense.tdk.com/wp-content/uploads/2015/02/Recommendations-for-Mounting-and-Connecting-InvenSense-MEMS-Microphones.pdf"
    title: "InvenSense AN-1003 — Mounting and Connecting MEMS Microphones"
  - url: "https://media.digikey.com/pdf/data%20sheets/knowles%20acoustics%20pdfs/sisonic_design_guide.pdf"
    title: "Knowles — SiSonic Design Guide"
---

# PCB Layout for Dual MEMS Mics

Practical guidance for laying out **two MEMS microphones on a PCB** to capture usable stereo sound. Synthesizes classical [stereo theory](how-we-hear-stereo.md) with the real constraints of MEMS parts.

## Step 1 — Pick the technique

Almost all general-purpose MEMS mics (ICS-43434, SPH0645, INMP441, IM69D130, etc.) are **omnidirectional**. That means:

- **XY, Blumlein, M/S, ORTF, DIN, NOS** all require directional mics — skip them unless your part is specifically a directional MEMS.
- You are doing a [**spaced omni AB pair**](spaced-techniques.md). Your only real knob is **spacing**.

## Step 2 — Pick the spacing

Spacing determines both max ITD and how low in frequency the two mics start to phase-interact.

| Spacing | Max ITD | First null (hard-side source) | Feel |
|---|---|---|---|
| 1 cm | ~29 µs | 17 kHz | ≈ Mono |
| 2 cm | ~58 µs | 8.5 kHz | Subtle stereo |
| 5 cm | ~146 µs | 3.4 kHz | Noticeable stereo |
| 10 cm | ~290 µs | 1.7 kHz | Clear stereo |
| 15–20 cm | ~440–580 µs | 1.1–0.85 kHz | Full natural stereo |

Rule of thumb for PCB-scale products:

- **Earbuds / hearables:** 15 mm between ports is a typical stereo / beamforming distance.
- **Phones / handhelds / small recorders:** 5–15 cm gives meaningful stereo.
- **Larger bars, laptops:** 15–30 cm approaches classic AB or ORTF spacing.
- **Below ~2 cm:** don't bother calling it stereo — use a single mic or pick two mics for beamforming, not stereo imaging.

## Step 3 — Match the mics

Stereo imaging relies on **small** differences between channels, so mismatches between mics show up as image shift or wandering.

- **Sensitivity matching:** aim for **±1 dB** between the two parts. MEMS mics typically specify ±1 to ±3 dB; pick tighter-binned parts if possible.
- **Phase matching:** aim for **±5° to ±10°** across the band — important for beamforming, less critical for simple stereo.
- **Buy from the same lot.** Batch variation is real.
- **Route both mics identically.** Same trace length, same passive values, same decoupling — anything asymmetric leaks into the stereo image.

## Step 4 — Acoustic port design

The sound hole is part of the acoustic system. Treat it like a signal path.

- **Hole diameter:** typically **0.5–1.0 mm** on the PCB; smaller can clog with solder paste, larger can resonate. See the [Knowles SiSonic Design Guide](https://media.digikey.com/pdf/data%20sheets/knowles%20acoustics%20pdfs/sisonic_design_guide.pdf).
- **Gasket between port and enclosure opening:** mandatory. Leaks kill low-end and let noise in.
- **Make both ports identical:** same hole size, same gasket, same enclosure opening shape. Asymmetry = frequency response mismatch = skewed stereo image.
- **Bottom-port vs. top-port:** pick one and use the same for both mics. Mixing firing directions is asking for trouble.

## Step 5 — PCB layout details

- **Keep both mics far from noise sources:** buck converters, clock crystals, antennas, motors, speakers. Put both mics on the **same side** of these noise sources so they reject common-mode noise similarly.
- **Mirror the routing.** L and R trace lengths, vias, and ground returns should be as symmetric as practical.
- **Digital (I²S / PDM) mics are easier** than analog for stereo because you don't have analog gain mismatch to worry about. Two PDM mics can even share clock and data lines with one tied to L-select and the other to R-select (this is how most stereo I²S MEMS pairs work).
- **Give each mic its own decoupling cap** close to the VDD pin (100 nF typical, plus a bulk cap nearby).
- **Solid ground plane under both mics**, not split. Splits cause return-path asymmetry.

## Step 6 — Enclosure matters as much as PCB

- The enclosure shape creates its own ILD via shadowing and diffraction. A flat PCB on an open bench sounds very different than one in a handheld case.
- If you want directivity without a directional mic, **place the two mics on opposite sides of a physical baffle** (the device body itself). This is how phones and laptops get usable stereo from two omnis — the body is the "head."
- For an "artificial head" effect in a small device, aim for **~15 cm of enclosure width between mics with the body as an acoustic obstruction in between**.

## Quick decision tree

```
Is each mic directional?
├── Yes → You can do ORTF/XY; spacing and angle follow those techniques
└── No  → Omni MEMS, AB spaced pair only
         │
         ├── Spacing < 2 cm    → skip stereo, use beamforming instead
         ├── Spacing 2–15 cm   → stereo with enclosure baffle between mics
         └── Spacing > 15 cm   → classical wide AB stereo
```

## Common pitfalls

- **Mounting two omnis side-by-side on a flat PCB with nothing between them.** You'll get subtle stereo at best — the enclosure isn't helping you.
- **Asymmetric port openings or gaskets.** The channel with the looser gasket will be bassier and louder → image shifts.
- **One mic near a speaker, one far.** Guaranteed feedback and wildly different noise floors.
- **Trusting datasheet sensitivity tolerance.** ±3 dB sensitivity tolerance means real parts can be 6 dB apart — that's a one-sided mono recording.

## References

1. [PUI Audio — Wide-Band MEMS Microphones Application Guide](https://puiaudio.com/generic-press-releases/wide-band-mems-microphones-application-guide/) — Noise source placement and PCB layout fundamentals.
2. [InvenSense AN-1003 — Mounting and Connecting MEMS Microphones](https://invensense.tdk.com/wp-content/uploads/2015/02/Recommendations-for-Mounting-and-Connecting-InvenSense-MEMS-Microphones.pdf) — Port design, solder paste, mounting.
3. [Knowles SiSonic Design Guide](https://media.digikey.com/pdf/data%20sheets/knowles%20acoustics%20pdfs/sisonic_design_guide.pdf) — Sound hole geometry and acoustic path.
4. [Microchip — Mechanical Design of MEMS Microphone Array Geometry](https://microchip.my.site.com/s/article/Mechanical-Design-of-MEMS-Microphone-Stack-Array-Geometry-Placement) — Array spacing for multi-mic use.
