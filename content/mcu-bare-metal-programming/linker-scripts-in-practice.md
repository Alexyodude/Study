---
title: "Linker Scripts in Practice"
created: 2026-03-08
updated: 2026-03-08
tags: [linker-script, memory-layout, sections, flash, sram, gnu-ld]
status: draft
sources:
  - url: "https://dev.to/ripan030/linker-scripts-explained-controlling-memory-layout-on-bare-metal-3ocb"
    title: "Linker Scripts Explained: Controlling Memory Layout on Bare Metal"
  - url: "https://medium.com/@csrohit/writing-linker-script-for-stm32-arm-cortex-m3-%EF%B8%8F-fdc2acaaddcc"
    title: "Writing Linker Script for STM32 (Arm Cortex M3)"
  - url: "https://vivonomicon.com/2018/04/20/bare-metal-stm32-programming-part-2-making-it-to-main/"
    title: "Bare Metal STM32 Programming Part 2: Making it to Main"
  - url: "https://stm32world.com/wiki/STM32_Bare_Metal_Development"
    title: "STM32 Bare Metal Development - STM32World Wiki"
  - url: "https://www.stf12.org/developers/freerots_ec-linker_script.html"
    title: "GCC Linker Script and STM32 - A Tutorial"
---

## Why You Need a Linker Script

The linker combines all your compiled object files (`.o`) into a single executable. On a desktop OS, the linker uses a default script because every program has the same memory layout. On a bare-metal MCU, every chip has different flash and SRAM addresses and sizes. You must tell the linker exactly where to put everything.

As explained in [Linker Scripts Explained](https://dev.to/ripan030/linker-scripts-explained-controlling-memory-layout-on-bare-metal-3ocb), a linker script answers two questions:

1. **What memory regions exist?** (flash at what address, SRAM at what address, how big)
2. **What goes where?** (code in flash, variables in SRAM, vector table at the start)

## MEMORY Command: Defining Flash and SRAM

The `MEMORY` block declares the physical memory regions of your MCU:

```ld
MEMORY
{
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 64K
    SRAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 20K
}
```

Each entry specifies:

- **Name** -- an arbitrary label (FLASH, SRAM, RAM, etc.)
- **Attributes** -- `r` (read), `w` (write), `x` (execute)
- **ORIGIN** -- the starting physical address
- **LENGTH** -- the size of the region

These values come directly from your MCU's datasheet. For [STM32F103C8T6](https://medium.com/@csrohit/writing-linker-script-for-stm32-arm-cortex-m3-%EF%B8%8F-fdc2acaaddcc) (the "Blue Pill"):
- Flash: 64 KB starting at `0x0800_0000`
- SRAM: 20 KB starting at `0x2000_0000`

## SECTIONS Command: Placing Code and Data

The `SECTIONS` block maps input sections from object files to output sections and assigns them to memory regions:

```ld
SECTIONS
{
    .isr_vector : {
        KEEP(*(.isr_vector))
    } > FLASH

    .text : {
        *(.text)
        *(.text*)
    } > FLASH

    .rodata : {
        *(.rodata)
        *(.rodata*)
    } > FLASH

    .data : {
        *(.data)
        *(.data*)
    } > SRAM AT > FLASH

    .bss : {
        *(.bss)
        *(.bss*)
        *(COMMON)
    } > SRAM
}
```

The syntax `> SRAM AT > FLASH` means: the `.data` section lives in SRAM at runtime (VMA) but is stored in FLASH initially (LMA). The startup code copies it from flash to SRAM.

## KEEP() for the Vector Table

When you compile with `-ffunction-sections -fdata-sections` and link with `--gc-sections`, the linker removes any section not reachable from the entry point. The vector table is referenced by hardware, not by code, so the linker might discard it.

`KEEP()` tells the linker to never garbage-collect the specified section:

```ld
.isr_vector : {
    . = ALIGN(4);
    KEEP(*(.isr_vector))
    . = ALIGN(4);
} > FLASH
```

## Linker Symbols: _sidata, _sdata, _edata, _sbss, _ebss

The startup code needs to know where sections start and end so it can copy `.data` and zero `.bss`. The linker script defines these boundary symbols:

```ld
.data : {
    . = ALIGN(4);
    _sdata = .;          /* Start of .data in SRAM */
    *(.data)
    *(.data*)
    . = ALIGN(4);
    _edata = .;          /* End of .data in SRAM */
} > SRAM AT > FLASH

_sidata = LOADADDR(.data);  /* Start of .data in FLASH (LMA) */

.bss : {
    . = ALIGN(4);
    _sbss = .;           /* Start of .bss */
    *(.bss)
    *(.bss*)
    *(COMMON)
    . = ALIGN(4);
    _ebss = .;           /* End of .bss */
} > SRAM
```

These symbols have no storage -- they are just addresses. In C, you declare them as `extern` and take their address:

<!-- tabs -->
```c
extern uint32_t _sidata, _sdata, _edata, _sbss, _ebss;
```

```rust
// In Rust, linker symbols are declared as extern statics
// Their address (not value) is what matters
extern "C" {
    static _sidata: u32;
    static _sdata: u32;
    static _edata: u32;
    static _sbss: u32;
    static _ebss: u32;
}
```
<!-- /tabs -->

## ALIGN and Padding

`ALIGN(n)` rounds the location counter up to the next `n`-byte boundary. ARM Cortex-M requires word-aligned (4-byte) access for most operations:

```ld
. = ALIGN(4);    /* Ensure 4-byte alignment */
```

Without proper alignment, you risk hard faults from unaligned memory access (especially on Cortex-M0 which does not support unaligned access).

## Stack Pointer Symbol

The linker script also defines the initial stack pointer, typically at the top of SRAM:

```ld
_estack = ORIGIN(SRAM) + LENGTH(SRAM);
```

This value becomes entry 0 of the vector table.

## Full Example: Linker Script for STM32F103

```ld
/* STM32F103C8T6: 64K Flash, 20K SRAM */
ENTRY(Reset_Handler)

_estack = ORIGIN(SRAM) + LENGTH(SRAM);

MEMORY
{
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 64K
    SRAM  (rwx) : ORIGIN = 0x20000000, LENGTH = 20K
}

SECTIONS
{
    /* Vector table -- must be first in flash */
    .isr_vector : {
        . = ALIGN(4);
        KEEP(*(.isr_vector))
        . = ALIGN(4);
    } > FLASH

    /* Program code */
    .text : {
        . = ALIGN(4);
        *(.text)
        *(.text*)
        *(.glue_7)         /* ARM/Thumb interworking */
        *(.glue_7t)
        . = ALIGN(4);
        _etext = .;
    } > FLASH

    /* Read-only data (constants, strings) */
    .rodata : {
        . = ALIGN(4);
        *(.rodata)
        *(.rodata*)
        . = ALIGN(4);
    } > FLASH

    /* C++ constructor/destructor tables */
    .init_array : {
        PROVIDE_HIDDEN(__init_array_start = .);
        KEEP(*(SORT(.init_array.*)))
        KEEP(*(.init_array))
        PROVIDE_HIDDEN(__init_array_end = .);
    } > FLASH

    /* Initialized data: stored in flash, copied to SRAM */
    _sidata = LOADADDR(.data);
    .data : {
        . = ALIGN(4);
        _sdata = .;
        *(.data)
        *(.data*)
        . = ALIGN(4);
        _edata = .;
    } > SRAM AT > FLASH

    /* Zero-initialized data */
    .bss : {
        . = ALIGN(4);
        _sbss = .;
        *(.bss)
        *(.bss*)
        *(COMMON)
        . = ALIGN(4);
        _ebss = .;
    } > SRAM

    /* Heap and stack: fill remaining SRAM */
    ._user_heap_stack : {
        . = ALIGN(8);
        PROVIDE(end = .);          /* Used by _sbrk for malloc */
        PROVIDE(_heap_start = .);
        . = . + 0x200;            /* Min heap: 512 bytes */
        . = . + 0x400;            /* Min stack: 1024 bytes */
        . = ALIGN(8);
    } > SRAM
}
```

## Common Mistakes

- **Forgetting `KEEP` on the vector table** -- the linker discards it, and the MCU boots into garbage.
- **Wrong ORIGIN/LENGTH** -- the binary appears to flash correctly but the MCU hard-faults because code is at the wrong address.
- **Missing `AT > FLASH` on `.data`** -- initialized variables are not stored in flash, so they have no initial values after reset.
- **Forgetting `*(COMMON)`** -- uninitialized globals declared without `static` in C go into the COMMON section, not `.bss`.

## References

1. [Linker Scripts Explained: Controlling Memory Layout on Bare Metal](https://dev.to/ripan030/linker-scripts-explained-controlling-memory-layout-on-bare-metal-3ocb) — Beginner-friendly overview of linker script concepts
2. [Writing Linker Script for STM32 (Arm Cortex M3)](https://medium.com/@csrohit/writing-linker-script-for-stm32-arm-cortex-m3-%EF%B8%8F-fdc2acaaddcc) — STM32-specific linker script walkthrough with examples
3. [Bare Metal STM32 Programming Part 2: Making it to Main](https://vivonomicon.com/2018/04/20/bare-metal-stm32-programming-part-2-making-it-to-main/) — Practical linker script and startup code tutorial
4. [STM32 Bare Metal Development - STM32World Wiki](https://stm32world.com/wiki/STM32_Bare_Metal_Development) — Wiki covering bare-metal development on STM32
5. [GCC Linker Script and STM32 - A Tutorial](https://www.stf12.org/developers/freerots_ec-linker_script.html) — In-depth tutorial on GNU linker scripts for STM32

## Related Topics

- [Startup Code](startup-code.md) -- uses the symbols defined here
- [Vector Table](vector-table.md) -- placed by the `.isr_vector` section
- [Memory Layout](../mcu-architecture/memory-architecture/memory-layout-and-linker-scripts.md) -- the hardware memory map these scripts describe
