---
title: "Hardware & the $1000 Budget"
created: 2026-10-22
updated: 2026-10-22
tags: [hardware, intel-arc, b60, pcie, psu, budget, am4]
status: review
sources:
  - url: "https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2026-03/datasheet-b60-gpu.pdf"
    title: "Intel Arc Pro B60 Datasheet"
  - url: "https://flopper.io/gpu/intel-arc-pro-b60-24gb/spec-sheet"
    title: "Flopper — Arc Pro B60 Spec Sheet"
  - url: "https://cdn.multitronic.fi/media/9/6/mmo_134689064_1773307848_3924_283.pdf"
    title: "Sparkle Arc Pro B60 User Manual"
  - url: "https://www.intel.com/content/www/us/en/support/articles/000099073.html"
    title: "Intel Support — Resizable BAR for Arc Pro graphics"
  - url: "https://at-web1.www.anandtech.com/show/14161/the-amd-x570-motherboard-overview/4"
    title: "AnandTech — X570 Motherboard Overview"
  - url: "https://forum.level1techs.com/t/dual-gpu-pcie-bifurcation-question-frustration/252100"
    title: "Level1Techs — Dual GPU PCIe Bifurcation"
  - url: "https://forum.level1techs.com/t/llm-adventures-with-intel-arc-pro-b60s-p2p-vllm/252516"
    title: "Level1Techs — LLM Adventures with Arc Pro B60s, P2P, vLLM"
  - url: "https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities"
    title: "Tom's Hardware — RAM Price Index 2026"
  - url: "https://tech-insider.org/ca/ram-ddr5-ssd-price-shortage-canada-2026/"
    title: "Tech Insider — RAM/SSD Shortage 2026"
  - url: "https://forum.level1techs.com/t/asrock-x870-taichi-creator-dual-gpu/243897"
    title: "Level1Techs — ASRock X870 Taichi Creator Dual GPU"
  - url: "https://forum.level1techs.com/t/x870e-motherboard-for-dual-gpu-and-optane/222898"
    title: "Level1Techs — X870E Motherboard for Dual GPU"
  - url: "https://tomshardware.com/pc-components/gpus/maxsun-unveils-intel-dual-gpu-battlemage-graphics-card-with-48gb-gddr6-to-compete-with-nvidia-and-amd"
    title: "Tom's Hardware — Maxsun Dual B60"
---

# Hardware & the $1000 Budget

You already own the hard part: two GPUs with 24 GB each. This page picks the cheapest host that lets both cards run at full usefulness, and explains why.

## What the B60 needs from the host

| Spec | Value | Why it matters for the build |
|---|---|---|
| Memory | 24 GB GDDR6, 192-bit, [456 GB/s](https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2026-03/datasheet-b60-gpu.pdf) | 48 GB total across two cards |
| Interface | [PCIe 5.0 x8](https://flopper.io/gpu/intel-arc-pro-b60-24gb/spec-sheet) | Only uses 8 lanes, so an x8/x8 split loses nothing on PCIe 4.0 boards beyond link speed |
| Power | [200 W TBP, one 8-pin](https://cdn.multitronic.fi/media/9/6/mmo_134689064_1773307848_3924_283.pdf) (Sparkle blower/passive) | ~400 W for two cards; check your exact model's connector |
| Compute | 20 Xe cores, 160 XMX engines, ~197 INT8 TOPS ([Flopper](https://flopper.io/gpu/intel-arc-pro-b60-24gb/spec-sheet)) | Prompt processing speed |
| Firmware | [Resizable BAR required for proper performance](https://www.intel.com/content/www/us/en/support/articles/000099073.html) | CPU + board must support ReBAR |

### Check which B60 variant you have

- **Blower (fan) cards** exhaust out the back — ideal for two cards close together.
- **Passive cards** have **no fan**. They are designed for server chassis with strong front-to-back airflow. In a desktop case you must add a fan ducted directly over each card, or they will thermal-throttle.
- **Dual-GPU cards** (e.g. Maxsun B60 Dual 48G) put two GPUs on one board and need **x8/x8 bifurcation of a single slot** and a [400 W 12V-2x6 connector](https://tomshardware.com/pc-components/gpus/maxsun-unveils-intel-dual-gpu-battlemage-graphics-card-with-48gb-gddr6-to-compete-with-nvidia-and-amd). If you have two separate single-GPU cards (most likely), you instead need **two slots wired x8/x8**.

## Why the platform choice is mostly about RAM prices

Consumer DRAM prices exploded in 2025–2026 because AI data centers absorbed supply. A 64 GB DDR5 kit that cost about $190 a year ago has been tracked at [over $1,000](https://tech-insider.org/ca/ram-ddr5-ssd-price-shortage-canada-2026/), and 32 GB kits that were $100–200 now start around [$350](https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities). A new AM5/LGA1851 build would spend half the budget on memory alone — **unless you already own DDR5**.

**You already have 2×8 GB DDR5 (16 GB)**, so the RAM problem is solved and a current-generation **AM5** platform fits the budget (Option A). If you didn't have them, **used DDR4** would be the escape hatch (Option B). For a GPU inference box, system RAM speed barely matters as long as everything fits in VRAM.

## Option A (recommended for you): AM5 + your existing DDR5

| Part | What to buy | Est. cost | Notes |
|---|---|---|---|
| CPU | Ryzen 5 7600 / 7600X | $130–200 | 24 usable PCIe 5.0 lanes, ReBAR supported. **Avoid 8000G APUs** (8500G/8600G/8700G) — they have fewer PCIe lanes and can't do x8/x8 |
| Board | AM5 board with **x8/x8 from the CPU** | $250–350 | Reported x8/x8 candidates: [ASRock X670E Taichi / Taichi Lite, ASRock X870 Taichi Creator](https://forum.level1techs.com/t/asrock-x870-taichi-creator-dual-gpu/243897), [ASUS ProArt X870E-Creator, ProArt X670E-Creator, ProArt B650-Creator](https://forum.level1techs.com/t/x870e-motherboard-for-dual-gpu-and-optane/222898) — **verify in the manual**; plain B650/B850/X870 boards usually run the second slot at x4 from the chipset |
| RAM | Your 2×8 GB DDR5 | $0 | 16 GB in dual channel — enough for a GPU-only server (see below) |
| SSD | 1–2 TB NVMe | $80–150 | Use an M.2 slot that does **not** steal lanes from the second GPU slot (see below) |
| PSU | 850–1000 W ATX 3.x Gold | $110–160 | Two 200 W GPUs + 65 W CPU ≈ 550 W peak |
| Case | Airflow case, 7+ slots | $70–120 | Leave at least one empty slot between cards |
| CPU cooler | Stock (7600 includes one) | $0–25 | |
| **Total** | | **≈ $640–1,000** | Target ~$800 |

Things to check with your RAM and AM5:

- **Is 16 GB enough?** Yes, for this job. The model lives in GPU memory, not system RAM. llama.cpp memory-maps the model file, so loading a 40 GB model with 16 GB of RAM works — it just streams from the SSD (a fast NVMe makes loads quick). Add a 16–32 GB swap file as a safety net, especially for vLLM, which stages weights through system RAM while loading. You'd only need more RAM to offload giant models to the CPU, and that needs 64 GB+ anyway.
- **Desktop sticks, not laptop.** Desktop DDR5 is a long UDIMM; laptop DDR5 (SO-DIMM) won't fit. Server RDIMMs also won't work on AM5.
- **First boot takes minutes.** AM5 trains DDR5 memory on first boot (and after BIOS updates) — a black screen for 1–3 minutes is normal. Update the BIOS early.
- **M.2 lane sharing.** On several AM5 boards (e.g. the [ProArt X870E](https://forum.level1techs.com/t/x870e-motherboard-for-dual-gpu-and-optane/222898)), populating a specific Gen5 M.2 slot drops the second GPU slot to x4. The manual's lane table tells you which M.2 slot to avoid.
- **Slot spacing.** Some boards' second slot can't take a card thicker than two slots ([Taichi Creator report](https://forum.level1techs.com/t/asrock-x870-taichi-creator-dual-gpu/243897)). Most B60s are dual-slot, so this is usually fine.

Intel alternative: an LGA1700 board with x8/x8 (e.g. ProArt Z790-Creator, MSI Z790 Ace/Carbon) plus a used i5-13400/14400 also works with DDR5 — compare used prices locally.

## Option B: used AM4 desktop (if you had no RAM)

| Part | What to buy | Est. cost | Notes |
|---|---|---|---|
| CPU | Ryzen 5 5600 / 5600X / 7 5700X | $80–130 | Ryzen 5000 supports ReBAR and PCIe 4.0; avoid 5600G/5700G APUs (PCIe 3.0, x8 lanes for GPUs) |
| Board | X570 or B550 with **x8/x8 from CPU** | $150–250 | Confirmed layouts: [ASRock X570 Taichi](https://at-web1.www.anandtech.com/show/14161/the-amd-x570-motherboard-overview/4) (x16 or x8/x8). Also commonly x8/x8: ASUS ProArt B550-Creator, Gigabyte X570 Aorus Master, MSI MEG X570 Ace — **verify in the manual** |
| RAM | 2×16 GB DDR4-3200 | $90–150 | Go 2×32 GB ($180–250+) only if you plan CPU/MoE offload |
| SSD | 1–2 TB NVMe (PCIe 3.0/4.0) | $80–150 | Models are 15–45 GB each; 2 TB is comfortable |
| PSU | 850–1000 W ATX 3.x Gold | $110–160 | Two 200 W GPUs + 65 W CPU ≈ 550 W peak; headroom covers transients |
| Case | Airflow case, 7+ slots | $70–120 | Leave at least one empty slot between cards |
| CPU cooler | Stock or $25 tower | $0–25 | |
| **Total** | | **≈ $580–1,000** | Target ~$750 |

### How to read a board manual for x8/x8

Look for the PCIe slot table. You want wording like *"PCIE1 / PCIE2: x16/x0 or x8/x8"* — both slots wired to the **CPU**. Avoid boards where the second long slot says *"x4 (chipset)"* or *"shares bandwidth with M.2"* only. Forum threads show many people [get burned by this](https://forum.level1techs.com/t/dual-gpu-pcie-bifurcation-question-frustration/252100): a full-length slot is not necessarily wired x8.

## Option C: you already own a desktop

If you have a PC with Ryzen 3000/5000 or Intel 10th-gen+:

- **Two CPU-wired slots x8/x8?** Just add a PSU if needed. Cost: $0–160.
- **Second slot is chipset x4?** It still works with llama.cpp **layer split**, which sends only small activations between GPUs per token. Tensor parallel in vLLM will be slower. Cost: $0–160, and upgrade the board later if you outgrow it.

## Option D: used workstation (only with care)

Used Dell Precision T7820 / HP Z6 G4 / Lenovo P720 towers are cheap and often come with 64–128 GB of ECC RAM — attractive in a RAM shortage. But:

- Most Skylake/Cascade Lake Xeon platforms **do not expose Resizable BAR**, which Arc needs.
- They are PCIe 3.0, and their PSUs use proprietary connectors with limited PCIe power leads.

Only go this way if you confirm ReBAR in that exact model's BIOS first. A newer workstation (e.g. Threadripper Pro) fixes all this but usually exceeds the budget.

## A note on multi-GPU on consumer platforms

Intel and vLLM support PCIe peer-to-peer between B60s, but community testing found [consumer platforms are slower for P2P traffic](https://forum.level1techs.com/t/llm-adventures-with-intel-arc-pro-b60s-p2p-vllm/252516) than workstation boards or a PCIe switch. With two cards this mostly affects tensor-parallel throughput, not whether things work. Layer split is barely affected.

## Budget example (with your DDR5)

- Ryzen 5 7600 — $170
- ASRock X670E Taichi Lite or ASUS ProArt B650-Creator — $300
- Your 2×8 GB DDR5 — $0
- 2 TB NVMe — $120
- 1000 W Gold ATX 3.1 PSU — $140
- Airflow case + 2 extra fans — $100
- **Total: $830**, leaving ~$170 for a UPS, a bigger SSD, or more RAM later.

## Related

- [Software Stack & Setup](software-stack.md) — BIOS settings to flip after assembly
- [Models & Expected Performance](models-and-performance.md) — when 64 GB system RAM is worth it

## References

1. [Intel Arc Pro B60 Datasheet](https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2026-03/datasheet-b60-gpu.pdf) — memory and bandwidth specs
2. [Flopper — Arc Pro B60 Spec Sheet](https://flopper.io/gpu/intel-arc-pro-b60-24gb/spec-sheet) — PCIe interface, Xe cores, TOPS
3. [Sparkle Arc Pro B60 User Manual](https://cdn.multitronic.fi/media/9/6/mmo_134689064_1773307848_3924_283.pdf) — 200 W TBP, 8-pin connector, PSU recommendation
4. [Intel Support — Resizable BAR](https://www.intel.com/content/www/us/en/support/articles/000099073.html) — ReBAR requirement
5. [AnandTech — X570 Motherboard Overview](https://at-web1.www.anandtech.com/show/14161/the-amd-x570-motherboard-overview/4) — X570 Taichi slot layout
6. [Level1Techs — Dual GPU PCIe Bifurcation](https://forum.level1techs.com/t/dual-gpu-pcie-bifurcation-question-frustration/252100) — real-world bifurcation pitfalls
7. [Level1Techs — LLM Adventures with Arc Pro B60s, P2P, vLLM](https://forum.level1techs.com/t/llm-adventures-with-intel-arc-pro-b60s-p2p-vllm/252516) — P2P performance on consumer vs workstation platforms
8. [Tom's Hardware — RAM Price Index 2026](https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities) — DRAM pricing
9. [Tech Insider — RAM/SSD Shortage 2026](https://tech-insider.org/ca/ram-ddr5-ssd-price-shortage-canada-2026/) — 64 GB kit price history
10. [Tom's Hardware — Maxsun Dual B60](https://tomshardware.com/pc-components/gpus/maxsun-unveils-intel-dual-gpu-battlemage-graphics-card-with-48gb-gddr6-to-compete-with-nvidia-and-amd) — dual-GPU card power and bifurcation
11. [Level1Techs — ASRock X870 Taichi Creator Dual GPU](https://forum.level1techs.com/t/asrock-x870-taichi-creator-dual-gpu/243897) — AM5 x8/x8 board candidates and slot-spacing caveat
12. [Level1Techs — X870E Motherboard for Dual GPU](https://forum.level1techs.com/t/x870e-motherboard-for-dual-gpu-and-optane/222898) — ProArt x8/x8 and M.2 lane-sharing behavior
