---
title: "MCU Families Compared"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, datasheet, comparison, arm, avr, risc-v]
status: draft
sources:
  - url: "https://hackaday.com/2025/02/14/a-guide-to-making-the-right-microcontroller-choice/"
    title: "A Guide to Making the Right Microcontroller Choice - Hackaday"
  - url: "https://oxeltech.de/how-to-select-the-right-microcontroller-for-your-embedded-system/"
    title: "How to Select the Right Microcontroller for Your Embedded System"
  - url: "https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Cortex-A%20R%20M%20datasheets/Arm%20Cortex-M%20Comparison%20Table_v3.pdf"
    title: "ARM Cortex-M Processor Comparison Table"
---

Choosing a microcontroller starts with understanding what is available. This section surveys the three major MCU architecture families -- ARM Cortex-M, AVR, and RISC-V -- and provides a framework for making informed decisions. But first, you need to know how to read the documentation.

## How to Read a Datasheet

Every MCU comes with documentation from the manufacturer. For ARM-based MCUs (especially STM32), there are typically three separate documents:

| Document | Contents | When to Use |
|----------|----------|-------------|
| **Datasheet** | Pinout, package options, electrical specs, memory sizes, peripheral list, ordering codes | Choosing a specific part number; PCB design |
| **Reference Manual** | Detailed register descriptions for all peripherals, clock tree, memory map | Writing drivers; configuring peripherals |
| **Programming Manual** | CPU core details, instruction set, system control registers, NVIC | Understanding the processor itself |

### What to Look for First

When evaluating an MCU, scan the datasheet for these key specifications:

**Memory**:
- Flash size (program storage) -- typically 16 KB to 2 MB
- SRAM size (runtime data) -- typically 4 KB to 512 KB
- EEPROM (if available) -- non-volatile data storage

**Performance**:
- Maximum clock frequency
- CPU core type (e.g., Cortex-M4 vs Cortex-M0)
- FPU (floating-point unit) availability
- DMA channels

**Peripherals**:
- UART/USART count
- SPI / I2C interfaces
- ADC channels and resolution (10-bit, 12-bit, 16-bit)
- Timers (general-purpose, advanced, basic)
- DAC, CAN, USB, Ethernet

**Package and Pins**:
- Package type (QFP, BGA, QFN) and pitch
- Total GPIO count
- Pin alternate functions (which pins can be UART, SPI, etc.)

**Power**:
- Supply voltage range
- Active current (mA/MHz)
- Sleep mode current (uA or nA)
- Wake-up sources and time

### Reading the Memory Map

The memory map diagram shows how the 4 GB address space is divided:

```
0x00000000 - 0x1FFFFFFF  Code region (flash, boot ROM)
0x20000000 - 0x3FFFFFFF  SRAM
0x40000000 - 0x5FFFFFFF  Peripherals
0x60000000 - 0x9FFFFFFF  External memory (RAM, FSMC)
0xA0000000 - 0xDFFFFFFF  External devices
0xE0000000 - 0xFFFFFFFF  System (NVIC, SCB, debug, MPU)
```

This map is consistent across all [Cortex-M devices](https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Cortex-A%20R%20M%20datasheets/Arm%20Cortex-M%20Comparison%20Table_v3.pdf), which is one of ARM's key advantages -- code that accesses SRAM at `0x20000000` works on any Cortex-M chip.

### Reading Register Descriptions

A typical register description includes:

```
Register: USART_CR1 (Control Register 1)
Offset: 0x00
Reset value: 0x0000 0000

Bit 13 - UE: USART enable
  0: USART disabled
  1: USART enabled

Bit 3 - TE: Transmitter enable
  0: Transmitter disabled
  1: Transmitter enabled

Bit 2 - RE: Receiver enable
  0: Receiver disabled
  1: Receiver enabled
```

Each bit or bit-field has a name, position, reset value, and description of what each value means. The offset is relative to the peripheral's base address.

## Child Pages

- [ARM Cortex-M](arm-cortex-m.md) -- the dominant 32-bit embedded architecture family
- [AVR Architecture](avr-architecture.md) -- the classic 8-bit platform behind Arduino
- [RISC-V Microcontrollers](risc-v-microcontrollers.md) -- the open-source ISA challenger
- [Choosing an MCU](choosing-an-mcu.md) -- a practical decision framework

## References

1. [A Guide to Making the Right Microcontroller Choice - Hackaday](https://hackaday.com/2025/02/14/a-guide-to-making-the-right-microcontroller-choice/) — Practical advice on comparing and selecting MCUs
2. [How to Select the Right Microcontroller for Your Embedded System](https://oxeltech.de/how-to-select-the-right-microcontroller-for-your-embedded-system/) — Systematic embedded MCU selection methodology
3. [ARM Cortex-M Processor Comparison Table](https://developer.arm.com/-/media/Arm%20Developer%20Community/PDF/Cortex-A%20R%20M%20datasheets/Arm%20Cortex-M%20Comparison%20Table_v3.pdf) — Official ARM comparison of Cortex-M processor features

## Related Topics

- [Linker Script and Memory Layout](../../mcu-build-system-and-compilation/linker-script-and-memory-layout.md) -- how the memory map connects to your build system
- [Debugging Overview](../debugging-and-probes/index.md) -- debug capabilities vary by MCU family
