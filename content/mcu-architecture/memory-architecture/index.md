---
title: "Memory Architecture"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, memory, flash, sram, memory-map, arm, cortex-m]
status: draft
sources:
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
  - url: "https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/"
    title: "Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts"
  - url: "https://blog.thea.codes/the-most-thoroughly-commented-linker-script/"
    title: "The Most Thoroughly Commented Linker Script"
---

## Von Neumann vs Harvard Architecture

Two fundamental approaches to connecting a CPU to memory:

### Von Neumann (Princeton)

One shared bus for both instructions and data. The CPU fetches an instruction or accesses data, but not both simultaneously.

```
  +-------+        +--------+
  |  CPU  |<======>| Memory |  (single bus for code + data)
  +-------+        +--------+
```

**Pros:** Simpler design, self-modifying code is straightforward.
**Cons:** Bus bottleneck -- can't fetch the next instruction while reading data.

### Harvard

Separate buses for instructions and data. The CPU can fetch the next instruction while reading/writing data in the same clock cycle.

```
  +-------+ instruction bus  +-----------+
  |  CPU  |<================>| Flash     |
  |       | data bus         +-----------+
  |       |<================>| SRAM      |
  +-------+                  +-----------+
```

**Pros:** Higher throughput -- parallel access to code and data.
**Cons:** More complex hardware, two bus systems.

### ARM Cortex-M: Modified Harvard

[ARM Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) uses a **modified Harvard architecture**: it has separate instruction and data buses (AHB-I and AHB-D) for performance, but both share a **single, unified address space**. From the programmer's perspective, code and data live in the same 4 GB address map. The bus matrix handles routing internally.

This gives you the speed benefit of Harvard (parallel fetches) with the simplicity of a single address space (one pointer type, no special I/O instructions).

## The Memory Map

[ARM defines a standard memory map](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) for all Cortex-M processors. The 32-bit address space (4 GB) is divided into fixed regions:

```
  0xFFFF_FFFF  +---------------------+
               | System / Debug      |  0xE000_0000 - 0xFFFF_FFFF (512 MB)
  0xE000_0000  +---------------------+
               | Device (external)   |  0xA000_0000 - 0xDFFF_FFFF (1 GB)
  0xA000_0000  +---------------------+
               | RAM (external)      |  0x6000_0000 - 0x9FFF_FFFF (1 GB)
  0x6000_0000  +---------------------+
               | Peripheral          |  0x4000_0000 - 0x5FFF_FFFF (512 MB)
  0x4000_0000  +---------------------+
               | SRAM                |  0x2000_0000 - 0x3FFF_FFFF (512 MB)
  0x2000_0000  +---------------------+
               | Code (Flash)        |  0x0000_0000 - 0x1FFF_FFFF (512 MB)
  0x0000_0000  +---------------------+
```

### What Lives Where (STM32 Example)

| Region | Address | Typical Content |
|---|---|---|
| Code | `0x0800_0000` | On-chip Flash (program code) |
| SRAM | `0x2000_0000` | On-chip SRAM (variables, stack, heap) |
| Peripherals | `0x4000_0000` | GPIO, UART, SPI, I2C, timer registers |
| System | `0xE000_0000` | NVIC, SysTick, SCB, debug registers |

The first word at `0x0000_0000` (or `0x0800_0000` aliased) contains the initial stack pointer. The second word contains the reset handler address. This is the **vector table** -- the CPU reads it at power-on.

### Why the Memory Map Matters

- **No virtual memory**: addresses are physical. `0x4001_0800` is always GPIOA on an STM32F1.
- **Peripheral access = memory access**: you read/write peripheral registers using the same `LDR`/`STR` instructions used for SRAM.
- **Memory protection**: the optional MPU uses these regions to set access permissions (read-only code, no-execute data, etc.).

## Overview of Memory Types

| Memory Type | Volatile? | Speed | Typical Size | Used For |
|---|---|---|---|---|
| Flash | No | Medium (may need wait states) | 16 KB -- 2 MB | Program code, constants |
| SRAM | Yes | Fast (zero wait states) | 2 KB -- 512 KB | Variables, stack, heap |
| EEPROM | No | Slow (write) | 256 B -- 16 KB | Configuration, calibration |

## Child Pages

- [Flash Memory](flash-memory.md) -- how code is stored and executed from NOR flash
- [SRAM](sram.md) -- runtime data memory (.data, .bss, stack, heap)
- [EEPROM and NVM](eeprom-and-nvm.md) -- byte-level non-volatile storage
- [Memory-Mapped I/O](memory-mapped-io.md) -- accessing peripherals as memory addresses
- [Memory Layout and Linker Scripts](memory-layout-and-linker-scripts.md) -- sections, LMA vs VMA, .map files

## References

1. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Modified Harvard architecture and memory map design
2. [Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) — Hands-on guide to STM32 memory regions and addressing
3. [The Most Thoroughly Commented Linker Script](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/) — Detailed linker script walkthrough for embedded ARM targets

## Related Topics

- [Registers and Register File](../registers-and-register-file.md) -- 32-bit registers define the 4 GB address space
- [CPU Core and ALU](../cpu-core-and-alu.md) -- load/store instructions to access memory
