---
title: "Instruction Execution"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, instruction-execution, pipeline, isa, arm, cortex-m]
status: draft
sources:
  - url: "https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/"
    title: "Instruction Pipeline in ARM Cortex-M Series"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
---

## The Instruction Cycle

Every program is a sequence of machine instructions stored in flash memory. The CPU's job is to process these instructions one by one (or overlapped, with a pipeline). Each instruction goes through a series of stages collectively called the **instruction cycle**.

At its simplest, the cycle has three phases:

```
  +----------+     +----------+     +-----------+
  |  FETCH   | --> |  DECODE  | --> |  EXECUTE  |
  +----------+     +----------+     +-----------+
       |                |                 |
  Read instruction   Figure out       Perform the
  from memory at     what the         operation:
  the PC address     opcode means     ALU, memory
                     and what         access, or
                     operands it      register
                     needs            write-back
```

This cycle repeats for every instruction. On a pipelined processor, multiple instructions can be in different stages simultaneously, increasing throughput.

## How Fast Does It Run?

The speed of instruction execution depends on:

1. **Clock frequency** -- how many cycles per second (e.g., 72 MHz = 72 million cycles/second)
2. **Cycles per instruction (CPI)** -- most Cortex-M instructions take 1 cycle, but loads, stores, and branches take more
3. **Wait states** -- flash memory may be slower than the CPU, adding stall cycles
4. **Pipeline efficiency** -- branches flush the pipeline, costing extra cycles

A Cortex-M4 at 168 MHz can theoretically process ~168 million simple instructions per second, but real throughput is lower due to wait states and branches.

## Deterministic Timing

Unlike desktop CPUs with deep pipelines, out-of-order execution, and caches that make timing unpredictable, [Cortex-M processors](https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/) (especially M0--M4) offer **deterministic timing**. Each instruction has a known, fixed cycle count. This is critical for:

- Hard real-time systems (motor control, audio processing)
- Bit-banging protocols (software-implemented SPI, UART)
- Timing-sensitive interrupt handlers

## Child Pages

- [Fetch-Decode-Execute](fetch-decode-execute.md) -- detailed walkthrough of each pipeline stage
- [Clock Cycles and Timing](clock-cycles-and-timing.md) -- CPI, wait states, MIPS
- [Pipeline Basics](pipeline-basics.md) -- 2-stage vs 3-stage pipelines, hazards
- [Instruction Set Overview](instruction-set-overview.md) -- RISC philosophy, Thumb/Thumb-2, addressing modes

## References

1. [Instruction Pipeline in ARM Cortex-M Series](https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/) — Pipeline stages and deterministic timing in Cortex-M
2. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — Cortex-M family overview including pipeline variants
3. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Cortex-M execution model and instruction cycle

## Related Topics

- [CPU Core and ALU](../cpu-core-and-alu.md) -- the execute stage performs ALU operations
- [Program Counter and Execution Flow](../program-counter-and-execution-flow.md) -- PC drives the fetch stage
- [Flash Memory](../memory-architecture/flash-memory.md) -- instructions are fetched from flash
- [Clock Sources and Tree](../clock-and-power-system/clock-sources-and-tree.md) -- the clock drives the pipeline
