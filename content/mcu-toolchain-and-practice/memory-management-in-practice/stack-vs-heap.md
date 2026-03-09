---
title: "Stack vs Heap"
created: 2026-03-08
updated: 2026-03-08
tags: [stack, heap, memory, embedded, allocation]
status: draft
sources:
  - url: "https://medium.com/@haekyong13/stack-vs-heap-memory-in-c-what-every-embedded-engineer-should-know-e46dd2cd1f14"
    title: "Stack vs. Heap Memory in C: What Every Embedded Engineer Should Know"
  - url: "https://www.embedded.com/mastering-stack-and-heap-for-system-reliability-part-1-calculating-stack-size/"
    title: "Mastering Stack and Heap for System Reliability"
  - url: "https://visualgdb.com/documentation/embedded/stackheap/"
    title: "Stack and Heap Layout of Embedded Projects - VisualGDB"
  - url: "https://electrical.codidact.com/posts/286121"
    title: "Why Should I Not Use Dynamic Memory Allocation in Embedded Systems?"
---

The [stack and the heap](https://medium.com/@haekyong13/stack-vs-heap-memory-in-c-what-every-embedded-engineer-should-know-e46dd2cd1f14) are the two main regions where data lives at runtime. In embedded systems, understanding their behavior is critical because both share the same limited SRAM, and mismanaging either one can crash your system.

## Stack

The stack is managed automatically by the CPU and compiler. It grows **downward** from the top of SRAM on ARM Cortex-M.

### Characteristics

- **LIFO** (Last In, First Out) -- function calls push frames; returns pop them
- **Deterministic** -- allocation and deallocation take constant time (just adjusting SP)
- **Fixed size** -- defined at link time, does not grow dynamically
- **Automatic cleanup** -- local variables are freed when the function returns

### What Goes on the Stack

- Function local variables
- Function parameters (those not passed in registers)
- Return addresses
- Saved registers during function calls and interrupts
- Interrupt context (8 registers auto-pushed by Cortex-M hardware)

### Stack Sizing

A typical Cortex-M project might allocate 1-8 KB for the main stack. The required size depends on:

- Maximum call depth (deepest function nesting)
- Size of local variables in each function
- Interrupt nesting depth (each interrupt pushes at least 32 bytes)
- RTOS task stacks (each task has its own stack)

**Example**: If your deepest call chain is 10 functions deep, each using ~50 bytes of locals, plus 3 levels of interrupt nesting at 32 bytes each, you need at minimum: `10 * 50 + 3 * 32 = 596 bytes`, plus some safety margin.

## Heap

The heap is managed by software (the C library's `malloc`/`free` implementation). It grows **upward** from after the `.bss` section.

### Characteristics

- **Flexible** -- allocate any size at any time
- **Non-deterministic** -- allocation time varies depending on heap state
- **Manual management** -- you must `free()` what you `malloc()`
- **Fragmentation risk** -- repeated alloc/free creates unusable gaps

### The Fragmentation Problem

Consider a heap with 1024 bytes free:

```
[A:128][free:64][B:256][free:128][C:64][free:384]
```

Total free: 64 + 128 + 384 = 576 bytes. But if you request a 256-byte block, `malloc` returns NULL -- no single contiguous chunk is large enough. This is **external fragmentation**.

On a desktop with gigabytes of RAM, fragmentation is a nuisance. On an MCU with 4 KB of SRAM, it is a system failure.

## When Heap Is Acceptable

Despite the warnings, there are cases where heap allocation on an MCU is reasonable:

- **One-time allocation at startup** -- allocate buffers during `main()` initialization and never free them. This avoids fragmentation entirely.
- **Large, infrequent buffers** -- if you need a temporary 2 KB buffer for one operation, heap can make sense if the allocation pattern is simple.
- **Memory pool backing** -- use a single `malloc` to get the pool memory, then manage it yourself.

The rule: if you can prove that `free()` is never called (or called in strict reverse order), heap is safe.

## Measuring Stack Usage

### Compiler Flags

GCC provides two useful flags:

```makefile
# Warn if any function uses more than N bytes of stack
CFLAGS += -Wstack-usage=256

# Generate .su files showing stack usage per function
CFLAGS += -fstack-usage
```

The `.su` files list each function and its stack consumption:

```
src/main.c:15:6:main	128	static
src/uart.c:42:6:uart_init	32	static
src/parser.c:89:6:parse_packet	512	dynamic,bounded
```

"static" means the compiler can determine the exact usage. "dynamic,bounded" means it includes variable-length arrays but the compiler can still bound it.

### Stack Watermarking

Fill the entire stack region with a known pattern at startup, then check how far the pattern was overwritten:

<!-- tabs -->
```c
#define STACK_FILL_PATTERN 0xDEADBEEF

// Call this very early in startup, before main()
void stack_paint(void) {
    extern uint32_t _stack_bottom;  // From linker script
    extern uint32_t _stack_top;

    volatile uint32_t *p = &_stack_bottom;
    // Don't overwrite the current stack frame!
    volatile uint32_t *current_sp;
    __asm volatile("mov %0, sp" : "=r"(current_sp));

    while (p < current_sp - 16) {  // Leave margin
        *p++ = STACK_FILL_PATTERN;
    }
}

// Call this periodically to check high-water mark
uint32_t stack_check_usage(void) {
    extern uint32_t _stack_bottom;
    extern uint32_t _stack_top;

    volatile uint32_t *p = &_stack_bottom;
    while (*p == STACK_FILL_PATTERN && p < &_stack_top) {
        p++;
    }

    uint32_t total = (uint32_t)&_stack_top - (uint32_t)&_stack_bottom;
    uint32_t unused = (uint32_t)p - (uint32_t)&_stack_bottom;
    return total - unused;  // Bytes used
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const STACK_FILL_PATTERN: u32 = 0xDEAD_BEEF;

extern "C" {
    static mut _stack_bottom: u32;
    static mut _stack_top: u32;
}

/// Call this very early in startup, before main()
unsafe fn stack_paint() {
    let mut p = &mut _stack_bottom as *mut u32;
    // Don't overwrite the current stack frame!
    let current_sp: *const u32;
    core::arch::asm!("mov {}, sp", out(reg) current_sp);

    while p < current_sp.sub(16) as *mut u32 { // Leave margin
        write_volatile(p, STACK_FILL_PATTERN);
        p = p.add(1);
    }
}

/// Call this periodically to check high-water mark
unsafe fn stack_check_usage() -> u32 {
    let bottom = &_stack_bottom as *const u32;
    let top = &_stack_top as *const u32;

    let mut p = bottom;
    while read_volatile(p) == STACK_FILL_PATTERN && p < top {
        p = p.add(1);
    }

    let total = top as u32 - bottom as u32;
    let unused = p as u32 - bottom as u32;
    total - unused // Bytes used
}
```
<!-- /tabs -->

The watermark tells you the [**maximum** stack usage](https://www.embedded.com/mastering-stack-and-heap-for-system-reliability-part-1-calculating-stack-size/) observed during the test run. In production, add a 25-50% safety margin above this value.

### Static Analysis

Tools like `arm-none-eabi-objdump` and dedicated analyzers can compute worst-case stack depth by analyzing the call graph:

```bash
# Dump call tree with stack usage
arm-none-eabi-nm --print-size --size-sort firmware.elf
```

For RTOS-based projects, most RTOSes (FreeRTOS, Zephyr) provide stack usage statistics per task via API calls like `uxTaskGetStackHighWaterMark()`.

## Linker Script Configuration

The stack and heap sizes are set in the linker script:

```ld
/* Define stack and heap sizes */
_stack_size = 0x1000;   /* 4 KB stack */
_heap_size  = 0x0400;   /* 1 KB heap (or 0 if unused) */

SECTIONS {
    /* ... other sections ... */

    .heap (NOLOAD) : {
        _heap_start = .;
        . += _heap_size;
        _heap_end = .;
    } > SRAM

    .stack (NOLOAD) : {
        _stack_bottom = .;
        . += _stack_size;
        _stack_top = .;
    } > SRAM
}
```

## Quick Reference

| Aspect | Stack | Heap |
|--------|-------|------|
| Growth direction | Downward (high to low) | Upward (low to high) |
| Speed | Very fast (SP adjust) | Slower (search free list) |
| Lifetime | Function scope | Until `free()` |
| Size | Fixed at link time | Grows until collision |
| Fragmentation | None | Yes |
| Thread safety | Each task gets its own | Needs mutex protection |
| Failure mode | Overflow (silent corruption) | Returns NULL |

## References

1. [Stack vs. Heap Memory in C: What Every Embedded Engineer Should Know](https://medium.com/@haekyong13/stack-vs-heap-memory-in-c-what-every-embedded-engineer-should-know-e46dd2cd1f14) — Comparison of stack and heap for embedded contexts
2. [Mastering Stack and Heap for System Reliability](https://www.embedded.com/mastering-stack-and-heap-for-system-reliability-part-1-calculating-stack-size/) — Methods for calculating worst-case stack usage
3. [Stack and Heap Layout of Embedded Projects - VisualGDB](https://visualgdb.com/documentation/embedded/stackheap/) — Visual guide to stack and heap memory layout
4. [Why Should I Not Use Dynamic Memory Allocation in Embedded Systems?](https://electrical.codidact.com/posts/286121) — Rationale for avoiding heap in embedded systems

## Related Topics

- [Static Allocation Patterns](static-allocation-patterns.md) -- alternatives to heap allocation
- [Fault Debugging Techniques](../debugging-and-probes/fault-debugging-techniques.md) -- detecting stack overflows
- [MPU Memory Protection](mpu-memory-protection.md) -- hardware stack guard regions
