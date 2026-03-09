---
title: "Memory Management in Practice"
created: 2026-03-08
updated: 2026-03-08
tags: [memory, embedded, allocation, dma, mpu]
status: draft
sources:
  - url: "https://electrical.codidact.com/posts/286121"
    title: "Why Should I Not Use Dynamic Memory Allocation in Embedded Systems?"
  - url: "https://www.embedded.com/mastering-stack-and-heap-for-system-reliability-part-1-calculating-stack-size/"
    title: "Mastering Stack and Heap for System Reliability"
  - url: "https://theembeddedgeorge.github.io/theEmbeddedNewTestament.github.io/Embedded_C/Memory_Management.html"
    title: "Memory Management in Embedded Systems"
---

Memory is the most constrained resource on a microcontroller. A typical Cortex-M0 might have 4 KB of SRAM and 16 KB of flash. Even a "large" Cortex-M7 often tops out at 1 MB of flash and 512 KB of SRAM. Every byte matters, and the allocation strategies you use on a desktop will not work here.

## Why Dynamic Allocation Is Dangerous

On a desktop, you call `malloc()` freely and the OS handles the rest with virtual memory and paging. On an MCU, there is no OS, no virtual memory, and no paging. Using `malloc()` and `free()` on an MCU [introduces several problems](https://electrical.codidact.com/posts/286121):

1. **Fragmentation** -- after many alloc/free cycles, free memory becomes scattered into small, unusable chunks. With only a few KB of heap, this can be fatal.

2. **Non-deterministic timing** -- `malloc()` traversal time depends on heap state. In a real-time system, you cannot guarantee how long an allocation will take.

3. **No recovery from failure** -- when `malloc()` returns `NULL`, most embedded code has no way to recover gracefully. There is no swap file to fall back on.

4. **Hidden memory leaks** -- without a memory debugger or OS-level tools, leaks in embedded code silently consume SRAM until the system crashes.

Many safety-critical coding standards (MISRA C, CERT C, DO-178C) ban or heavily restrict dynamic allocation for these reasons.

## Memory Management Strategies

Instead of dynamic allocation, embedded developers use a combination of techniques:

### Static Allocation

Allocate everything at compile time. Use global variables, `static` locals, and fixed-size arrays. The linker tells you exactly how much memory you need -- if it fits, it will always fit.

### Memory Pools

Pre-allocate a fixed number of fixed-size blocks. Code "allocates" by taking a block from the pool and "frees" by returning it. No fragmentation because all blocks are the same size.

### Ring Buffers

A fixed-size circular buffer for streaming data (UART, ADC, audio). The producer writes to the head; the consumer reads from the tail. No allocation needed after initialization.

### Stack Discipline

Keep local variables small. Avoid large arrays on the stack. Measure stack usage with compiler flags and watermarking.

### DMA

Use the DMA controller to move data between memory and peripherals without CPU involvement. This is not allocation per se, but it affects how you lay out buffers in memory.

### MPU Protection

Use the Memory Protection Unit to enforce access rules -- for example, making a stack guard region that triggers a fault on overflow.

## Section Overview

- [Stack vs Heap](stack-vs-heap.md) -- understanding the two allocation regions and measuring usage
- [DMA Controller](dma-controller.md) -- offloading memory transfers from the CPU
- [MPU Memory Protection](mpu-memory-protection.md) -- hardware access control for memory regions
- [Static Allocation Patterns](static-allocation-patterns.md) -- pools, ring buffers, and compile-time strategies

## Typical Memory Layout

For reference, here is how SRAM is typically organized on a Cortex-M MCU:

```
High Address
+-------------------+
|    Stack          |  Grows downward from top of SRAM
|    (grows down)   |
+-------------------+
|    (free space)   |  Stack and heap grow toward each other
+-------------------+
|    Heap           |  Grows upward (if used)
|    (grows up)     |
+-------------------+
|    .bss           |  Zero-initialized global/static variables
+-------------------+
|    .data          |  Initialized global/static variables
+-------------------+
Low Address
```

The gap between stack and heap is your safety margin. If they collide, you get silent memory corruption -- one of the hardest bugs to diagnose.

## References

1. [Why Should I Not Use Dynamic Memory Allocation in Embedded Systems?](https://electrical.codidact.com/posts/286121) — Discussion of malloc pitfalls in resource-constrained environments
2. [Mastering Stack and Heap for System Reliability](https://www.embedded.com/mastering-stack-and-heap-for-system-reliability-part-1-calculating-stack-size/) — Techniques for calculating and managing stack size
3. [Memory Management in Embedded Systems](https://theembeddedgeorge.github.io/theEmbeddedNewTestament.github.io/Embedded_C/Memory_Management.html) — Overview of embedded memory management strategies

## Related Topics

- [Linker Script](../../mcu-build-system-and-compilation/linker-script-and-memory-layout.md) -- defining memory regions and sections
- [Fault Debugging Techniques](../debugging-and-probes/fault-debugging-techniques.md) -- diagnosing memory-related crashes
