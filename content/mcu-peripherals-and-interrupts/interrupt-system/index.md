---
title: "Interrupt System"
created: 2026-03-08
updated: 2026-03-08
tags: [interrupts, nvic, isr, cortex-m, stm32]
status: draft
sources:
  - url: "https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic"
    title: "A Practical Guide to ARM Cortex-M Exception Handling"
  - url: "https://microcontrollerslab.com/nested-vectored-interrupt-controller-nvic-arm-cortex-m/"
    title: "Nested Vectored Interrupt Controller (NVIC) ARM Cortex-M"
---

## Why Interrupts?

Without interrupts, the only way to detect events is **polling** -- sitting in a loop checking a flag. This wastes CPU cycles and makes it impossible to respond quickly to multiple events.

<!-- tabs -->
```c
// Polling: CPU does nothing but wait
while (!(USART2->SR & USART_SR_RXNE)) { }
char c = USART2->DR;
```

```rust
use core::ptr::read_volatile;

const USART2_SR: *const u32 = 0x4000_4400 as *const u32;
const USART2_DR: *const u32 = (0x4000_4400 + 0x04) as *const u32;

// Polling: CPU does nothing but wait
unsafe {
    while read_volatile(USART2_SR) & (1 << 5) == 0 {}  // RXNE
    let c = read_volatile(USART2_DR) as u8;
}
```
<!-- /tabs -->

With interrupts, the hardware **signals the CPU** when something happens. The CPU stops what it is doing, runs a short handler (ISR), then returns to its previous task. Between events, the CPU can do useful work or enter a low-power sleep mode.

<!-- tabs -->
```c
// Interrupt: CPU is free until data arrives
void USART2_IRQHandler(void) {
    if (USART2->SR & USART_SR_RXNE) {
        buffer[head++] = USART2->DR;  // handle event
    }
}
```

```rust
use core::ptr::read_volatile;

static mut BUFFER: [u8; 256] = [0; 256];
static mut HEAD: usize = 0;

const USART2_SR: *const u32 = 0x4000_4400 as *const u32;
const USART2_DR: *const u32 = (0x4000_4400 + 0x04) as *const u32;

// Interrupt: CPU is free until data arrives
#[no_mangle]
pub unsafe extern "C" fn USART2_IRQHandler() {
    if read_volatile(USART2_SR) & (1 << 5) != 0 {  // RXNE
        BUFFER[HEAD] = read_volatile(USART2_DR) as u8;
        HEAD += 1;
    }
}
```
<!-- /tabs -->

## How a Hardware Signal Becomes an ISR Call

```
1. Peripheral detects event (e.g., byte received)
2. Peripheral sets its interrupt flag (RXNE in USART_SR)
3. If peripheral interrupt enable bit is set (RXNEIE in CR1)
   --> peripheral asserts its IRQ line to NVIC
4. NVIC checks: is this IRQ enabled? is its priority high enough?
5. If yes: CPU stacks current context (8 registers) automatically
6. CPU loads PC from vector table entry for this IRQ
7. ISR executes
8. ISR returns via special EXC_RETURN value
9. CPU unstacks context and resumes previous code
```

## Interrupt Latency

The time from the peripheral event to the first ISR instruction is called **interrupt latency**. On Cortex-M3/M4, this is deterministic: [**12 clock cycles**](https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic) (for zero-wait-state memory).

This includes:
- Recognizing the pending interrupt
- Stacking 8 registers (R0-R3, R12, LR, PC, xPSR)
- Fetching the vector table entry
- Loading the ISR address into PC

Optimizations like **tail-chaining** and **late-arriving** can reduce latency further for back-to-back interrupts.

## The Big Picture

The interrupt system on Cortex-M has several interconnected parts:

```
Peripheral                NVIC                    CPU Core
+----------+         +-----------+          +------------------+
| UART IRQ |-------->| Enable    |          | Vector Table     |
| TIM IRQ  |-------->| Priority  |--------->| Context Switch   |
| EXTI IRQ |-------->| Pending   |          | ISR Execution    |
| DMA IRQ  |-------->|           |          | EXC_RETURN       |
+----------+         +-----------+          +------------------+
                          |
                     Priority Grouping
                     (AIRCR.PRIGROUP)
```

## Child Pages

- [NVIC Architecture](nvic-architecture.md) -- registers, EXTI, enabling interrupts
- [Priority and Preemption](priority-and-preemption.md) -- priority levels, grouping, nesting
- [ISR Design Patterns](isr-design-patterns.md) -- writing safe, efficient interrupt handlers
- [Context Switching Mechanics](context-switching-mechanics.md) -- stacking, EXC_RETURN, tail-chaining
- [Exceptions and Faults](exceptions-and-faults.md) -- HardFault, BusFault, debugging crashes

## References

1. [A Practical Guide to ARM Cortex-M Exception Handling](https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic) — In-depth guide to exception handling, latency, and NVIC operation
2. [Nested Vectored Interrupt Controller (NVIC) ARM Cortex-M](https://microcontrollerslab.com/nested-vectored-interrupt-controller-nvic-arm-cortex-m/) — Overview of NVIC features and interrupt flow

## Related Topics

- [GPIO](../gpio-register-level.md) -- EXTI interrupts on pin edges
- [Timers](../timers-and-counters.md) -- timer update interrupts
- [UART](../uart-serial.md) -- RXNE/TXE interrupts
