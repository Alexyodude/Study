---
title: "ARM Cortex-M"
created: 2026-03-08
updated: 2026-03-08
tags: [arm, cortex-m, cmsis, stm32, nrf, embedded]
status: draft
sources:
  - url: "https://community.arm.com/cfs-file/__key/communityserver-discussions-components-files/18/Cortex_2D00_M-for-Beginners-_2D00_-2017_5F00_EN_5F00_v2.pdf"
    title: "Cortex-M for Beginners - ARM Community"
  - url: "https://developerhelp.microchip.com/xwiki/bin/view/products/mcu-mpu/32bit-mcu/sam/arm-cortex-differences/"
    title: "Differences Between ARM Cortex Families - Microchip"
  - url: "https://qcentlabs.com/posts/cortex-wars/"
    title: "The Core Wars: ARM Cortex M0+ vs M3 vs M4 vs M7"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
---

The [ARM Cortex-M](https://community.arm.com/cfs-file/__key/communityserver-discussions-components-files/18/Cortex_2D00_M-for-Beginners-_2D00_-2017_5F00_EN_5F00_v2.pdf) family is the dominant architecture for 32-bit microcontrollers. Designed by ARM and licensed to silicon vendors, Cortex-M cores power everything from simple IoT sensors to motor controllers and audio processors. Understanding the different Cortex-M variants is essential for choosing the right MCU.

## The Cortex-M Lineup

ARM designs the processor cores; silicon vendors (ST, NXP, Nordic, Microchip, etc.) build complete MCUs around them by adding flash, SRAM, and peripherals.

### Cortex-M0 / M0+

The smallest, lowest-power Cortex-M cores.

| Feature | M0 | M0+ |
|---------|-----|------|
| Architecture | ARMv6-M | ARMv6-M |
| Pipeline | 3-stage | 2-stage |
| Instructions | 56 (mostly 16-bit Thumb) | 56 + single-cycle I/O port |
| Interrupts | Up to 32 | Up to 32 |
| Hardware divide | No | No |
| MPU | No | Optional (8 regions) |
| Typical clock | 24-48 MHz | 24-64 MHz |

**Use cases**: Simple sensor nodes, battery-powered IoT, LED drivers, USB accessories.

The M0+ is essentially an improved M0 with a shorter pipeline (better energy per instruction) and an optional single-cycle I/O port for GPIO bit-banging.

### Cortex-M3

The original "mainstream" Cortex-M core that introduced the Thumb-2 instruction set.

| Feature | Detail |
|---------|--------|
| Architecture | ARMv7-M |
| Pipeline | 3-stage |
| Instruction set | Full Thumb-2 (mix of 16-bit and 32-bit) |
| Interrupts | Up to 240 (with NVIC) |
| Hardware divide | Yes (SDIV, UDIV) |
| MPU | Optional (8 regions) |
| DSP | No |
| FPU | No |
| Typical clock | 72-120 MHz |

**Use cases**: General-purpose control, communication stacks, mid-range industrial.

The M3 is a significant step up from M0: it adds hardware integer division, the full Thumb-2 instruction set (efficient mix of 16-bit and 32-bit instructions), bit-banding for atomic bit manipulation, and up to 240 interrupts with priority levels.

### Cortex-M4

Adds DSP and optional floating-point to the M3 foundation.

| Feature | Detail |
|---------|--------|
| Architecture | ARMv7E-M |
| Pipeline | 3-stage |
| DSP instructions | Yes (SIMD, MAC, saturating arithmetic) |
| FPU | Optional single-precision (M4F) |
| MPU | Optional (8 regions) |
| Typical clock | 80-180 MHz |

**Use cases**: Motor control, audio processing, sensor fusion, digital filtering.

Key DSP instructions:
- **SIMD** -- process two 16-bit or four 8-bit values in one instruction
- **MAC** -- multiply-accumulate in a single cycle (essential for FIR/IIR filters)
- **Saturating arithmetic** -- results clamp to min/max instead of wrapping

The "F" suffix (e.g., STM32F4, Cortex-M4F) means the FPU is included. Without it, floating-point operations are emulated in software (~10-20x slower).

### Cortex-M7

The high-performance member of the family.

| Feature | Detail |
|---------|--------|
| Architecture | ARMv7E-M |
| Pipeline | 6-stage, superscalar, dual-issue |
| FPU | Optional single + double precision |
| Cache | Optional I-cache and D-cache |
| TCM | Tightly Coupled Memory (zero-wait-state) |
| MPU | Optional (8 or 16 regions) |
| Typical clock | 216-600 MHz |

**Use cases**: Graphics, complex signal processing, high-speed communication, real-time control with heavy computation.

The [M7's 6-stage pipeline](https://qcentlabs.com/posts/cortex-wars/) and branch prediction make it 2x faster per MHz than M4. The cache and TCM provide fast local memory, but introduce cache coherency concerns with DMA (see [DMA Controller](../memory-management-in-practice/dma-controller.md)).

## Comparison Table

| Feature | M0/M0+ | M3 | M4/M4F | M7 |
|---------|--------|-----|--------|-----|
| Thumb instructions | Thumb-1 | Thumb-2 | Thumb-2 | Thumb-2 |
| Hardware divide | No | Yes | Yes | Yes |
| DSP extensions | No | No | Yes | Yes |
| FPU | No | No | Optional SP | Optional SP+DP |
| Cache | No | No | No | Optional |
| Max interrupts | 32 | 240 | 240 | 240 |
| Pipeline stages | 2-3 | 3 | 3 | 6 |
| CoreMark/MHz | ~2.3 | ~3.3 | ~3.4 | ~5.0 |
| Typical power | Lowest | Medium | Medium | Highest |

## CMSIS: The Common Interface

ARM provides **CMSIS (Cortex Microcontroller Software Interface Standard)** -- a vendor-independent abstraction layer:

- **CMSIS-Core** -- standard access to CPU registers, NVIC, SysTick, MPU. Every vendor's HAL builds on this.
- **CMSIS-DSP** -- optimized DSP library (FFT, filters, matrix math) for M4/M7.
- **CMSIS-RTOS** -- RTOS abstraction API.
- **CMSIS-DAP** -- standardized debug probe firmware.

Because of CMSIS, the same NVIC setup code works across STM32, LPC, nRF, and SAM devices:

<!-- tabs -->
```c
// This code works on ANY Cortex-M, regardless of vendor
NVIC_SetPriority(USART2_IRQn, 3);
NVIC_EnableIRQ(USART2_IRQn);
```

```rust
// Rust embedded — using cortex-m and PAC crates
// Works on any Cortex-M via the cortex-m NVIC API
use cortex_m::peripheral::NVIC;
use stm32f4::stm32f407::Interrupt; // PAC provides interrupt enum

unsafe {
    // Set priority for USART2 interrupt
    NVIC::unmask(Interrupt::USART2);
    // Priority set via the PAC's NVIC peripheral
    let mut nvic = cortex_m::Peripherals::take().unwrap().NVIC;
    nvic.set_priority(Interrupt::USART2, 3);
    NVIC::unmask(Interrupt::USART2);
}
```
<!-- /tabs -->

## Major Vendors

| Vendor | Family | Notable Chips | Strengths |
|--------|--------|---------------|-----------|
| **ST** (STMicroelectronics) | STM32 | STM32F103, STM32F407, STM32H743 | Huge portfolio, CubeMX code gen, massive community |
| **NXP** | LPC, i.MX RT | LPC1768, i.MX RT1060 | Industrial focus, crossover processors |
| **Nordic** | nRF | nRF52840, nRF5340 | Bluetooth LE leader, ultra-low power |
| **Microchip** | SAM | SAMD21, SAME70 | Broad portfolio (acquired Atmel) |
| **Raspberry Pi** | RP | RP2040 | Dual M0+, PIO state machines, low cost |
| **Infineon** | PSoC, XMC | PSoC6, XMC4000 | Analog integration, automotive |

## Getting Started

For learning, the best entry points are:

1. **STM32 Nucleo boards** (~$12-15) -- ST-Link debugger built in, huge community, CubeMX support
2. **Raspberry Pi Pico** (~$4) -- RP2040, excellent documentation, no debugger on board but SWD header available
3. **nRF52 DK** (~$30) -- if Bluetooth is needed

All support GCC (`arm-none-eabi-gcc`), OpenOCD, and GDB.

## References

1. [Cortex-M for Beginners - ARM Community](https://community.arm.com/cfs-file/__key/communityserver-discussions-components-files/18/Cortex_2D00_M-for-Beginners-_2D00_-2017_5F00_EN_5F00_v2.pdf) — ARM's official introductory guide to Cortex-M
2. [Differences Between ARM Cortex Families - Microchip](https://developerhelp.microchip.com/xwiki/bin/view/products/mcu-mpu/32bit-mcu/sam/arm-cortex-differences/) — Vendor comparison of Cortex-M variants
3. [The Core Wars: ARM Cortex M0+ vs M3 vs M4 vs M7](https://qcentlabs.com/posts/cortex-wars/) — Performance and feature comparison across Cortex-M cores
4. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — General overview of the Cortex-M architecture family

## Related Topics

- [Choosing an MCU](choosing-an-mcu.md) -- using these specs to make a selection
- [AVR Architecture](avr-architecture.md) -- the 8-bit alternative
- [RISC-V Microcontrollers](risc-v-microcontrollers.md) -- the open-source competitor
- [Debugging and Probes](../debugging-and-probes/index.md) -- CoreSight debug on all Cortex-M
