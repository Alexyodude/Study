---
title: "MCU Architecture"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, architecture, arm, cortex-m, embedded]
status: draft
sources:
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
  - url: "https://microcontrollerslab.com/arm-cortex-m4-architecture/"
    title: "ARM Cortex-M4 Architecture"
---

## What Is a Microcontroller?

A microcontroller (MCU) is a small computer on a single chip. Unlike a general-purpose CPU (like the one in your laptop), an MCU integrates the processor, memory, and peripherals into one package. You don't need to add external RAM chips or a separate graphics card -- everything needed to run a program is already on the chip.

| Feature | General-Purpose CPU | Microcontroller (MCU) |
|---|---|---|
| Memory | External (GB of DRAM) | On-chip (KB of SRAM + Flash) |
| Clock speed | GHz range | MHz range (8--480 MHz typical) |
| Power | Watts | Milliwatts or microwatts |
| OS | Runs Linux/Windows | Often bare-metal or RTOS |
| Cost | $50--$500+ | $0.10--$20 |
| Use case | Desktop, server | Sensor, motor control, IoT |

## MCU Block Diagram

A typical [ARM Cortex-M](https://en.wikipedia.org/wiki/ARM_Cortex-M) microcontroller contains these major blocks:

```
 +--------------------------------------------------+
 |                   MCU Chip                        |
 |                                                   |
 |  +----------+    +-------+    +-----------+       |
 |  | CPU Core |<-->| Bus   |<-->|  Flash    |       |
 |  | (ARM     |    | Matrix|    |  (Code)   |       |
 |  |  Cortex-M|    |       |<-->+-----------+       |
 |  +----------+    |       |    |  SRAM     |       |
 |       |          |       |<-->|  (Data)   |       |
 |  +----------+    |       |    +-----------+       |
 |  |   NVIC   |    |       |                        |
 |  +----------+    |       |<-->+-----------+       |
 |                  |       |    | Peripheral|       |
 |  +----------+    |       |    | GPIO,UART |       |
 |  | SysTick  |    +-------+    | SPI,I2C.. |       |
 |  +----------+                 +-----------+       |
 |                                                   |
 |  +----------+    +----------+                     |
 |  | Clock    |    | Power    |                     |
 |  | System   |    | Manage   |                     |
 |  +----------+    +----------+                     |
 +--------------------------------------------------+
```

## Key Components

### CPU Core
The processor that fetches, decodes, and executes instructions. [ARM Cortex-M cores](https://embeddedsecurity.io/sec-arm-arch-core) are 32-bit RISC processors using the Thumb/Thumb-2 instruction set. The core contains general-purpose registers (R0--R12), a program counter (PC), stack pointer (SP), link register (LR), and an ALU for arithmetic and logic operations.

See: [CPU Core and ALU](cpu-core-and-alu.md) | [Registers](registers-and-register-file.md)

### Memory
MCUs use on-chip **Flash** (non-volatile, stores your program) and **SRAM** (volatile, stores runtime data). The entire 4 GB address space is divided into well-defined regions -- code, SRAM, peripherals, and system.

See: [Memory Architecture](memory-architecture/index.md)

### Bus System
The bus matrix connects the CPU to memory and peripherals. ARM Cortex-M MCUs typically use:
- **AHB (Advanced High-performance Bus)** -- connects CPU to Flash, SRAM, and high-speed peripherals
- **APB (Advanced Peripheral Bus)** -- connects to lower-speed peripherals (UART, SPI, I2C)

### Peripherals
Hardware modules for interacting with the outside world. All peripherals are accessed through **memory-mapped registers** -- you read and write to specific memory addresses to control hardware. Common peripherals include GPIO, timers, UART, SPI, I2C, ADC, and DMA.

See: [Memory-Mapped I/O](memory-architecture/memory-mapped-io.md)

### Interrupt Controller (NVIC)
The **Nested Vectored Interrupt Controller** handles hardware events (button press, timer overflow, data received). It supports priority-based preemption so urgent events are handled first.

### Clock and Power System
The clock drives all digital logic. MCUs offer multiple clock sources (internal RC, external crystal) and power modes (sleep, stop, standby) to balance performance and energy use.

See: [Clock and Power System](clock-and-power-system/index.md)

## ARM Cortex-M Family at a Glance

| Variant | Architecture | Pipeline | Key Features |
|---|---|---|---|
| Cortex-M0/M0+ | ARMv6-M | 2-stage | Ultra-low power, minimal gate count |
| Cortex-M3 | ARMv7-M | 3-stage | Hardware divide, bit-banding |
| Cortex-M4 | ARMv7E-M | 3-stage | DSP instructions, optional FPU |
| Cortex-M7 | ARMv7E-M | 6-stage | Cache, dual-issue, branch prediction |
| Cortex-M33 | ARMv8-M | 3-stage | TrustZone security |

## Execution Modes

ARM Cortex-M processors have two execution modes:

- **Thread Mode** -- normal application code runs here (can be privileged or unprivileged)
- **Handler Mode** -- exception/interrupt handlers run here (always privileged)

The processor boots into privileged Thread Mode. The `CONTROL` register can switch Thread Mode to unprivileged, which is useful when running an RTOS to isolate user tasks from kernel code.

## Child Pages

- [CPU Core and ALU](cpu-core-and-alu.md) -- how the processor performs arithmetic and logic
- [Registers and Register File](registers-and-register-file.md) -- R0--R15, special registers, xPSR
- [Program Counter and Execution Flow](program-counter-and-execution-flow.md) -- branching, subroutine calls
- [Stack Pointer and Call Stack](stack-pointer-and-call-stack.md) -- MSP, PSP, stack frames
- [Memory Architecture](memory-architecture/index.md) -- Flash, SRAM, memory map, linker scripts
- [Instruction Execution](instruction-execution/index.md) -- pipeline, timing, ISA
- [Clock and Power System](clock-and-power-system/index.md) -- oscillators, PLL, low-power modes

## References

1. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Overview of ARM Cortex-M core architecture and security features
2. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — General reference for Cortex-M family variants and specifications
3. [ARM Cortex-M4 Architecture](https://microcontrollerslab.com/arm-cortex-m4-architecture/) — Detailed breakdown of the Cortex-M4 core architecture
