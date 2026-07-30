---
title: "Image Sensors for Embedded"
created: 2026-04-24
updated: 2026-04-24
tags: [camera, image-sensor, mipi, embedded]
status: draft
sources:
  - url: "https://www.raspberrypi.com/documentation/accessories/camera.html"
    title: "Raspberry Pi — Camera documentation"
  - url: "https://thinkrobotics.com/blogs/learn/raspberry-pi-camera-module-comparison-complete-2025-guide"
    title: "ThinkRobotics — RPi camera comparison guide"
---

# Image Sensors for Embedded

Picking a camera sensor for an embedded project is mostly about matching **three constraints** at once:

1. **Resolution × frame rate** — what "high-res at 30 fps" actually means in the datasheet.
2. **Interface** — DVP, MIPI CSI-2, USB, GMSL — and how many lanes your SoC has.
3. **Driver support** — a sensor without a Linux/BSP driver for your SoC is unusable.

Miss any one of these and the sensor is the wrong choice regardless of the others.

## Common trap: "max fps" is almost never at max resolution

Most sensors advertise their top megapixel count and their top fps in **separate** modes. A 12 MP sensor that "does 120 fps" usually does 120 fps at 1080p, not at 12 MP. Always look at the sensor's mode table — resolution, fps, and the required MIPI lane count come as a set.

## Subtopics

1. [Sensor Basics](sensor-basics.md) — optical format, pixel size, rolling vs global shutter, BSI, HDR.
2. [Interfaces](interfaces.md) — DVP, MIPI CSI-2 lane counts, bandwidth math.
3. [Sensor Comparison by Price](sensor-comparison.md) — price-sorted table of sensors that hit ≥30 fps at high resolution.
4. [How to Choose a Sensor](choosing-a-sensor.md) — decision checklist.
5. [STM32 Hosts for Dual Cameras + Secure Boot](stm32-hosts-for-cameras.md) — STM32 parts that can run two 1080p30 sensors with TrustZone and ROM secure boot.

## References

1. [Raspberry Pi — Camera documentation](https://www.raspberrypi.com/documentation/accessories/camera.html) — Canonical specs for OV5647, IMX219, IMX477, IMX708, IMX296.
2. [Arducam — Official Raspberry Pi Cameras](https://blog.arducam.com/official-raspberry-pi-cameras/) — Module-level comparisons and use cases.
3. [ThinkRobotics — Raspberry Pi Camera Module Comparison](https://thinkrobotics.com/blogs/learn/raspberry-pi-camera-module-comparison-complete-2025-guide) — Resolution and fps specs across all modules.
