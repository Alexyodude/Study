---
title: "Camera Sensor Catalog"
created: 2026-06-29
updated: 2026-06-29
tags: [cameras, global-shutter, rolling-shutter, machine-vision, image-sensors, rgb, monochrome]
status: review
sources:
  - url: "https://www.baslerweb.com/en-us/learning/cmos-global-shutter-cameras/"
    title: "Basler — CMOS Global Shutter Cameras"
  - url: "https://www.sony-semicon.com/en/products/is/industry/global-shutter.html"
    title: "Sony Semiconductor — Global Shutter Image Sensors"
  - url: "https://www.e-consystems.com/industrial-cameras/ar0234-usb3-global-shutter-camera.asp"
    title: "e-con Systems — AR0234 Full HD Color Global Shutter Camera"
  - url: "https://www.uctronics.com/arducam-2mp-global-shutter-og02b10-color-camera-modules-pivariety.html"
    title: "Arducam OG02B10 2MP Color Global Shutter Module"
  - url: "https://www.get-cameras.com/USB3.0-Camera-1.6MP-Color-Sony-IMX273-MER2-160-227U3C"
    title: "Daheng MER2-160-227U3C — Sony IMX273 Color"
---

# Camera Sensor Catalog

A searchable, filterable catalog of **camera image sensors across the full resolution range** — from **0.3 MP VGA up to 67 MP** — in both **color (RGB) and monochrome**, and both **global and rolling shutter**, sorted to surface **low-price** options first. Global shutter is the primary focus, with a few common **rolling-shutter** sensors included and clearly labeled. It aims to cover the major machine-vision / embedded sensor families: **Sony Pregius & Pregius S, GPixel (GMAX / GSPRINT), Teledyne e2v Emerald, ams CMOSIS (CMV), onsemi AR / PYTHON / XGS, and OmniVision**. It spans three buying categories: cheap **USB webcams/boards**, **embedded camera modules** (Raspberry Pi / Jetson), and professional **industrial machine-vision** cameras.

> **Open the interactive catalog:** [`/camera-sensors/`](../../site/camera-sensors/index.html) in the generated site. Filter by category, **shutter (global/rolling)**, color/mono, resolution band, interface, sensor, minimum frame rate, and maximum price; sort by price, frame rate, or resolution. Each card shows a **price-source confidence** (verified / listed / est.).

## Global vs rolling shutter

A **rolling shutter** exposes the image one row at a time, top to bottom. Anything moving fast — a spinning fan, a golf swing, a part on a conveyor — gets **skew, wobble, or partial-exposure artifacts** because different rows are captured at slightly different instants.

A **global shutter** exposes **every pixel at the same instant**, then reads the data out. Fast motion is frozen cleanly with no skew. That is why machine vision, robotics, drones, and any high-speed capture prefer global shutter — at the cost of a more complex (and usually pricier) pixel design than rolling shutter.

The catalog labels each sensor's shutter type and lets you filter by it. The rolling-shutter entries (Sony **IMX219**, OmniVision **OV4689**) are included because they're extremely common and frequently cross-shopped — but note they will skew on fast motion. Watch out for modules that mis-market rolling sensors (like the OV4689) as "global shutter."

## Resolution bands & "1080p"

The catalog spans five resolution bands (filterable):

- **< 1 MP (VGA)** — **OV7251** (640×480), **Sony IMX287** (728×544). Tiny, blisteringly fast (120–500+ fps), often mono. Tracking / high-speed inspection.
- **1 MP** — **OV9281/OV9782**, **onsemi AR0144**, **PYTHON 1300**, **ams CGSS130 (GS130)** (1.3 MP NIR mono). Cheap, popular for robotics, depth (OAK), and VR/3D tracking.
- **1.5–2.5 MP (the "1080p" crowd)** — **AR0234, IMX392, IMX174, IMX296, IMX273, OG02B10, OV2311**. The sweet spot for full-HD machine vision.
- **3–5 MP** — **IMX252/IMX265** (3.2 MP), **IMX547** (5.1 MP), **IMX250/IMX264** (5 MP), **XGS 5000** (5.3 MP), **CMV4000** (4 MP), **Emerald 3.2M**, **IMX900** (3.2 MP), **OV4689** (4 MP, *rolling*). More pixels at moderate-to-high frame rate.
- **8 MP+** — **IMX219** (8 MP, *rolling*), **IMX255** (8.9 MP), **IMX546/IMX267** (8–8.9 MP), **GMAX2509** (9 MP 4K), **XGS 12000 / IMX253 / IMX545 / CMV12000** (12 MP), **XGS 16000 / IMX542** (16 MP), **CMV20000 / IMX541 / GSPRINT4521** (20–21 MP), **IMX540 / IMX530 / PYTHON 25K / XGS 30000** (24–30 MP), **Emerald 67M** (67 MP). High resolution; frame rates fall as pixels climb (and some high-speed parts like CMV12000/GSPRINT run 300–1000 fps).

"1080p" = **1920×1080**. Most 2.3 MP sensors are **1920×1200** (16:10) and contain a full 1080p frame. The **"True 1080p only"** toggle keeps only sensors at least 1920 px wide; 4:3 parts like IMX296 (1456×1088) or IMX273 (1440×1080) hit 1080 *lines* but are narrower.

## The sensors you'll see

| Sensor | Native res | Color/Mono | Notable trait |
|--------|-----------|------------|---------------|
| **Sony IMX287** | 728×544 (0.4 MP) | both | VGA Pregius; 500+ fps; high-speed inspection |
| **OmniVision OV9281** | 1280×800 (1.0 MP) | mono | Cheapest GS module (~$26–52); Pi/Jetson tracking |
| **OmniVision OV9782** | 1280×800 (1.0 MP) | color | Color sibling of OV9281; OAK depth cameras |
| **onsemi AR0144** | 1280×800 (1.0 MP) | both | Automotive/AR GS; good low light |
| **onsemi AR0234** | 1920×1200 (2.3 MP) | both | Cheapest path to color GS 1080p; budget USB boards |
| **Sony IMX392** | 1920×1200 (2.3 MP) | both | Pregius; common in FLIR / Basler |
| **Sony IMX174** | 1920×1200 (2.3 MP) | both | Large 1/1.2" Pregius; best low-light / dynamic range |
| **Sony IMX296** | 1456×1088 (1.58 MP) | both | 4:3; native Raspberry Pi "Global Shutter Camera" |
| **Sony IMX273** | 1440×1080 (1.6 MP) | both | Pregius; native 1080-line, 200+ fps |
| **OmniVision OG02B10** | 1600×1300 (2.3 MP) | color | OmniPixel3-GS; parts -A74A / -A75A / -A75A-Z; 1600×1080 @ 80 fps; AR/VR & robotics |
| **OmniVision OG02B1B** | 1600×1300 (2.3 MP) | mono | Monochrome sibling of OG02B10; NIR-strong; tracking / 3D |
| **Sony IMX252** | 2048×1536 (3.2 MP) | both | Pregius; fast 3.2 MP (~120 fps) |
| **Sony IMX265** | 2048×1536 (3.2 MP) | both | Pregius; lower-cost 3.2 MP (~55 fps) |
| **Sony IMX250** | 2448×2048 (5.0 MP) | both | 5 MP Pregius; ~75 fps |
| **Sony IMX264** | 2448×2048 (5.0 MP) | both | 5 MP Pregius; ~35 fps, lower noise |
| **onsemi PYTHON 1300** | 1280×1024 (1.3 MP) | both | Compact board-level; ~150 fps |
| **onsemi XGS 5000** | 2592×2048 (5.3 MP) | both | High-speed 5 MP (~132 fps) |
| **OmniVision OV2311** | 1600×1300 (2.1 MP) | mono | NIR mono; eye/iris tracking, biometrics |
| **OmniVision OV7251** | 640×480 (0.3 MP) | mono | VGA NIR mono; gesture / head / eye tracking |
| **Sony IMX267** | 4096×2160 (8.9 MP) | both | 4K-class Pregius; CCD replacement |
| **Sony IMX304** | 4096×3000 (12.3 MP) | both | 12 MP Pregius, large 1.1" format |
| **Sony IMX546** | 2840×2840 (8.1 MP) | both | Pregius **S** (BSI, 2.74 µm); square sensor |
| **Sony IMX540** | 5328×4608 (24.5 MP) | both | Pregius **S** flagship; 24.5 MP GS |
| **ams CGSS130 (GS130)** | 1080×1280 (1.3 MP) | mono | Global shutter; NIR-enhanced + HDR; 3D / face / iris sensing |
| **Sony IMX219** | 3280×2464 (8 MP) | color | **Rolling shutter** — Raspberry Pi Cam v2; cheap, ubiquitous |
| **OmniVision OV4689** | 2688×1520 (4 MP) | color | **Rolling shutter** — 4 MP surveillance; high frame rate, HDR |
| **Sony IMX249** | 1920×1200 (2.3 MP) | both | Gen-1 Pregius; cost-effective 41 fps IMX174 sibling |
| **Sony IMX255** | 4112×2176 (8.9 MP) | both | High-speed Pregius; 93 fps at 8.9 MP |
| **Sony IMX253** | 4096×3000 (12.3 MP) | both | Classic 12 MP Pregius workhorse |
| **Sony IMX900** | 2064×1552 (3.2 MP) | both | Newer Pregius S; RGB-IR, Quad HDR, 120 fps |
| **Sony IMX547–542–541** | 5.1 / 12.4 / 16.3 / 20.4 MP | both | Pregius S standard line (BSI 2.74 µm) |
| **Sony IMX530 / IMX540** | 5328×4608 (24.5 MP) | both | Pregius S 24.5 MP — high-speed / standard |
| **GPixel GMAX series** | 9–25 MP | both | Smallest GS pixel; 4K @ 290 fps to 25 MP |
| **GPixel GSPRINT4521** | 5120×4096 (21 MP) | mono | High-speed GS: 21 MP @ 1000 fps |
| **Teledyne e2v Emerald** | 3.2 – 67 MP | both | Compact feature-rich GS up to 67 MP (8192²) |
| **ams CMOSIS CMV** | 2 / 4 / 12 / 20 MP | both | Long-standing high-speed GS (CMV12000 = 4K @ 300 fps) |
| **onsemi XGS series** | 5 / 12 / 16 / 30 MP | both | Modern high-res GS; XGS 30000 = 29.8 MP |
| **onsemi PYTHON 480 / 25K** | 0.48 / 25 MP | both | VGA to 25 MP large-format global shutter |

## How to read price (verify-first)

Prices are **USD** for relative comparison, each tagged with a **confidence**:

- **✓ Verified** — the number was fetched from the live source page during research and matched exactly: **ELP $71.72**, **Luxonis OV9782 $84.99**, **Arducam OV9281 €47.90**, **Arducam AR0234 €159**.
- **Listed** — a specific published retail price exists at a named reseller, but the page blocks automated fetch (e.g. **FLIR via B&H: $421 / $1,304**, **Arducam OG02B10 $109.99**, **Daheng €240**).
- **Est.** — approximate. **Most industrial machine-vision vendors (Basler, XIMEA, The Imaging Source, e-con, FLIR direct) are quote-only** — their pages literally say *"contact us for pricing"*, so no public number exists. Treat these as ballpark and request a quote.

**Lowest verified price:** **ELP AR0234** (~$72) — true 1080p color global shutter at 90 fps over plain USB 2.0. The **Arducam OV9281 mono** module goes as low as ~$26 (US) if you don't need color or 1080p.

## Quick picks

1. **Cheapest 1080p color** — **ELP-USBGS1200P01 (AR0234)**, ~$72, 1920×1200 @ 90 fps, USB 2.0.
2. **Cheapest GS overall** — **Arducam OV9281 mono**, ~$26–52, 1280×800, MIPI/USB. Tracking & fiducials.
3. **Best for Raspberry Pi color** — **Arducam IMX296 Color**, ~$59, 1456×1088 @ 60 fps, MIPI CSI.
4. **Industrial 1080p** — **FLIR Blackfly S BFS-U3-23S3C**, $421, 163 fps, hardware trigger.
5. **High resolution** — **FLIR BFS-U3-51S5C (IMX250)**, $1,304, 5 MP @ 75 fps.

## References

1. [Basler — CMOS Global Shutter Cameras](https://www.baslerweb.com/en-us/learning/cmos-global-shutter-cameras/) — Explains global vs. rolling shutter and Basler's GS camera lineup.
2. [Sony Semiconductor — Global Shutter Image Sensors](https://www.sony-semicon.com/en/products/is/industry/global-shutter.html) — Overview of the Pregius global-shutter sensor family (IMX174/IMX296/IMX392).
3. [e-con Systems — See3CAM_24CUG / AR0234 Full HD Color GS Camera](https://www.e-consystems.com/industrial-cameras/ar0234-usb3-global-shutter-camera.asp) — Specs for a representative full-HD color global-shutter USB camera.
4. [Teledyne FLIR — Blackfly S BFS-U3-23S3C (B&H)](https://www.bhphotovideo.com/c/product/1844617-REG/teledyne_flir_bfs_u3_23s3c_c_blackfly_s_usb3_2_3mp.html) — IMX392 industrial GS camera specs and pricing.
5. [ELP AR0234 1920×1080 90fps Global Shutter USB Camera](https://www.webcamerausb.com/elp-global-shutter-90fps-high-speed-usb-camera-color-aptina-ar0234-2mp-1920x1080-camera-module-with-no-distortion-lens-85dergee-p-462.html) — Low-cost color GS board, confirmed pricing.
6. [Arducam IMX296 Color Global Shutter Camera for Raspberry Pi](https://www.arducam.com/1-58mp-imx296-color-global-shutter-camera-module-with-m12-lens-for-raspberry-pi.html) — Embedded MIPI module spec sheet.
7. [Arducam OG02B10 2 MP Color Global Shutter Module (UCTronics)](https://www.uctronics.com/arducam-2mp-global-shutter-og02b10-color-camera-modules-pivariety.html) — OmniVision OG02B10 specs, resolution modes, and pricing.
8. [e-con Systems UC20MPA (OG02B10) — Spinel listing](https://www.spinelelectronics.com/product/uc20mpa/) — Active OG02B10 USB 2.0 color GS camera, 1600×1200 @ 60 fps.
9. [Daheng MER2-160-227U3C — Sony IMX273 Color (get-cameras)](https://www.get-cameras.com/USB3.0-Camera-1.6MP-Color-Sony-IMX273-MER2-160-227U3C) — IMX273 1440×1080 @ 227 fps industrial USB3 camera.
10. [OmniVision OV9782 — DepthAI / Luxonis](https://docs.luxonis.com/projects/hardware/en/latest/pages/articles/sensors/ov9782.html) — Sub-1080p color GS sensor noted for context.
