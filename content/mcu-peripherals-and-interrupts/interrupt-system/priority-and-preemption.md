---
title: "Priority and Preemption"
created: 2026-03-08
updated: 2026-03-08
tags: [interrupts, priority, preemption, nvic, cortex-m]
status: draft
sources:
  - url: "https://www.ocfreaks.com/interrupt-priority-grouping-arm-cortex-m-nvic/"
    title: "Interrupt Priority Grouping in ARM Cortex-M NVIC"
  - url: "https://community.arm.com/iot/embedded/b/embedded-blog/posts/cutting-through-the-confusion-with-arm-cortex-m-interrupt-priorities"
    title: "Cutting Through the Confusion with Cortex-M Interrupt Priorities"
  - url: "https://developer.arm.com/documentation/dui0646/latest/The-Cortex-M7-Processor/Exception-model/Interrupt-priority-grouping"
    title: "Interrupt Priority Grouping - Cortex-M7"
  - url: "https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic"
    title: "A Practical Guide to ARM Cortex-M Exception Handling"
---

Every interrupt on Cortex-M has a **priority value**. When two interrupts are pending at the same time, the one with the **lower numeric value** (= higher urgency) runs first. A higher-priority interrupt can also **preempt** (interrupt) a lower-priority ISR that is already running.

## Priority Bits

Each interrupt has an 8-bit priority field, but **not all bits are implemented**. The number of implemented bits varies by chip:

| MCU | Implemented Bits | Priority Levels |
|-----|-----------------|-----------------|
| Cortex-M0/M0+ | 2 | 4 (0, 1, 2, 3) |
| STM32F1 (Cortex-M3) | 4 | 16 (0-15) |
| STM32F4 (Cortex-M4) | 4 | 16 (0-15) |
| Some Cortex-M7 | 4-8 | 16-256 |

**Critical rule:** As explained in the [ARM community blog post on interrupt priorities](https://community.arm.com/iot/embedded/b/embedded-blog/posts/cutting-through-the-confusion-with-arm-cortex-m-interrupt-priorities), the implemented bits are always the **most significant** bits. On a 4-bit implementation, priority 0 is stored as `0x00` and priority 15 as `0xF0`. The CMSIS `NVIC_SetPriority()` function handles the shifting for you.

<!-- tabs -->
```c
NVIC_SetPriority(USART2_IRQn, 2);  // priority 2 out of 0-15
// Internally writes 0x20 to the priority register
```

```rust
use core::ptr::write_volatile;

const NVIC_IPR_BASE: u32 = 0xE000_E400;
const USART2_IRQN: u32 = 38;

unsafe {
    let ipr_addr = (NVIC_IPR_BASE + USART2_IRQN) as *mut u8;
    write_volatile(ipr_addr, 2 << 4);  // priority 2, internally writes 0x20
}
```
<!-- /tabs -->

## Priority Grouping: Preemption vs Sub-Priority

The priority field is [split into two parts](https://www.ocfreaks.com/interrupt-priority-grouping-arm-cortex-m-nvic/):

- **Preemption priority (group priority):** Determines whether one interrupt can preempt another
- **Sub-priority:** Breaks ties when multiple interrupts with the same preemption priority are pending simultaneously

The split point is configured by the **PRIGROUP** field in `SCB->AIRCR`.

### PRIGROUP Settings (4 implemented bits example)

| PRIGROUP | Preemption Bits | Sub-Priority Bits | Preemption Levels | Sub Levels |
|----------|----------------|-------------------|-------------------|------------|
| 3 | 4 | 0 | 16 | 1 |
| 4 | 3 | 1 | 8 | 2 |
| 5 | 2 | 2 | 4 | 4 |
| 6 | 1 | 3 | 2 | 8 |
| 7 | 0 | 4 | 1 | 16 |

<!-- tabs -->
```c
// Set priority grouping: 3 bits preemption, 1 bit sub-priority
// PRIGROUP = 4 (for 4 implemented bits)
NVIC_SetPriorityGrouping(4);

// Or directly:
SCB->AIRCR = (SCB->AIRCR & ~SCB_AIRCR_PRIGROUP_Msk)
            | (4 << SCB_AIRCR_PRIGROUP_Pos)
            | (0x5FA << SCB_AIRCR_VECTKEY_Pos);  // key required for write
```

```rust
use core::ptr::{read_volatile, write_volatile};

const SCB_AIRCR: *mut u32 = 0xE000_ED0C as *mut u32;
const PRIGROUP_POS: u32 = 8;
const PRIGROUP_MSK: u32 = 0x7 << PRIGROUP_POS;
const VECTKEY: u32 = 0x05FA << 16;

unsafe {
    // Set priority grouping: 3 bits preemption, 1 bit sub-priority
    let aircr = read_volatile(SCB_AIRCR);
    write_volatile(SCB_AIRCR,
        (aircr & !PRIGROUP_MSK & 0x0000_FFFF)  // preserve non-key bits
        | (4 << PRIGROUP_POS)                    // PRIGROUP = 4
        | VECTKEY);                              // key required for write
}
```
<!-- /tabs -->

## How Preemption Works

**Rule 1:** An ISR can only be preempted by an interrupt with a **numerically lower preemption priority**.

**Rule 2:** If two pending interrupts have the **same preemption priority**, the one with the lower sub-priority runs first -- but it does **not** preempt the other. They run back-to-back.

**Rule 3:** If both preemption and sub-priority are the same, the interrupt with the **lower IRQ number** (earlier in the vector table) wins.

## Example: UART Preempting Timer

Scenario: You want UART RX to preempt a timer ISR (because losing a byte is worse than a slightly delayed timer tick).

<!-- tabs -->
```c
// Setup: PRIGROUP = 3 (all 4 bits are preemption, no sub-priority)
NVIC_SetPriorityGrouping(3);

// Timer interrupt: lower urgency (higher number)
NVIC_SetPriority(TIM2_IRQn, 5);
NVIC_EnableIRQ(TIM2_IRQn);

// UART interrupt: higher urgency (lower number)
NVIC_SetPriority(USART2_IRQn, 2);
NVIC_EnableIRQ(USART2_IRQn);
```

```rust
use core::ptr::write_volatile;

const NVIC_IPR_BASE: u32 = 0xE000_E400;
const NVIC_ISER0: *mut u32 = 0xE000_E100 as *mut u32;
const NVIC_ISER1: *mut u32 = (0xE000_E100 + 0x04) as *mut u32;
const TIM2_IRQN: u32 = 28;
const USART2_IRQN: u32 = 38;

unsafe {
    // Setup: PRIGROUP = 3 (all 4 bits are preemption, no sub-priority)
    // (see AIRCR write example above)

    // Timer interrupt: lower urgency (higher number)
    write_volatile((NVIC_IPR_BASE + TIM2_IRQN) as *mut u8, 5 << 4);
    write_volatile(NVIC_ISER0, 1 << TIM2_IRQN);

    // UART interrupt: higher urgency (lower number)
    write_volatile((NVIC_IPR_BASE + USART2_IRQN) as *mut u8, 2 << 4);
    write_volatile(NVIC_ISER1, 1 << (USART2_IRQN - 32));
}
```
<!-- /tabs -->

What happens at runtime:

```
Time -->
  [main code running]
       |
       +-- TIM2 interrupt fires, priority 5
       |   [TIM2_IRQHandler executing...]
       |        |
       |        +-- USART2 interrupt fires, priority 2
       |        |   Priority 2 < 5, so USART2 PREEMPTS TIM2
       |        |   [USART2_IRQHandler executes]
       |        |   [USART2_IRQHandler returns]
       |        |
       |        +-- TIM2_IRQHandler resumes
       |   [TIM2_IRQHandler returns]
       |
  [main code resumes]
```

## Nesting Depth

Interrupts can nest multiple levels deep. Each nesting level pushes 8 registers (32 bytes) onto the stack. With many nested interrupts, **stack overflow** is a real risk.

**Practical advice:**
- Keep the total number of preemption levels small (2-4 is typical)
- Size your stack to handle worst-case nesting
- Use sub-priority for ordering rather than preemption when possible

## Special Priority Values

Some system exceptions have **fixed priorities** that cannot be changed:

| Exception | Priority |
|-----------|----------|
| Reset | -3 (highest, fixed) |
| NMI | -2 (fixed) |
| HardFault | -1 (fixed) |
| All others | Configurable |

This means HardFault always preempts any configurable interrupt, and NMI preempts everything except Reset.

## Common Mistakes

1. **Forgetting that lower number = higher priority.** Priority 0 is the most urgent. Priority 15 is the least.

2. **Not setting PRIGROUP.** The default grouping may not be what you expect. Set it explicitly at startup.

3. **Using raw register writes without the shift.** On a 4-bit implementation, priority 2 must be written as `0x20` (shifted left by 4). Use `NVIC_SetPriority()` to avoid this pitfall.

4. **Assigning priority 0 to everything.** If all interrupts have the same priority, none can preempt another -- you lose the benefit of nesting.

## References

1. [Interrupt Priority Grouping in ARM Cortex-M NVIC](https://www.ocfreaks.com/interrupt-priority-grouping-arm-cortex-m-nvic/) — Detailed walkthrough of PRIGROUP and priority splitting
2. [Cutting Through the Confusion with Cortex-M Interrupt Priorities](https://community.arm.com/iot/embedded/b/embedded-blog/posts/cutting-through-the-confusion-with-arm-cortex-m-interrupt-priorities) — ARM blog clarifying common priority misconceptions
3. [Interrupt Priority Grouping - Cortex-M7](https://developer.arm.com/documentation/dui0646/latest/The-Cortex-M7-Processor/Exception-model/Interrupt-priority-grouping) — Official ARM documentation on priority grouping
4. [A Practical Guide to ARM Cortex-M Exception Handling](https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic) — Practical guide covering priority levels and preemption

## Related Topics

- [NVIC Architecture](nvic-architecture.md) -- the registers that hold these priority values
- [Context Switching](context-switching-mechanics.md) -- what actually happens during preemption
- [ISR Design Patterns](isr-design-patterns.md) -- keeping ISRs short enough that priorities matter less
