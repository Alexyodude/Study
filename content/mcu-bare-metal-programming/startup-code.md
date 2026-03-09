---
title: "Startup Code"
created: 2026-03-08
updated: 2026-03-08
tags: [startup, reset-handler, bare-metal, cortex-m, initialization]
status: draft
sources:
  - url: "https://allthingsembedded.com/post/2019-01-03-arm-cortex-m-startup-code-for-c-and-c/"
    title: "ARM Cortex-M Startup Code for C and C++ - AllThingsEmbedded"
  - url: "https://medium.com/@ragagr116/what-happens-before-main-understanding-the-startup-file-on-arm-cortex-m-46c9f55e1a6b"
    title: "What Happens Before main() - Understanding the Startup File"
  - url: "https://vivonomicon.com/2018/04/20/bare-metal-stm32-programming-part-2-making-it-to-main/"
    title: "Bare Metal STM32 Programming Part 2: Making it to Main"
  - url: "https://jacobmossberg.se/posts/2018/08/11/run-c-program-bare-metal-on-arm-cortex-m3.html"
    title: "Run a C Program Bare Metal on ARM Cortex-M3"
---

## What Happens Before main()

In a desktop program, the OS sets up the stack, loads the binary into memory, initializes the C runtime, and then calls `main()`. On a bare-metal MCU, there is no OS to do any of that. The startup code is responsible for everything.

When an ARM Cortex-M processor comes out of reset, it does exactly two things:

1. Loads the initial stack pointer (SP) from address `0x00000000`.
2. Loads the reset vector from address `0x00000004` and branches to it.

That reset vector points to `Reset_Handler` -- the [true entry point of your firmware](https://allthingsembedded.com/post/2019-01-03-arm-cortex-m-startup-code-for-c-and-c/). The processor does not call `main()` directly.

## Reset_Handler: The Entry Point

`Reset_Handler` must prepare the C runtime environment before calling `main()`. Here is the sequence:

```
Power On
  |
  v
[Load SP from 0x0000_0000]
  |
  v
[Jump to Reset_Handler at 0x0000_0004]
  |
  v
[Copy .data from Flash to SRAM]
  |
  v
[Zero out .bss in SRAM]
  |
  v
[Call SystemInit() -- configure clocks]
  |
  v
[Call __libc_init_array() -- C++ constructors]
  |
  v
[Call main()]
  |
  v
[Infinite loop if main() returns]
```

## Copying .data from Flash to SRAM (LMA to VMA)

Initialized global variables (like `int count = 42;`) need their initial values at runtime. These values are stored in flash (the **Load Memory Address**, LMA) but must live in SRAM at runtime (the **Virtual Memory Address**, VMA), as demonstrated in [Making it to Main](https://vivonomicon.com/2018/04/20/bare-metal-stm32-programming-part-2-making-it-to-main/).

The startup code copies this block from flash to SRAM using symbols defined by the linker script:

- `_sidata` -- start of .data in flash (source)
- `_sdata` -- start of .data in SRAM (destination)
- `_edata` -- end of .data in SRAM

<!-- tabs -->
```c
/* Copy .data section from Flash to SRAM */
uint32_t *src = &_sidata;
uint32_t *dst = &_sdata;
while (dst < &_edata) {
    *dst++ = *src++;
}
```

```rust
// Copy .data section from Flash to SRAM
unsafe {
    let mut src = &_sidata as *const u32;
    let mut dst = &_sdata as *const u32 as *mut u32;
    let end = &_edata as *const u32;
    while (dst as *const u32) < end {
        core::ptr::write_volatile(dst, core::ptr::read_volatile(src));
        src = src.add(1);
        dst = dst.add(1);
    }
}

// Idiomatic alternative using cortex-m-rt crate:
// The #[entry] macro and cortex-m-rt runtime handle
// .data copy and .bss zeroing automatically.
```
<!-- /tabs -->

## Zeroing the .bss Section

Uninitialized globals (like `int buffer[256];`) go in the `.bss` section. The C standard requires them to be zero at startup. Rather than storing a block of zeros in flash, the startup code fills `.bss` with zeros:

<!-- tabs -->
```c
/* Zero-fill .bss section */
uint32_t *bss = &_sbss;
while (bss < &_ebss) {
    *bss++ = 0;
}
```

```rust
// Zero-fill .bss section
unsafe {
    let mut bss = &_sbss as *const u32 as *mut u32;
    let end = &_ebss as *const u32;
    while (bss as *const u32) < end {
        core::ptr::write_volatile(bss, 0);
        bss = bss.add(1);
    }
}
```
<!-- /tabs -->

## Initializing the Clock (SystemInit)

Most Cortex-M chips start up on an internal RC oscillator running at a low frequency (e.g., 8 MHz on STM32). `SystemInit()` is typically a CMSIS-provided function that:

- Configures the flash wait states
- Enables the HSE (High-Speed External) oscillator if present
- Configures the PLL to multiply the clock up (e.g., to 72 MHz or 168 MHz)
- Switches the system clock source

This step is optional in the simplest programs -- the MCU will run on its default internal oscillator. But any real application needs a stable, known clock frequency.

## Calling __libc_init_array (C++ Constructors)

If your project uses C++, global objects need their constructors called before `main()`. The compiler generates a table of constructor function pointers in the `.init_array` section. `__libc_init_array()` iterates through this table and calls each one.

Even in pure C projects, this call is often included because some toolchain features (like `__attribute__((constructor))` functions) depend on it.

## Calling main()

After all initialization is complete, the startup code calls `main()`. If `main()` ever returns, the startup code enters an infinite loop to prevent the processor from executing garbage instructions:

<!-- tabs -->
```c
main();
while (1);  /* Trap: main() should never return */
```

```rust
// In Rust embedded, main() returns `-> !` (never type),
// so the compiler enforces it never returns.
#[entry]
fn main() -> ! {
    // ... application code ...
    loop {}  // Required: must diverge
}
```
<!-- /tabs -->

## Example: Startup Code in C

<!-- tabs -->
```c
/* Symbols defined by the linker script */
extern uint32_t _sidata, _sdata, _edata;
extern uint32_t _sbss, _ebss;
extern uint32_t _estack;

/* Prototypes */
void Reset_Handler(void);
void Default_Handler(void);
int main(void);
void SystemInit(void);
extern void __libc_init_array(void);

void Reset_Handler(void) {
    /* 1. Copy .data from Flash to SRAM */
    uint32_t *src = &_sidata;
    uint32_t *dst = &_sdata;
    while (dst < &_edata) {
        *dst++ = *src++;
    }

    /* 2. Zero-fill .bss */
    dst = &_sbss;
    while (dst < &_ebss) {
        *dst++ = 0;
    }

    /* 3. Configure system clock */
    SystemInit();

    /* 4. Call static constructors */
    __libc_init_array();

    /* 5. Enter application */
    main();

    /* 6. Trap if main returns */
    while (1);
}

void Default_Handler(void) {
    while (1);  /* Unhandled interrupt -- halt */
}
```

```rust
// In Rust embedded, the cortex-m-rt crate handles startup automatically.
// It provides: .data copy, .bss zeroing, FPU init, and calls main().
// You just write your entry point:

#![no_std]
#![no_main]

use cortex_m_rt::entry;
use panic_halt as _; // panic handler

#[entry]
fn main() -> ! {
    // cortex-m-rt has already:
    //   1. Copied .data from Flash to SRAM
    //   2. Zeroed .bss
    //   3. Initialized the FPU (if present)
    //   4. Called pre_init() (if defined)

    // Your application starts here
    loop {}
}

// For a fully manual Reset_Handler (no cortex-m-rt):
#[no_mangle]
pub unsafe extern "C" fn Reset_Handler() -> ! {
    extern "C" {
        static _sidata: u32;
        static mut _sdata: u32;
        static _edata: u32;
        static mut _sbss: u32;
        static _ebss: u32;
    }

    // 1. Copy .data from Flash to SRAM
    let mut src = &_sidata as *const u32;
    let mut dst = &mut _sdata as *mut u32;
    let end = &_edata as *const u32;
    while (dst as *const u32) < end {
        core::ptr::write(dst, core::ptr::read(src));
        src = src.add(1);
        dst = dst.add(1);
    }

    // 2. Zero-fill .bss
    let mut bss = &mut _sbss as *mut u32;
    let bss_end = &_ebss as *const u32;
    while (bss as *const u32) < bss_end {
        core::ptr::write(bss, 0);
        bss = bss.add(1);
    }

    // 3. Enter application (never returns)
    extern "Rust" { fn main() -> !; }
    main()
}
```
<!-- /tabs -->

## Example: Startup Code in Assembly (GNU AS)

```armasm
.syntax unified
.cpu cortex-m3
.thumb

.global Reset_Handler
.type Reset_Handler, %function

Reset_Handler:
    /* Copy .data from Flash (LMA) to SRAM (VMA) */
    ldr r0, =_sdata       /* destination start */
    ldr r1, =_edata       /* destination end */
    ldr r2, =_sidata      /* source start (in flash) */
copy_data:
    cmp r0, r1
    bge zero_bss
    ldr r3, [r2], #4
    str r3, [r0], #4
    b copy_data

zero_bss:
    /* Zero-fill .bss */
    ldr r0, =_sbss
    ldr r1, =_ebss
    movs r2, #0
fill_bss:
    cmp r0, r1
    bge call_main
    str r2, [r0], #4
    b fill_bss

call_main:
    bl SystemInit
    bl __libc_init_array
    bl main
    b .                    /* infinite loop */

.size Reset_Handler, .-Reset_Handler
```

## Key Takeaways

- The processor loads SP and jumps to `Reset_Handler` automatically -- you never set the stack pointer in startup code.
- The `.data` copy and `.bss` zero are essential. Without them, your global variables contain garbage.
- `SystemInit` is not part of the C language -- it is a CMSIS convention for clock setup.
- If you forget `__libc_init_array` in a C++ project, global objects will not be constructed.

## References

1. [ARM Cortex-M Startup Code for C and C++ - AllThingsEmbedded](https://allthingsembedded.com/post/2019-01-03-arm-cortex-m-startup-code-for-c-and-c/) — Detailed explanation of Reset_Handler and runtime initialization
2. [What Happens Before main() - Understanding the Startup File](https://medium.com/@ragagr116/what-happens-before-main-understanding-the-startup-file-on-arm-cortex-m-46c9f55e1a6b) — Overview of pre-main initialization on Cortex-M
3. [Bare Metal STM32 Programming Part 2: Making it to Main](https://vivonomicon.com/2018/04/20/bare-metal-stm32-programming-part-2-making-it-to-main/) — Practical walkthrough of .data copy and .bss zeroing
4. [Run a C Program Bare Metal on ARM Cortex-M3](https://jacobmossberg.se/posts/2018/08/11/run-c-program-bare-metal-on-arm-cortex-m3.html) — End-to-end example of startup code on Cortex-M3

## Related Topics

- [Vector Table](vector-table.md) -- the structure that tells the CPU where `Reset_Handler` is
- [Linker Scripts in Practice](linker-scripts-in-practice.md) -- defines the symbols startup code uses
- [Boot Process Deep Dive](boot-process-deep-dive.md) -- the full power-on sequence
