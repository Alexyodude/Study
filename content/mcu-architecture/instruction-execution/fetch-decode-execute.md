---
title: "Fetch-Decode-Execute Cycle"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, fetch, decode, execute, pipeline, arm, cortex-m]
status: draft
sources:
  - url: "https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/"
    title: "Instruction Pipeline in ARM Cortex-M Series"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
---

## Overview

Every instruction the CPU processes goes through three fundamental stages: **fetch**, **decode**, and **execute**. This cycle is at the heart of how [ARM Cortex-M pipelines](https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/) operate. Understanding these stages helps you reason about timing, pipeline behavior, and why certain operations cost more cycles than others.

## Stage 1: Fetch

The fetch stage retrieves the next instruction from memory.

**What happens:**
1. The **Program Counter (PC)** value is placed on the **address bus**
2. The bus matrix routes the request to **flash memory** (or SRAM if executing from RAM)
3. Flash returns the instruction bytes (2 bytes for 16-bit Thumb, 4 bytes for 32-bit Thumb-2)
4. The instruction is loaded into the **instruction register**
5. PC is incremented (by 2 or 4) to point to the next instruction

```
  PC: 0x0800_0100
       |
       v
  Address Bus ---> Flash Memory
                       |
                       v
                   Instruction: 0x1840  (ADDS R0, R0, R1)
                       |
                       v
                   Instruction Register
```

### Fetch Bottlenecks

- **Flash wait states**: at high clock speeds, flash can't respond in 1 cycle. The CPU stalls until flash is ready. The prefetch buffer and instruction cache (ART Accelerator on STM32F4) mitigate this.
- **Branch instructions**: when a branch is taken, the already-fetched instruction in the pipeline is wrong and must be discarded (pipeline flush).

## Stage 2: Decode

The decode stage interprets the instruction and prepares the operands.

**What happens:**
1. The **opcode** (operation code) is extracted from the instruction bits
2. The decoder identifies the operation type (ADD, LDR, B, etc.)
3. **Source register** numbers are extracted and used to read values from the register file
4. **Immediate values** are extracted and sign-extended if needed
5. **Control signals** are generated for the ALU, memory interface, and write-back logic

### Example: Decoding `ADDS R0, R1, R2` (encoding: `0x1888`)

```
  Instruction bits: 0001 1000 1000 1000
                    ^^^^ ^^             = opcode (ADD, register)
                           ^^^ ^^^      = Rm (R2), Rn (R1)
                                  ^^^   = Rd (R0)

  Decoder output:
    Operation:  ADD
    Source A:   R1 (value from register file)
    Source B:   R2 (value from register file)
    Destination: R0
    Update flags: Yes (S suffix)
```

## Stage 3: Execute

The execute stage performs the actual operation and writes the result.

**What happens depends on the instruction type:**

### Data Processing (e.g., ADD, AND, MOV)
1. ALU receives two operands from the register file
2. ALU performs the operation (add, subtract, AND, OR, shift, etc.)
3. Result is written to the destination register
4. Status flags (N, Z, C, V) are updated if the `S` suffix is present

### Memory Access (e.g., LDR, STR)
1. ALU computes the effective address (base register + offset)
2. For **LDR**: address goes on the bus, data returns from memory into a register
3. For **STR**: register value is sent to memory at the computed address
4. Memory operations take additional cycles (1--2 extra for SRAM, more for flash)

### Branch (e.g., B, BL, BX)
1. ALU computes the target address (PC + offset, or from a register)
2. For conditional branches: check the condition flags first
3. If branch is taken: load target address into PC, flush the pipeline
4. For BL: also save the return address in LR

## Visual Walkthrough: `ADDS R0, R1, R2`

Assume R1 = 5, R2 = 3.

```
  Cycle 1: FETCH
  +--------+    +------------------+    +------------------+
  | PC:    |--->| Address Bus      |--->| Flash @ 0x100    |
  | 0x100  |    |                  |    | Returns: 0x1888  |
  +--------+    +------------------+    +------------------+
                                              |
  PC incremented to 0x102                     v
                                        Instruction Reg: 0x1888

  Cycle 2: DECODE
  +------------------+    +------------------+
  | Instruction Reg  |--->| Decoder          |
  | 0x1888           |    | Op: ADD          |
  +------------------+    | Src: R1, R2      |
                          | Dst: R0          |
                          | Flags: Yes       |
                          +------------------+
                               |        |
                          +----+    +---+
                          v         v
                    R1 -> 5    R2 -> 3
                    (from register file)

  Cycle 3: EXECUTE
  +----------+         +----------+
  | Operand A|---> 5   |          |
  |          |         |   ALU    |---> Result: 8 ---> R0
  | Operand B|---> 3   |  (ADD)   |
  +----------+         +----------+
                            |
                       Flags: N=0, Z=0, C=0, V=0
```

**Result:** R0 = 8, no flags set (result is positive, non-zero, no carry, no overflow).

## Multi-Cycle Instructions

Not all instructions complete in one execute cycle:

| Instruction Type | Typical Cycles | Why |
|---|---|---|
| Register ALU (ADD, MOV) | 1 | Single ALU operation |
| Multiply (MUL) | 1 (M3/M4) | Hardware multiplier |
| Load (LDR) | 2 | Memory access takes extra cycle |
| Store (STR) | 2 | Memory access takes extra cycle |
| Branch (taken) | 1 + pipeline refill | Pipeline flush costs 1-3 cycles |
| Divide (SDIV, UDIV) | 2--12 (M3/M4) | Iterative algorithm |
| Load Multiple (LDM) | 1 + N | N = number of registers loaded |

## Walkthrough: LDR R0, [R1, #4]

This load instruction reads a word from memory at address (R1 + 4) into R0.

```
  Cycle 1: FETCH
    Fetch instruction from flash

  Cycle 2: DECODE + Address Calculation
    Decode: LDR, base=R1, offset=4
    ALU computes: effective_address = R1 + 4

  Cycle 3: MEMORY ACCESS
    Put effective_address on data bus
    Wait for SRAM to return the 32-bit word

  Cycle 4: WRITE-BACK
    Store the loaded value into R0
```

In a pipelined processor, some of these stages overlap with the next instruction's fetch/decode, so the effective penalty is often less than the total cycle count suggests.

## References

1. [Instruction Pipeline in ARM Cortex-M Series](https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/) — Detailed explanation of pipeline stages in Cortex-M
2. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Cortex-M core architecture and instruction processing
3. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — Cortex-M instruction cycle and multi-cycle operations

## Related Topics

- [CPU Core and ALU](../cpu-core-and-alu.md) -- ALU operations in the execute stage
- [Pipeline Basics](pipeline-basics.md) -- how stages overlap
- [Clock Cycles and Timing](clock-cycles-and-timing.md) -- CPI for different instruction types
- [Program Counter and Execution Flow](../program-counter-and-execution-flow.md) -- PC drives the fetch stage
