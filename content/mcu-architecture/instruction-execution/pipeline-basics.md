---
title: "Pipeline Basics"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, pipeline, hazards, branch-penalty, arm, cortex-m]
status: draft
sources:
  - url: "https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/"
    title: "Instruction Pipeline in ARM Cortex-M Series"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
---

## What Is a Pipeline?

Without a [pipeline](https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/), the CPU would fetch an instruction, decode it, execute it, then start over. Most of the hardware sits idle during each stage. A **pipeline** overlaps these stages so that while one instruction is executing, the next is being decoded, and a third is being fetched -- all simultaneously.

Think of it like a laundry assembly line: while one load is drying, the next is washing, and a third is being sorted.

## Pipeline Stages by Cortex-M Variant

### 2-Stage Pipeline: Cortex-M0+

The simplest pipeline, optimized for minimal power and silicon area:

```
  Stage 1: FETCH      - retrieve instruction, read operands
  Stage 2: EXECUTE    - decode + execute in one stage

  Cycle:   1    2    3    4    5
  Inst A: [F ] [EX]
  Inst B:      [F ] [EX]
  Inst C:           [F ] [EX]
```

**Trade-off:** Lower throughput (fewer overlapping stages) but lower power consumption and smaller die size.

### 3-Stage Pipeline: Cortex-M3 / M4

The most common pipeline in mid-range MCUs:

```
  Stage 1: FETCH      - retrieve instruction from memory
  Stage 2: DECODE     - interpret opcode, read register operands
  Stage 3: EXECUTE    - ALU operation, memory access, write-back

  Cycle:   1    2    3    4    5    6
  Inst A: [F ] [D ] [EX]
  Inst B:      [F ] [D ] [EX]
  Inst C:           [F ] [D ] [EX]
  Inst D:                [F ] [D ] [EX]
```

After the pipeline is full (cycle 3), one instruction completes every cycle -- achieving an ideal **CPI of 1** for single-cycle instructions.

### 6-Stage Pipeline: Cortex-M7

The [highest-performance M-profile pipeline](https://en.wikipedia.org/wiki/ARM_Cortex-M) with **dual-issue** capability:

```
  Stages: Fetch -> Decode -> Issue -> Execute -> Memory -> Write-back
```

The M7 can issue **two instructions per cycle** if they don't conflict, achieving CPI below 1 in some cases. It also includes branch prediction hardware to reduce pipeline penalties.

## Why PC Is "Ahead" of the Current Instruction

In a 3-stage pipeline, when an instruction is in the **execute** stage, the CPU has already fetched the instruction two positions ahead:

```
  Address    Instruction      Pipeline State (during execute of Inst A)
  0x100      Inst A           [EXECUTE]  <-- currently executing
  0x102      Inst B           [DECODE]
  0x104      Inst C           [FETCH]    <-- PC points here
```

If you read the PC during execution of `Inst A` at `0x100`, you get `0x104` (current + 4). This is a **defined behavior** in the ARM architecture. The ARM documentation states that reading PC returns the current instruction's address + 4.

This offset is accounted for by the assembler when computing PC-relative addresses (e.g., `LDR R0, [PC, #offset]`), so you rarely need to think about it -- but it explains why debuggers sometimes show unexpected PC values.

## Pipeline Hazards

A **hazard** occurs when the pipeline can't proceed normally. There are three types:

### Data Hazard

An instruction depends on the result of the preceding instruction that hasn't finished yet.

```arm
ADD  R0, R1, R2     @ Result goes to R0 (available after execute)
SUB  R3, R0, R4     @ Needs R0 -- but R0 isn't written back yet!
```

On Cortex-M3/M4, this is handled by **operand forwarding** (also called bypassing): the ALU result is fed directly to the next instruction's input without waiting for the register write-back. This eliminates most data hazard stalls.

### Control Hazard (Branch Hazard)

When a branch is taken, the instructions already in the pipeline (fetched speculatively) are wrong and must be discarded.

```arm
    CMP  R0, #0
    BEQ  target     @ If taken, pipeline has fetched the wrong next instructions
    ADD  R1, R1, #1 @ This was fetched but won't execute if branch is taken
    ...
target:
    MOV  R1, #0     @ This is what should execute
```

### Structural Hazard

Two pipeline stages need the same hardware resource simultaneously (e.g., both fetch and execute try to access memory). Cortex-M's Harvard architecture (separate instruction and data buses) avoids most structural hazards.

## Branch Penalty

When a branch is taken, the pipeline must be **flushed** -- instructions that were fetched and decoded after the branch are discarded, and fetching restarts from the branch target.

### Cost by Pipeline Depth

| Processor | Pipeline | Branch Penalty (taken) |
|---|---|---|
| Cortex-M0+ | 2-stage | 1 cycle |
| Cortex-M3/M4 | 3-stage | 1--3 cycles |
| Cortex-M7 | 6-stage | 1--7 cycles (mitigated by predictor) |

A deeper pipeline gives better throughput for sequential code but higher penalty for branches.

### Minimizing Branch Penalties

**Cortex-M0 through M4:** No hardware branch prediction. Every taken branch pays the full penalty. Software techniques:

- **If-Then (IT) blocks** (Cortex-M3/M4): conditional execution without branching:
  ```arm
  CMP  R0, #0
  ITE  EQ              @ If-Then-Else: next instruction if EQ, one after if NE
  MOVEQ R1, #1         @ Executes if Z=1 (no branch, no penalty)
  MOVNE R1, #0         @ Executes if Z=0
  ```

- **Conditional moves** instead of branch-over patterns

- **Loop unrolling**: reduce the number of branch-back instructions in tight loops

**Cortex-M7:** Includes a **branch target cache** that predicts branch outcomes, significantly reducing the penalty for loops and common branch patterns.

## Pipeline Example: A Complete Sequence

```arm
    MOV  R0, #5         @ Inst 1
    MOV  R1, #3         @ Inst 2
    ADD  R2, R0, R1     @ Inst 3 (uses R0, R1 from above)
    STR  R2, [R3]       @ Inst 4 (store result to memory)
```

On a 3-stage pipeline (Cortex-M3/M4):

```
  Cycle: 1    2    3    4    5    6
  Inst1: [F ] [D ] [EX]
  Inst2:      [F ] [D ] [EX]
  Inst3:           [F ] [D ] [EX]          <- data forwarded from Inst1/2
  Inst4:                [F ] [D ] [EX+MEM] <- extra cycle for memory access
```

Inst 3 needs R0 and R1. Thanks to forwarding, their values are available without stalls. Inst 4 needs an extra cycle for the memory write.

## Practical Impact

For most embedded code, pipeline details are invisible -- the compiler handles instruction ordering. But understanding pipelines helps you:

1. **Estimate execution time** accurately
2. **Understand why branches are expensive** in tight loops
3. **Interpret debugger behavior** (PC is ahead, breakpoints may seem off by one)
4. **Choose the right Cortex-M variant** for your latency requirements

## References

1. [Instruction Pipeline in ARM Cortex-M Series](https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/) — Pipeline depth and hazard handling in Cortex-M variants
2. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — Cortex-M7 dual-issue pipeline and branch prediction details
3. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Pipeline architecture and operand forwarding mechanisms

## Related Topics

- [Fetch-Decode-Execute](fetch-decode-execute.md) -- detailed view of each stage
- [Clock Cycles and Timing](clock-cycles-and-timing.md) -- CPI and deterministic timing
- [Program Counter and Execution Flow](../program-counter-and-execution-flow.md) -- how PC advances and branches work
- [Instruction Set Overview](instruction-set-overview.md) -- IT blocks and conditional execution
