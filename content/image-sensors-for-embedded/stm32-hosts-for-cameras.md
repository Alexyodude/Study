---
title: "STM32 Hosts for Dual Cameras with Secure Boot"
created: 2026-04-30
updated: 2026-04-30
tags: [stm32, camera, mipi, csi-2, dcmi, dcmipp, trustzone, secure-boot, security, pricing]
status: draft
sources:
  - url: "https://www.st.com/en/microcontrollers-microprocessors/stm32mp2-series.html"
    title: "STMicroelectronics — STM32MP2 series"
  - url: "https://www.st.com/en/microcontrollers-microprocessors/stm32n657x0.html"
    title: "STMicroelectronics — STM32N657X0"
  - url: "https://www.st.com/resource/en/application_note/an6211-introduction-to-digital-camera-interface-pixel-pipeline-for-stm32-mcus-stmicroelectronics.pdf"
    title: "AN6211 — DCMIPP for STM32 MCUs"
  - url: "https://wiki.stmicroelectronics.cn/stm32mpu/wiki/STM32MP2_V4L2_camera_overview"
    title: "ST wiki — STM32MP2 V4L2 camera overview"
  - url: "https://trustedfirmware-a.readthedocs.io/en/latest/plat/st/stm32mp2.html"
    title: "TF-A — STM32MP2 platform port"
  - url: "https://www.st.com/content/st_com/en/ecosystems/stm32trust.html"
    title: "STMicroelectronics — STM32Trust security framework"
  - url: "https://www.cnx-software.com/2023/05/16/stm32mp25-stmicro-stm32mp2-arm-cortex-a35-m33-mpu-family/"
    title: "CNX — STM32MP2 family announcement"
  - url: "https://www.digikey.com/en/products/detail/stmicroelectronics/STM32MP257FAK3/24883094"
    title: "DigiKey — STM32MP257FAK3 pricing & stock"
  - url: "https://www.digikey.com/en/products/detail/stmicroelectronics/STM32MP255DAK3T/26254193"
    title: "DigiKey — STM32MP255DAK3T pricing & stock"
  - url: "https://www.digikey.com/en/products/detail/stmicroelectronics/STM32N657X0H3Q/25675974"
    title: "DigiKey — STM32N657X0H3Q pricing & stock"
  - url: "https://www.digikey.com/en/products/detail/stmicroelectronics/STM32N657A0H3Q/25935633"
    title: "DigiKey — STM32N657A0H3Q pricing & stock"
---

# STM32 Hosts for Dual Cameras with Secure Boot

A practical short-list of STM32 parts that can simultaneously satisfy:

1. **Two camera sensors** wired in (not multiplexed into one stream).
2. **At least 1080p @ 30 fps** capture per stream.
3. **ARM TrustZone** (TrustZone-M for Cortex-M, TrustZone-A for Cortex-A).
4. **ROM-based secure boot** with an authenticated chain of trust.

Picking a host is mostly about whether it has **two camera input pipelines** at all — most STM32 parts have only one. Security is easier; STM32Trust is broadly available.

## The two viable families

| Family | Cores | Cam input #1 | Cam input #2 | Max stream | TrustZone | Secure stack |
|---|---|---|---|---|---|---|
| **STM32MP25x** (MPU) | 1–2× Cortex-A35 + Cortex-M33 | MIPI CSI-2 (2-lane D-PHY) → DCMIPP | Parallel DCMI → DCMIPP | 5 MP @ 30 fps via ISP, **VENC rated 1080p30** | TrustZone-A (A35) **+** TrustZone-M (M33) | ROM → TF-A → **OP-TEE** → Linux |
| **STM32N6x7** (MCU) | Cortex-M55 @ 800 MHz + NeuralART NPU | MIPI CSI-2 (2-lane D-PHY) → DCMIPP | 16-bit parallel DCMI → DCMIPP | 1080p30 capture; **H.264 encode capped at 1080p @ 15 fps** | TrustZone-M only | RSS ROM → **TF-M / SBSFU** (no OP-TEE — Cortex-M only) |

Both expose **two distinct camera ingress paths** muxed into a single DCMIPP pixel pipeline. That's how you get "dual camera" on these chips. Beyond two, you need an external CSI-2 aggregator/MIPI mux.

## STM32MP25 — the MPU answer

**STM32MP251 / MP253 / MP255 / MP257** — pick by feature set:

| Variant | A35 cores | NPU/GPU | Display | Ethernet | CAN-FD |
|---|---|---|---|---|---|
| MP251 | 1× | — | DSI/LVDS | 2× | 3× |
| MP253 | 2× | — | DSI/LVDS | 2× | 3× |
| MP255 | 2× | NPU + GPU | DSI/LVDS | 2× | 3× |
| MP257 | 2× | NPU + GPU | DSI + **LVDS** | **3× (2+1 switch)** | 3× |

All four expose the same camera + security IP:

- **DCMIPP** pixel pipeline with crop, decimate, downscale, statistics, dual-output.
- **CSI-2 host** with 2-lane D-PHY, up to ~2.5 Gbps/lane.
- **Parallel DCMI** input (8/10/12/14-bit) — second camera lane.
- **ISP**: Lite-ISP block on the MIPI path; rated up to **5 MP @ 30 fps**. Two 1080p30 streams fit comfortably.
- **H.264 hardware encoder** for 1080p30 (encode while you capture).
- **Security**: ROM secure boot with public-key auth → BL2 → OP-TEE → Linux. On-the-fly external memory encryption (DDR + flash). Side-channel-resistant AES/PKA. RNG, secure storage, tamper.
- "**P**" suffix part numbers (e.g. STM32MP257**F**) include the full crypto option.

**Reference design:** STM32MP257F-EV1 evaluation board. Camera modules from TechNexion / Digi (ConnectCore MP25) ship with V4L2 drivers in mainline Linux as of 2024.

When to pick MP25:
- You're running Linux (or Zephyr on the M33 + Linux on the A35).
- You need to **encode** both 1080p30 streams (H.264 hardware) or push them over Ethernet.
- You want full TF-A + OP-TEE chain of trust (industry standard MPU security).

## STM32N6 — the MCU answer (with real caveats)

**STM32N657X0**, ~800 MHz Cortex-M55 with Helium (MVE) and the **NeuralART** NPU (~600 GOPS). Positioned as "MPU-class on a microcontroller" — single-chip, no DDR mandatory, fast deterministic boot.

- **DCMIPP** pixel pipeline (same family of IP as MP25).
- **CSI-2 host** (2-lane D-PHY) — the **first STM32 MCU with native CSI-2**.
- **Parallel DCMI** — works in parallel with CSI-2 for a second sensor.
- **H.264 encoder**: **1080p @ 15 fps** maximum. Lower resolutions go faster (e.g., 720p closer to 30 fps), but the chip cannot encode 1080p30 at all, let alone two streams.
- **Security**: TrustZone-**M** only (no Cortex-A → **no OP-TEE**, no Linux secure-world). The TEE on this part is **TF-M** or ST's SBSFU running in the secure state of the M55. ROM-based RSS secure boot, RDP, AES + PKA with side-channel countermeasures, **OTFDEC** for transparent decryption of code XIP'd from external flash.

### Where N6 actually loses to MP25

| Capability | STM32MP25 | STM32N657 |
|---|---|---|
| Dual 1080p **capture** | ✅ | ✅ |
| Dual 1080p30 **H.264 encode** | ✅ (VENC interleaves streams) | ❌ (encoder caps at 1080p15) |
| Single 1080p30 H.264 encode | ✅ | ❌ — best is 1080p15 |
| Single 4K H.264 encode | ⚠️ at lower fps | ❌ |
| OP-TEE secure-world OS | ✅ | ❌ — TrustZone-M only, runs TF-M instead |
| Linux + secure boot chain | ✅ TF-A → OP-TEE → Linux | ❌ — bare-metal / RTOS only |
| 5 MP @ 30 fps ISP | ✅ | ✅ (same DCMIPP) |
| On-device NPU | NPU on MP255/MP257 | ✅ (NeuralART, faster than MP25's NPU) |

When to pick N6:
- You want a **single MCU** with no Linux and no DDR boot complexity.
- You're doing **on-device AI inference** on the camera streams (face/object/anomaly), where the NeuralART NPU is the actual differentiator.
- You can **capture** dual 1080p30 raw/YUV but **don't need to H.264-encode** both streams on-chip.
- A TF-M based TEE is acceptable in your security model (no OP-TEE requirement).

When to **avoid** N6:
- You need OP-TEE, Linux, or any Cortex-A trusted-OS ecosystem.
- You need to **encode** at 1080p30 on-chip — the 15 fps cap is hard.
- You need >1080p video output beyond stills.

## Parts to skip for this requirement

| Family | Why it fails |
|---|---|
| STM32MP15x / MP13x | DCMI only natively. CSI-2 needs an external bridge. Awkward at 1080p30 dual. |
| STM32H7 / H7Rx / H7Sx | Most have DCMI only; no TrustZone-M (Cortex-M7). H7R7/H7S7 add DCMIPP but still single ingress. |
| STM32H5 | TrustZone-M ✅, secure boot ✅, but no native CSI-2 and limited camera bandwidth. |
| STM32U5 / L5 | TrustZone-M ✅, but single DCMI at most; not a dual-1080p30 part. |
| STM32WBA / WL | No camera interface. |

## Quick decision

```
Need OP-TEE, Linux, or 1080p30 H.264 encode?
  → STM32MP25x — only option. Pick MP257 for 3× Eth/LVDS, MP255 for cheaper
    dev, MP253 for no-NPU, MP251 for single-A35 cost-down.

Single-MCU AI camera, can live without H.264 encode at 1080p30, TF-M is enough?
  → STM32N657 — and only then. The N6 captures dual 1080p30 fine but cannot
    encode both at 1080p30 (encoder caps at 1080p15), and there is no OP-TEE
    on Cortex-M.

Anything that needs more than this — dual 4K encode, two full-ISP-processed
>2 MP streams, or a richer Linux secure-OS ecosystem — leave STM32:
  → NXP i.MX 8M Plus, TI AM62A, Rockchip RK3588.
```

## Pricing & availability (DigiKey, USD, snapshot 2026-04-30)

Prices and stock change weekly — verify before ordering. Mouser carries the same SKUs at comparable prices.

| Part | What it is | Stock | 1 unit | 10 | 100 | 500+ | Package | Lead time |
|---|---|---|---|---|---|---|---|---|
| [**STM32MP257FAK3**](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32MP257FAK3/24883094) | dual A35 + M33, full crypto, NPU/GPU, 3× Ethernet | 278 | $26.70 | $21.49 | $18.75 | $18.07 (250) | 424-VFBGA 14×14, tray | 20 wk |
| [**STM32MP255DAK3T**](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32MP255DAK3T/26254193) | dual A35 + M33, NPU/GPU | 1,400 (T&R only) | — | — | — | **$15.60** ea | 424-VFBGA 14×14, T&R | 20 wk |
| [**STM32N657X0H3Q**](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32N657X0H3Q/25675974) | M55 + NeuralART, large BGA | **0** (notify) | $21.44 | $17.13 | $14.75 (119) | $13.89 (595) | 264-VFBGA 14×14, tray | 15 wk |
| [**STM32N657A0H3Q**](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32N657A0H3Q/25935633) | M55 + NeuralART, **compact 6×6** | **2,503** | $18.36 | $14.60 | $12.62 | $11.83 | 169-VFBGA 6×6, tray | 15 wk |

### Practical picks from this table

- **Cheapest + most available right now**: **STM32N657A0H3Q**. $18.36 in singles, 2,500+ on the shelf, the 6×6 BGA is much easier to lay out than the 14×14 parts.
- **Best MPU you can buy in singles**: **STM32MP257FAK3**. ~$27/1, drops to $18 at 250 units. Same silicon as the EV1 dev kit.
- **Cheapest MPU at production volume**: **STM32MP255DAK3T** at $15.60 each — but DigiKey only sells the full 1,400-unit Tape & Reel (~$21.8k). Not for prototyping.
- **Avoid for now**: **STM32N657X0H3Q** (the 264-pin variant) — out of stock, 15-week lead time. Use the A0H3Q variant unless you specifically need its larger pin count.

### Dev kits (the fast path)

| Kit | Part | Notes |
|---|---|---|
| [STM32MP257F-EV1](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32MP257F-EV1/24740245) | full evaluation board | DSI/LVDS, both camera connectors, expansion |
| [STM32MP257F-DK](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32MP257F-DK/25862908) | discovery kit | cheaper, fewer connectors |
| [STM32N6570-DK](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32N6570-DK/25724059) | N6 discovery kit | bundled camera, AI demos |
| [NUCLEO-N657X0-Q](https://www.digikey.com/en/products/detail/stmicroelectronics/NUCLEO-N657X0-Q/25724056) | Nucleo board | bare-bones, BYO camera |

## How high can you push the resolution?

The headline number on the DCMIPP datasheet — "5 MP @ 30 fps" — is the **ISP** budget, not the chip's total capture capability. DCMIPP has three pipes; only one runs the ISP.

| Pipe | Purpose | Resolution bound |
|---|---|---|
| **Pipe0 (Dump)** | Raw passthrough: stats, Bayer for stills, or YUV/RGB from a sensor that already has an ISP | Memory bandwidth (12 MP YUV/RGB confirmed) |
| **Pipe1 (ISP)** | Bayer → RGB/YUV through the on-chip ISP | **5 MP @ 30 fps total** |
| **Pipe2 (Aux)** | Crop / downsize / decimation; can dynamically tap ISP output | Shares Pipe1 |

So the rule is: anything that goes through the ISP must fit in 5 MP @ 30 fps. Anything that bypasses the ISP is bandwidth-bound, not ISP-bound.

### What this means for dual-camera configs (STM32MP25)

| Configuration | Works? | Note |
|---|---|---|
| Dual **1080p @ 30 fps** through ISP (2 MP + 2 MP = 4 MP) | ✅ | Sweet spot. Headroom to spare. |
| Dual **1440p @ 30 fps** through ISP (3.7 MP each) | ❌ | Exceeds 5 MP ISP budget. |
| **5 MP @ 30 fps** (ISP) + **1080p @ 30 fps** (bypass) | ✅ | Second sensor must output YUV/RGB itself. |
| One **5 MP @ 30 fps** ISP-processed stream | ✅ | Full ISP budget on one camera. |
| **4K Bayer** decimated 2× → 2 MP into ISP | ✅ | Wide FOV preview, lower effective res. |
| **4K @ 30 fps full ISP** | ❌ | Exceeds ISP. |
| **Dual 1080p30 H.264 encode** | ✅ | VENC interleaves multiple streams. |
| **4K H.264 encode** | ⚠️ | VENC accepts up to 4080×4080 but is rated 1080p30. 4K works only at lower fps with bandwidth headroom. |

### STM32N6 specifics

Same ISP/DCMIPP family as MP25 — same 5 MP @ 30 fps ISP budget, same Pipe0 bypass story (12 MP YUV/RGB capture confirmed). The hard ceiling is the **H.264 encoder at 1080p @ 15 fps**. Capture can go higher than encode.

### When STM32 is not the answer

- **Dual 4K encoded output**: not on STM32. Look at NXP i.MX 8M Plus, TI AM62A, or Rockchip RK3588.
- **Two full-ISP-processed >2 MP streams**: same — exceeds the 5 MP shared ISP budget.

## Wiring two sensors in practice

DCMIPP accepts **one stream at a time** but switches at the pipeline input. The realistic dual-camera topologies are:

1. **CSI-2 sensor + parallel sensor** — independent ingress paths, DCMIPP time-multiplexes pipeline output buffers. Easiest.
2. **Two CSI-2 sensors via aggregator** — e.g. Maxim/ADI GMSL or a TI FPD-Link III deserializer that combines two CSI-2 streams into a single virtual-channel-tagged CSI-2 stream into the STM32 host. DCMIPP demultiplexes by virtual channel.
3. **Two CSI-2 sensors via MIPI mux** — fast switch between sensors, but only one is live at a time. Not true dual capture.

For genuinely **simultaneous** 1080p30 from both, topology (1) or (2) is what you build.

## Security checklist (applies to both families)

- Provision RSS / ROM keys at the factory (ECDSA P-256 or P-384).
- Enable RDP level 2 only after you have a verified field-update path.
- Use **OTFDEC** (N6) or **MCE/SAES** (MP25) to keep external flash images encrypted.
- Run camera/ISP DMAs through firewalls / RIF (Resource Isolation Framework on MP25) so the non-secure world cannot read frame buffers from the secure world.
- For two-sensor designs, isolate one sensor's pipeline into the secure domain if it carries sensitive data (driver-monitor, biometrics).

## References

1. [STM32MP2 series — STMicroelectronics](https://www.st.com/en/microcontrollers-microprocessors/stm32mp2-series.html) — Family overview, variants, peripherals.
2. [STM32N657X0 — STMicroelectronics](https://www.st.com/en/microcontrollers-microprocessors/stm32n657x0.html) — N6 product page with DCMIPP, CSI-2, NeuralART, RSS.
3. [AN6211 — DCMIPP for STM32 MCUs](https://www.st.com/resource/en/application_note/an6211-introduction-to-digital-camera-interface-pixel-pipeline-for-stm32-mcus-stmicroelectronics.pdf) — Pixel pipeline architecture, CSI-2 + DCMI dual ingress.
4. [STM32MP2 V4L2 camera overview — ST wiki](https://wiki.stmicroelectronics.cn/stm32mpu/wiki/STM32MP2_V4L2_camera_overview) — Linux media-controller graph for CSI + DCMIPP.
5. [TF-A STM32MP2 platform port](https://trustedfirmware-a.readthedocs.io/en/latest/plat/st/stm32mp2.html) — Boot chain, OP-TEE integration on MP25.
6. [STM32Trust — STMicroelectronics](https://www.st.com/content/st_com/en/ecosystems/stm32trust.html) — Security framework spanning TrustZone, secure boot, crypto IP.
7. [CNX — STM32MP2 family announcement](https://www.cnx-software.com/2023/05/16/stm32mp25-stmicro-stm32mp2-arm-cortex-a35-m33-mpu-family/) — Variant feature matrix at launch.
8. [Exploring STM32N6 (Medium)](https://medium.com/@pkusolruangchai/exploring-stm32n6-f41df8e2e516) — Independent deep-dive: CSI-2, DCMIPP, NPU, H.264 limits.
9. [DigiKey — STM32MP257FAK3](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32MP257FAK3/24883094) — Pricing, stock, packaging, lead time.
10. [DigiKey — STM32MP255DAK3T](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32MP255DAK3T/26254193) — Tape & Reel volume pricing.
11. [DigiKey — STM32N657X0H3Q](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32N657X0H3Q/25675974) — 264-pin BGA pricing & lead time.
12. [DigiKey — STM32N657A0H3Q](https://www.digikey.com/en/products/detail/stmicroelectronics/STM32N657A0H3Q/25935633) — 169-pin compact BGA pricing & stock.
13. [ST wiki — How to use the DCMIPP ISP](https://wiki.st.com/stm32mpu/wiki/How_to_use_the_DCMIPP_ISP) — Pipe0/Pipe1/Pipe2 architecture, ISP 5 MP budget, decimation factors.
14. [ST wiki — Hardware Video Encoding with STM32](https://wiki.st.com/stm32mcu/wiki/Introduction_to_Hardware_Video_Encoding_with_STM32) — VENC resolution range and 1080p30 rating.
15. [ST community — STM32N6 with 12 MP image sensor](https://community.st.com/t5/edge-ai/can-the-stm32n6-be-connected-to-a-12mp-image-sensor/td-p/776772) — 12 MP YUV/RGB sensors via Pipe0-dump (ISP bypass).
