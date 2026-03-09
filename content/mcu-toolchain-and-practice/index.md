---
title: "Toolchain and Practice"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, toolchain, debugging, memory, practice]
status: draft
sources:
  - url: "https://developer.arm.com/documentation/107565/latest/Memory-protection/Memory-Protection-Unit"
    title: "ARM Memory Protection Unit Documentation"
  - url: "https://interrupt.memfault.com/blog/cortex-m-hardfault-debug"
    title: "How to Debug a HardFault on an ARM Cortex-M MCU"
  - url: "https://openocd.org/doc/html/GDB-and-OpenOCD.html"
    title: "GDB and OpenOCD - OpenOCD User's Guide"
---

Studying microcontroller architecture is only half the story. The other half is knowing how to build, debug, and deploy firmware on real hardware. This section bridges theory and practice by covering the tools and techniques that working embedded engineers use every day.

## Why This Section Matters

Understanding registers, interrupts, and peripherals from a textbook is necessary but not sufficient. In practice, you will spend significant time:

- **Debugging** -- stepping through code, reading [fault registers](https://interrupt.memfault.com/blog/cortex-m-hardfault-debug), and figuring out why your MCU locked up at 2 AM.
- **Managing memory** -- working within kilobytes of RAM, avoiding fragmentation, and using DMA to offload the CPU.
- **Choosing hardware** -- selecting the right MCU family for a project based on peripherals, power, cost, and ecosystem.

Each of these areas has its own set of tools, patterns, and pitfalls.

## Section Overview

### Debugging and Probes

How to connect a debugger, step through code, and diagnose faults on ARM Cortex-M targets.

- [Debugging Overview](debugging-and-probes/index.md) -- debug architecture and why printf is not enough
- [JTAG and SWD](debugging-and-probes/jtag-and-swd.md) -- the two main debug transport protocols
- [OpenOCD and GDB](debugging-and-probes/openocd-and-gdb.md) -- the open-source debug toolchain
- [Semihosting and Printf](debugging-and-probes/semihosting-and-printf.md) -- getting text output from a target
- [Fault Debugging Techniques](debugging-and-probes/fault-debugging-techniques.md) -- diagnosing HardFaults and crashes

### Memory Management in Practice

Strategies for working within the tight memory constraints of microcontrollers.

- [Memory Management Overview](memory-management-in-practice/index.md) -- why memory is your scarcest resource
- [Stack vs Heap](memory-management-in-practice/stack-vs-heap.md) -- deterministic vs flexible allocation
- [DMA Controller](memory-management-in-practice/dma-controller.md) -- offloading data transfers from the CPU
- [MPU Memory Protection](memory-management-in-practice/mpu-memory-protection.md) -- hardware-enforced access control
- [Static Allocation Patterns](memory-management-in-practice/static-allocation-patterns.md) -- pools, ring buffers, and compile-time strategies

### MCU Families Compared

A survey of popular microcontroller architectures and how to choose between them.

- [MCU Families Overview](mcu-families-compared/index.md) -- reading datasheets and comparing specs
- [ARM Cortex-M](mcu-families-compared/arm-cortex-m.md) -- the dominant 32-bit embedded architecture
- [AVR Architecture](mcu-families-compared/avr-architecture.md) -- the classic 8-bit platform
- [RISC-V Microcontrollers](mcu-families-compared/risc-v-microcontrollers.md) -- the open-source challenger
- [Choosing an MCU](mcu-families-compared/choosing-an-mcu.md) -- a decision framework for real projects

## References

1. [ARM Memory Protection Unit Documentation](https://developer.arm.com/documentation/107565/latest/Memory-protection/Memory-Protection-Unit) — Official ARM docs on MPU configuration and usage
2. [How to Debug a HardFault on an ARM Cortex-M MCU](https://interrupt.memfault.com/blog/cortex-m-hardfault-debug) — Practical guide to diagnosing Cortex-M fault exceptions
3. [GDB and OpenOCD - OpenOCD User's Guide](https://openocd.org/doc/html/GDB-and-OpenOCD.html) — Official OpenOCD documentation for GDB integration

## Prerequisites

This section assumes familiarity with:

- C programming and pointers
- Basic MCU architecture (registers, memory map, interrupts) -- see [MCU Architecture Fundamentals](../mcu-architecture-fundamentals/index.md)
- The compilation process (preprocessor, compiler, linker) -- see [Build System and Compilation](../mcu-build-system-and-compilation/index.md)
