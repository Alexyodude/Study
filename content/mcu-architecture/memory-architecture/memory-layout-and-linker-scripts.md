---
title: "Memory Layout and Linker Scripts"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, linker-script, memory-layout, lma, vma, sections, arm, cortex-m]
status: draft
sources:
  - url: "https://blog.thea.codes/the-most-thoroughly-commented-linker-script/"
    title: "The Most Thoroughly Commented Linker Script"
  - url: "https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/"
    title: "Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts"
  - url: "https://medium.com/@csrohit/writing-linker-script-for-stm32-arm-cortex-m3-%EF%B8%8F-fdc2acaaddcc"
    title: "Writing Linker Script for STM32"
---

## What a Linker Script Does

The [**linker script**](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/) tells the linker where to place each section of your program in memory. On a desktop OS, the operating system handles memory layout. On a bare-metal MCU, **you** define it -- the linker script is your memory map blueprint.

Without a correct linker script, your code won't boot. The vector table must be at the right address, `.data` must be copied from flash to SRAM, and the stack must start at the right place.

## Memory Sections

Your compiled program is divided into **sections**, each with a specific purpose:

| Section | Content | Stored In | Runs From |
|---|---|---|---|
| `.text` | Executable code (machine instructions) | Flash | Flash (XIP) |
| `.rodata` | Read-only data (const variables, strings) | Flash | Flash |
| `.data` | Initialized global/static variables | Flash (initial values) | SRAM (runtime) |
| `.bss` | Zero-initialized global/static variables | Not stored (size only) | SRAM |
| `.stack` | Call stack space | Not stored | SRAM |
| `.heap` | Dynamic allocation space (malloc) | Not stored | SRAM |

### Where Each Section Comes From in C Code

<!-- tabs -->
```c
const char msg[] = "hello";    // .rodata (read-only, stays in flash)
int counter = 42;              // .data (initial value in flash, variable in SRAM)
int errors;                    // .bss (zero-initialized, only in SRAM)
void func(void) { ... }       // .text (code, in flash)

void main(void) {
    int local = 5;             // stack (SRAM, allocated at runtime)
    char *p = malloc(100);     // heap (SRAM, allocated at runtime)
}
```

```rust
// #![no_std] embedded Rust -- same sections, different syntax

static MSG: &str = "hello";                // .rodata (flash)
static mut COUNTER: i32 = 42;             // .data (flash -> SRAM)
static mut ERRORS: i32 = 0;               // .bss (SRAM, zero-initialized)
fn func() { /* ... */ }                    // .text (flash)

fn main() -> ! {
    let local: i32 = 5;                   // stack (SRAM)
    // Heap is opt-in via alloc crate + global allocator,
    // but most embedded Rust avoids heap allocation entirely.
    loop {}
}
```
<!-- /tabs -->

## LMA vs VMA

This is one of the most confusing linker concepts, but it's essential for MCU development.

- **LMA (Load Memory Address)**: where the section is **stored** (in the flash image)
- **VMA (Virtual Memory Address)**: where the section is **accessed at runtime**

For most sections, LMA = VMA. The exception is `.data`:

```
  .data section:
    LMA = 0x0800_xxxx  (stored in flash, part of the firmware binary)
    VMA = 0x2000_0000  (accessed from SRAM at runtime)
```

At startup, the initialization code copies `.data` from its LMA (flash) to its VMA (SRAM). This is necessary because global variables must be in writable memory, but their initial values must survive power cycles.

```
  Flash (LMA)                          SRAM (VMA)
  +------------------+                +------------------+
  | .text            |                |                  |
  | .rodata          |                |                  |
  | .data (copy)  ------startup------>| .data (runtime)  |
  +------------------+   copies       +------------------+
                                      | .bss (zeroed)    |
                                      +------------------+
                                      | heap -->         |
                                      |       <-- stack  |
                                      +------------------+
```

## Example Linker Script

Here is a simplified but complete [linker script for an STM32F103](https://medium.com/@csrohit/writing-linker-script-for-stm32-arm-cortex-m3-%EF%B8%8F-fdc2acaaddcc) (64 KB flash, 20 KB SRAM):

```ld
/* Entry point - first function to execute */
ENTRY(Reset_Handler)

/* Memory regions */
MEMORY
{
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 64K
    RAM   (rwx) : ORIGIN = 0x20000000, LENGTH = 20K
}

/* Initial stack pointer = top of RAM */
_estack = ORIGIN(RAM) + LENGTH(RAM);

/* Minimum stack and heap sizes */
_Min_Stack_Size = 0x400;   /* 1 KB */
_Min_Heap_Size  = 0x200;   /* 512 B */

SECTIONS
{
    /* Vector table + code -> Flash */
    .text :
    {
        . = ALIGN(4);
        KEEP(*(.isr_vector))    /* Vector table MUST be first */
        *(.text)                /* All code */
        *(.text*)
        *(.rodata)              /* Read-only data */
        *(.rodata*)
        . = ALIGN(4);
        _etext = .;             /* End of text (used by startup) */
    } >FLASH

    /* Initialized data -> stored in Flash, copied to RAM */
    .data :
    {
        . = ALIGN(4);
        _sdata = .;             /* Start of .data in RAM (VMA) */
        *(.data)
        *(.data*)
        . = ALIGN(4);
        _edata = .;             /* End of .data in RAM */
    } >RAM AT> FLASH            /* VMA = RAM, LMA = FLASH */
    _sidata = LOADADDR(.data);  /* Start of .data in Flash (LMA) */

    /* Zero-initialized data -> RAM only */
    .bss :
    {
        . = ALIGN(4);
        _sbss = .;
        *(.bss)
        *(.bss*)
        *(COMMON)
        . = ALIGN(4);
        _ebss = .;
    } >RAM

    /* Heap and stack check */
    ._user_heap_stack :
    {
        . = ALIGN(8);
        . = . + _Min_Heap_Size;
        . = . + _Min_Stack_Size;
        . = ALIGN(8);
    } >RAM
}
```

### Key Elements Explained

- `ENTRY(Reset_Handler)` -- tells the debugger where execution begins
- `KEEP(*(.isr_vector))` -- prevents the linker from discarding the vector table (it looks unused because nothing calls it directly)
- `>RAM AT> FLASH` -- section lives in RAM (VMA) but is loaded from Flash (LMA)
- `_sidata`, `_sdata`, `_edata` -- symbols used by startup code to copy .data
- `_sbss`, `_ebss` -- symbols used by startup code to zero .bss

## How .data Gets From Flash to SRAM

The startup code (assembly or C) runs before `main()` and performs the copy:

```arm
@ Copy .data from Flash (LMA) to SRAM (VMA)
    ldr  r0, =_sdata       @ Destination start (SRAM)
    ldr  r1, =_edata       @ Destination end
    ldr  r2, =_sidata      @ Source (Flash)
copy_loop:
    cmp  r0, r1
    bge  copy_done
    ldr  r3, [r2], #4      @ Load word from flash, post-increment
    str  r3, [r0], #4      @ Store word to SRAM, post-increment
    b    copy_loop
copy_done:

@ Zero .bss
    ldr  r0, =_sbss
    ldr  r1, =_ebss
    movs r2, #0
zero_loop:
    cmp  r0, r1
    bge  zero_done
    str  r2, [r0], #4
    b    zero_loop
zero_done:

    bl   main              @ Call main()
```

## Reading a .map File

The linker can produce a `.map` file showing exactly where every symbol ends up. Add `-Wl,-Map=output.map` to your GCC command.

```
.text           0x08000000     0x1a4
                0x08000000        _stext
 *(.isr_vector)
 .isr_vector    0x08000000      0xec   startup.o
 *(.text)
 .text          0x080000ec      0x48   main.o
                0x080000ec        main
                0x08000114        init_hardware

.data           0x20000000       0x8   load address 0x080001a4
                0x20000000        _sdata
 .data          0x20000000       0x8   main.o
                0x20000000        counter
                0x20000004        config_byte
                0x20000008        _edata

.bss            0x20000008      0x104
                0x20000008        _sbss
 .bss           0x20000008      0x100  main.o
                0x20000008        rx_buffer
                0x2000010c        _ebss
```

From this you can read:
- `main()` is at `0x080000EC` in flash
- `counter` is at `0x20000000` in SRAM, with initial value stored at `0x080001A4` in flash
- `rx_buffer` is 256 bytes in `.bss` starting at `0x20000008`

## References

1. [The Most Thoroughly Commented Linker Script](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/) — Comprehensive annotated linker script for ARM embedded targets
2. [Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) — Practical STM32 linker script and memory layout walkthrough
3. [Writing Linker Script for STM32](https://medium.com/@csrohit/writing-linker-script-for-stm32-arm-cortex-m3-%EF%B8%8F-fdc2acaaddcc) — Step-by-step guide to writing STM32 Cortex-M3 linker scripts

## Related Topics

- [Flash Memory](flash-memory.md) -- where .text and .data (LMA) live
- [SRAM](sram.md) -- where .data (VMA), .bss, stack, and heap live
- [Stack Pointer and Call Stack](../stack-pointer-and-call-stack.md) -- stack section in the linker script
