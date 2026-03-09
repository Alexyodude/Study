---
title: "NVIC Architecture"
created: 2026-03-08
updated: 2026-03-08
tags: [nvic, exti, interrupts, cortex-m, stm32, registers]
status: draft
sources:
  - url: "https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic"
    title: "A Practical Guide to ARM Cortex-M Exception Handling"
  - url: "https://arm-software.github.io/CMSIS_6/v6.0.0/Core/group__NVIC__gr.html"
    title: "CMSIS-Core: Interrupts and Exceptions (NVIC)"
  - url: "https://microcontrollerslab.com/nested-vectored-interrupt-controller-nvic-arm-cortex-m/"
    title: "Nested Vectored Interrupt Controller (NVIC) ARM Cortex-M"
---

The **NVIC (Nested Vectored Interrupt Controller)** is built into every ARM Cortex-M core. It manages all external interrupts (from peripherals) and determines which ISR runs based on priority. "Nested" means a higher-priority interrupt can preempt a lower-priority one that is already running.

## NVIC Register Groups

All NVIC registers are [memory-mapped starting at `0xE000E100`](https://arm-software.github.io/CMSIS_6/v6.0.0/Core/group__NVIC__gr.html). Each register set has one bit (or byte) per interrupt line.

### ISER -- Interrupt Set-Enable Registers

Address: `0xE000E100 - 0xE000E13C`

Writing a **1** to a bit enables that interrupt. Writing 0 has no effect (write-1-to-set design).

<!-- tabs -->
```c
// Enable USART2 interrupt (IRQ #38 on STM32F4)
NVIC->ISER[1] |= (1 << (38 - 32));  // ISER[1], bit 6

// Or use CMSIS helper:
NVIC_EnableIRQ(USART2_IRQn);
```

```rust
use core::ptr::{read_volatile, write_volatile};

const NVIC_ISER1: *mut u32 = (0xE000_E100 + 0x04) as *mut u32;

unsafe {
    // Enable USART2 interrupt (IRQ #38 on STM32F4)
    write_volatile(NVIC_ISER1, read_volatile(NVIC_ISER1) | (1 << (38 - 32)));
}

// Or with cortex-m crate:
// unsafe { cortex_m::peripheral::NVIC::unmask(stm32f4::Interrupt::USART2); }
```
<!-- /tabs -->

### ICER -- Interrupt Clear-Enable Registers

Address: `0xE000E180 - 0xE000E1BC`

Writing a **1** disables that interrupt. Symmetric to ISER.

<!-- tabs -->
```c
NVIC_DisableIRQ(USART2_IRQn);
```

```rust
use core::ptr::{read_volatile, write_volatile};

const NVIC_ICER1: *mut u32 = (0xE000_E180 + 0x04) as *mut u32;

unsafe {
    write_volatile(NVIC_ICER1, 1 << (38 - 32)); // write-1-to-clear-enable
}

// Or with cortex-m crate:
// cortex_m::peripheral::NVIC::mask(stm32f4::Interrupt::USART2);
```
<!-- /tabs -->

### ISPR / ICPR -- Set-Pending and Clear-Pending

Address: `0xE000E200` / `0xE000E280`

- **ISPR:** Writing 1 manually pends an interrupt (useful for software-triggered interrupts)
- **ICPR:** Writing 1 clears a pending interrupt

<!-- tabs -->
```c
NVIC_SetPendingIRQ(TIM2_IRQn);    // trigger TIM2 ISR from software
NVIC_ClearPendingIRQ(TIM2_IRQn);  // cancel pending
```

```rust
use core::ptr::write_volatile;

const NVIC_ISPR0: *mut u32 = 0xE000_E200 as *mut u32;
const NVIC_ICPR0: *mut u32 = 0xE000_E280 as *mut u32;
const TIM2_IRQN: u32 = 28;

unsafe {
    write_volatile(NVIC_ISPR0, 1 << TIM2_IRQN);  // trigger TIM2 ISR from software
    write_volatile(NVIC_ICPR0, 1 << TIM2_IRQN);  // cancel pending
}

// Or with cortex-m crate:
// cortex_m::peripheral::NVIC::pend(stm32f4::Interrupt::TIM2);
// cortex_m::peripheral::NVIC::unpend(stm32f4::Interrupt::TIM2);
```
<!-- /tabs -->

### IPR -- Interrupt Priority Registers

Address: `0xE000E400 - 0xE000E5EC`

Each interrupt gets **8 bits** for priority, but not all bits are implemented. STM32 typically implements the top 4 bits (16 priority levels). Lower value = higher priority.

<!-- tabs -->
```c
// Set USART2 priority to 2 (out of 0-15)
NVIC_SetPriority(USART2_IRQn, 2);

// Under the hood: NVIC->IPR[38] = (2 << 4);
// (shifted left because only top 4 bits are used)
```

```rust
use core::ptr::write_volatile;

// NVIC IPR registers: one byte per interrupt, at 0xE000E400
const NVIC_IPR_BASE: u32 = 0xE000_E400;

unsafe {
    // Set USART2 (IRQ #38) priority to 2 (out of 0-15)
    let ipr_addr = (NVIC_IPR_BASE + 38) as *mut u8;
    write_volatile(ipr_addr, 2 << 4); // shifted: only top 4 bits used
}

// Or with cortex-m crate:
// unsafe { cortex_m::peripheral::NVIC::unmask(stm32f4::Interrupt::USART2); }
// let mut nvic = unsafe { cortex_m::peripheral::NVIC::steal() };
// unsafe { nvic.set_priority(stm32f4::Interrupt::USART2, 2); }
```
<!-- /tabs -->

## Number of Interrupt Lines

The number varies by MCU:

| Core | Max External IRQs |
|------|--------------------|
| Cortex-M0 | 32 |
| Cortex-M0+ | 32 |
| Cortex-M3 | 240 |
| Cortex-M4 | 240 |
| Cortex-M7 | 240 |

In practice, STM32F4 uses about 82 IRQ lines, STM32F1 about 60.

## EXTI -- External Interrupt Controller

EXTI is a **separate peripheral** (not part of the NVIC) that converts GPIO pin edges into interrupt requests, as covered in the [Memfault exceptions guide](https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic). It sits between the GPIO pins and the NVIC.

```
GPIO Pin --> EXTI line --> NVIC --> CPU
```

### EXTI Registers

| Register | Purpose |
|----------|---------|
| EXTI_IMR | Interrupt mask -- enable/disable each EXTI line |
| EXTI_RTSR | Rising trigger selection |
| EXTI_FTSR | Falling trigger selection |
| EXTI_PR | Pending register -- write 1 to clear |

### Mapping GPIO Pins to EXTI Lines

EXTI line 0 can be PA0, PB0, PC0, etc. -- only one pin per EXTI number. The SYSCFG_EXTICRx registers select which port drives each line.

<!-- tabs -->
```c
// Map PA0 to EXTI line 0
RCC->APB2ENR |= RCC_APB2ENR_SYSCFGEN;       // enable SYSCFG clock
SYSCFG->EXTICR[0] &= ~SYSCFG_EXTICR1_EXTI0; // PA0 (0x0000)

// Configure EXTI0 for rising edge
EXTI->RTSR |= EXTI_RTSR_TR0;   // rising trigger
EXTI->FTSR &= ~EXTI_FTSR_TR0;  // not falling
EXTI->IMR |= EXTI_IMR_MR0;     // unmask EXTI0

// Enable in NVIC
NVIC_EnableIRQ(EXTI0_IRQn);
NVIC_SetPriority(EXTI0_IRQn, 3);
```

```rust
use core::ptr::{read_volatile, write_volatile};

const RCC_APB2ENR: *mut u32 = (0x4002_3800 + 0x44) as *mut u32;
const SYSCFG_EXTICR1: *mut u32 = (0x4001_3800 + 0x08) as *mut u32;
const EXTI_BASE: u32 = 0x4001_3C00;
const EXTI_IMR: *mut u32 = EXTI_BASE as *mut u32;
const EXTI_RTSR: *mut u32 = (EXTI_BASE + 0x08) as *mut u32;
const EXTI_FTSR: *mut u32 = (EXTI_BASE + 0x0C) as *mut u32;

unsafe {
    // Map PA0 to EXTI line 0
    write_volatile(RCC_APB2ENR, read_volatile(RCC_APB2ENR) | (1 << 14)); // SYSCFGEN
    write_volatile(SYSCFG_EXTICR1, read_volatile(SYSCFG_EXTICR1) & !0xF); // PA0

    // Configure EXTI0 for rising edge
    write_volatile(EXTI_RTSR, read_volatile(EXTI_RTSR) | (1 << 0));   // rising trigger
    write_volatile(EXTI_FTSR, read_volatile(EXTI_FTSR) & !(1 << 0));  // not falling
    write_volatile(EXTI_IMR, read_volatile(EXTI_IMR) | (1 << 0));     // unmask EXTI0

    // Enable in NVIC
    let nvic_iser0 = 0xE000_E100 as *mut u32;
    write_volatile(nvic_iser0, 1 << 6);  // EXTI0_IRQn = 6
    let nvic_ipr = (0xE000_E400 + 6) as *mut u8;
    write_volatile(nvic_ipr, 3 << 4);    // priority 3
}
```
<!-- /tabs -->

### EXTI ISR

<!-- tabs -->
```c
void EXTI0_IRQHandler(void) {
    if (EXTI->PR & EXTI_PR_PR0) {
        EXTI->PR = EXTI_PR_PR0;  // clear pending (write 1 to clear!)
        // handle button press on PA0
    }
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const EXTI_PR: *mut u32 = (0x4001_3C00 + 0x14) as *mut u32;

#[no_mangle]
pub unsafe extern "C" fn EXTI0_IRQHandler() {
    if read_volatile(EXTI_PR) & (1 << 0) != 0 {
        write_volatile(EXTI_PR, 1 << 0);  // clear pending (write 1 to clear!)
        // handle button press on PA0
    }
}
```
<!-- /tabs -->

**Important:** EXTI lines 5-9 share one ISR (`EXTI9_5_IRQHandler`), and lines 10-15 share another (`EXTI15_10_IRQHandler`). You must check the pending register inside the ISR to determine which line fired.

## The Three-Level Enable Chain

For a peripheral interrupt to reach the CPU, **all three levels** must be enabled:

```
1. Peripheral level:  USART2->CR1 |= USART_CR1_RXNEIE;  // enable RXNE interrupt
2. NVIC level:        NVIC_EnableIRQ(USART2_IRQn);        // enable in NVIC
3. Global level:      __enable_irq();                      // clear PRIMASK (usually already done)
```

Missing any one of these and the interrupt will never fire.

## References

1. [A Practical Guide to ARM Cortex-M Exception Handling](https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic) — Comprehensive guide to NVIC, EXTI, and exception flow
2. [CMSIS-Core: Interrupts and Exceptions (NVIC)](https://arm-software.github.io/CMSIS_6/v6.0.0/Core/group__NVIC__gr.html) — Official CMSIS API reference for NVIC functions
3. [Nested Vectored Interrupt Controller (NVIC) ARM Cortex-M](https://microcontrollerslab.com/nested-vectored-interrupt-controller-nvic-arm-cortex-m/) — NVIC register overview and interrupt enable chain

## Related Topics

- [Priority and Preemption](priority-and-preemption.md) -- how priority values determine nesting
- [Context Switching](context-switching-mechanics.md) -- what happens when the NVIC activates an ISR
- [GPIO](../gpio-register-level.md) -- EXTI source pins
