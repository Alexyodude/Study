---
title: "Potting & Environmental Sealing"
created: 2026-04-23
updated: 2026-04-23
tags: [audio, microphones, pcb, mems, potting, waterproofing]
status: draft
sources:
  - url: "https://www.gore.com/products/gore-protective-vents-acoustics"
    title: "Gore — Protective Vents for Acoustics"
  - url: "https://www.saati.com/protect/acoustics/"
    title: "Saati — Acoustex acoustic membranes"
  - url: "https://media.digikey.com/pdf/data%20sheets/knowles%20acoustics%20pdfs/sisonic_design_guide.pdf"
    title: "Knowles — SiSonic Design Guide"
---

# Potting & Environmental Sealing

You can pot a microphone PCB for environmental protection, vibration damping, or tamper resistance — **as long as the sound port stays acoustically open to outside air**. Blocking the port kills the mic.

## Why the port is sacred

A microphone is a pressure sensor. The diaphragm converts air-pressure waves into electrical signal. Two physical facts decide everything:

- **Acoustic impedance mismatch.** Cured potting (epoxy, urethane, hard silicone) has acoustic impedance ~**3000–4000× higher** than air. Sound crossing air → cured potting → diaphragm loses roughly **40–80 dB** and is heavily low-pass filtered. Usable: no.
- **Diaphragm motion.** The diaphragm is a thin film that needs to move micrometers. If cured potting touches it, it physically can't move. Dead mic.

So: **pot the body, the leads, the rest of the PCB — never the port, never the diaphragm.**

## Four approaches, ranked by robustness

### 1. Masked potting
Cover the sound hole with Kapton tape or a silicone plug before pouring potting. Cure, then remove the mask.

- **Pros:** Cheapest. No added components.
- **Cons:** Port is still a bare hole — no water/dust protection. Masking a 0.3–1 mm MEMS port is fiddly, and capillary action can pull uncured potting in if the seal isn't perfect.
- **Use when:** Only needed for vibration damping or tamper resistance, not for environmental sealing.

### 2. Acoustic channel / port tube
Leave a channel through the potting — a molded tube, a straw, or a silicone gasket — that leads from outside air down to the mic port.

- **Pros:** Preserves sensitivity well. Simple geometry.
- **Cons:** Still not waterproof. A tube-shaped cavity **resonates** — long narrow channels add peaks/notches in frequency response, which on a stereo pair means L and R differ if tubes aren't identical.
- **Use when:** You need the mic to sit behind the potting surface but don't need IP-rated sealing.

### 3. Hydrophobic acoustic membrane (the production answer)
Bond a thin **ePTFE** or equivalent membrane over the port. Passes air pressure waves; blocks water, dust, and particulate.

- **Commercial parts:** Gore Protective Vents (acoustic), Saati Acoustex, Donaldson Tetratex, Nitto.
- **Insertion loss:** typically **1–3 dB**, mostly flat across 20 Hz – 20 kHz.
- **IP rating:** off-the-shelf parts reach IP67 / IP68.
- **Pros:** Waterproof, dustproof, professional-grade. Used in phones, wearables, outdoor IP cameras.
- **Cons:** Small BOM cost. Bonding process must be repeatable.

This is the standard approach for any product that's going outside, getting wet, or being washed.

### 4. Sealed cavity with low-impedance medium
Pro audio hydrophones fill the capsule cavity with silicone gel or oil matched to water's acoustic impedance.

- **Pros:** True underwater operation.
- **Cons:** Changes frequency response entirely; specialized capsules; overkill for most PCB projects.

## Stereo-specific pitfalls

Everything that applies to [matching two mics](pcb-mic-layout.md) applies **twice as hard** once you add potting and membranes — you now have two more sources of asymmetry per channel.

- **Use identical membrane parts** on both L and R. Different pore sizes, different thicknesses, or different manufacturing batches can shift the frequency response of one channel vs. the other → skewed stereo image.
- **Identical bonding.** Same adhesive, same squeeze-out, same tension. Hand-applied membranes are very hard to keep matched — prefer pre-applied membranes bonded by a jig.
- **Identical acoustic cavity behind the membrane.** Any volume or channel-length difference between L and R adds different resonances.
- **Identical potting thickness** around each port. If one mic is buried deeper in potting than the other, its port channel behaves differently.
- **Assemble both channels with the same process on the same day.** Age, humidity during cure, and fixture wear all drift over time.

## Practical workflow

For a small PCB with two MEMS or ECM mics that needs to survive water/dust:

1. **Design the enclosure with a port opening above each mic**, sized to the membrane's datasheet.
2. **Bond the acoustic membrane to the enclosure** (not to the PCB) using a pre-cut adhesive vent — both sides from the same reel, same part, same tool.
3. **Add a gasket (silicone O-ring or foam ring) between the enclosure and the mic's port ring** so there's no air leak bypassing the membrane.
4. **Pot the PCB** with the enclosure in place, keeping potting away from the port region. The gasket now blocks uncured potting from migrating into the port.
5. **Test both channels with a reference tone** after cure. Measure sensitivity and frequency response of L vs. R; anything more than ~1–2 dB mismatch means something went wrong with the bond or gasket.

## For the GTA2718B (small ECM) specifically

Small ECMs usually ship with a thin mylar/cloth screen over the port — that's **not waterproof**. If you pot, you still need a proper acoustic vent on top, or pot such that only the existing screen faces an open cavity in the potting. The screen is a particle filter, not a seal.

## References

1. [Gore — Protective Vents for Acoustics](https://www.gore.com/products/gore-protective-vents-acoustics) — ePTFE acoustic membrane product family used in phones and wearables.
2. [Saati — Acoustex](https://www.saati.com/protect/acoustics/) — Acoustic mesh membranes with IP-rating data.
3. [Knowles — SiSonic Design Guide](https://media.digikey.com/pdf/data%20sheets/knowles%20acoustics%20pdfs/sisonic_design_guide.pdf) — Port sealing, gasket, and adhesive guidance for MEMS mics.
