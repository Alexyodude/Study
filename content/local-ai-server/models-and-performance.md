---
title: "Models & Expected Performance"
created: 2026-10-22
updated: 2026-10-22
tags: [local-llm, models, quantization, performance, vram]
status: review
sources:
  - url: "https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2026-03/datasheet-b60-gpu.pdf"
    title: "Intel Arc Pro B60 Datasheet"
  - url: "https://forum.level1techs.com/t/arc-pro-b60-for-local-llms/246971"
    title: "Level1Techs — Arc Pro B60 for Local LLMs"
  - url: "https://aiweekly.co/alerts/intel-arc-pro-b70-delivers-63-ts-on-qwen-36-35b"
    title: "AI Weekly — Arc Pro B70 63 t/s on Qwen 3.6-35B"
  - url: "https://discuss.vllm.ai/t/intel-xpu-dual-arc-b60pro-single-arc-b70pro/2770"
    title: "vLLM Forum — Dual Arc B60 Pro vs Single B70 Pro"
  - url: "https://www.phoronix.com/review/intel-arc-pro-b70-four"
    title: "Phoronix — Four Intel Graphics Cards on Ubuntu 26.04"
  - url: "https://github.com/intel/llm-scaler"
    title: "Intel LLM Scaler (GitHub)"
---

# Models & Expected Performance

With 48 GB of VRAM split across two cards, the question is: **which models fit, and how fast will they be?**

## Rule of thumb: will it fit?

**VRAM needed ≈ model file size + KV cache + ~1 GB overhead per GPU.**

Model file size ≈ parameters × bits-per-weight ÷ 8. Examples:

| Model size | Q4_K_M (~4.8 bpw) | Q5_K_M (~5.7 bpw) | Q8_0 (~8.5 bpw) | Fits in 48 GB? |
|---|---|---|---|---|
| 8–9B | ~5 GB | ~6 GB | ~9 GB | Easily — one card is enough |
| 14B | ~9 GB | ~10 GB | ~15 GB | Easily — one card |
| 27–32B dense | ~19 GB | ~23 GB | ~34 GB | Yes, at any of these, with long context |
| 30–35B MoE (~3B active) | ~19 GB | ~23 GB | ~35 GB | Yes — and fast |
| 70B dense | ~42 GB | ~50 GB | ~75 GB | Only Q4, with short context (~8k) |
| 100B+ MoE (e.g. gpt-oss-120b, ~63 GB) | — | — | — | Partly — needs CPU offload + 64 GB system RAM |

KV cache grows with context length. A 32B model at 32k context typically needs several more GB; use `-ctk q8_0 -ctv q8_0` in llama.cpp to halve it.

## Rule of thumb: how fast?

When generating, each token reads every active weight once, so:

**max tokens/s ≈ memory bandwidth ÷ bytes read per token.**

With layer split, the two cards work one after the other, so you get one card's bandwidth (456 GB/s) for the whole model:

- 32B dense at Q4 (~19 GB): 456 ÷ 19 ≈ **24 t/s ceiling**, expect ~12–18 t/s.
- 30B MoE with ~3B active at Q4 (~2 GB read per token): ceiling well over 100 t/s; real-world tends to land around 40–70 t/s because of overheads. A single B70 (the bigger sibling with more memory bandwidth, so expect somewhat less on a B60) has been measured at [62–64 t/s on Qwen 3.6-35B](https://aiweekly.co/alerts/intel-arc-pro-b70-delivers-63-ts-on-qwen-36-35b).
- 70B dense at Q4 (~42 GB): ≈ 11 t/s ceiling, expect ~6–9 t/s.

Tensor parallel (vLLM `-tp 2`) lets both cards read at once, approaching 2× bandwidth for single requests, and much more total throughput under batching.

### Real measurements (sanity check)

- A single B60 with llama.cpp SYCL on a 9B Q4 model measured about [329 t/s prompt processing and 23 t/s generation](https://forum.level1techs.com/t/arc-pro-b60-for-local-llms/246971) — below the theoretical ceiling, showing that **Arc software is still maturing**. Update llama.cpp often.
- Dual-B60 vLLM users report **very long time-to-first-token on long contexts** ([vLLM forum](https://discuss.vllm.ai/t/intel-xpu-dual-arc-b60pro-single-arc-b70pro/2770)). Prompt processing (prefill) is the weak spot vs NVIDIA; keep agent/coding contexts lean or use prefix caching.
- Phoronix found llama.cpp Vulkan [scaled to two cards and then collapsed](https://www.phoronix.com/review/intel-arc-pro-b70-four) beyond that — two cards is the sweet spot for this backend.

## Suggested starter lineup

| Use | Model class | Format | Why |
|---|---|---|---|
| Everyday chat, fast | ~30–35B MoE (e.g. Qwen3/3.6 30B-A3B class) | GGUF Q5/Q6 | Very fast, high quality, long context |
| Best dense quality | 27–32B dense | GGUF Q6/Q8 or FP8 in vLLM | Fits fully with room for 32k+ context |
| Coding agent | 30B-class coder MoE | GGUF Q5 / FP8 | Speed matters more than raw size for agents |
| Biggest that fits | 70B dense | Q4_K_M, 8k context | Slow but possible |
| Embeddings / RAG | Small embedding + reranker models | vLLM ([LLM Scaler supports both](https://github.com/intel/llm-scaler)) | Run alongside a chat model on one card |

## Is 64 GB system RAM worth the extra ~$100–150?

- **No**, if you stay within 48 GB VRAM models (most people; everything up to 32B dense and ~35B MoE).
- **Yes**, if you want 100B+ MoE models like gpt-oss-120b: llama.cpp can keep attention on the GPUs and push expert layers to system RAM (`--n-cpu-moe N`). It runs, slower, but surprisingly usable because only a few experts are active per token.

Since RAM is so expensive in 2026, start with 32 GB and upgrade only if you actually hit this case.

## Related

- [Hardware & the $1000 Budget](hardware-and-budget.md)
- [Software Stack & Setup](software-stack.md)

## References

1. [Intel Arc Pro B60 Datasheet](https://www.intel.com/content/dam/www/central-libraries/us/en/documents/2026-03/datasheet-b60-gpu.pdf) — 456 GB/s memory bandwidth used in the speed estimates
2. [Level1Techs — Arc Pro B60 for Local LLMs](https://forum.level1techs.com/t/arc-pro-b60-for-local-llms/246971) — measured llama.cpp SYCL numbers on a B60
3. [AI Weekly — Arc Pro B70 63 t/s on Qwen 3.6-35B](https://aiweekly.co/alerts/intel-arc-pro-b70-delivers-63-ts-on-qwen-36-35b) — MoE speed reference on a sibling card
4. [vLLM Forum — Dual Arc B60 Pro vs Single B70 Pro](https://discuss.vllm.ai/t/intel-xpu-dual-arc-b60pro-single-arc-b70pro/2770) — real-world dual-B60 vLLM experience
5. [Phoronix — Four Intel Graphics Cards on Ubuntu 26.04](https://www.phoronix.com/review/intel-arc-pro-b70-four) — multi-GPU Vulkan scaling
6. [Intel LLM Scaler (GitHub)](https://github.com/intel/llm-scaler) — embedding/reranker and quantization support
