---
title: "Debugging and Probes"
created: 2026-03-08
updated: 2026-03-08
tags: [debugging, probes, coresight, dap, embedded]
status: draft
sources:
  - url: "https://developer.arm.com/-/media/Arm%20Developer%20Community/Images/Tutorial%20Guide%20Diagrams%20and%20Screenshots/Arm%20Development%20Studio/Understanding%20the%20CoreSight%20DAP/Understanding_the_CoreSight_DAP.pdf"
    title: "Understanding the CoreSight DAP - ARM Developer"
  - url: "https://www.allaboutcircuits.com/technical-articles/jtag-implementation-arm-core-devices/"
    title: "JTAG Implementation in ARM Core Devices"
  - url: "https://arm-software.github.io/CMSIS_5/DAP/html/index.html"
    title: "Firmware for CoreSight Debug Access Port - CMSIS-DAP"
  - url: "https://ignitarium.com/a-complete-guide-to-soc-debugging-part-3/"
    title: "A Complete Guide to SoC Debugging Part 3"
---

Debugging embedded systems is fundamentally different from debugging desktop applications. You cannot just attach a process debugger -- you need specialized hardware and protocols to peek inside a running microcontroller. This page introduces the ARM CoreSight debug architecture and explains why `printf` alone will not cut it.

## Why Printf-Debugging Is Insufficient

On a desktop, sprinkling `printf` statements through your code is a reasonable first step. On an MCU, it falls apart:

- **No stdout** -- there is no terminal connected by default. You need a UART, USB, or debug probe to see output.
- **Timing disruption** -- printing over UART at 115200 baud takes milliseconds per line. This changes the timing of your code and can mask or introduce bugs, especially in interrupt-driven or real-time systems.
- **Crashes are silent** -- if the MCU hits a HardFault, it will not print anything helpful. It just stops.
- **No register visibility** -- you cannot inspect CPU registers, peripheral registers, or memory contents with printf.
- **Limited breakpoints** -- you cannot pause execution at a specific line and inspect state.

A proper debug setup gives you all of this: breakpoints, watchpoints, register inspection, memory reads, and step-by-step execution.

## The CoreSight Debug Architecture

ARM designed a standardized debug infrastructure called [**CoreSight**](https://developer.arm.com/-/media/Arm%20Developer%20Community/Images/Tutorial%20Guide%20Diagrams%20and%20Screenshots/Arm%20Development%20Studio/Understanding%20the%20CoreSight%20DAP/Understanding_the_CoreSight_DAP.pdf) that is implemented across all Cortex-M devices. It provides a consistent way for external tools to access the internals of any ARM-based MCU, regardless of the silicon vendor.

### Key Components

```
External Debugger (PC)
       |
   Debug Probe (ST-Link, J-Link, etc.)
       |
   Debug Port (DP)  -- physical interface (JTAG or SWD)
       |
   Access Port (AP) -- bridge to internal buses
       |
   +-----------+-----------+
   |           |           |
  CPU       Debug       Trace
 Regs    Components   Components
```

### Debug Port (DP)

The Debug Port handles the physical connection between the debug probe and the chip. There are three variants:

| DP Type | Protocols Supported |
|---------|-------------------|
| **SWJ-DP** | Both SWD and JTAG (most common) |
| **SW-DP** | SWD only |
| **JTAG-DP** | JTAG only |

Most modern Cortex-M chips use SWJ-DP, which lets you choose either protocol.

### Access Ports (AP)

An Access Port connects the Debug Port to internal system buses. A single DP can support up to 256 APs (in ADIv5). Common types:

- **AHB-AP** -- connects to the AHB bus, giving access to all memory-mapped resources (flash, SRAM, peripheral registers). This is the most important AP for debugging.
- **APB-AP** -- connects to the APB bus for debug component registers.
- **JTAG-AP** -- bridges to legacy (pre-CoreSight) debug interfaces.

### Debug Access Port (DAP)

The combination of one DP and one or more APs is called a **DAP** (Debug Access Port). It is the complete debug interface of the chip.

Through the DAP, an external debugger can:

- Read and write any memory address (including peripheral registers)
- Halt and resume the CPU
- Set hardware breakpoints and watchpoints
- Read CPU registers (R0-R15, PSR, etc.)
- Access trace data

## What You Need to Debug

A minimal debug setup requires three things:

1. **A debug probe** -- hardware that speaks JTAG or SWD (e.g., ST-Link, J-Link, CMSIS-DAP)
2. **Debug software** -- a bridge like OpenOCD that translates high-level commands into DAP transactions
3. **A debugger** -- GDB or an IDE that provides the user interface

## Child Pages

- [JTAG and SWD](jtag-and-swd.md) -- the transport protocols that connect your probe to the chip
- [OpenOCD and GDB](openocd-and-gdb.md) -- the open-source debug toolchain
- [Semihosting and Printf](semihosting-and-printf.md) -- getting text output without a dedicated UART
- [Fault Debugging Techniques](fault-debugging-techniques.md) -- diagnosing HardFaults and other crashes

## References

1. [Understanding the CoreSight DAP - ARM Developer](https://developer.arm.com/-/media/Arm%20Developer%20Community/Images/Tutorial%20Guide%20Diagrams%20and%20Screenshots/Arm%20Development%20Studio/Understanding%20the%20CoreSight%20DAP/Understanding_the_CoreSight_DAP.pdf) — ARM's official guide to CoreSight debug architecture
2. [JTAG Implementation in ARM Core Devices](https://www.allaboutcircuits.com/technical-articles/jtag-implementation-arm-core-devices/) — Detailed walkthrough of JTAG on ARM targets
3. [Firmware for CoreSight Debug Access Port - CMSIS-DAP](https://arm-software.github.io/CMSIS_5/DAP/html/index.html) — Open-source debug probe firmware specification
4. [A Complete Guide to SoC Debugging Part 3](https://ignitarium.com/a-complete-guide-to-soc-debugging-part-3/) — SoC debug concepts and debug port internals

## Related Topics

- [Interrupt Handling](../../mcu-architecture-fundamentals/interrupts-and-nvic.md) -- understanding the NVIC and exception model
- [Memory Map](../../mcu-architecture-fundamentals/memory-map-and-bus.md) -- how the address space is organized
