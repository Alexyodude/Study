---
title: "SRAM"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, sram, memory, data-section, bss, stack, heap]
status: draft
sources:
  - url: "https://blog.thea.codes/the-most-thoroughly-commented-linker-script/"
    title: "The Most Thoroughly Commented Linker Script"
  - url: "https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/"
    title: "Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
---

## What SRAM Is

**Static RAM (SRAM)** is the fast, volatile memory inside an MCU used for runtime data. "Volatile" means it loses its contents when power is removed. "Static" means each bit is held by a flip-flop circuit that retains its value as long as power is applied -- no periodic refresh needed.

On STM32 devices, SRAM starts at address `0x2000_0000`.

## SRAM vs DRAM

Desktop computers use **DRAM** (Dynamic RAM). MCUs use **SRAM**. Here's why:

| Feature | SRAM | DRAM |
|---|---|---|
| Cell structure | 6 transistors (flip-flop) | 1 transistor + 1 capacitor |
| Refresh needed | No | Yes (every few ms) |
| Speed | Very fast (0 wait states) | Fast but needs refresh cycles |
| Density | Low (larger cells) | High (smaller cells) |
| Cost per bit | Expensive | Cheap |
| Typical MCU size | 2 KB -- 512 KB | Not used in MCUs |
| Typical PC size | CPU cache (MB) | Main memory (GB) |

SRAM is used in MCUs because it's simple (no refresh controller needed), fast (the CPU can read/write in a single cycle), and the quantities are small enough that cost isn't prohibitive.

## What Lives in SRAM

SRAM holds four main types of data, each placed in a specific [**linker section**](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/):

### .data Section (Initialized Globals)

Global and static variables with explicit initial values.

<!-- tabs -->
```c
int counter = 42;           // .data -- stored in SRAM, initialized to 42
static float scale = 3.14f; // .data
```

```rust
static mut COUNTER: i32 = 42;        // .data -- stored in SRAM, initialized to 42
static mut SCALE: f32 = 3.14;        // .data
// Note: accessing `static mut` requires `unsafe` in Rust
```
<!-- /tabs -->

The initial values are stored in **flash** (since SRAM is empty at power-on). The startup code copies them from flash to SRAM before `main()` runs.

### .bss Section (Zero-Initialized Globals)

Global and static variables that are zero or have no explicit initializer.

<!-- tabs -->
```c
int error_count;             // .bss -- zero-initialized
static char buffer[256];     // .bss -- zero-initialized
```

```rust
static mut ERROR_COUNT: i32 = 0;          // .bss -- zero-initialized
static mut BUFFER: [u8; 256] = [0; 256];  // .bss -- zero-initialized
```
<!-- /tabs -->

The `.bss` section doesn't occupy space in flash -- the linker just records its size. The startup code fills this region with zeros.

### Stack

The call stack for function calls, local variables, and interrupt context. Grows downward from the top of SRAM.

<!-- tabs -->
```c
void process(void) {
    uint8_t local_buf[64];   // 64 bytes on the stack
    int result;              // 4 bytes on the stack
    // ...
}
```

```rust
fn process() {
    let local_buf: [u8; 64] = [0; 64];  // 64 bytes on the stack
    let result: i32;                      // 4 bytes on the stack
    // ...
}
```
<!-- /tabs -->

See: [Stack Pointer and Call Stack](../stack-pointer-and-call-stack.md)

### Heap

Dynamically allocated memory (`malloc`, `calloc`). Grows upward from the end of `.bss`.

<!-- tabs -->
```c
char *p = malloc(128);       // 128 bytes from heap
```

```rust
// Heap allocation in embedded Rust requires a global allocator
// (e.g., embedded-alloc crate) and #![feature(alloc)] or alloc crate:
extern crate alloc;
use alloc::vec;

let p = vec![0u8; 128];     // 128 bytes from heap

// Most embedded Rust projects avoid heap allocation entirely,
// preferring stack-allocated buffers or static pools.
```
<!-- /tabs -->

In embedded systems, heap usage is often avoided or carefully controlled because `malloc` can fragment memory and fail unpredictably.

## SRAM Layout in Memory

```
  0x2000_0000  +------------------+
               |     .data        |  Initialized globals (copied from flash)
               +------------------+
               |     .bss         |  Zero-initialized globals
               +------------------+
               |     Heap  -->    |  Grows upward (malloc)
               |                  |
               |   (free space)   |
               |                  |
               |     <-- Stack    |  Grows downward (PUSH)
  0x2000_XXXX  +------------------+  <-- Initial SP (_estack)
```

If the heap and stack grow toward each other and collide, you get memory corruption with no warning (unless you use an MPU or stack canary).

## Typical SRAM Sizes

| MCU | SRAM | Flash | Notes |
|---|---|---|---|
| STM32F030F4 | 4 KB | 16 KB | Ultra low-cost Cortex-M0 |
| STM32F103C8 | 20 KB | 64 KB | Popular "Blue Pill" |
| STM32F401RE | 96 KB | 512 KB | Mid-range Cortex-M4 |
| STM32F407VG | 192 KB | 1 MB | High-performance Cortex-M4 |
| STM32H743 | 1 MB | 2 MB | Cortex-M7, includes TCM |

Some MCUs have **multiple SRAM banks** (SRAM1, SRAM2, CCM) at different addresses, allowing simultaneous access by the CPU and DMA without bus contention.

## Zero Wait State Access

SRAM operates at the full CPU clock speed with **zero wait states**. This is a major advantage over flash at high clock speeds:

```
  Instruction in Flash (168 MHz, 5 wait states):
    Fetch takes ~6 cycles (mitigated by cache/prefetch)

  Data in SRAM (168 MHz, 0 wait states):
    Load/store takes 1 cycle
```

This is why performance-critical data (lookup tables, buffers, DMA targets) should be in SRAM, and why some developers copy critical code to SRAM for execution.

## Startup Code: Initializing SRAM

At reset, SRAM contains random garbage. The [startup code](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) (typically in a file called `startup_stm32xxxx.s` or `crt0.s`) runs before `main()` to prepare SRAM:

<!-- tabs -->
```c
// Pseudocode of what startup code does:

// 1. Copy .data from flash (LMA) to SRAM (VMA)
extern uint32_t _sidata;  // Source: flash address (LMA)
extern uint32_t _sdata;   // Destination start: SRAM address
extern uint32_t _edata;   // Destination end

uint32_t *src = &_sidata;
uint32_t *dst = &_sdata;
while (dst < &_edata) {
    *dst++ = *src++;
}

// 2. Zero out .bss
extern uint32_t _sbss;
extern uint32_t _ebss;

dst = &_sbss;
while (dst < &_ebss) {
    *dst++ = 0;
}

// 3. Call main()
main();
```

```rust
// In Rust embedded (#![no_std] + cortex-m-rt), the startup code is
// provided by the cortex-m-rt crate. It handles .data copy and .bss
// zeroing automatically before calling your #[entry] function.

// You just write:
use cortex_m_rt::entry;

#[entry]
fn main() -> ! {
    // .data is already copied, .bss is already zeroed
    // by cortex-m-rt's Reset handler
    loop {}
}

// The linker script (memory.x) defines _sidata, _sdata, _edata,
// _sbss, _ebss -- cortex-m-rt's assembly startup reads these.
```
<!-- /tabs -->

These symbols (`_sidata`, `_sdata`, `_edata`, `_sbss`, `_ebss`) are defined by the linker script.

## Backup SRAM

Some STM32 devices (F4, F7, H7) include a small **Backup SRAM** (typically 4 KB) powered by the VBAT pin. This SRAM retains its contents during standby mode or even when the main power supply is removed (if a battery is connected to VBAT). Useful for storing critical state across resets.

## References

1. [The Most Thoroughly Commented Linker Script](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/) — Linker section placement and SRAM initialization explained
2. [Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) — Startup code and SRAM data initialization on STM32
3. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Memory model and SRAM addressing in Cortex-M

## Related Topics

- [Flash Memory](flash-memory.md) -- where .data initial values are stored
- [Memory Layout and Linker Scripts](memory-layout-and-linker-scripts.md) -- how sections are placed
- [Stack Pointer and Call Stack](../stack-pointer-and-call-stack.md) -- stack lives in SRAM
- [Memory-Mapped I/O](memory-mapped-io.md) -- peripheral registers in a different address range
