---
title: "JTAG and SWD"
created: 2026-03-08
updated: 2026-03-08
tags: [jtag, swd, debugging, probes, embedded]
status: draft
sources:
  - url: "https://www.allaboutcircuits.com/technical-articles/jtag-implementation-arm-core-devices/"
    title: "JTAG Implementation in ARM Core Devices"
  - url: "https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Low_Pin-Count_Debug_Interfaces_for_Multi-device_Systems.pdf"
    title: "Low Pin-Count Debug Interfaces for Multi-device Systems - ARM"
  - url: "https://qcentlabs.com/posts/swd_banger/"
    title: "Making my own Programmer/Debugger using ARM SWD"
  - url: "https://arm-software.github.io/CMSIS_5/DAP/html/index.html"
    title: "CMSIS-DAP Firmware"
---

JTAG and SWD are the two physical protocols used to connect a debug probe to a microcontroller. Both allow you to halt the CPU, set breakpoints, read memory, and flash firmware. They differ in pin count, speed, and capability.

## JTAG (Joint Test Action Group)

[JTAG](https://www.allaboutcircuits.com/technical-articles/jtag-implementation-arm-core-devices/) is an industry standard defined by IEEE 1149.1. It was originally designed for board-level testing (boundary scan) but became the dominant debug interface for processors.

### JTAG Signals

JTAG uses four mandatory signals plus an optional reset:

| Signal | Direction | Purpose |
|--------|-----------|---------|
| **TCK** | Probe -> Target | Test Clock -- clocks all JTAG operations |
| **TMS** | Probe -> Target | Test Mode Select -- controls the TAP state machine |
| **TDI** | Probe -> Target | Test Data In -- serial data into the target |
| **TDO** | Target -> Probe | Test Data Out -- serial data from the target |
| **nTRST** | Probe -> Target | Test Reset (optional) -- resets the TAP controller |

### How JTAG Works

JTAG operates through a state machine called the **TAP (Test Access Port) controller**. The debugger navigates this state machine by toggling TMS on each TCK edge:

```
         TMS=1
  +--> Test-Logic-Reset
  |         |  TMS=0
  |    Run-Test/Idle
  |         |  TMS=1
  |    Select-DR-Scan ----TMS=1----> Select-IR-Scan
  |         |  TMS=0                      |  TMS=0
  |    Capture-DR                    Capture-IR
  |         |                              |
  |    Shift-DR  <-- data bits -->   Shift-IR
  |         |                              |
  |    Update-DR                     Update-IR
  +---  (back to idle)
```

Data is shifted in through TDI and out through TDO one bit at a time while in the Shift-DR or Shift-IR states.

### JTAG Daisy-Chaining

A powerful feature of JTAG is **daisy-chaining**: multiple devices on a board can share the same TCK and TMS lines, with TDO of one device connected to TDI of the next. This lets a single debug probe access every chip on the board.

## SWD (Serial Wire Debug)

[ARM developed SWD](https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Low_Pin-Count_Debug_Interfaces_for_Multi-device_Systems.pdf) as a 2-pin alternative to JTAG, specifically for Cortex-M devices. It provides the same debug capability with fewer pins.

### SWD Signals

| Signal | Direction | Purpose |
|--------|-----------|---------|
| **SWDIO** | Bidirectional | Serial Wire Data -- carries commands and data |
| **SWCLK** | Probe -> Target | Serial Wire Clock -- clocks all operations |

SWDIO is bidirectional: the probe drives it when sending commands, and the target drives it when responding. A turnaround period separates the direction changes.

### SWD Protocol

SWD uses a packet-based protocol with three phases:

1. **Request** (8 bits) -- the probe sends: start bit, APnDP (access port or debug port), RnW (read or write), address bits, parity, stop, park
2. **Acknowledge** (3 bits) -- the target responds: OK, WAIT, or FAULT
3. **Data** (33 bits) -- 32 data bits + 1 parity bit, driven by either side depending on RnW

```
Host sends:         Target responds:    Data phase:
[Start|AP|RW|A2|A3|Par|Stop|Park]  [ACK]  [32-bit data + parity]
```

### SWO (Serial Wire Output)

SWD can optionally use a third pin, **SWO**, for trace output. SWO carries ITM (Instrumentation Trace Macrocell) data from the target to the probe, enabling `printf`-style output and event tracing without consuming a UART. See [Semihosting and Printf](semihosting-and-printf.md) for details.

## JTAG vs SWD Comparison

| Feature | JTAG | SWD |
|---------|------|-----|
| Pins required | 4 (+ optional reset) | 2 (+ optional SWO) |
| Daisy-chain support | Yes | No |
| ARM Cortex-M support | Yes | Yes |
| Non-ARM device support | Yes | No (ARM only) |
| Trace output | Separate trace port | SWO pin |
| Speed | Typically up to 20 MHz | Typically up to 50 MHz |
| Boundary scan | Yes | No |

**Rule of thumb**: Use SWD for single-chip ARM Cortex-M projects (fewer wires, simpler). Use JTAG when you need daisy-chaining, boundary scan, or are debugging non-ARM devices.

## Common Debug Probes

### ST-Link

- Bundled with STM32 Nucleo and Discovery boards
- Supports SWD and JTAG (V2 and V3)
- V3 adds high-speed SWD and virtual COM port
- Price: free (on dev boards) or ~$25 standalone
- Works with OpenOCD, STM32CubeIDE, pyOCD

### SEGGER J-Link

- Industry standard, supports nearly all ARM devices
- Very fast flash programming
- J-Link EDU available for ~$20 (non-commercial use)
- Proprietary software with GDB server
- Supports SEGGER RTT for real-time output

### CMSIS-DAP

- ARM's [open-source debug probe firmware](https://arm-software.github.io/CMSIS_5/DAP/html/index.html) specification
- Runs on various hardware (e.g., DAPLink on mbed boards)
- Compatible with OpenOCD, pyOCD, and many IDEs
- Typically slower than J-Link but fully open

### Black Magic Probe

- Open-source probe that runs GDB server on the probe itself
- No need for OpenOCD -- connect GDB directly via USB serial
- Built on STM32F103

## Connector Pinouts

Most probes use the standard ARM debug connectors:

**10-pin Cortex Debug Connector (1.27mm)**:
```
Pin 1: VTref    Pin 2: SWDIO/TMS
Pin 3: GND      Pin 4: SWCLK/TCK
Pin 5: GND      Pin 6: SWO/TDO
Pin 7: (key)    Pin 8: TDI
Pin 9: GND      Pin 10: nRESET
```

**20-pin ARM Standard JTAG (2.54mm)**: Older, larger connector found on many development boards. Carries the same signals with additional GND pins.

## References

1. [JTAG Implementation in ARM Core Devices](https://www.allaboutcircuits.com/technical-articles/jtag-implementation-arm-core-devices/) — Comprehensive overview of JTAG protocol on ARM
2. [Low Pin-Count Debug Interfaces for Multi-device Systems - ARM](https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Low_Pin-Count_Debug_Interfaces_for_Multi-device_Systems.pdf) — ARM whitepaper on SWD and low-pin debug
3. [Making my own Programmer/Debugger using ARM SWD](https://qcentlabs.com/posts/swd_banger/) — Hands-on SWD protocol implementation walkthrough
4. [CMSIS-DAP Firmware](https://arm-software.github.io/CMSIS_5/DAP/html/index.html) — ARM's open-source debug probe firmware reference

## Related Topics

- [OpenOCD and GDB](openocd-and-gdb.md) -- using these protocols with open-source tools
- [Debugging Overview](index.md) -- CoreSight architecture and the DAP
