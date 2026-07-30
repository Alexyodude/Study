---
title: "Sensor Comparison by Price"
created: 2026-04-24
updated: 2026-04-24
tags: [camera, image-sensor, comparison, mipi]
status: draft
sources:
  - url: "https://www.raspberrypi.com/documentation/accessories/camera.html"
    title: "Raspberry Pi — Camera documentation"
  - url: "https://thinkrobotics.com/blogs/learn/raspberry-pi-camera-module-comparison-complete-2025-guide"
    title: "ThinkRobotics — RPi camera comparison"
  - url: "https://commonlands.com/pages/image-sensors/imx708"
    title: "Commonlands — IMX708"
  - url: "https://docs.arducam.com/Nvidia-Jetson-Camera/Jetvariety-Camera/OV9281/"
    title: "Arducam — OV9281 wiki"
---

# Sensor Comparison by Price

Price-sorted comparison of camera sensors that can sustain **≥ 30 fps at a useful high resolution**. Module prices include a lens; the sensor IC alone is cheaper.

> **Important:** a sensor's advertised "max fps" is almost never at full resolution. Check the mode table on the datasheet. See the notes on [interfaces](interfaces.md) for why.

## Budget tier (~$5–$20 modules)

| Sensor | Full res | Full-res fps | 1080p fps | Format | Interface | Notes |
|---|---|---|---|---|---|---|
| **OV5647** | 5 MP | 15 | 30 | 1/4" | MIPI 2-lane / DVP | RPi Cam v1 (2013). Fixed focus. FSI (weak low light). |
| **OV5640** | 5 MP | 15 | 30 | 1/4" | MIPI 2-lane / DVP | Autofocus variant exists. Better color than OV5647. |
| **MIS5001** | 5 MP | **25** | 30 | 1/2.8" | MIPI 2-lane | SmartSens. **Caps at 25 fps**—fails strict 30 fps at full res. |
| **GC2053** | 2 MP (1080p) | **60** | 60 | 1/2.9" | MIPI 2-lane | Common in $5 IP cams. No higher resolution. |
| **SC2336** | 2 MP (1080p) | **60** | 60 | 1/3" | MIPI 2-lane | SmartSens. Decent low light for the price. |

**Best in tier if 1080p is enough:** GC2053 / SC2336 — real 60 fps.
**Best in tier if 5MP is required:** OV5640 with autofocus; accept the 30 fps @ 1080p limit.

## Mid tier (~$20–$40 modules)

| Sensor | Full res | Full-res fps | Useful mode | Format | Interface | Notes |
|---|---|---|---|---|---|---|
| **IMX219** | 8 MP (3280×2464) | 21 | 1640×1232 @ 60, 1080p @ 30 | 1/4" | MIPI 2-lane | RPi Cam v2. BSI. Huge driver support. |
| **IMX708** | 12 MP (4608×2592) | 14 | 2304×1296 @ 56, 1080p @ 50 | 1/2.43" | MIPI 2-lane | RPi Cam v3. PDAF **autofocus**, **HDR**. |
| **SC530AI** | 5 MP | 30 | 5 MP @ 30 | 1/2.8" | MIPI 2-lane | SmartSens AI line. True 5MP@30fps. Rockchip/Ingenic BSPs mainly. |
| **OS08A10** | 8 MP | 30 | 4K @ 30 | 1/1.8" | MIPI 4-lane | OmniVision 4K. Needs 4-lane host. |

**Best value upgrade from OV5647/MIS5001 on Luckfox/Rockchip:** SC530AI.
**Best value in the Pi ecosystem:** IMX219 for well-behaved, IMX708 for flagship features.

## High tier (~$50–$80 modules)

| Sensor | Full res | Full-res fps | Useful mode | Format | Interface | Notes |
|---|---|---|---|---|---|---|
| **IMX477** | 12 MP (4056×3040) | 40 (4-lane) / ~30 (2-lane) | 1080p @ 120 | 1/2.3" | MIPI 2 or 4-lane | RPi HQ Cam. C-mount optional. Best low-light under $100. |
| **OV9281** | 1 MP mono (1280×800) | **120 global shutter** | 720p @ 120 | 1/4" | MIPI 2-lane | **Machine vision.** Mono option. Ideal for CV / stereo / fast motion. |
| **AR0234** | 2.3 MP (1920×1200) | **120 global shutter** | 1080p @ 120 GS | 1/2.6" | MIPI 4-lane | Color global shutter. Robotics / drones. |
| **IMX296** | 1.6 MP (1440×1080) | **60 global shutter** | Full @ 60 | 1/2.9" | MIPI 2-lane | Industrial Sony GS. Pi Global Shutter Camera. |

**Best for robotics / stereo / motion:** OV9281 or AR0234.
**Best image quality under $100:** IMX477.

## Premium tier ($80–$200+ modules)

| Sensor | Full res | Full-res fps | Notes |
|---|---|---|---|
| **IMX415** | 4K (3864×2192) | 30 | Sony Starvis 2. Security-camera flagship. Excellent low light. |
| **IMX585** | 4K | 60 | Starvis 2, HDR. High dynamic range. |
| **IMX662** | 2 MP low-light | 60 HDR | Near-IR strong. Used in dashcams. |
| **IMX519** | 16 MP (4656×3496) | 15 full / 30 binned | Arducam's autofocus flagship. |
| **IMX900 / IMX565** | 2.4–4 MP GS | 60–120 | Industrial global shutter. $200+. |

## Column reference

- **Full res / Full-res fps:** the sensor's top resolution and the fps it can sustain at that resolution. This is almost always lower than the "max fps" advertised in marketing.
- **Useful mode:** a binned or cropped mode with a practical fps — what you'd probably actually use.
- **Format:** optical format (larger is better for low light).
- **Interface:** MIPI lane count required to hit the full-res fps.

## If you want ≥ 30 fps at 5 MP (your original ask)

Ruled out: OV5647 (15 fps), MIS5001 (25 fps).

Best candidates in rough price order:

1. **SC530AI** (~$20) — 5 MP @ 30 fps native. Rockchip/SmartSens ecosystem only.
2. **IMX219** (~$15–$25) — use binned 1640×1232 @ 60 fps if "5 MP" isn't strict, or accept 1080p @ 30.
3. **IMX708** (~$25–$35) — 2304×1296 @ 56 fps, 1080p @ 50 — 5 MP-class resolution above 30 fps.
4. **IMX477** (~$50) — for real low-light quality; 1080p @ 120 or 12 MP @ 40 with 4-lane host.

See [How to Choose a Sensor](choosing-a-sensor.md) for the full decision checklist.

## References

1. [Raspberry Pi — Camera documentation](https://www.raspberrypi.com/documentation/accessories/camera.html) — Official specs for RPi Cam v1 / v2 / v3 / HQ / GS.
2. [ThinkRobotics — RPi camera comparison](https://thinkrobotics.com/blogs/learn/raspberry-pi-camera-module-comparison-complete-2025-guide) — Side-by-side resolution and fps.
3. [Commonlands — Sony IMX708](https://commonlands.com/pages/image-sensors/imx708) — Full IMX708 specs and modes.
4. [Arducam — OV9281 wiki](https://docs.arducam.com/Nvidia-Jetson-Camera/Jetvariety-Camera/OV9281/) — Global-shutter sensor details.
5. [GoPhotonics — SC2336](https://www.gophotonics.com/products/cmos-image-sensors/smartsens-technology/21-1025-sc2336) — SmartSens SC2336 datasheet summary.
