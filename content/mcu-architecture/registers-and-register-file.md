---
title: "Registers and Register File"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, registers, arm, cortex-m, xpsr, stack-pointer]
status: draft
sources:
  - url: "https://embeddedprep.com/arm-cortex-m4-core-registers/"
    title: "ARM Cortex-M4 Core Registers"
  - url: "https://developer.arm.com/documentation/dui0552/latest/the-cortex-m3-processor/programmers-model/core-registers"
    title: "ARM Cortex-M3 Core Registers - ARM Developer"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
---

## What Are Registers?

Registers are tiny, ultra-fast storage locations inside the CPU core. They hold the data the ALU is actively working on. Accessing a register takes **1 clock cycle** -- reading from SRAM or Flash is slower because it travels over a bus.

ARM Cortex-M is a **32-bit architecture**, meaning every register is 32 bits (4 bytes) wide. This defines the natural data size: one ADD instruction works on two 32-bit values.

## General-Purpose Registers: R0--R12

The [Cortex-M core](https://embeddedprep.com/arm-cortex-m4-core-registers/) has 13 general-purpose registers.

```
  R0  [________________________________]  \
  R1  [________________________________]   |  Low registers (R0-R7)
  R2  [________________________________]   |  Accessible by ALL Thumb instructions
  R3  [________________________________]   |
  R4  [________________________________]   |
  R5  [________________________________]   |
  R6  [________________________________]   |
  R7  [________________________________]  /
  R8  [________________________________]  \
  R9  [________________________________]   |  High registers (R8-R12)
  R10 [________________________________]   |  Only 32-bit Thumb-2 instructions
  R11 [________________________________]   |
  R12 [________________________________]  /
```

**Key distinction:** 16-bit Thumb instructions (Cortex-M0/M0+) can only access R0--R7. 32-bit [Thumb-2 instructions](https://developer.arm.com/documentation/dui0552/latest/the-cortex-m3-processor/programmers-model/core-registers) (Cortex-M3/M4/M7) can access all R0--R12.

### ARM Calling Convention (AAPCS)

The ARM Architecture Procedure Call Standard defines how registers are used in function calls:

| Registers | Role | Caller-saved? |
|---|---|---|
| R0--R3 | Function arguments and return value | Yes (caller saves if needed) |
| R4--R11 | Local variables | No (callee must save/restore) |
| R12 | Intra-procedure scratch register | Yes |

<!-- tabs -->
```c
int add(int a, int b) { return a + b; }
// a arrives in R0, b in R1
// Result returned in R0
```

```rust
fn add(a: i32, b: i32) -> i32 { a + b }
// Same calling convention on ARM: a in R0, b in R1, result in R0
```
<!-- /tabs -->

```arm
add:
    ADDS R0, R0, R1    @ R0 = R0 + R1 (a + b)
    BX   LR            @ Return
```

## Special Registers

### R13 -- Stack Pointer (SP)

Points to the top of the stack. The Cortex-M has two banked stack pointers:

- **MSP (Main Stack Pointer)** -- used at reset and in Handler Mode (interrupts)
- **PSP (Process Stack Pointer)** -- used by application tasks in an RTOS

Only one is active at a time. The `CONTROL.SPSEL` bit selects which one `SP` refers to.

See: [Stack Pointer and Call Stack](stack-pointer-and-call-stack.md)

### R14 -- Link Register (LR)

Stores the return address when a subroutine is called with `BL` (Branch with Link). When the function finishes, `BX LR` returns to the caller.

```arm
BL  my_function     @ LR = address of next instruction; jump to my_function
...
my_function:
    @ do work
    BX  LR          @ return to caller (address stored in LR)
```

If a function calls another function, it must save LR on the stack first -- otherwise the original return address is lost.

### R15 -- Program Counter (PC)

Holds the address of the **next instruction to be fetched**. Writing to PC causes a jump. Due to the pipeline, reading PC returns the current instruction address + 4.

See: [Program Counter and Execution Flow](program-counter-and-execution-flow.md)

## Program Status Register (xPSR)

The xPSR is a 32-bit register combining three logical sub-registers:

```
  31 30 29 28 27 26    24 23     16 15  10 9    0
 +--+--+--+--+--+-------+----------+------+------+
 |N |Z |C |V |Q | (res) | ICI/IT   | (res)|ExcNum|
 +--+--+--+--+--+-------+----------+------+------+
 |<--- APSR --->|       |<- EPSR ->|      |IPSR  |
```

### APSR (Application Program Status Register) -- bits 31:27

| Bit | Flag | Meaning |
|---|---|---|
| 31 | N | Negative -- result is negative (bit 31 = 1) |
| 30 | Z | Zero -- result is zero |
| 29 | C | Carry -- unsigned overflow or no borrow |
| 28 | V | Overflow -- signed overflow |
| 27 | Q | Saturation -- sticky, set by saturating instructions (M4) |

### IPSR (Interrupt Program Status Register) -- bits 8:0

Contains the **exception number** of the currently executing handler. Zero means Thread Mode (no active exception). For example, `IPSR = 15` means the SysTick handler is running.

### EPSR (Execution Program Status Register) -- bits 26:24, 15:10

Contains the **Thumb state bit** (T, bit 24) and the **IT block state** for conditional execution. The T bit must always be 1 on Cortex-M (it only supports Thumb mode). If T is cleared, a HardFault occurs.

### Reading and Writing xPSR

You cannot access xPSR directly. Use the `MRS` and `MSR` instructions:

```arm
MRS R0, APSR       @ Read APSR flags into R0
MRS R0, IPSR       @ Read current exception number
MSR APSR_nzcvq, R0 @ Write flags (rarely done directly)
```

## Interrupt Masking Registers

These special registers control which interrupts the CPU will accept:

### PRIMASK (1 bit)

```arm
CPSID I         @ Set PRIMASK = 1 (disable all interrupts except NMI)
CPSIE I         @ Set PRIMASK = 0 (enable interrupts)
```

Equivalent to a global interrupt disable. Fast and simple.

### BASEPRI (up to 8 bits, Cortex-M3/M4/M7 only)

Sets a priority threshold. Interrupts with priority >= BASEPRI value are blocked.

```arm
MOV  R0, #0x40
MSR  BASEPRI, R0    @ Block interrupts with priority >= 0x40
MOV  R0, #0
MSR  BASEPRI, R0    @ Re-enable all interrupts
```

This is more selective than PRIMASK -- you can block low-priority interrupts while still allowing critical ones.

### FAULTMASK (1 bit, Cortex-M3/M4/M7 only)

Like PRIMASK but also blocks HardFault. Only NMI can preempt. Rarely used in application code.

### CONTROL Register (2--3 bits)

| Bit | Name | Meaning |
|---|---|---|
| 0 | nPRIV | 0 = privileged, 1 = unprivileged (Thread Mode only) |
| 1 | SPSEL | 0 = use MSP, 1 = use PSP (Thread Mode only) |
| 2 | FPCA | 1 = FP context is active (Cortex-M4F/M7 with FPU) |

```arm
MRS R0, CONTROL
ORR R0, R0, #0x02   @ Set SPSEL = 1 (switch to PSP)
MSR CONTROL, R0
ISB                  @ Instruction Sync Barrier (required after CONTROL write)
```

## Register Width Defines the Architecture

Because all registers are 32 bits wide:
- The ALU processes 32-bit operands in one cycle
- Addresses are 32 bits, giving a 4 GB address space (0x00000000--0xFFFFFFFF)
- A `LDR` instruction loads 32 bits from memory into a register in one operation
- Pointers are 4 bytes in C code compiled for Cortex-M

## References

1. [ARM Cortex-M4 Core Registers](https://embeddedprep.com/arm-cortex-m4-core-registers/) — Detailed guide to M4 register file and usage conventions
2. [ARM Cortex-M3 Core Registers - ARM Developer](https://developer.arm.com/documentation/dui0552/latest/the-cortex-m3-processor/programmers-model/core-registers) — Official ARM documentation for M3 core register model
3. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Cortex-M architecture overview including special registers

## Related Topics

- [CPU Core and ALU](cpu-core-and-alu.md) -- how registers feed the ALU
- [Program Counter and Execution Flow](program-counter-and-execution-flow.md) -- PC (R15) in depth
- [Stack Pointer and Call Stack](stack-pointer-and-call-stack.md) -- SP (R13) in depth
