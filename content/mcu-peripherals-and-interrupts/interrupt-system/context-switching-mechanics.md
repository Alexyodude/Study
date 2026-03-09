---
title: "Context Switching Mechanics"
created: 2026-03-08
updated: 2026-03-08
tags: [context-switch, stacking, exc-return, tail-chaining, cortex-m]
status: draft
sources:
  - url: "https://developer.arm.com/documentation/dui0552/a/the-cortex-m3-processor/exception-model/exception-entry-and-return"
    title: "Exception Entry and Return - ARM Cortex-M3"
  - url: "https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic"
    title: "A Practical Guide to ARM Cortex-M Exception Handling"
  - url: "https://microcontrollerslab.com/interrupt-processing-arm-cortex-m-microcontrollers/"
    title: "Sequence of Interrupt Processing Steps ARM Cortex-M"
  - url: "https://www.embeddedrelated.com/showarticle/912.php"
    title: "Cortex-M Exception Handling (Part 2)"
---

When an interrupt fires on Cortex-M, the hardware performs an automatic **context switch** -- saving the current state so the ISR can run, and restoring it when the ISR returns. Understanding this mechanism helps you debug stack overflows, optimize interrupt latency, and work with RTOS context switches.

## What Happens on Interrupt Entry

The hardware automatically pushes 8 registers onto the current stack (MSP or PSP):

```
High Address (pushed first)
  +----------+
  |   xPSR   |  Program Status Register
  +----------+
  |    PC    |  Return address (where to resume)
  +----------+
  |    LR    |  Link Register (R14)
  +----------+
  |    R12   |
  +----------+
  |    R3    |
  +----------+
  |    R2    |
  +----------+
  |    R1    |
  +----------+
  |    R0    |  <-- SP points here after stacking
  +----------+
Low Address
```

These 8 registers (32 bytes) are chosen because they are the **caller-saved** registers in the [ARM calling convention (AAPCS)](https://developer.arm.com/documentation/dui0552/a/the-cortex-m3-processor/exception-model/exception-entry-and-return). The ISR can freely use R0-R3, R12, and LR without saving them -- the hardware already did.

The remaining registers (R4-R11) are **callee-saved**. If the ISR (or functions it calls) uses them, the compiler generates `PUSH`/`POP` instructions automatically.

### Stacking Timeline

On Cortex-M3/M4 with zero-wait-state memory, the entire entry sequence takes **12 clock cycles**:
1. Recognize and accept the exception
2. Push 8 registers to stack
3. Fetch the vector table entry
4. Load ISR address into PC

## EXC_RETURN Value

After stacking, the hardware writes a special value into the **Link Register (LR)**. This is called `EXC_RETURN`. It is not a real address -- it is a sentinel that triggers the exception return sequence when loaded into PC.

### Common EXC_RETURN Values

| Value | Meaning |
|-------|---------|
| `0xFFFFFFF1` | Return to Handler mode, use MSP (nested interrupt returning) |
| `0xFFFFFFF9` | Return to Thread mode, use MSP |
| `0xFFFFFFFD` | Return to Thread mode, use PSP |
| `0xFFFFFFE1` | Return to Handler mode, use MSP, with FPU frame |
| `0xFFFFFFE9` | Return to Thread mode, use MSP, with FPU frame |
| `0xFFFFFFED` | Return to Thread mode, use PSP, with FPU frame |

Key bits in EXC_RETURN:

| Bit | Name | Meaning |
|-----|------|---------|
| 3 | Return mode | 1 = Thread mode, 0 = Handler mode |
| 2 | Stack pointer | 1 = PSP, 0 = MSP |
| 4 | Frame type | 1 = no FPU context, 0 = FPU context stacked |

### How Return Works

When the ISR executes `BX LR` (or `POP {PC}` which loads the EXC_RETURN value into PC), the hardware detects the special value and:
1. Pops the 8 registers from the stack
2. Restores PC, xPSR, LR, R0-R3, R12
3. Resumes execution at the saved PC address

<!-- tabs -->
```c
// The compiler generates this automatically:
void TIM2_IRQHandler(void) {
    // ... handler code ...
    // compiler generates: POP {R4-R7, PC}  (PC gets EXC_RETURN)
    // hardware detects EXC_RETURN, unstacks, returns
}
```

```rust
// The compiler generates the same prologue/epilogue automatically:
#[no_mangle]
pub unsafe extern "C" fn TIM2_IRQHandler() {
    // ... handler code ...
    // compiler generates: POP {R4-R7, PC}  (PC gets EXC_RETURN)
    // hardware detects EXC_RETURN, unstacks, returns
}
```
<!-- /tabs -->

## Tail-Chaining

When one ISR finishes and another interrupt is already pending, the hardware optimizes the transition:

**Without tail-chaining (hypothetical):**
```
ISR A returns --> unstack 8 regs --> stack 8 regs --> ISR B starts
                   (wasted cycles)
```

**With tail-chaining (actual Cortex-M behavior):**
```
ISR A returns --> skip unstack/restack --> fetch ISR B vector --> ISR B starts
```

The hardware skips the unstack + restack since the same registers would be popped and immediately pushed again. This saves [**about 18 cycles**](https://www.embeddedrelated.com/showarticle/912.php) (Cortex-M3) compared to a full unstack + restack.

Tail-chaining happens automatically. You do not need to configure anything.

## Late-Arriving Optimization

If a higher-priority interrupt arrives **during the stacking phase** of a lower-priority interrupt:

```
Time -->
  [Stacking for IRQ A (lower priority)]
       |
       +-- IRQ B (higher priority) arrives during stacking
       |
  [Hardware redirects: fetches ISR B vector instead of ISR A]
  [ISR B executes using the already-stacked context]
  [ISR B returns, tail-chains into ISR A]
```

The stacking already in progress is reused -- no need to restart it. This ensures the higher-priority interrupt is serviced with minimal additional latency.

## Lazy Stacking for FPU Context

On Cortex-M4F/M7 with an FPU, the floating-point registers (S0-S15, FPSCR) add **17 more registers** (68 bytes) to the stack frame. Stacking all of them on every interrupt would be expensive.

**Lazy stacking** solves this:
1. On interrupt entry, space is **reserved** on the stack for FPU registers, but they are **not actually saved**
2. The LSPACT flag is set to remember that FPU context is deferred
3. Only if the ISR uses a floating-point instruction does the hardware trap and save the FPU registers
4. If the ISR never touches the FPU, the registers are never stacked (saving ~12 cycles)

```
Without lazy stacking:  Always push 25 registers (100 bytes)
With lazy stacking:     Push 8 registers, reserve space for 17 more
                        Actually push FPU regs only if ISR uses FPU
```

Lazy stacking is enabled by default on Cortex-M4F. Controlled by `FPCCR.LSPEN` and `FPCCR.ASPEN` bits.

## Stack Usage Summary

| Scenario | Bytes per ISR level |
|----------|-------------------|
| No FPU | 32 bytes (8 registers) + callee-saved regs |
| FPU (lazy, ISR does not use FPU) | 32 bytes + 68 reserved (but not written) |
| FPU (ISR uses FPU) | 100 bytes (25 registers) |

For nested interrupts, multiply by nesting depth. This is why stack sizing matters -- 3 levels of nesting with FPU = 300 bytes minimum just for hardware stacking.

## Debugging Tips

- If you see a **HardFault after an ISR return**, check for stack overflow -- the unstacking read from corrupted memory
- The stacked PC value tells you **exactly where the interrupted code was**. Extract it to find what was running when the interrupt hit
- Use the ITM/SWO trace or a logic analyzer to measure actual interrupt latency

## References

1. [Exception Entry and Return - ARM Cortex-M3](https://developer.arm.com/documentation/dui0552/a/the-cortex-m3-processor/exception-model/exception-entry-and-return) — Official ARM docs on stacking and EXC_RETURN mechanics
2. [A Practical Guide to ARM Cortex-M Exception Handling](https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic) — Practical coverage of context switching and latency
3. [Sequence of Interrupt Processing Steps ARM Cortex-M](https://microcontrollerslab.com/interrupt-processing-arm-cortex-m-microcontrollers/) — Step-by-step interrupt entry and exit sequence
4. [Cortex-M Exception Handling (Part 2)](https://www.embeddedrelated.com/showarticle/912.php) — Detailed analysis of tail-chaining and late-arriving optimizations

## Related Topics

- [NVIC Architecture](nvic-architecture.md) -- how interrupts are enabled and prioritized
- [Priority and Preemption](priority-and-preemption.md) -- what determines nesting depth
- [Exceptions and Faults](exceptions-and-faults.md) -- what happens when stacking fails
- [ISR Design Patterns](isr-design-patterns.md) -- minimizing time in ISRs
