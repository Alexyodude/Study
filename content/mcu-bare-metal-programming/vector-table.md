---
title: "Vector Table"
created: 2026-03-08
updated: 2026-03-08
tags: [vector-table, interrupts, exceptions, cortex-m, NVIC, VTOR]
status: draft
sources:
  - url: "https://allthingsembedded.com/post/2019-01-03-arm-cortex-m-startup-code-for-c-and-c/"
    title: "ARM Cortex-M Startup Code for C and C++ - AllThingsEmbedded"
  - url: "https://github.com/cpq/bare-metal-programming-guide"
    title: "Bare Metal Programming Guide - GitHub"
  - url: "https://developer.arm.com/documentation/100941/latest/Barriers"
    title: "ARM Documentation - Barriers"
  - url: "https://metebalci.com/blog/demystifying-arm-cortex-m33-bare-metal-startup/"
    title: "Demystifying ARM Cortex-M33 Bare Metal Startup"
---

## What the Vector Table Is

The [vector table](https://allthingsembedded.com/post/2019-01-03-arm-cortex-m-startup-code-for-c-and-c/) is an array of 32-bit values stored at the very beginning of flash memory. Each entry is either an address of an exception/interrupt handler function or the initial stack pointer value. When an exception or interrupt fires, the processor looks up the corresponding entry in the vector table and branches to that address.

On ARM Cortex-M, the vector table must start at address `0x00000000` (or wherever the VTOR register points). It is the first thing the processor reads after reset.

## Structure: Array of Function Pointers

Conceptually, the vector table is just an array:

<!-- tabs -->
```c
typedef void (*vector_fn)(void);

vector_fn vector_table[] = {
    (vector_fn) &_estack,     /* Entry 0: Initial SP */
    Reset_Handler,             /* Entry 1: Reset */
    NMI_Handler,               /* Entry 2: NMI */
    HardFault_Handler,         /* Entry 3: Hard Fault */
    /* ... more entries ... */
};
```

```rust
// In Rust, cortex-m-rt defines the vector table via attributes.
// Exception handlers are declared with #[exception]:
use cortex_m_rt::{entry, exception};

#[exception]
unsafe fn HardFault(_frame: &cortex_m_rt::ExceptionFrame) -> ! {
    loop {}
}

#[exception]
fn SysTick() {
    // SysTick handler
}

// For a manual vector table without cortex-m-rt:
#[link_section = ".isr_vector"]
#[no_mangle]
pub static VECTOR_TABLE: [unsafe extern "C" fn(); 4] = [
    // Entry 0: Initial SP (cast from address)
    unsafe { core::mem::transmute::<u32, unsafe extern "C" fn()>(0x2000_5000) },
    Reset_Handler,
    NMI_Handler,
    HardFault_Handler,
];
```
<!-- /tabs -->

## Entry 0: Initial Stack Pointer

The first entry is special -- it is not a function pointer. It holds the initial value of the stack pointer (SP). On Cortex-M, the stack grows downward, so this is typically set to the top of SRAM:

```
Entry 0:  0x2000_5000   <-- top of 20 KB SRAM (0x2000_0000 + 0x5000)
```

When the processor resets, it loads this value into the SP register before executing any code. You never need to set SP manually in your startup code.

## Entry 1: Reset_Handler Address

The second entry is the address of the `Reset_Handler` function. After loading the SP, the processor fetches this address and branches to it. This is the true entry point of your firmware.

## System Exceptions (Entries 2-15)

Entries 2 through 15 are ARM-defined system exceptions, identical across all Cortex-M devices:

| Entry | IRQ # | Exception | Description |
|-------|-------|-----------|-------------|
| 0 | -- | -- | Initial Stack Pointer |
| 1 | -15 | Reset | Reset vector |
| 2 | -14 | NMI | Non-Maskable Interrupt |
| 3 | -13 | HardFault | All fault classes (if others disabled) |
| 4 | -12 | MemManage | Memory protection fault (M3/M4/M7) |
| 5 | -11 | BusFault | Bus error (M3/M4/M7) |
| 6 | -10 | UsageFault | Undefined instruction, alignment (M3/M4/M7) |
| 7-10 | -- | Reserved | -- |
| 11 | -5 | SVCall | Supervisor call (SVC instruction) |
| 12 | -4 | DebugMonitor | Debug monitor (M3/M4/M7) |
| 13 | -- | Reserved | -- |
| 14 | -2 | PendSV | Pendable request for system service |
| 15 | -1 | SysTick | System tick timer |

Cortex-M0/M0+ only implement HardFault (entries 4-6 and 12 are reserved).

## External Interrupts (Entry 16+)

Starting at entry 16, the vector table contains peripheral-specific interrupt handlers. These are defined by the chip vendor, not by ARM. For example, on STM32F103:

| Entry | IRQ # | Handler | Source |
|-------|-------|---------|--------|
| 16 | 0 | WWDG_IRQHandler | Window Watchdog |
| 17 | 1 | PVD_IRQHandler | Power voltage detect |
| 18 | 2 | TAMPER_IRQHandler | Tamper detection |
| ... | ... | ... | ... |
| 43 | 27 | USART1_IRQHandler | USART1 global |

The total number of external interrupts varies by chip -- typically 16 to 240.

## VTOR Register: Relocating the Vector Table

By default, the processor expects the vector table at address `0x00000000`. The [**Vector Table Offset Register** (VTOR)](https://metebalci.com/blog/demystifying-arm-cortex-m33-bare-metal-startup/) at address `0xE000ED08` lets you move it:

<!-- tabs -->
```c
/* Relocate vector table to start of SRAM */
SCB->VTOR = 0x20000000;
```

```rust
// Relocate vector table to start of SRAM
unsafe {
    let scb = &*cortex_m::peripheral::SCB::PTR;
    scb.vtor.write(0x2000_0000);
}
```
<!-- /tabs -->

Common reasons to relocate the vector table:

- **Bootloader to application jump** -- the application's vector table is at a flash offset (e.g., `0x08008000`), not at `0x08000000`.
- **RAM-based vector table** -- faster to update at runtime, useful for dynamically changing interrupt handlers.

The VTOR value must be aligned to the next power-of-two that is greater than or equal to the table size. For most devices, 256-byte or 512-byte alignment is required.

## Weak Aliases and the Override Pattern

The standard pattern uses **weak** function attributes so that default handlers can be overridden:

<!-- tabs -->
```c
/* Default handler: infinite loop */
void Default_Handler(void) {
    while (1);
}

/* Declare all handlers as weak aliases of Default_Handler */
void NMI_Handler(void)       __attribute__((weak, alias("Default_Handler")));
void HardFault_Handler(void) __attribute__((weak, alias("Default_Handler")));
void SVC_Handler(void)       __attribute__((weak, alias("Default_Handler")));
void PendSV_Handler(void)    __attribute__((weak, alias("Default_Handler")));
void SysTick_Handler(void)   __attribute__((weak, alias("Default_Handler")));
void USART1_IRQHandler(void) __attribute__((weak, alias("Default_Handler")));
/* ... all other IRQ handlers ... */
```

```rust
// In Rust with cortex-m-rt, the weak alias pattern is built in.
// cortex-m-rt provides DefaultHandler as a catch-all.
// Override specific handlers with the #[exception] or #[interrupt] attribute:

use cortex_m_rt::exception;

// Default handler for all unhandled exceptions/interrupts
#[exception]
unsafe fn DefaultHandler(_irqn: i16) {
    loop {} // Halt on unhandled interrupt
}

// Override a specific system exception (replaces weak alias)
#[exception]
fn SysTick() {
    // Your SysTick handler
}

// Override a specific peripheral interrupt
use stm32f1::stm32f103::interrupt;

#[interrupt]
fn USART1() {
    // Your USART1 handler
}
```
<!-- /tabs -->

How this works:

1. By default, every interrupt vector points to `Default_Handler` (an infinite loop).
2. When you define `void USART1_IRQHandler(void) { ... }` in your application code, the linker uses your **strong** definition instead of the weak alias.
3. Any unhandled interrupt safely traps in the default loop instead of crashing unpredictably.

## Example: Complete Vector Table in C (STM32F103)

<!-- tabs -->
```c
#include <stdint.h>

/* Linker-provided symbol */
extern uint32_t _estack;

/* Reset handler (defined in startup.c) */
void Reset_Handler(void);

/* Default handler for unimplemented interrupts */
void Default_Handler(void) {
    while (1);
}

/* System exception handlers -- weak aliases */
void NMI_Handler(void)        __attribute__((weak, alias("Default_Handler")));
void HardFault_Handler(void)  __attribute__((weak, alias("Default_Handler")));
void MemManage_Handler(void)  __attribute__((weak, alias("Default_Handler")));
void BusFault_Handler(void)   __attribute__((weak, alias("Default_Handler")));
void UsageFault_Handler(void) __attribute__((weak, alias("Default_Handler")));
void SVC_Handler(void)        __attribute__((weak, alias("Default_Handler")));
void PendSV_Handler(void)     __attribute__((weak, alias("Default_Handler")));
void SysTick_Handler(void)    __attribute__((weak, alias("Default_Handler")));

/* External interrupt handlers -- weak aliases (subset shown) */
void USART1_IRQHandler(void)  __attribute__((weak, alias("Default_Handler")));
void TIM2_IRQHandler(void)    __attribute__((weak, alias("Default_Handler")));
void EXTI0_IRQHandler(void)   __attribute__((weak, alias("Default_Handler")));

/* Vector table -- placed in .isr_vector by linker script */
__attribute__((section(".isr_vector")))
const uint32_t g_pfnVectors[] = {
    (uint32_t) &_estack,           /* Initial SP */
    (uint32_t) Reset_Handler,      /* Reset */
    (uint32_t) NMI_Handler,        /* NMI */
    (uint32_t) HardFault_Handler,  /* Hard Fault */
    (uint32_t) MemManage_Handler,  /* Mem Manage */
    (uint32_t) BusFault_Handler,   /* Bus Fault */
    (uint32_t) UsageFault_Handler, /* Usage Fault */
    0, 0, 0, 0,                    /* Reserved */
    (uint32_t) SVC_Handler,        /* SVCall */
    0, 0,                          /* Reserved */
    (uint32_t) PendSV_Handler,     /* PendSV */
    (uint32_t) SysTick_Handler,    /* SysTick */
    /* External interrupts (IRQ 0...) */
    (uint32_t) EXTI0_IRQHandler,   /* EXTI Line 0 */
    /* ... additional IRQ handlers ... */
    (uint32_t) USART1_IRQHandler,  /* USART1 */
    (uint32_t) TIM2_IRQHandler,    /* TIM2 */
};
```

```rust
// With cortex-m-rt, the vector table is generated automatically.
// You only define the handlers you need — all others default to
// DefaultHandler (an infinite loop, unless you override it).

#![no_std]
#![no_main]

use cortex_m_rt::{entry, exception};
use stm32f1::stm32f103::interrupt;
use panic_halt as _;

#[entry]
fn main() -> ! {
    loop {}
}

// System exceptions — override only the ones you handle
#[exception]
unsafe fn HardFault(_frame: &cortex_m_rt::ExceptionFrame) -> ! {
    loop {}
}

#[exception]
fn SysTick() {
    // SysTick handler
}

// Peripheral interrupts — override only the ones you handle
#[interrupt]
fn USART1() {
    // USART1 handler
}

#[interrupt]
fn TIM2() {
    // TIM2 handler
}

// cortex-m-rt places the vector table in .vector_table section
// automatically with all the correct entries and weak defaults.
```
<!-- /tabs -->

The `__attribute__((section(".isr_vector")))` places the table in a named section. The linker script uses `KEEP()` to prevent it from being garbage-collected, and places it at the very start of flash.

## References

1. [ARM Cortex-M Startup Code for C and C++ - AllThingsEmbedded](https://allthingsembedded.com/post/2019-01-03-arm-cortex-m-startup-code-for-c-and-c/) — Vector table layout and weak alias pattern for handlers
2. [Bare Metal Programming Guide - GitHub](https://github.com/cpq/bare-metal-programming-guide) — Practical example of vector table implementation in C
3. [ARM Documentation - Barriers](https://developer.arm.com/documentation/100941/latest/Barriers) — ARM reference on memory barriers used with VTOR
4. [Demystifying ARM Cortex-M33 Bare Metal Startup](https://metebalci.com/blog/demystifying-arm-cortex-m33-bare-metal-startup/) — VTOR relocation and startup on newer Cortex-M cores

## Related Topics

- [Startup Code](startup-code.md) -- the Reset_Handler that the vector table points to
- [Linker Scripts in Practice](linker-scripts-in-practice.md) -- how `.isr_vector` gets placed at address 0
- [Boot Process Deep Dive](boot-process-deep-dive.md) -- the full reset sequence
