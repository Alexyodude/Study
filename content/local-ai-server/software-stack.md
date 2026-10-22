---
title: "Software Stack & Setup"
created: 2026-10-22
updated: 2026-10-22
tags: [linux, intel-arc, llama-cpp, vllm, sycl, vulkan, docker]
status: review
sources:
  - url: "https://dgpu-docs.intel.com/overview/introduction.html"
    title: "Intel Data Center & Pro GPU Docs — Overview"
  - url: "https://dgpu-docs.intel.com/installation-guides/installing-omix.html"
    title: "Intel — Installing Open Middleware Xe (OMIX)"
  - url: "https://dgpu-docs.intel.com/overview/release-notes/containers/compute-runtime/26.14.37833.4.html"
    title: "Intel Compute Runtime 26.14 Release Notes"
  - url: "https://github.com/intel/llm-scaler"
    title: "Intel LLM Scaler (GitHub)"
  - url: "https://www.phoronix.com/review/intel-arc-pro-b70-four"
    title: "Phoronix — Four Intel Graphics Cards on Ubuntu 26.04"
  - url: "https://bentech.substack.com/p/running-local-llms-on-intel-arc-pro"
    title: "Running Local LLMs on Intel Arc Pro B60 and B70 GPUs"
  - url: "https://github.com/ggml-org/llama.cpp/discussions/23313"
    title: "llama.cpp — Performance on Intel GPU with SYCL"
  - url: "https://www.intel.com/content/www/us/en/support/articles/000099073.html"
    title: "Intel Support — Resizable BAR for Arc Pro graphics"
  - url: "https://github.com/open-webui/open-webui"
    title: "Open WebUI"
  - url: "https://aur.archlinux.org/packages/llama.cpp-sycl?O=0"
    title: "AUR — llama.cpp-sycl package (user benchmark comments)"
---

# Software Stack & Setup

The stack, bottom to top: **BIOS → Linux kernel (Xe driver) → Intel compute runtime (Level Zero / OpenCL) or Vulkan → inference engine (llama.cpp or vLLM) → OpenAI-compatible API → chat UI.**

## Step 1 — BIOS settings

Set these before installing anything:

- **Above 4G Decoding:** Enabled
- **Resizable BAR (Re-Size BAR / Smart Access Memory):** Enabled — [required for proper Arc Pro performance](https://www.intel.com/content/www/us/en/support/articles/000099073.html)
- **CSM:** Disabled (pure UEFI boot; ReBAR depends on it)
- **PCIe slot mode:** x8/x8 (some boards call it "bifurcation" or set it automatically when both slots are filled)
- **PCIe link speed:** Auto (the B60 links at Gen5 x8 on AM5). If you see instability or link errors, force Gen4 — the bandwidth loss barely matters for inference.

Verify ReBAR once Linux is up — each B60 should show a BAR equal to its VRAM:

```bash
sudo lspci -vv -d 8086: | grep -iE "VGA|Display|Region 2"
# Expect something like: Region 2: Memory at ... (64-bit, prefetchable) [size=32G]
```

## Step 2 — Operating system & driver

- The B60 (Battlemage / Xe2) uses the **Xe kernel driver**, which is [in the upstream kernel since 6.11](https://dgpu-docs.intel.com/overview/introduction.html). Newer is better for Battlemage.
- Intel validates its compute-runtime container on [Ubuntu 24.04.4](https://dgpu-docs.intel.com/overview/release-notes/containers/compute-runtime/26.14.37833.4.html); Phoronix ran four Arc Pro cards on [Ubuntu 26.04 LTS with Linux 7.0](https://www.phoronix.com/review/intel-arc-pro-b70-four).

**Recommendation:** Ubuntu **26.04 LTS** (newest kernel and Mesa out of the box) or Ubuntu 24.04.4 with the HWE kernel if you want to match Intel's validation exactly.

User-space drivers: Intel's [Open Middleware Xe (OMIX)](https://dgpu-docs.intel.com/installation-guides/installing-omix.html) bundles the Level Zero and OpenCL runtimes, the SYCL compiler, oneDNN and oneMKL, and lists the B60 as supported. Follow that guide for the SYCL path. For the Vulkan path, Ubuntu's Mesa driver is enough.

```bash
sudo usermod -aG render,video $USER   # GPU device access; log out and back in
ls /dev/dri/                          # expect card0, card1 (+ iGPU if any), renderD128, renderD129
sudo dmesg | grep -iE "xe |guc"       # check the driver loaded both cards and the GuC firmware version
```

With only 16 GB of system RAM, add a swap file so large model loads (especially vLLM, which stages weights in RAM) don't get killed:

```bash
sudo fallocate -l 32G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Firmware gotcha:** one user found Ubuntu shipped an older GuC firmware than the kernel wanted and saw [degraded performance until updating it](https://bentech.substack.com/p/running-local-llms-on-intel-arc-pro). If dmesg complains about GuC firmware, update the `linux-firmware` package (or copy the newer file from upstream linux-firmware).

## Step 3a — llama.cpp (start here)

Easiest and most flexible: runs GGUF models, splits across both GPUs, offloads to CPU RAM when needed, exposes an OpenAI-compatible server.

Two GPU backends work on the B60:

| Backend | Pros | Cons |
|---|---|---|
| **Vulkan** | No oneAPI install; uses distro Mesa; good for hybrid & vision models | Prompt processing usually slower |
| **SYCL** | Faster prompt processing on Arc Pro (~150 tok/s more PP in one [B70 user report](https://aur.archlinux.org/packages/llama.cpp-sycl?O=0)) | Needs Intel oneAPI/OMIX toolchain |

<!-- tabs -->
```bash
# Vulkan build
sudo apt install -y build-essential cmake git libvulkan-dev glslc
git clone https://github.com/ggml-org/llama.cpp && cd llama.cpp
cmake -B build -DGGML_VULKAN=ON
cmake --build build -j
./build/bin/llama-server --list-devices    # should list both B60s
```
```bash
# SYCL build (after installing OMIX / oneAPI)
source /opt/intel/oneapi/setvars.sh
git clone https://github.com/ggml-org/llama.cpp && cd llama.cpp
cmake -B build -DGGML_SYCL=ON -DCMAKE_C_COMPILER=icx -DCMAKE_CXX_COMPILER=icpx
cmake --build build -j
./build/bin/llama-server --list-devices
```
<!-- /tabs -->

Serve a model across both cards:

```bash
./build/bin/llama-server -m ~/models/Qwen3-32B-Q5_K_M.gguf \
  -ngl 99 --split-mode layer --tensor-split 1,1 \
  -c 32768 -fa on --host 0.0.0.0 --port 8080
```

- `-ngl 99` puts all layers on GPU; `--tensor-split 1,1` divides them evenly between the two 24 GB cards.
- Try both builds with `llama-bench` on your model — Vulkan vs SYCL results change between releases.

## Step 3b — vLLM via Intel LLM Scaler (for throughput / many users)

Intel's [LLM Scaler](https://github.com/intel/llm-scaler) ships a Docker image (`intel/llm-scaler-vllm`, latest `0.26.0-b2`, Sept 2026) with vLLM tuned for B60/B70. It supports **tensor, pipeline and data parallel**, INT4 and FP8 quantization, embedding/reranker models, and P2P between cards.

```bash
docker pull intel/llm-scaler-vllm:0.26.0-b2
docker run -it --rm --net=host --device=/dev/dri --shm-size=8g \
  -v ~/models:/llm/models intel/llm-scaler-vllm:0.26.0-b2 bash
# inside the container (see the repo's vllm/README.md for the exact recommended flags):
vllm serve /llm/models/Qwen3-32B --tensor-parallel-size 2 --quantization fp8 --max-model-len 32768
```

When to use which:

- **Just you, chatting/coding, trying many models →** llama.cpp.
- **Several users or agents hitting the server at once, Hugging Face-format models →** vLLM. It batches requests and is far more efficient under load.

Expect rough edges: community builders report [driver bugs, OOMs and long time-to-first-token](https://bentech.substack.com/p/running-local-llms-on-intel-arc-pro) on this path. Pin a known-good image tag once things work.

## Step 4 — front-end & remote access

- **[Open WebUI](https://github.com/open-webui/open-webui)** in Docker, pointed at `http://localhost:8080/v1` (llama.cpp) or `:8000/v1` (vLLM).
- Coding tools (Continue, Aider, opencode, etc.) can use the same OpenAI-compatible URL.
- For access outside your home, use a VPN like Tailscale/WireGuard rather than port-forwarding.

## Checklist

1. BIOS: 4G decoding + ReBAR on, CSM off, x8/x8
2. Ubuntu 26.04 (or 24.04.4 HWE), user in `render` group
3. `lspci` shows large BAR on both cards; dmesg shows Xe + GuC loaded
4. llama.cpp Vulkan build lists two devices
5. Serve one model, benchmark, then try SYCL and/or LLM Scaler

## Related

- [Hardware & the $1000 Budget](hardware-and-budget.md)
- [Models & Expected Performance](models-and-performance.md)

## References

1. [Intel GPU Docs — Overview](https://dgpu-docs.intel.com/overview/introduction.html) — Xe kernel driver in upstream Linux 6.11+
2. [Intel — Installing OMIX](https://dgpu-docs.intel.com/installation-guides/installing-omix.html) — Level Zero, OpenCL, SYCL compiler, oneDNN/oneMKL bundle
3. [Intel Compute Runtime 26.14 Release Notes](https://dgpu-docs.intel.com/overview/release-notes/containers/compute-runtime/26.14.37833.4.html) — B60 support, Ubuntu 24.04.4 validation
4. [Intel LLM Scaler (GitHub)](https://github.com/intel/llm-scaler) — vLLM/omni containers, release history, multi-GPU features
5. [Phoronix — Four Intel Graphics Cards on Ubuntu 26.04](https://www.phoronix.com/review/intel-arc-pro-b70-four) — multi-card Arc Pro on Linux 7.0
6. [Running Local LLMs on Intel Arc Pro B60 and B70](https://bentech.substack.com/p/running-local-llms-on-intel-arc-pro) — GuC firmware gotcha, Vulkan vs SYCL, vLLM pain points
7. [llama.cpp — Performance on Intel GPU with SYCL](https://github.com/ggml-org/llama.cpp/discussions/23313) — SYCL backend performance discussion
8. [Intel Support — Resizable BAR](https://www.intel.com/content/www/us/en/support/articles/000099073.html) — ReBAR requirement
9. [Open WebUI](https://github.com/open-webui/open-webui) — chat front-end
10. [AUR — llama.cpp-sycl](https://aur.archlinux.org/packages/llama.cpp-sycl?O=0) — user comment comparing SYCL vs Vulkan on a B70
