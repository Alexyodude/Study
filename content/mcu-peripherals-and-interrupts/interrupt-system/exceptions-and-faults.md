---
title: "Exceptions and Faults"
created: 2026-03-08
updated: 2026-03-08
tags: [hardfault, busfault, memmanage, usagefault, cortex-m, debugging]
status: draft
sources:
  - url: "https://interrupt.memfault.com/blog/cortex-m-hardfault-debug"
    title: "How to Debug a HardFault on an ARM Cortex-M MCU"
  - url: "https://community.st.com/t5/stm32-mcus/how-to-debug-a-hardfault-on-an-arm-cortex-m-stm32/ta-p/672235"
    title: "How to Debug a HardFault on an ARM Cortex-M STM32"
  - url: "https://www.keil.com/appnotes/files/apnt209.pdf"
    title: "AN209 - Using Cortex-M3/M4/M7 Fault Exceptions"
---

Cortex-M processors have a hierarchy of **fault exceptions** that fire when the CPU encounters an error -- invalid memory access, undefined instruction, division by zero, etc. Understanding faults is essential for debugging embedded systems.

## System Exceptions vs External Interrupts

ARM Cortex-M has two categories of exceptions:

| Type | Numbers | Examples |
|------|---------|---------|
| System exceptions | 1-15 | Reset, NMI, HardFault, SysTick, SVCall |
| External interrupts | 16+ | UART, Timer, GPIO, DMA, SPI, etc. |

System exceptions are built into the core. External interrupts come from peripherals via the NVIC.

### Fault Exceptions

| Exception | Number | Priority | Purpose |
|-----------|--------|----------|---------|
| HardFault | 3 | -1 (fixed) | Catch-all for unhandled faults |
| MemManage | 4 | Configurable | MPU violations |
| BusFault | 5 | Configurable | Bus errors (memory access failures) |
| UsageFault | 6 | Configurable | Instruction execution errors |

## HardFault: The Catch-All

HardFault fires when:
- A configurable fault handler (MemManage, BusFault, UsageFault) is **disabled** and that fault occurs
- A configurable fault handler itself causes a fault (**escalation**)
- A fault occurs during vector table fetch

HardFault has priority -1, so it preempts all configurable interrupts. Only NMI and Reset can preempt HardFault.

**If you are seeing HardFaults, enable the configurable fault handlers first** -- they give you much more specific information about what went wrong.

<!-- tabs -->
```c
// Enable configurable fault handlers at startup
SCB->SHCSR |= SCB_SHCSR_MEMFAULTENA_Msk
            | SCB_SHCSR_BUSFAULTENA_Msk
            | SCB_SHCSR_USGFAULTENA_Msk;
```

```rust
use core::ptr::{read_volatile, write_volatile};

const SCB_SHCSR: *mut u32 = 0xE000_ED24 as *mut u32;
const MEMFAULTENA: u32 = 1 << 16;
const BUSFAULTENA: u32 = 1 << 17;
const USGFAULTENA: u32 = 1 << 18;

unsafe {
    write_volatile(SCB_SHCSR, read_volatile(SCB_SHCSR)
        | MEMFAULTENA | BUSFAULTENA | USGFAULTENA);
}
```
<!-- /tabs -->

## MemManage Fault

Triggered by:
- MPU (Memory Protection Unit) access violations
- Executing code from a region marked as Execute Never (XN)
- Accessing memory beyond the defined MPU regions

Useful bits in `SCB->CFSR` (MemManage fault status, bits [7:0]):

| Bit | Name | Meaning |
|-----|------|---------|
| 0 | IACCVIOL | Instruction access violation |
| 1 | DACCVIOL | Data access violation |
| 7 | MMARVALID | MMFAR register holds the faulting address |

If MMARVALID is set, read `SCB->MMFAR` to get the exact address that caused the fault.

## BusFault

Triggered by:
- Accessing an invalid memory address (e.g., peripheral without clock enabled)
- Accessing misaligned memory on a bus that does not support it
- Error during interrupt vector fetch

Useful bits in `SCB->CFSR` (BusFault status, bits [15:8]):

| Bit | Name | Meaning |
|-----|------|---------|
| 8 | IBUSERR | Instruction bus error |
| 9 | PRECISERR | Precise data bus error (BFAR valid) |
| 10 | IMPRECISERR | Imprecise data bus error (BFAR may not be valid) |
| 11 | UNSTKERR | Error during unstacking (exception return) |
| 12 | STKERR | Error during stacking (exception entry) |
| 15 | BFARVALID | BFAR register holds the faulting address |

**Imprecise bus faults** are tricky: the faulting instruction may be several instructions before the fault is reported because writes are buffered. Disable write buffering temporarily to make them precise, as recommended in the [Keil AN209 application note](https://www.keil.com/appnotes/files/apnt209.pdf): `SCnSCB->ACTLR |= SCnSCB_ACTLR_DISDEFWBUF_Msk;`

## UsageFault

Triggered by:
- **Undefined instruction** (corrupted code, wrong Thumb/ARM mode)
- **Unaligned memory access** (if UNALIGN_TRP is enabled)
- **Division by zero** (if DIV_0_TRP is enabled)
- **Invalid EXC_RETURN** value
- Attempting to switch to ARM state (Cortex-M is Thumb-only)

Useful bits in `SCB->CFSR` (UsageFault status, bits [31:16]):

| Bit | Name | Meaning |
|-----|------|---------|
| 16 | UNDEFINSTR | Undefined instruction |
| 17 | INVSTATE | Invalid state (e.g., trying to use ARM instruction) |
| 18 | INVPC | Invalid PC load on exception return |
| 19 | NOCP | Coprocessor access (FPU not enabled) |
| 24 | UNALIGNED | Unaligned access |
| 25 | DIVBYZERO | Division by zero |

Enable trapping for division by zero and unaligned access:
<!-- tabs -->
```c
SCB->CCR |= SCB_CCR_DIV_0_TRP_Msk | SCB_CCR_UNALIGN_TRP_Msk;
```

```rust
use core::ptr::{read_volatile, write_volatile};

const SCB_CCR: *mut u32 = 0xE000_ED14 as *mut u32;
const DIV_0_TRP: u32 = 1 << 4;
const UNALIGN_TRP: u32 = 1 << 3;

unsafe {
    write_volatile(SCB_CCR, read_volatile(SCB_CCR) | DIV_0_TRP | UNALIGN_TRP);
}
```
<!-- /tabs -->

## Fault Status Registers Summary

| Register | Address | Content |
|----------|---------|---------|
| SCB->CFSR | 0xE000ED28 | Combined: MemManage [7:0] + BusFault [15:8] + UsageFault [31:16] |
| SCB->HFSR | 0xE000ED2C | HardFault status (FORCED bit = escalated from configurable fault) |
| SCB->MMFAR | 0xE000ED34 | MemManage faulting address |
| SCB->BFAR | 0xE000ED38 | BusFault faulting address |

## Debugging a HardFault: Reading the Stacked PC

When a fault occurs, the exception stack frame contains the **PC** (program counter) at the point of the fault. Extracting this PC tells you exactly which instruction caused the crash. The [Memfault HardFault debugging guide](https://interrupt.memfault.com/blog/cortex-m-hardfault-debug) walks through this process in detail.

### Step 1: Determine Which Stack Was Active

<!-- tabs -->
```c
void HardFault_Handler(void) {
    __asm volatile(
        "TST   LR, #4          \n"  // test bit 2 of EXC_RETURN
        "ITE   EQ               \n"
        "MRSEQ R0, MSP          \n"  // if 0: main stack pointer
        "MRSNE R0, PSP          \n"  // if 1: process stack pointer
        "B     hard_fault_handler\n"
    );
}
```

```rust
use core::arch::asm;

#[no_mangle]
pub unsafe extern "C" fn HardFault_Handler() {
    asm!(
        "TST   LR, #4",           // test bit 2 of EXC_RETURN
        "ITE   EQ",
        "MRSEQ R0, MSP",          // if 0: main stack pointer
        "MRSNE R0, PSP",          // if 1: process stack pointer
        "B     hard_fault_handler",
        options(noreturn)
    );
}
```
<!-- /tabs -->

### Step 2: Read the Stacked Registers

<!-- tabs -->
```c
void hard_fault_handler(uint32_t *stack_frame) {
    volatile uint32_t r0   = stack_frame[0];
    volatile uint32_t r1   = stack_frame[1];
    volatile uint32_t r2   = stack_frame[2];
    volatile uint32_t r3   = stack_frame[3];
    volatile uint32_t r12  = stack_frame[4];
    volatile uint32_t lr   = stack_frame[5];  // return address in caller
    volatile uint32_t pc   = stack_frame[6];  // FAULTING INSTRUCTION
    volatile uint32_t xpsr = stack_frame[7];

    volatile uint32_t cfsr = SCB->CFSR;
    volatile uint32_t hfsr = SCB->HFSR;
    volatile uint32_t bfar = SCB->BFAR;
    volatile uint32_t mmfar = SCB->MMFAR;

    // Set a breakpoint here and inspect the variables
    __BKPT(0);
    while (1) { }
}
```

```rust
use core::ptr::read_volatile;

const SCB_CFSR: *const u32 = 0xE000_ED28 as *const u32;
const SCB_HFSR: *const u32 = 0xE000_ED2C as *const u32;
const SCB_BFAR: *const u32 = 0xE000_ED38 as *const u32;
const SCB_MMFAR: *const u32 = 0xE000_ED34 as *const u32;

#[no_mangle]
pub unsafe extern "C" fn hard_fault_handler(stack_frame: *const u32) {
    let _r0   = read_volatile(stack_frame.offset(0));
    let _r1   = read_volatile(stack_frame.offset(1));
    let _r2   = read_volatile(stack_frame.offset(2));
    let _r3   = read_volatile(stack_frame.offset(3));
    let _r12  = read_volatile(stack_frame.offset(4));
    let _lr   = read_volatile(stack_frame.offset(5));  // return address in caller
    let _pc   = read_volatile(stack_frame.offset(6));  // FAULTING INSTRUCTION
    let _xpsr = read_volatile(stack_frame.offset(7));

    let _cfsr  = read_volatile(SCB_CFSR);
    let _hfsr  = read_volatile(SCB_HFSR);
    let _bfar  = read_volatile(SCB_BFAR);
    let _mmfar = read_volatile(SCB_MMFAR);

    // Set a breakpoint here and inspect the variables
    core::arch::asm!("bkpt #0");
    loop {}
}
```
<!-- /tabs -->

### Step 3: Find the Faulting Code

Take the stacked PC value and look it up in your `.map` file or disassembly:
```
pc = 0x08001234  -->  check .map file or use: arm-none-eabi-addr2line -e firmware.elf 0x08001234
```

## Common Fault Causes

| Cause | Fault Type | How to Identify |
|-------|-----------|-----------------|
| Null pointer dereference | BusFault/HardFault | BFAR = 0x00000000 |
| Stack overflow | BusFault (STKERR) | SP points outside RAM |
| Unaligned access | UsageFault (UNALIGNED) | Only if trap enabled |
| Writing to flash | BusFault | BFAR in flash region |
| Peripheral without clock | BusFault | BFAR = peripheral address |
| Corrupted function pointer | UsageFault (INVSTATE) | PC is odd or in wrong region |
| Division by zero | UsageFault (DIVBYZERO) | Only if trap enabled |
| Heap overflow into stack | Various | Gradual corruption, hard to trace |

## Prevention Checklist

- Enable all configurable fault handlers at startup
- Enable DIV_0_TRP and UNALIGN_TRP during development
- Size your stack generously and fill it with a canary pattern (e.g., 0xDEADBEEF)
- Use the MPU to protect the stack guard region
- Check all pointer dereferences for NULL
- Enable compiler warnings (`-Wall -Wextra`)

## References

1. [How to Debug a HardFault on an ARM Cortex-M MCU](https://interrupt.memfault.com/blog/cortex-m-hardfault-debug) — Step-by-step HardFault debugging with stacked PC extraction
2. [How to Debug a HardFault on an ARM Cortex-M STM32](https://community.st.com/t5/stm32-mcus/how-to-debug-a-hardfault-on-an-arm-cortex-m-stm32/ta-p/672235) — ST community guide for debugging faults on STM32
3. [AN209 - Using Cortex-M3/M4/M7 Fault Exceptions](https://www.keil.com/appnotes/files/apnt209.pdf) — Keil application note on fault exception types and registers

## Related Topics

- [Context Switching](context-switching-mechanics.md) -- the stacking mechanism that creates the fault frame
- [NVIC Architecture](nvic-architecture.md) -- exception numbers and enabling fault handlers
- [Priority and Preemption](priority-and-preemption.md) -- HardFault's fixed priority
