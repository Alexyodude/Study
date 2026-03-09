---
title: "CPU Core and ALU"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, alu, cpu-core, arm, cortex-m, arithmetic]
status: draft
sources:
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
  - url: "https://microcontrollerslab.com/arm-cortex-m4-architecture/"
    title: "ARM Cortex-M4 Architecture"
---

## What the ALU Does

The **Arithmetic Logic Unit (ALU)** is the part of the CPU that performs calculations. Every time your code adds two numbers, compares a sensor reading to a threshold, or toggles a bit in a register, the ALU does the actual work.

The [ARM Cortex-M](https://en.wikipedia.org/wiki/ARM_Cortex-M) ALU is 32 bits wide -- it operates on 32-bit values in a single step.

## ALU Operations

### Arithmetic Operations

| Instruction | Operation | Example |
|---|---|---|
| `ADD R0, R1, R2` | R0 = R1 + R2 | Addition |
| `ADDS R0, R1, R2` | R0 = R1 + R2, update flags | Addition with flags |
| `SUB R0, R1, R2` | R0 = R1 - R2 | Subtraction |
| `MUL R0, R1, R2` | R0 = R1 * R2 | Multiplication |
| `SDIV R0, R1, R2` | R0 = R1 / R2 (signed) | Division (M3/M4 only) |

### Logic Operations

| Instruction | Operation | Example Use |
|---|---|---|
| `AND R0, R1, R2` | R0 = R1 & R2 | Mask specific bits |
| `ORR R0, R1, R2` | R0 = R1 \| R2 | Set specific bits |
| `EOR R0, R1, R2` | R0 = R1 ^ R2 | Toggle bits |
| `BIC R0, R1, R2` | R0 = R1 & ~R2 | Clear specific bits |
| `MVN R0, R1` | R0 = ~R1 | Bitwise NOT |

### Shift Operations

| Instruction | Operation | Effect |
|---|---|---|
| `LSL R0, R1, #3` | R0 = R1 << 3 | Multiply by 8 |
| `LSR R0, R1, #2` | R0 = R1 >> 2 (unsigned) | Divide by 4 |
| `ASR R0, R1, #1` | R0 = R1 >> 1 (signed) | Signed divide by 2 |
| `ROR R0, R1, #4` | Rotate R1 right by 4 | Circular shift |

## Data Path: From Registers Through the ALU

When the CPU executes `ADDS R0, R1, R2`, this is what happens inside:

```
  Register File
  +--------+
  | R1: 5  |----> Operand A ----+
  +--------+                    |    +---------+
  | R2: 3  |----> Operand B ---+--->|   ALU   |---> Result (8) ---> R0
  +--------+                        |  ADD op |
                                    +---------+
                                        |
                                    Status Flags
                                    N=0, Z=0, C=0, V=0
```

1. The **decode stage** identifies the source registers (R1, R2) and the operation (ADD)
2. The **register file** outputs the values of R1 and R2 onto internal buses
3. The **ALU** receives both operands, performs addition, and produces the result
4. The result is written back to the **destination register** (R0)
5. If the `S` suffix is present (`ADDS`), the **status flags** are updated

## Status Flags (Condition Flags)

The ALU can optionally update four status flags in the **APSR** (Application Program Status Register). These flags are used by conditional instructions to make decisions.

| Flag | Name | Set When |
|---|---|---|
| **N** | Negative | Result bit 31 is 1 (result is negative in signed math) |
| **Z** | Zero | Result is exactly zero |
| **C** | Carry | Unsigned overflow (add), or no borrow (subtract) |
| **V** | Overflow | Signed overflow (result doesn't fit in 32 bits) |

### Flag Examples

```arm
@ Example 1: Zero flag
MOVS R0, #5
SUBS R0, R0, #5    @ R0 = 0, Z=1, N=0, C=1, V=0

@ Example 2: Negative flag
MOVS R0, #3
SUBS R0, R0, #10   @ R0 = -7 (0xFFFFFFF9), Z=0, N=1

@ Example 3: Carry flag
MOVS R0, #0xFFFFFFFF
ADDS R0, R0, #1    @ R0 = 0, C=1, Z=1 (unsigned overflow)

@ Example 4: Overflow flag
MOV  R0, #0x7FFFFFFF   @ Max positive signed 32-bit
ADDS R0, R0, #1        @ R0 = 0x80000000, V=1 (signed overflow)
```

### Using Flags for Conditional Execution

Flags drive conditional branches. The pattern is: perform an operation that sets flags, then branch based on the result.

```arm
CMP R0, R1          @ Computes R0 - R1, sets flags (discards result)
BEQ equal_label     @ Branch if Z=1 (R0 == R1)
BGT greater_label   @ Branch if Z=0 and N==V (R0 > R1, signed)
BCC less_unsigned   @ Branch if C=0 (R0 < R1, unsigned)
```

`CMP` is essentially `SUBS` but it throws away the result -- it only updates flags.

## Cortex-M Specific: Saturating Arithmetic and DSP

[Cortex-M4 and M7](https://microcontrollerslab.com/arm-cortex-m4-architecture/) add DSP-oriented ALU instructions:

- **QADD, QSUB** -- saturating add/subtract (clamp to max/min instead of wrapping)
- **SMLAL** -- signed multiply-accumulate (64-bit result)
- **USAT, SSAT** -- unsigned/signed saturation

The **Q flag** in APSR is set when a saturating operation clips the result. This is useful in audio and motor control where overflow would produce dangerous glitches.

```arm
@ Saturating add: if R1 + R2 > 0x7FFFFFFF, result clamps to 0x7FFFFFFF
QADD R0, R1, R2
```

## Practical Example: Setting a GPIO Pin

Even a simple "turn on an LED" involves the ALU:

<!-- tabs -->
```c
// C code
GPIOA->ODR |= (1 << 5);  // Set bit 5 of output data register
```

```rust
// Using PAC (read-modify-write via register API)
let gpioa = unsafe { &*pac::GPIOA::ptr() };
gpioa.odr.modify(|r, w| unsafe { w.bits(r.bits() | (1 << 5)) });

// Using HAL (type-safe, no bit manipulation needed)
let mut led = gpioa.pa5.into_push_pull_output();
led.set_high();
```
<!-- /tabs -->

The compiler generates something like:

```arm
LDR  R0, =0x40020014    @ Load address of GPIOA->ODR
LDR  R1, [R0]           @ Read current value
ORR  R1, R1, #0x20      @ ALU sets bit 5 (OR with 0x20)
STR  R1, [R0]           @ Write back modified value
```

The ALU performs the `ORR` -- a logic operation that sets one bit while preserving all others.

## References

1. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Overview of Cortex-M core internals and data path
2. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — General reference for Cortex-M ALU capabilities
3. [ARM Cortex-M4 Architecture](https://microcontrollerslab.com/arm-cortex-m4-architecture/) — Cortex-M4 DSP instructions and saturating arithmetic details

## Related Topics

- [Registers and Register File](registers-and-register-file.md) -- where the ALU gets its operands
- [Instruction Set Overview](instruction-execution/instruction-set-overview.md) -- the full instruction catalog
- [Fetch-Decode-Execute](instruction-execution/fetch-decode-execute.md) -- the ALU's role in the execution stage
