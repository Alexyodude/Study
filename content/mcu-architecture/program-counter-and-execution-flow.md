---
title: "Program Counter and Execution Flow"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, program-counter, branching, arm, cortex-m]
status: draft
sources:
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
  - url: "https://embeddedprep.com/arm-cortex-m4-core-registers/"
    title: "ARM Cortex-M4 Core Registers"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
---

## What the Program Counter Does

The **Program Counter (PC, R15)** holds the address of the next instruction to be fetched from memory. After each fetch, the PC automatically advances to point to the following instruction. This is how the CPU moves through your program sequentially, one instruction at a time.

```
  Flash Memory
  Address    Instruction
  0x0800_0100:  MOV R0, #5        <-- PC points here first
  0x0800_0102:  MOV R1, #3        <-- then here
  0x0800_0104:  ADD R0, R0, R1    <-- then here
  0x0800_0106:  ...
```

For 16-bit Thumb instructions, PC advances by 2. For 32-bit Thumb-2 instructions, PC advances by 4.

## PC and the Pipeline

Due to the pipeline, the PC value you read in software is **ahead** of the instruction currently executing. On a [Cortex-M3/M4](https://embeddedprep.com/arm-cortex-m4-core-registers/) with a 3-stage pipeline:

- While instruction at address `0x100` is **executing**, the CPU has already **fetched** the instruction at `0x108`
- Reading PC during execution returns `current_instruction_address + 4`

This offset matters when computing PC-relative addresses (e.g., loading constants from a literal pool).

## Sequential Execution

By default, the CPU executes instructions in order. The PC increments automatically:

```arm
@ Sequential flow
MOV  R0, #10       @ PC = 0x100, then PC -> 0x102
MOV  R1, #20       @ PC = 0x102, then PC -> 0x104
ADD  R2, R0, R1    @ PC = 0x104, then PC -> 0x106
```

No special effort is needed -- this is the default behavior.

## Branching: Changing the Flow

**Branch instructions** break sequential flow by writing a new value into PC.

### Unconditional Branch: B

```arm
    MOV R0, #1
    B   skip          @ PC = address of "skip" label
    MOV R0, #2        @ This line is SKIPPED
skip:
    MOV R0, #3        @ Execution continues here
```

### Conditional Branches

Conditional branches check the status flags (N, Z, C, V) set by a previous instruction:

```arm
    CMP R0, #10       @ Compare: computes R0 - 10, sets flags
    BEQ is_ten         @ Branch if Equal (Z=1)
    BNE not_ten        @ Branch if Not Equal (Z=0)
    BGT greater        @ Branch if Greater Than (signed: Z=0 and N==V)
    BLT less           @ Branch if Less Than (signed: N!=V)
    BHI higher         @ Branch if Higher (unsigned: C=1 and Z=0)
    BLS lower_same     @ Branch if Lower or Same (unsigned: C=0 or Z=1)
```

Common condition suffixes:

| Suffix | Condition | Flags |
|---|---|---|
| EQ | Equal | Z=1 |
| NE | Not equal | Z=0 |
| GT | Greater than (signed) | Z=0, N=V |
| LT | Less than (signed) | N!=V |
| GE | Greater or equal (signed) | N=V |
| LE | Less or equal (signed) | Z=1 or N!=V |
| HI | Higher (unsigned >) | C=1, Z=0 |
| CS/HS | Carry set / unsigned >= | C=1 |
| CC/LO | Carry clear / unsigned < | C=0 |

### Implementing an If-Else

<!-- tabs -->
```c
// C code
if (x > 0) {
    y = 1;
} else {
    y = -1;
}
```

```rust
let y = if x > 0 { 1 } else { -1 };
```
<!-- /tabs -->

```arm
    CMP  R0, #0         @ x in R0
    BGT  positive
    MOV  R1, #-1         @ else: y = -1
    B    done
positive:
    MOV  R1, #1          @ y = 1
done:
    @ continue...
```

### Implementing a Loop

<!-- tabs -->
```c
// C code
for (int i = 0; i < 10; i++) { sum += i; }
```

```rust
let sum: i32 = (0..10).sum();

// Or with an explicit loop:
let mut sum = 0i32;
for i in 0..10 {
    sum += i;
}
```
<!-- /tabs -->

```arm
    MOV  R0, #0          @ i = 0
    MOV  R1, #0          @ sum = 0
loop:
    ADD  R1, R1, R0      @ sum += i
    ADD  R0, R0, #1      @ i++
    CMP  R0, #10
    BLT  loop            @ if i < 10, repeat
```

## Subroutine Calls: BL and BX LR

### BL (Branch with Link)

`BL` does two things:
1. Saves the return address in the **Link Register (LR, R14)** -- this is the address of the instruction right after `BL`
2. Sets PC to the target function address

```arm
    BL  my_function      @ LR = next instruction address; jump to my_function
    @ execution resumes here after my_function returns
```

### BX LR (Return from Subroutine)

```arm
my_function:
    @ ... do work ...
    BX  LR               @ PC = LR (return to caller)
```

### Nested Calls: Saving LR on the Stack

If `func_a` calls `func_b`, `func_b`'s `BL` will overwrite LR. So `func_a` must save LR first:

```arm
func_a:
    PUSH {LR}            @ Save return address on stack
    BL   func_b          @ LR now holds return to func_a's caller? No --
                         @ LR = address after this BL (inside func_a)
    POP  {PC}            @ Pop saved LR directly into PC = return to caller

func_b:
    @ leaf function (calls nothing), no need to save LR
    BX   LR
```

`POP {PC}` is a common idiom: it pops the saved LR value directly into PC, which is equivalent to a return.

## BX -- Branch and Exchange

`BX` branches to the address in a register. The lowest bit of the target address indicates the instruction set:
- Bit 0 = 1: Thumb mode (always the case on Cortex-M)
- Bit 0 = 0: ARM mode (causes a HardFault on Cortex-M, which only supports Thumb)

This is why function addresses in [Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) always have bit 0 set (e.g., `0x0800_0101` instead of `0x0800_0100`).

## How the CPU Fetches the Next Instruction

1. **PC** is placed on the **address bus**
2. The **bus matrix** routes the request to **Flash memory** (or SRAM if executing from RAM)
3. Flash returns the instruction word (2 or 4 bytes)
4. The instruction enters the **pipeline's fetch stage**
5. PC is incremented automatically
6. If a branch is taken, the pipeline is flushed and PC loads the branch target

The pipeline flush on a taken branch is why branches have a small performance cost (1--3 extra cycles depending on the pipeline depth).

## References

1. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Cortex-M execution modes, Thumb state, and branching
2. [ARM Cortex-M4 Core Registers](https://embeddedprep.com/arm-cortex-m4-core-registers/) — PC register behavior and pipeline offset details
3. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — General reference for Cortex-M pipeline and execution

## Related Topics

- [Registers and Register File](registers-and-register-file.md) -- PC is R15 in the register file
- [Stack Pointer and Call Stack](stack-pointer-and-call-stack.md) -- how PUSH/POP support nested calls
- [Pipeline Basics](instruction-execution/pipeline-basics.md) -- why PC is ahead of the current instruction
- [Fetch-Decode-Execute](instruction-execution/fetch-decode-execute.md) -- the full instruction cycle
