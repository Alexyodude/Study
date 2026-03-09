---
title: "Fault Debugging Techniques"
created: 2026-03-08
updated: 2026-03-08
tags: [hardfault, debugging, fault, cortex-m, embedded]
status: draft
sources:
  - url: "https://interrupt.memfault.com/blog/cortex-m-hardfault-debug"
    title: "How to Debug a HardFault on an ARM Cortex-M MCU - Memfault"
  - url: "https://community.st.com/t5/stm32-mcus/how-to-debug-a-hardfault-on-an-arm-cortex-m-stm32/ta-p/672235"
    title: "How to Debug a HardFault on an ARM Cortex-M STM32"
  - url: "https://blog.feabhas.com/2018/09/updated-developing-a-generic-hard-fault-handler-for-arm-cortex-m3-cortex-m4-using-gcc/"
    title: "Developing a Generic Hard Fault Handler for ARM Cortex-M3/M4"
  - url: "https://kb.segger.com/Cortex-M_Fault"
    title: "Cortex-M Fault - SEGGER Knowledge Base"
---

When a Cortex-M MCU encounters an illegal operation, it triggers a [**fault exception**](https://interrupt.memfault.com/blog/cortex-m-hardfault-debug). The CPU jumps to a fault handler, and if you have not written one, it usually ends up in an infinite loop. This page covers how to diagnose faults systematically using the fault status registers and stacked context.

## Types of Faults

Cortex-M processors have several fault exceptions, in order of priority:

| Fault | Exception # | Trigger |
|-------|-------------|---------|
| **HardFault** | 3 | Catch-all for unhandled faults, or escalation from other faults |
| **MemManage** | 4 | MPU violation or access to Execute Never region |
| **BusFault** | 5 | Error on bus transaction (invalid address, peripheral not clocked) |
| **UsageFault** | 6 | Undefined instruction, unaligned access, divide by zero |

On Cortex-M0/M0+, only HardFault exists. On Cortex-M3 and above, the configurable faults (MemManage, BusFault, UsageFault) can be individually enabled. If they are not enabled, they **escalate** to HardFault.

## Fault Status Registers

The key registers for fault diagnosis are all in the System Control Block (SCB), memory-mapped in the Private Peripheral Bus:

| Register | Address | Purpose |
|----------|---------|---------|
| **HFSR** | 0xE000ED2C | HardFault Status Register |
| **CFSR** | 0xE000ED28 | Configurable Fault Status Register |
| **MMFAR** | 0xE000ED34 | MemManage Fault Address Register |
| **BFAR** | 0xE000ED38 | BusFault Address Register |

### CFSR Layout

The CFSR is a 32-bit register that combines three sub-registers:

```
Bits [31:16]  UFSR  (Usage Fault Status Register)
Bits [15:8]   BFSR  (Bus Fault Status Register)
Bits [7:0]    MMFSR (Memory Manage Fault Status Register)
```

### HFSR Key Bits

| Bit | Name | Meaning |
|-----|------|---------|
| 30 | FORCED | Fault was escalated from a configurable fault |
| 1 | VECTTBL | Bus fault during vector table read |

If FORCED is set, check CFSR to find the original cause.

### UFSR Key Bits

| Bit | Name | Meaning |
|-----|------|---------|
| 25 | DIVBYZERO | Division by zero (if enabled in CCR) |
| 24 | UNALIGNED | Unaligned memory access |
| 18 | INVPC | Invalid EXC_RETURN value |
| 17 | INVSTATE | Attempt to execute in invalid state (e.g., ARM mode on Cortex-M) |
| 16 | UNDEFINSTR | Undefined instruction |

### BFSR Key Bits

| Bit | Name | Meaning |
|-----|------|---------|
| 15 | BFARVALID | BFAR register holds the faulting address |
| 13 | STKERR | Bus fault on exception stacking |
| 12 | UNSTKERR | Bus fault on exception unstacking |
| 11 | IMPRECISERR | Imprecise data bus error (address unknown) |
| 10 | PRECISERR | Precise data bus error (address in BFAR) |
| 9 | IBUSERR | Instruction bus error |

### MMFSR Key Bits

| Bit | Name | Meaning |
|-----|------|---------|
| 7 | MMARVALID | MMFAR register holds the faulting address |
| 4 | MSTKERR | MemManage fault on exception stacking |
| 1 | DACCVIOL | Data access violation |
| 0 | IACCVIOL | Instruction access violation |

## Extracting the Stacked PC

When a fault occurs, the CPU automatically pushes eight registers onto the stack before entering the handler:

```
Stack (high address):
  xPSR         [SP + 28]
  PC           [SP + 24]  <-- Return address (where the fault happened)
  LR           [SP + 20]
  R12          [SP + 16]
  R3           [SP + 12]
  R2           [SP + 8]
  R1           [SP + 4]
  R0           [SP + 0]
Stack pointer ->
```

The **stacked PC** tells you which instruction caused the fault. The tricky part is determining which stack pointer was active -- MSP (Main Stack Pointer) or PSP (Process Stack Pointer). Bit 2 of the EXC_RETURN value in LR tells you:

- LR bit 2 = 0: fault used MSP
- LR bit 2 = 1: fault used PSP

## Writing a Custom HardFault Handler

Here is a practical fault handler that extracts all the useful information (based on the [Feabhas approach](https://blog.feabhas.com/2018/09/updated-developing-a-generic-hard-fault-handler-for-arm-cortex-m3-cortex-m4-using-gcc/)):

### Assembly Entry Point (GCC)

```asm
/* In startup or separate .s file */
.syntax unified
.thumb

.global HardFault_Handler
.type HardFault_Handler, %function
HardFault_Handler:
    tst lr, #4              /* Test bit 2 of EXC_RETURN */
    ite eq
    mrseq r0, msp           /* If 0, fault frame is on MSP */
    mrsne r0, psp           /* If 1, fault frame is on PSP */
    mov r1, lr              /* Pass EXC_RETURN as second argument */
    b HardFault_Handler_C   /* Call C handler */
```

### C Handler

<!-- tabs -->
```c
void HardFault_Handler_C(uint32_t *stack_frame, uint32_t exc_return) {
    volatile uint32_t r0   = stack_frame[0];
    volatile uint32_t r1   = stack_frame[1];
    volatile uint32_t r2   = stack_frame[2];
    volatile uint32_t r3   = stack_frame[3];
    volatile uint32_t r12  = stack_frame[4];
    volatile uint32_t lr   = stack_frame[5];
    volatile uint32_t pc   = stack_frame[6];  // Faulting instruction
    volatile uint32_t xpsr = stack_frame[7];

    volatile uint32_t cfsr  = SCB->CFSR;
    volatile uint32_t hfsr  = SCB->HFSR;
    volatile uint32_t mmfar = SCB->MMFAR;
    volatile uint32_t bfar  = SCB->BFAR;

    // All variables are now visible in the debugger.
    // Set a breakpoint on the line below.
    __BKPT(0);

    while (1) {}  // Halt here
}
```

```rust
// Rust embedded — using cortex-m crate for SCB access
use core::ptr::read_volatile;
use cortex_m::peripheral::SCB;

#[no_mangle]
unsafe extern "C" fn HardFault_Handler_C(
    stack_frame: *const u32,
    exc_return: u32,
) {
    let r0   = read_volatile(stack_frame.offset(0));
    let r1   = read_volatile(stack_frame.offset(1));
    let r2   = read_volatile(stack_frame.offset(2));
    let r3   = read_volatile(stack_frame.offset(3));
    let r12  = read_volatile(stack_frame.offset(4));
    let lr   = read_volatile(stack_frame.offset(5));
    let pc   = read_volatile(stack_frame.offset(6)); // Faulting instruction
    let xpsr = read_volatile(stack_frame.offset(7));

    let scb = &*SCB::PTR;
    let cfsr  = read_volatile(&scb.cfsr as *const _ as *const u32);
    let hfsr  = read_volatile(&scb.hfsr as *const _ as *const u32);
    let mmfar = read_volatile(0xE000_ED34 as *const u32);
    let bfar  = read_volatile(0xE000_ED38 as *const u32);

    // All variables are now visible in the debugger.
    cortex_m::asm::bkpt();

    loop {} // Halt here
}
```
<!-- /tabs -->

When you hit this handler in GDB, inspect the local variables:

```gdb
(gdb) print/x pc
$1 = 0x80001a4
(gdb) print/x cfsr
$2 = 0x20000        # Bit 17 = INVSTATE
(gdb) print/x hfsr
$3 = 0x40000000     # Bit 30 = FORCED
```

## Using addr2line

Once you have the faulting PC, convert it to a source file and line number:

```bash
arm-none-eabi-addr2line -e firmware.elf -f -p 0x080001a4
# Output: main at src/main.c:47
```

The `-f` flag shows the function name, `-p` makes the output human-readable.

## Common Fault Causes and Fixes

| CFSR Bits | Likely Cause | Fix |
|-----------|-------------|-----|
| UNDEFINSTR | Corrupted function pointer, wrong vector table | Check function pointers; verify `.isr_vector` |
| INVSTATE | Calling function via pointer without thumb bit set | Ensure bit 0 is set: `(void(*)(void))((uint32_t)func \| 1)` |
| UNALIGNED | 32-bit access at non-4-byte-aligned address | Check struct packing; use `__packed` carefully |
| PRECISERR + BFARVALID | Access to invalid or unclocked peripheral | Enable peripheral clock in RCC before access |
| IMPRECISERR | Asynchronous bus error (hard to locate) | Disable write buffer: set DISDEFWBUF in ACTLR |
| DACCVIOL + MMARVALID | MPU violation | Check MPU region config; see [MPU Memory Protection](../memory-management-in-practice/mpu-memory-protection.md) |

### Making Imprecise Faults Precise

Imprecise bus faults are difficult to debug because the PC has moved past the faulting instruction. You can force precise errors by disabling the write buffer:

<!-- tabs -->
```c
// Set DISDEFWBUF bit in Auxiliary Control Register
SCB->ACTLR |= (1 << 1);
```

```rust
// Set DISDEFWBUF bit in Auxiliary Control Register
unsafe {
    let actlr = 0xE000_E008 as *mut u32;
    let val = core::ptr::read_volatile(actlr);
    core::ptr::write_volatile(actlr, val | (1 << 1));
}
```
<!-- /tabs -->

This slows execution but ensures the PC points to the exact faulting instruction.

## Stack Overflow Detection

Stack overflow is a common cause of HardFaults. The symptoms are confusing -- corrupted variables, random crashes, faults at seemingly innocent code.

### Watermark Technique

Fill the stack with a known pattern at startup and check how much was consumed:

<!-- tabs -->
```c
// At startup, fill stack area with pattern
extern uint32_t _stack_start;  // From linker script
extern uint32_t _stack_end;

void stack_paint(void) {
    volatile uint32_t *p = &_stack_start;
    while (p < &_stack_end) {
        *p++ = 0xDEADBEEF;
    }
}

// Later, check how much stack was used
uint32_t stack_usage(void) {
    volatile uint32_t *p = &_stack_start;
    while (*p == 0xDEADBEEF && p < &_stack_end) {
        p++;
    }
    return (uint32_t)(&_stack_end - p) * sizeof(uint32_t);
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

extern "C" {
    static mut _stack_start: u32; // From linker script
    static mut _stack_end: u32;
}

const STACK_PATTERN: u32 = 0xDEAD_BEEF;

unsafe fn stack_paint() {
    let mut p = &mut _stack_start as *mut u32;
    let end = &mut _stack_end as *mut u32;
    while p < end {
        write_volatile(p, STACK_PATTERN);
        p = p.add(1);
    }
}

unsafe fn stack_usage() -> u32 {
    let mut p = &_stack_start as *const u32;
    let end = &_stack_end as *const u32;
    while read_volatile(p) == STACK_PATTERN && p < end {
        p = p.add(1);
    }
    let remaining = end.offset_from(p) as u32;
    remaining * core::mem::size_of::<u32>() as u32
}
```
<!-- /tabs -->

### MPU-Based Detection

Configure an MPU region at the bottom of the stack as "no access". Any overflow triggers a MemManage fault with a precise address. See [MPU Memory Protection](../memory-management-in-practice/mpu-memory-protection.md).

### Compiler Flags

```makefile
# Warn if any function uses more than N bytes of stack
CFLAGS += -Wstack-usage=256

# Generate .su files with per-function stack usage
CFLAGS += -fstack-usage
```

## References

1. [How to Debug a HardFault on an ARM Cortex-M MCU - Memfault](https://interrupt.memfault.com/blog/cortex-m-hardfault-debug) — In-depth guide to HardFault diagnosis and register inspection
2. [How to Debug a HardFault on an ARM Cortex-M STM32](https://community.st.com/t5/stm32-mcus/how-to-debug-a-hardfault-on-an-arm-cortex-m-stm32/ta-p/672235) — ST Community guide for STM32-specific fault debugging
3. [Developing a Generic Hard Fault Handler for ARM Cortex-M3/M4](https://blog.feabhas.com/2018/09/updated-developing-a-generic-hard-fault-handler-for-arm-cortex-m3-cortex-m4-using-gcc/) — Walkthrough of building a reusable fault handler
4. [Cortex-M Fault - SEGGER Knowledge Base](https://kb.segger.com/Cortex-M_Fault) — SEGGER's reference on Cortex-M fault types and causes

## Related Topics

- [OpenOCD and GDB](openocd-and-gdb.md) -- connecting a debugger to inspect fault state
- [MPU Memory Protection](../memory-management-in-practice/mpu-memory-protection.md) -- using MPU for stack guard regions
- [Stack vs Heap](../memory-management-in-practice/stack-vs-heap.md) -- understanding stack size constraints
