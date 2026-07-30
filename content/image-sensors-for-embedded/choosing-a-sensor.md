---
title: "How to Choose a Sensor"
created: 2026-04-24
updated: 2026-04-24
tags: [camera, image-sensor, selection, embedded]
status: draft
sources:
  - url: "https://www.raspberrypi.com/documentation/accessories/camera.html"
    title: "Raspberry Pi — Camera documentation"
  - url: "https://blog.arducam.com/official-raspberry-pi-cameras/"
    title: "Arducam — Best Native Raspberry Pi Cameras"
---

# How to Choose a Sensor

A decision checklist that takes you from "I want a camera" to a specific module.

## 1. What does your SoC support?

Driver support is the real constraint. A beautiful sensor without a mainline or vendor driver for your SoC takes weeks of porting.

| Platform | Best-supported sensors |
|---|---|
| Raspberry Pi (all models) | OV5647, IMX219, IMX477, IMX708, IMX296, IMX500 |
| Rockchip RV1106 / RV1106G3 (Luckfox Pico) | **In-kernel drivers:** SC3336, SC4336, SC530AI, OV5647, MIS5001. **Best pick for 5MP@30fps: SC530AI.** |
| Rockchip RK3566 / 3568 / 3588 | Broad: Sony IMX, OmniVision, SmartSens |
| NVIDIA Jetson | IMX219, IMX477 official; many via Arducam |
| ESP32-CAM / ESP32-P4 | OV2640, OV5640, OV2710 |
| STM32MP1 | OV5640, others with DCMI/CSI port |

**Rule:** before falling in love with a sensor, search `<sensor name> linux driver <your SoC>`. If you get nothing, expect pain.

## 2. What's your resolution-vs-fps target?

Write it in one sentence: "I need **X × Y at Z fps**, and I can tolerate cropping/binning to achieve it."

Then check the **sensor's mode table**, not its marketing headline. Sensors expose multiple modes:

- Full-resolution mode (usually slowest).
- Binned mode (half resolution, 4× faster).
- Cropped mode (smaller FOV, potentially fastest).

Example for IMX219:

| Mode | Resolution | fps |
|---|---|---|
| Full | 3280×2464 | 21 |
| Binned 2×2 | 1640×1232 | 60 |
| Crop | 1280×720 | 60 |

If you asked for "8 MP at 60 fps" — you can't have it on IMX219.

## 3. How many MIPI lanes does your host give the camera port?

2 lanes vs 4 lanes can halve your max fps at high res. Check the SoC TRM or the dev board schematic.

## 4. What's the light environment?

- **Outdoors / daylight only:** any modern sensor works.
- **Indoors / office lighting:** BSI sensor required. OV5647 (FSI) will be noisy.
- **Low light / dusk / indoor evening:** Sony Starvis-class (IMX415, IMX462, IMX662), or at least a larger optical format (1/2.3" or bigger).
- **IR / night-vision:** look for "NoIR" modules (no IR-cut filter) or dedicated NIR-sensitive sensors (IMX462, IMX585).

## 5. Rolling or global shutter?

Rolling shutter is fine for:
- Static scenes, slow motion, surveillance, photography.

Global shutter is **required** for:
- Drones / robotics / moving cameras.
- Machine vision (QR, barcode, industrial inspection).
- Anything where the subject moves faster than ~10% of the frame per frame duration.
- Structured light / stereo depth / VSLAM.

## 6. Do you need color?

Monochrome variants of some CV sensors (OV9281-MONO, IMX296-MONO) collect ~2× more light and give better SNR. Good for SLAM, feature detection, industrial CV — useless if you need to see what color something is.

## 7. Lens and focus

- **Fixed focus:** cheap, fine for fixed distances (document scanner, always-on camera).
- **Autofocus (VCM):** IMX708, IMX519, OV5640-AF, IMX700. Needs I²C control of the VCM from your driver.
- **C/CS-mount:** IMX477 HQ Cam lets you swap real lenses. Expensive but flexible.
- **M12 (S-mount):** standard for small modules. Many 3rd-party lens options.

## 8. Module vs bare sensor

Unless you're designing the FPC and optics yourself, **buy a module**. A bare sensor needs:

- Power rails (usually 2.8 V, 1.8 V, 1.2 V — sometimes three separate ones).
- Crystal or external clock.
- Lens + lens holder + IR-cut filter.
- FPC / connector matching your host.

Modules are often cheaper than what you can build at quantity 1.

## 9. Decision in one minute

```
Fixed-focus 1080p30, cheap, for a hobby project?
  → GC2053 / SC2336 module

Good all-rounder, well-supported?
  → IMX219 (RPi v2 module)

Best image quality / HDR / autofocus in the RPi ecosystem?
  → IMX708 (RPi v3 module)

Biggest sensor / swappable lens / low-light?
  → IMX477 (RPi HQ Cam)

Motion / robotics / CV?
  → OV9281 or AR0234 (global shutter)

Luckfox / RV1106 Rockchip ecosystem, want 5MP@30?
  → SC530AI

Night / outdoor security?
  → IMX415 or IMX462
```

## References

1. [Raspberry Pi — Camera documentation](https://www.raspberrypi.com/documentation/accessories/camera.html) — Canonical mode tables for RPi-supported sensors.
2. [Arducam — Best Native Raspberry Pi Cameras](https://blog.arducam.com/official-raspberry-pi-cameras/) — Use-case guidance.
3. [ThinkRobotics — Raspberry Pi Camera Module Comparison](https://thinkrobotics.com/blogs/learn/raspberry-pi-camera-module-comparison-complete-2025-guide) — Side-by-side comparison.
