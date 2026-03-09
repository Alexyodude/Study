---
title: "Bare-Metal Programming"
created: 2026-03-08
updated: 2026-03-08
tags: [bare-metal, embedded, arm, cortex-m, stm32]
status: draft
sources:
  - url: "https://github.com/cpq/bare-metal-programming-guide"
    title: "Bare Metal Programming Guide (GitHub)"
  - url: "https://vivonomicon.com/2018/04/02/bare-metal-stm32-programming-part-1-hello-arm/"
    title: "Bare Metal STM32 Programming Part 1 - Vivonomicon"
  - url: "https://jacobmossberg.se/posts/2018/08/11/run-c-program-bare-metal-on-arm-cortex-m3.html"
    title: "Run a C Program Bare Metal on ARM Cortex-M3"
---

## What Bare-Metal Means

Bare-metal programming means writing code that runs directly on hardware with no operating system, no hardware abstraction layer (HAL), and no runtime environment beyond what you create yourself, as outlined in the [Bare Metal Programming Guide](https://github.com/cpq/bare-metal-programming-guide). Your code is the first thing that executes after the processor comes out of reset, and you are responsible for everything: initializing memory, configuring clocks, setting up peripherals, and handling interrupts.

In contrast, when you use an RTOS or a vendor HAL (like STM32 HAL or Arduino), layers of software sit between your application and the hardware. Those layers are convenient but hide what actually happens at the register level.

## Why Learn Bare-Metal

Understanding bare-metal programming gives you several advantages:

- **Debugging power** -- when something breaks at the HAL level, you can read the registers and understand what went wrong.
- **Performance** -- you can squeeze every cycle out of the hardware when you control everything.
- **Resource efficiency** -- on tiny MCUs with 16 KB of flash, there is no room for a HAL or RTOS.
- **Portability of knowledge** -- the concepts transfer across any ARM Cortex-M chip, regardless of vendor.
- **Interview readiness** -- embedded systems interviews frequently test bare-metal concepts.

The goal is not to avoid HALs forever. The goal is to understand what they do so you can use them wisely and debug them when they fail.

## The Bare-Metal Development Workflow

A typical bare-metal project follows this pipeline:

1. **Write source code** in C (or C++) using register-level access and CMSIS headers.
2. **Cross-compile** with `arm-none-eabi-gcc`, targeting the specific Cortex-M core.
3. **Link** using a linker script that maps code and data to the MCU's flash and SRAM.
4. **Convert** the ELF output to a raw binary (`.bin`) or Intel HEX (`.hex`) with `objcopy`.
5. **Flash** the binary onto the MCU using OpenOCD, ST-Link, or a UART bootloader.
6. **Debug** with GDB connected through a debug probe (SWD/JTAG).

The key files in any bare-metal project are:

| File | Purpose |
|------|---------|
| `startup.c` / `startup.s` | Vector table and pre-main initialization |
| `linker.ld` | Memory layout and section placement |
| `main.c` | Application entry point |
| `Makefile` | Build automation |
| CMSIS headers | Register definitions for the target MCU |

## Topics in This Section

- [Cross-Compilation Toolchain](cross-compilation-toolchain.md) -- the compiler, linker, and binary utilities
- [Startup Code](startup-code.md) -- what happens before `main()`
- [Vector Table](vector-table.md) -- interrupt and exception dispatch
- [Linker Scripts in Practice](linker-scripts-in-practice.md) -- controlling memory layout
- [Register-Level Programming](register-level-programming.md) -- reading and writing hardware registers
- [Volatile and Compiler Barriers](volatile-and-compiler-barriers.md) -- ensuring correct hardware access
- [Makefile and Build System](makefile-and-build-system.md) -- automating the build-flash-debug cycle
- [Boot Process Deep Dive](boot-process-deep-dive.md) -- from power-on to your application

## References

1. [Bare Metal Programming Guide (GitHub)](https://github.com/cpq/bare-metal-programming-guide) — Comprehensive guide to bare-metal ARM development workflow
2. [Bare Metal STM32 Programming Part 1 - Vivonomicon](https://vivonomicon.com/2018/04/02/bare-metal-stm32-programming-part-1-hello-arm/) — Introductory tutorial for STM32 bare-metal programming
3. [Run a C Program Bare Metal on ARM Cortex-M3](https://jacobmossberg.se/posts/2018/08/11/run-c-program-bare-metal-on-arm-cortex-m3.html) — Step-by-step guide to running C on Cortex-M3

## Related Topics

- [MCU Architecture](../mcu-architecture/index.md) -- the hardware foundation bare-metal code runs on
- [Peripherals and Interrupts](../mcu-peripherals-and-interrupts/index.md) -- using peripherals at the register level
