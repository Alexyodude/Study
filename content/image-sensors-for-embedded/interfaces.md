---
title: "Sensor Interfaces (DVP, MIPI CSI-2)"
created: 2026-04-24
updated: 2026-04-24
tags: [camera, image-sensor, mipi, dvp, interfaces]
status: draft
sources:
  - url: "https://www.raspberrypi.com/documentation/accessories/camera.html"
    title: "Raspberry Pi — Camera documentation"
  - url: "https://www.arducam.com/docs/cameras-for-raspberry-pi/"
    title: "Arducam — Raspberry Pi camera docs"
---

# Sensor Interfaces (DVP, MIPI CSI-2)

How the sensor hands pixels to the SoC. The interface caps your maximum **bandwidth**, which caps your **resolution × frame rate × bit-depth** product.

## DVP / Parallel (legacy)

- 8–12 parallel data lines + HSYNC, VSYNC, PCLK.
- Max ~**50–80 MHz pixel clock** in practice → ~1080p30 or 720p60 ceiling.
- Lots of PCB pins, sensitive to clock skew and crosstalk.
- Still used on very cheap MCU-class platforms (ESP32-CAM, some STM32s).

Sensors that often expose DVP: OV2640, OV5640, OV5647 (supports both), GC0308.

**Verdict:** don't choose this unless your SoC has no other option.

## MIPI CSI-2 (modern standard)

The ubiquitous serial interface. **Differential pairs** at high speed.

- Lanes: 1, 2, or 4 data lanes + 1 clock pair. More lanes = more bandwidth.
- Typical speeds: **1 Gbps/lane** (cheap SoCs) to **2.5 Gbps/lane** (modern).
- Encoding: 8b/10b-ish, serial, clocked by the sensor.

### Rough bandwidth math

```
Bandwidth (Mbps) = pixels/frame × fps × bit_depth × overhead
```

Example: 12 MP (4056×3040) at 30 fps, 10-bit Bayer:
```
4056 × 3040 × 30 × 10 × 1.2 ≈ 4.44 Gbps
```
→ Needs **2 lanes at 2.2 Gbps** or **4 lanes at 1.1 Gbps**. That's why IMX477 at full speed wants a 4-lane host or runs slower on 2-lane.

### Lane counts on common SoCs

| Platform | CSI-2 lanes available |
|---|---|
| Raspberry Pi Zero / 3 / 4 | 2 lanes (×1 port) |
| Raspberry Pi 5 | 2×2 lanes (two ports) |
| Raspberry Pi CM4 | 2 + 4 lanes |
| Rockchip RV1106 (Luckfox Pico) | 2 lanes |
| Rockchip RK3566 / RK3588 | 2 or 4 lanes per port |
| NVIDIA Jetson Nano | 2 lanes (×2 ports) |
| NVIDIA Jetson Orin Nano | 2 or 4 lanes (×4 ports) |
| ESP32-P4 | 2 lanes |

### Common pitfalls

- **"2-lane sensor" vs "4-lane sensor":** some sensors support both, but the datasheet's top fps is usually the 4-lane number. Using them on 2 lanes silently caps fps.
- **Trace length matching:** CSI-2 is a transmission line. Match all pairs to within ~100 mils (2.5 mm) and keep the differential impedance (85–100 Ω) controlled. Stereo-pair rules apply to each lane.
- **Clock lane must be continuous:** not every sensor runs in "continuous clock mode" — check the BSP driver.

## USB / USB Video Class (UVC)

- Great for prototyping: plug-and-play, no BSP work.
- Bandwidth ceiling: ~350 MB/s on USB 3.0 → 4K60 possible but compressed.
- Usually **MJPEG or H.264** inside — adds latency, reduces quality.
- Bad for low-level / real-time CV. Good for "I just need a webcam."

## GMSL / FPD-Link (automotive)

- Coax-cable SerDes: lets you put the camera 10+ meters from the SoC.
- Automotive (ADAS, robotics). Not relevant for hobbyist boards.

## Quick decision guide

| Your goal | Interface |
|---|---|
| Cheapest sensor on MCU | DVP |
| Embedded Linux board, ≤12 MP | MIPI CSI-2, 2 lanes |
| Embedded Linux, 4K / 60 fps | MIPI CSI-2, 4 lanes |
| PC prototyping, no BSP work | USB UVC |
| Camera > 1 m from host | GMSL |

## References

1. [Raspberry Pi — Camera documentation](https://www.raspberrypi.com/documentation/accessories/camera.html) — CSI lane counts on each RPi model.
2. [Arducam — Raspberry Pi camera docs](https://www.arducam.com/docs/cameras-for-raspberry-pi/) — Practical MIPI lane and sensor compatibility.
3. [Arducam — 12MP IMX708 wiki](https://docs.arducam.com/Raspberry-Pi-Camera/Native-camera/12MP-IMX708/) — Lane count vs fps example.
