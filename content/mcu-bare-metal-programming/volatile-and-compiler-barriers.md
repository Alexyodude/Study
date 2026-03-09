---
title: "Volatile and Compiler Barriers"
created: 2026-03-08
updated: 2026-03-08
tags: [volatile, memory-barriers, DMB, DSB, ISB, optimization, MMIO]
status: draft
sources:
  - url: "https://developer.arm.com/documentation/100941/latest/Barriers"
    title: "ARM Documentation - Barriers"
  - url: "https://documentation-service.arm.com/static/5efefb97dbdee951c1cd5aaf"
    title: "ARM DAI 0321A - ARM Cortex-M Programming Guide to Memory Barrier Instructions"
  - url: "https://medium.com/@levinet.nicolai/the-role-of-memory-barriers-for-different-memory-types-3ac990e1944a"
    title: "ARM Memory Barriers: DMB, DSB, ISB"
  - url: "https://www.embedded.com/dealing-with-memory-access-ordering-in-complex-embedded-designs/"
    title: "Dealing with Memory Access Ordering in Complex Embedded Designs"
  - url: "https://blog.feabhas.com/2019/01/peripheral-register-access-using-c-structs-part-1/"
    title: "Peripheral Register Access Using C Structs - Feabhas"
---

## Why Volatile Matters

The C compiler is aggressive about optimization. If it sees code like this:

<!-- tabs -->
```c
uint32_t *status = (uint32_t *)0x40020010;

while (*status == 0) {
    /* Wait for hardware to set a flag */
}
```

```rust
// BUG: without volatile, the compiler may optimize this to an infinite loop
let status = 0x4002_0010 as *const u32;
unsafe {
    while *status == 0 {  // May be hoisted out of loop!
        // Wait for hardware to set a flag
    }
}
```
<!-- /tabs -->

The compiler may reason: "The value at `*status` never changes inside this loop, so I can read it once and cache the result in a register." The optimized code becomes an infinite loop that never re-reads the hardware register.

The `volatile` keyword tells the compiler: "This value can change at any time without your knowledge. You must read from memory every single time."

<!-- tabs -->
```c
volatile uint32_t *status = (volatile uint32_t *)0x40020010;

while (*status == 0) {
    /* Compiler will re-read the register on every iteration */
}
```

```rust
use core::ptr::read_volatile;

let status = 0x4002_0010 as *const u32;
unsafe {
    while read_volatile(status) == 0 {
        // read_volatile forces a re-read on every iteration
    }
}
```
<!-- /tabs -->

Every memory-mapped I/O (MMIO) register access in embedded code must use `volatile`.

## What Volatile Does

`volatile` guarantees:

1. **Every read in the source code produces a load instruction.** The compiler will not cache the value in a CPU register across statements.
2. **Every write in the source code produces a store instruction.** The compiler will not eliminate "redundant" writes.
3. **Volatile accesses are not reordered with respect to other volatile accesses.** If you write register A before register B in your source, the compiler emits the stores in that order.

## What Volatile Does NOT Guarantee

`volatile` does **not** guarantee:

1. **Hardware memory ordering.** The CPU or bus can still reorder memory transactions, especially on more complex ARM cores with write buffers.
2. **Atomicity.** A volatile read/write is not atomic. On Cortex-M, 32-bit aligned accesses are atomic by the bus architecture, but read-modify-write sequences (like `|=`) are never atomic.
3. **Ordering with respect to non-volatile accesses.** The compiler may freely reorder non-volatile code around volatile accesses.

<!-- tabs -->
```c
volatile uint32_t *reg = (volatile uint32_t *)0x40020000;
int local_var = 0;

*reg = 0x01;         /* volatile write */
local_var = 42;      /* non-volatile -- compiler may move this before the write */
*reg = 0x02;         /* volatile write -- guaranteed after the first one */
```

```rust
use core::ptr::write_volatile;

let reg = 0x4002_0000 as *mut u32;
let mut local_var: i32 = 0;

unsafe {
    write_volatile(reg, 0x01);    // volatile write
    local_var = 42;                // non-volatile -- compiler may reorder
    write_volatile(reg, 0x02);    // volatile write -- guaranteed after first
}
```
<!-- /tabs -->

## Memory Barriers: DMB, DSB, ISB

ARM Cortex-M provides [three barrier instructions](https://developer.arm.com/documentation/100941/latest/Barriers) to enforce ordering at the hardware level:

### DMB -- Data Memory Barrier

Ensures that all memory accesses before the DMB complete before any memory access after it. The processor can continue executing non-memory instructions.

<!-- tabs -->
```c
__DMB();  /* CMSIS intrinsic */
```

```rust
cortex_m::asm::dmb(); // Data Memory Barrier
```
<!-- /tabs -->

**When to use:** After writing to a peripheral register that affects another peripheral. For example, after enabling a peripheral clock (RCC), use DMB before accessing that peripheral's registers.

### DSB -- Data Synchronization Barrier

Stronger than DMB. The processor stalls until all outstanding memory accesses complete. No further instructions execute until the barrier finishes.

<!-- tabs -->
```c
__DSB();  /* CMSIS intrinsic */
```

```rust
cortex_m::asm::dsb(); // Data Synchronization Barrier
```
<!-- /tabs -->

**When to use:**
- After modifying the vector table (VTOR)
- After enabling/disabling interrupts
- Before `WFI` (Wait For Interrupt) to ensure all memory writes are complete

### ISB -- Instruction Synchronization Barrier

Flushes the instruction pipeline. All instructions after the ISB are fetched fresh from memory.

<!-- tabs -->
```c
__ISB();  /* CMSIS intrinsic */
```

```rust
cortex_m::asm::isb(); // Instruction Synchronization Barrier
```
<!-- /tabs -->

**When to use:**
- After modifying control registers that affect instruction execution (e.g., enabling the FPU)
- After updating the vector table offset (VTOR)
- After changing memory protection settings (MPU)

### Typical Barrier Patterns

<!-- tabs -->
```c
/* Enable GPIOA clock, then access GPIOA registers */
RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;
__DSB();                              /* Ensure clock is enabled */
GPIOA->MODER |= (1 << 10);           /* Now safe to access GPIOA */

/* Relocate vector table */
SCB->VTOR = 0x08004000;
__DSB();                              /* Complete the write */
__ISB();                              /* Flush pipeline to use new table */
```

```rust
use core::ptr::{read_volatile, write_volatile};
use cortex_m::asm::{dsb, isb};

unsafe {
    // Enable GPIOA clock, then access GPIOA registers
    let rcc_ahb1enr = 0x4002_3830 as *mut u32;
    write_volatile(rcc_ahb1enr, read_volatile(rcc_ahb1enr) | (1 << 0));
    dsb();                                  // Ensure clock is enabled
    let gpioa_moder = 0x4002_0000 as *mut u32;
    write_volatile(gpioa_moder, read_volatile(gpioa_moder) | (1 << 10));

    // Relocate vector table
    let scb = &*cortex_m::peripheral::SCB::PTR;
    scb.vtor.write(0x0800_4000);
    dsb();                                  // Complete the write
    isb();                                  // Flush pipeline to use new table
}
```
<!-- /tabs -->

## Compiler Barriers

A compiler barrier prevents the compiler from reordering code across it, without generating any actual CPU instruction:

<!-- tabs -->
```c
__asm volatile ("" ::: "memory");
```

```rust
// Rust equivalent: compiler fence (no CPU instruction emitted)
core::sync::atomic::compiler_fence(core::sync::atomic::Ordering::SeqCst);

// Or using the cortex-m crate:
// cortex_m::asm::nop() is NOT the same — it emits an instruction.
// compiler_fence is the correct equivalent of asm volatile("" ::: "memory").
```
<!-- /tabs -->

This tells GCC: "I may have changed any memory location. Reload everything you had cached in registers."

This is lighter than a hardware barrier -- it only affects the compiler, not the CPU. Useful when you need ordering guarantees in a single-core system where hardware reordering is not a concern (which is most Cortex-M0/M3 scenarios with strongly-ordered memory).

CMSIS also provides `__COMPILER_BARRIER()` on some toolchains.

## Common Bugs from Missing Volatile

### Bug 1: Polling Loop Never Exits

<!-- tabs -->
```c
/* BUG: Missing volatile */
uint32_t *uart_status = (uint32_t *)0x40011000;
while (!(*uart_status & (1 << 7)));  /* Optimized to infinite loop at -O2 */
```

```rust
// BUG: Using normal dereference instead of read_volatile
let uart_status = 0x4001_1000 as *const u32;
unsafe {
    while *uart_status & (1 << 7) == 0 {}  // Optimized away at release!
}

// FIX: Use read_volatile
unsafe {
    while core::ptr::read_volatile(uart_status) & (1 << 7) == 0 {}
}
```
<!-- /tabs -->

### Bug 2: Register Write Eliminated

<!-- tabs -->
```c
/* BUG: Missing volatile */
uint32_t *led_reg = (uint32_t *)0x40020014;
*led_reg = 0xFF;   /* Turn LEDs on */
*led_reg = 0x00;   /* Turn LEDs off -- compiler may remove the first write */
```

```rust
// BUG: Using normal write instead of write_volatile
let led_reg = 0x4002_0014 as *mut u32;
unsafe {
    *led_reg = 0xFF;   // Compiler may eliminate this write!
    *led_reg = 0x00;
}

// FIX: Use write_volatile — both writes are preserved
unsafe {
    core::ptr::write_volatile(led_reg, 0xFF);
    core::ptr::write_volatile(led_reg, 0x00);
}
```
<!-- /tabs -->

The compiler sees two writes to the same location and optimizes away the first one. With `volatile`, both writes are preserved because each one has a visible side effect on the hardware.

### Bug 3: Peripheral Access After Clock Enable Fails

<!-- tabs -->
```c
RCC->AHB1ENR |= (1 << 0);   /* Enable GPIOA clock */
/* BUG: No barrier -- the clock enable may not have taken effect yet */
GPIOA->MODER = 0x01;         /* May fault or be ignored */
```

```rust
unsafe {
    let rcc = 0x4002_3830 as *mut u32;
    write_volatile(rcc, read_volatile(rcc) | (1 << 0)); // Enable GPIOA clock
    // BUG: No barrier — clock enable may not have propagated yet
    let moder = 0x4002_0000 as *mut u32;
    write_volatile(moder, 0x01); // May fault or be ignored

    // FIX: Add a DSB after clock enable
    // cortex_m::asm::dsb();
}
```
<!-- /tabs -->

The bus write to RCC may still be in a [write buffer](https://www.embedded.com/dealing-with-memory-access-ordering-in-complex-embedded-designs/) when the GPIOA access executes. A `__DSB()` after the clock enable fixes this.

### Bug 4: Interrupt Flag Not Seen

<!-- tabs -->
```c
volatile int flag = 0;    /* Set to 1 in ISR */

void ISR_Handler(void) {
    flag = 1;
}

int main(void) {
    while (!flag);   /* Works because flag is volatile */
    do_something();
}
```

```rust
use core::sync::atomic::{AtomicBool, Ordering};

// In Rust, use atomics for ISR-to-main communication
// (volatile alone is not idiomatic for shared flags)
static FLAG: AtomicBool = AtomicBool::new(false);

#[interrupt]
fn ISR_Handler() {
    FLAG.store(true, Ordering::Release);
}

#[entry]
fn main() -> ! {
    while !FLAG.load(Ordering::Acquire) {
        // Spin — atomic ensures no caching
    }
    do_something();
    loop {}
}
```
<!-- /tabs -->

Without `volatile` on `flag`, the compiler caches `flag` in a register in `main()` and never sees the ISR's update.

## Quick Reference

| Problem | Solution |
|---------|----------|
| Compiler caches MMIO reads | Use `volatile` |
| Compiler removes "redundant" MMIO writes | Use `volatile` |
| Compiler reorders code across MMIO | `volatile` handles volatile-to-volatile ordering |
| Need non-volatile ordering with volatile | Compiler barrier: `__asm volatile("" ::: "memory")` |
| Hardware write buffer delays propagation | `__DSB()` |
| Need to refetch instructions after config change | `__ISB()` |
| Need ordered memory accesses at hardware level | `__DMB()` |

## References

1. [ARM Documentation - Barriers](https://developer.arm.com/documentation/100941/latest/Barriers) — Official ARM reference for DMB, DSB, and ISB instructions
2. [ARM Cortex-M Programming Guide to Memory Barrier Instructions](https://documentation-service.arm.com/static/5efefb97dbdee951c1cd5aaf) — ARM application note on when barriers are needed
3. [ARM Memory Barriers: DMB, DSB, ISB](https://medium.com/@levinet.nicolai/the-role-of-memory-barriers-for-different-memory-types-3ac990e1944a) — Explains barrier roles for different memory types
4. [Dealing with Memory Access Ordering in Complex Embedded Designs](https://www.embedded.com/dealing-with-memory-access-ordering-in-complex-embedded-designs/) — Write buffer and memory ordering issues in practice
5. [Peripheral Register Access Using C Structs - Feabhas](https://blog.feabhas.com/2019/01/peripheral-register-access-using-c-structs-part-1/) — Volatile usage in struct-based peripheral access

## Related Topics

- [Register-Level Programming](register-level-programming.md) -- applying volatile to real peripheral access
- [Startup Code](startup-code.md) -- barriers may be needed during early initialization
