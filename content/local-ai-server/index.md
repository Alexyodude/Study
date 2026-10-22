---
title: "Local AI Server Overview"
created: 2026-10-22
updated: 2026-10-22
tags: [local-llm, intel-arc, b60, homelab, budget]
status: review
sources:
  - url: "https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2026-03/datasheet-b60-gpu.pdf"
    title: "Intel Arc Pro B60 Datasheet"
  - url: "https://github.com/intel/llm-scaler"
    title: "Intel LLM Scaler (GitHub)"
  - url: "https://www.intel.com/content/www/us/en/support/articles/000099073.html"
    title: "Intel Support — Resizable BAR for Arc Pro graphics"
  - url: "https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities"
    title: "Tom's Hardware — RAM Price Index 2026"
  - url: "https://github.com/open-webui/open-webui"
    title: "Open WebUI"
---

# Local AI Server Overview

**Goal:** turn two Intel Arc Pro B60 GPUs you already own into a local LLM server, spending **under $1000** on everything else.

**Short answer:** it is very doable. Two B60s give you **48 GB of VRAM** (2 × 24 GB, [456 GB/s each](https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2026-03/datasheet-b60-gpu.pdf)) — enough for 32B-class models at high quality or 70B-class models at 4-bit. The GPUs are the expensive part, and you already have them. You also already own **2×8 GB DDR5 (16 GB)**, which removes the biggest 2026 cost problem (RAM), so the rest of the box is an **AM5 desktop for roughly $750–900**. 16 GB is enough for a GPU-only inference server.

## The recommended build at a glance

| Part | Pick | Est. cost (Oct 2026) |
|---|---|---|
| CPU | Ryzen 5 7600 / 7600X (new or used) | $130–200 |
| Motherboard | AM5 board that splits the two top slots **x8/x8** from the CPU (e.g. ASRock X670E Taichi / Taichi Lite, ASUS ProArt X670E/X870E-Creator, ASUS ProArt B650-Creator — verify in the manual) | $250–350 |
| RAM | **Your existing DDR5** (2×8 GB = 16 GB) — enough when models run fully on the GPUs | $0 |
| Storage | 1–2 TB NVMe SSD | $80–150 |
| PSU | 850–1000 W ATX 3.x, 80+ Gold, enough 8-pin PCIe leads | $110–160 |
| Case + fans | Airflow case fitting two dual-slot cards with a gap | $70–120 |
| **Total** | | **≈ $640–980 → aim for ~$800** |

Prices are estimates. DRAM is in a severe shortage in 2026 ([Tom's Hardware RAM index](https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities)) — reusing your DDR5 is what makes a modern AM5 platform affordable. Without that RAM, a used DDR4/AM4 build would be cheaper. Details and alternatives are in [Hardware & the $1000 Budget](hardware-and-budget.md).

## Three rules that make or break the build

1. **Both GPUs need real CPU lanes.** Use a board that runs two slots at **x8/x8** from the CPU. A second card in a chipset x4 slot works for simple layer-splitting but hurts tensor-parallel speed.
2. **Turn on Resizable BAR** (plus Above 4G Decoding) in the BIOS. Intel says it [must be enabled](https://www.intel.com/content/www/us/en/support/articles/000099073.html) for proper Arc Pro performance. That rules out most older Xeon workstations.
3. **Use Linux with a recent kernel** and either **llama.cpp** (easy, flexible) or Intel's **[LLM Scaler](https://github.com/intel/llm-scaler)** vLLM container (best multi-user throughput). See [Software Stack & Setup](software-stack.md).

## Key concepts

- **VRAM is the budget for models.** A model's weights plus its KV cache (context) must fit in 48 GB to run fast.
- **Memory bandwidth sets generation speed.** Each generated token reads every active weight once, so tokens/s ≈ bandwidth ÷ model size (upper bound).
- **Layer split vs tensor parallel.** Layer split (llama.cpp default) puts half the layers on each GPU — little PCIe traffic, simple. Tensor parallel (vLLM `-tp 2`) splits every layer across both GPUs — faster for batches/many users, but needs good PCIe bandwidth.

## Example: what you'll run on day one

```bash
# llama.cpp (Vulkan build) serving a 32B model split across both B60s
./build/bin/llama-server -m ~/models/Qwen3-32B-Q5_K_M.gguf \
  -ngl 99 --split-mode layer --tensor-split 1,1 -c 32768 --host 0.0.0.0 --port 8080
```

Then point [Open WebUI](https://github.com/open-webui/open-webui) or any OpenAI-compatible client at `http://<server>:8080/v1`.

## Pages in this topic

- [Hardware & the $1000 Budget](hardware-and-budget.md) — platform choice, parts list, PSU, cooling, the RAM-price problem
- [Software Stack & Setup](software-stack.md) — BIOS, OS, drivers, llama.cpp, vLLM / LLM Scaler, front-ends
- [Models & Expected Performance](models-and-performance.md) — what fits in 48 GB and how fast it runs

## Related topics

- [Camera Sensors — Catalog](../camera-sensors/index.md) — another hardware-selection guide in this site

## References

1. [Intel Arc Pro B60 Datasheet](https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2026-03/datasheet-b60-gpu.pdf) — official memory, bandwidth, and platform specs
2. [Intel LLM Scaler (GitHub)](https://github.com/intel/llm-scaler) — Intel's vLLM/ComfyUI stack for Arc Pro B60/B70
3. [Intel Support — Resizable BAR](https://www.intel.com/content/www/us/en/support/articles/000099073.html) — ReBAR requirement for Arc Pro cards
4. [Tom's Hardware — RAM Price Index 2026](https://www.tomshardware.com/pc-components/ram/ram-price-index-2026-lowest-price-on-ddr5-and-ddr4-memory-of-all-capacities) — current DRAM pricing context
5. [Open WebUI](https://github.com/open-webui/open-webui) — self-hosted chat front-end for OpenAI-compatible servers
