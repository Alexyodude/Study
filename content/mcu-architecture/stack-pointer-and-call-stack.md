---
title: "Stack Pointer and Call Stack"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, stack, stack-pointer, msp, psp, arm, cortex-m]
status: draft
sources:
  - url: "https://embeddedprep.com/arm-cortex-m4-core-registers/"
    title: "ARM Cortex-M4 Core Registers"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
  - url: "https://blog.thea.codes/the-most-thoroughly-commented-linker-script/"
    title: "The Most Thoroughly Commented Linker Script"
---

## What the Stack Is

The **stack** is a region of SRAM used for temporary storage during program execution. It holds:

- Return addresses (so functions know where to go back)
- Saved register values (when a function needs to use registers that the caller is also using)
- Local variables (when they don't fit in registers)
- Interrupt context (registers saved automatically when an interrupt fires)

The stack follows a **Last In, First Out (LIFO)** discipline. The last value pushed is the first value popped.

## Full-Descending Stack

[ARM Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) uses a **full-descending** stack:

- **Full**: The stack pointer points to the **last item pushed** (not the next empty slot)
- **Descending**: The stack grows from **high addresses toward low addresses**

```
  High address
  0x2000_1000  +----------+  <-- Initial SP (top of RAM)
               |  (empty) |
               +----------+
  0x2000_0FF8  | saved LR |  <-- SP after PUSH {LR}
               +----------+
  0x2000_0FF4  | saved R4 |  <-- SP after PUSH {R4, LR}
               +----------+
               |   ...    |      Stack grows DOWNWARD
  Low address
```

## PUSH and POP Operations

### PUSH

`PUSH` decrements SP, then stores register values at the new SP address:

```arm
PUSH {R4, R5, LR}    @ SP -= 12 (3 registers x 4 bytes)
                      @ Store R4 at [SP], R5 at [SP+4], LR at [SP+8]
```

Registers are always stored in numerical order regardless of the order you write them.

### POP

`POP` loads register values from the stack, then increments SP:

```arm
POP {R4, R5, PC}     @ R4 = [SP], R5 = [SP+4], PC = [SP+8]
                      @ SP += 12
```

Notice `POP {PC}` -- popping into PC is a common way to return from a function (the saved LR value goes directly into PC).

## MSP vs PSP

The Cortex-M has **two stack pointers**, but only one is active at any time:

### Main Stack Pointer (MSP)

- Used by default after reset
- Always used in **Handler Mode** (interrupt/exception handlers)
- Typically used by the OS kernel or bare-metal code

### Process Stack Pointer (PSP)

- Used in **Thread Mode** when `CONTROL.SPSEL = 1`
- Assigned to application tasks in an RTOS
- Each RTOS task gets its own PSP value (pointing to its own stack area)

### Why Two Stack Pointers?

Separation provides **memory isolation**. If a user task overflows its stack, it corrupts its own PSP-based stack -- not the kernel's MSP-based stack. The RTOS can catch this and kill the offending task rather than crashing the entire system.

```
  SRAM Layout with RTOS
  +------------------+ 0x2000_1000
  |   MSP Stack      |  (Kernel + interrupts)
  +------------------+ 0x2000_0C00
  |   Task 1 Stack   |  (PSP for Task 1)
  +------------------+ 0x2000_0800
  |   Task 2 Stack   |  (PSP for Task 2)
  +------------------+ 0x2000_0400
  |   Heap / Data    |
  +------------------+ 0x2000_0000
```

### Switching Stack Pointers

```arm
@ Switch to PSP in Thread Mode
MRS  R0, CONTROL
ORR  R0, R0, #0x02    @ Set SPSEL bit
MSR  CONTROL, R0
ISB                    @ Required after CONTROL write

@ Set PSP value
LDR  R0, =0x20000C00
MSR  PSP, R0
```

## Stack Frames

When a function is called, a **stack frame** is created containing everything needed to return to the caller.

### Typical Stack Frame (Function Call)

```arm
my_func:
    PUSH {R4-R7, LR}      @ Save callee-saved registers + return address
    SUB  SP, SP, #16       @ Reserve 16 bytes for local variables
    @ ... function body ...
    ADD  SP, SP, #16       @ Release local variable space
    POP  {R4-R7, PC}       @ Restore registers and return
```

Stack during `my_func`:

```
  +------------------+
  |   Caller's frame |
  +------------------+  <-- SP before call
  |   LR (return)    |
  |   R7             |
  |   R6             |
  |   R5             |
  |   R4             |
  +------------------+  <-- SP after PUSH
  |  local var 3     |
  |  local var 2     |
  |  local var 1     |
  |  local var 0     |
  +------------------+  <-- SP after SUB (current SP)
```

### Exception Stack Frame (Automatic Hardware Stacking)

When an interrupt fires, the Cortex-M hardware **automatically** pushes 8 registers onto the stack before entering the handler:

```
  +------------------+
  |      xPSR        |  <-- highest address (pushed first)
  |      PC          |
  |      LR          |
  |      R12         |
  |      R3          |
  |      R2          |
  |      R1          |
  |      R0          |
  +------------------+  <-- SP when handler starts
```

This is why interrupt handlers on Cortex-M can be written as normal C functions -- the hardware handles the save/restore.

## Stack Overflow Risks in Embedded

Stack overflow is one of the most common and dangerous bugs in embedded systems.

### Why It Is Dangerous

- There is **no virtual memory** or MMU on most Cortex-M chips -- the stack just silently overwrites whatever is below it (globals, heap, other stacks)
- Symptoms are unpredictable: corrupted variables, HardFaults, mysterious resets

### Common Causes

1. **Deep call chains** -- calling functions that call functions, many levels deep
2. **Large local arrays** -- `char buffer[1024]` in a function uses 1 KB of stack per call
3. **Recursive functions** -- each recursive call adds a stack frame
4. **Interrupt nesting** -- each nested interrupt stacks 32+ bytes automatically

### Prevention Strategies

| Strategy | How |
|---|---|
| **Static analysis** | Use `-fstack-usage` (GCC) to see each function's stack usage |
| **Stack painting** | Fill stack with a pattern (e.g., `0xDEADBEEF`) at startup; check later how much was overwritten |
| **MPU guard region** | Configure the MPU to fault on access below the stack bottom |
| **Limit recursion** | Avoid recursion; use iterative algorithms |
| **Size appropriately** | Start with a generous stack size, then measure and trim |

### Checking Stack Usage (GCC)

```bash
arm-none-eabi-gcc -fstack-usage -c main.c
# Produces main.su file:
# main.c:10:5:main    48    static
# main.c:25:6:init    16    static
```

The `.su` file tells you each function's stack consumption, helping you calculate the worst-case stack depth.

## Stack in the Linker Script

The [linker script](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/) reserves stack space and sets `_estack` (end of stack = initial SP value):

```ld
_estack = ORIGIN(RAM) + LENGTH(RAM);    /* Top of RAM */

.stack (NOLOAD) :
{
    . = ALIGN(8);
    . = . + _Min_Stack_Size;    /* e.g., 0x400 = 1 KB */
} >RAM
```

The vector table's first entry is the initial MSP value, loaded from `_estack` at reset.

## References

1. [ARM Cortex-M4 Core Registers](https://embeddedprep.com/arm-cortex-m4-core-registers/) — MSP and PSP register details and stack pointer behavior
2. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Exception stack frame and hardware stacking mechanism
3. [The Most Thoroughly Commented Linker Script](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/) — Stack allocation in linker scripts with detailed annotations

## Related Topics

- [Registers and Register File](registers-and-register-file.md) -- SP is R13, LR is R14
- [Program Counter and Execution Flow](program-counter-and-execution-flow.md) -- BL/BX LR and subroutine calls
- [SRAM](memory-architecture/sram.md) -- where the stack physically lives
- [Memory Layout and Linker Scripts](memory-architecture/memory-layout-and-linker-scripts.md) -- how stack space is reserved
