---
title: "Sensor Basics (Format, Pixel, Shutter)"
created: 2026-04-24
updated: 2026-04-24
tags: [camera, image-sensor, optics]
status: draft
sources:
  - url: "https://commonlands.com/pages/image-sensors/imx708"
    title: "Commonlands — Sony IMX708 overview"
  - url: "https://www.raspberrypi.com/documentation/accessories/camera.html"
    title: "Raspberry Pi — Camera documentation"
---

# Sensor Basics (Format, Pixel, Shutter)

A handful of parameters on a sensor datasheet determine most of the image quality decisions.

## Optical format

Size of the sensing area, by convention given in "inches" (a legacy from old vidicon tubes — the number **isn't** the actual diagonal).

| Format | Diagonal (real) | Typical use |
|---|---|---|
| 1/4" | ~4 mm | Cheap phone / IoT cameras (OV5647, MIS5001) |
| 1/3" | ~6 mm | Better IoT, dashcams |
| 1/2.8" | ~6.5 mm | Security cameras (IMX415) |
| 1/2.3" | ~7.9 mm | Raspberry Pi HQ Cam (IMX477) |
| 1/1.8" | ~9 mm | High-end IP cams |
| 1" | ~16 mm | Prosumer |

**Bigger = more light per pixel = better low-light, better dynamic range.** Also needs a bigger lens.

## Pixel size

Measured in µm (micrometers). Bigger pixels = more photons per pixel = less noise.

- 1.12 µm — tiny, phone sensors, noisy in low light.
- 1.4 µm — typical cheap sensor (OV5647).
- 1.55–1.8 µm — mid-range.
- **2.0–3.0 µm** — low-light-optimized (Sony Starvis family).
- 3.45+ µm — industrial / global shutter (IMX296).

## Front-illuminated (FSI) vs back-illuminated (BSI)

- **FSI** (older): wiring is on top of the photodiodes, blocking light.
- **BSI** (modern): wiring is moved to the back; more light reaches the photodiode → usually **+1 stop** of low-light performance.

Almost all modern sensors (IMX219, IMX477, IMX708, Starvis line) are BSI. OV5647 is FSI — part of why it's poor in low light.

## Rolling vs global shutter

- **Rolling shutter:** each row is read sequentially. Fast-moving objects get skewed ("jello" effect). Almost all consumer sensors.
- **Global shutter:** every pixel is captured at the same instant. No skew. Needed for:
  - Robotics / drones
  - Machine vision, QR / barcode scanning
  - Fast-moving subjects
  - **Stereo depth / structured light**

Global shutter sensors are much more expensive and usually much lower resolution (OV9281 = 1 MP, IMX296 = 1.6 MP, AR0234 = 2.3 MP).

## HDR

Some sensors (IMX708, IMX585, IMX662) support **staggered HDR** or **DOL-HDR** — they expose multiple sub-frames at different exposures and merge in the ISP. Useful for high-contrast scenes (car cameras, outdoor surveillance).

## Bayer pattern vs mono

Color sensors use a **Bayer filter** (RGGB typically). A "mono" or "monochrome" variant exists for some machine-vision sensors — it has no color filter, collects ~2× more light, and is common for CV where color isn't needed (OV9281-MONO).

## Automatic functions (AE / AWB / AF)

- **AEC/AGC** — auto exposure / gain — usually built into the sensor.
- **AWB** — auto white balance — can be in the sensor or the host ISP.
- **AF** — autofocus — requires a voice-coil lens module; only some sensor modules support it (IMX708, IMX519, OV5640 AF version).

## References

1. [Commonlands — Sony IMX708 overview](https://commonlands.com/pages/image-sensors/imx708) — BSI, HDR, PDAF details.
2. [Raspberry Pi — Camera documentation](https://www.raspberrypi.com/documentation/accessories/camera.html) — Pixel size and format for RPi sensor line.
3. [Arducam — Official Raspberry Pi Cameras](https://blog.arducam.com/official-raspberry-pi-cameras/) — Practical FSI vs BSI comparison across RPi modules.
