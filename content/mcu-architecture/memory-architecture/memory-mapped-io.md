---
title: "Memory-Mapped I/O"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, mmio, volatile, bit-banding, gpio, arm, cortex-m]
status: draft
sources:
  - url: "https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/"
    title: "Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
  - url: "https://embeddedprep.com/arm-cortex-m4-core-registers/"
    title: "ARM Cortex-M4 Core Registers"
---

## Peripherals as Memory Addresses

On [ARM Cortex-M](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) microcontrollers, **everything is a memory address**. Peripheral hardware -- GPIO pins, timers, UARTs, ADCs -- is controlled by reading and writing to specific addresses in the 32-bit address space. There are no special `IN`/`OUT` instructions; you use the same `LDR` (load) and `STR` (store) instructions used for SRAM.

The peripheral region occupies `0x4000_0000` to `0x5FFF_FFFF` in the standard ARM memory map.

### Example: GPIO on STM32F4

GPIOA's registers start at `0x4002_0000`. Each register is a 32-bit word at a fixed offset:

| Offset | Register | Purpose |
|---|---|---|
| 0x00 | MODER | Pin mode (input, output, alternate, analog) |
| 0x04 | OTYPER | Output type (push-pull, open-drain) |
| 0x08 | OSPEEDR | Output speed |
| 0x0C | PUPDR | Pull-up / pull-down |
| 0x10 | IDR | Input data (read pin states) |
| 0x14 | ODR | Output data (set pin states) |
| 0x18 | BSRR | Bit set/reset (atomic set or clear) |

To turn on an LED on PA5, you write to the ODR register at `0x4002_0014`.

## Reading a GPIO Register by Address

### Raw Pointer Access (C)

<!-- tabs -->
```c
// Read GPIOA->IDR (Input Data Register)
uint32_t value = *(volatile uint32_t *)0x40020010;

// Set bit 5 in GPIOA->ODR (turn on LED on PA5)
*(volatile uint32_t *)0x40020014 |= (1 << 5);
```

```rust
use core::ptr;

// Read GPIOA->IDR (Input Data Register)
let value = unsafe { ptr::read_volatile(0x4002_0010 as *const u32) };

// Set bit 5 in GPIOA->ODR (turn on LED on PA5)
unsafe {
    let odr = 0x4002_0014 as *mut u32;
    let current = ptr::read_volatile(odr);
    ptr::write_volatile(odr, current | (1 << 5));
}
```
<!-- /tabs -->

### Using Vendor-Defined Structs (Cleaner)

ST provides header files that map peripheral structs to their base addresses:

<!-- tabs -->
```c
// From stm32f4xx.h (simplified)
#define GPIOA_BASE  0x40020000
#define GPIOA       ((GPIO_TypeDef *)GPIOA_BASE)

typedef struct {
    volatile uint32_t MODER;    // 0x00
    volatile uint32_t OTYPER;   // 0x04
    volatile uint32_t OSPEEDR;  // 0x08
    volatile uint32_t PUPDR;    // 0x0C
    volatile uint32_t IDR;      // 0x10
    volatile uint32_t ODR;      // 0x14
    volatile uint32_t BSRR;     // 0x18
    volatile uint32_t LCKR;     // 0x1C
    volatile uint32_t AFR[2];   // 0x20-0x24
} GPIO_TypeDef;

// Usage:
GPIOA->ODR |= (1 << 5);        // Set PA5 high
uint32_t pins = GPIOA->IDR;    // Read all input pins
```

```rust
// The PAC (Peripheral Access Crate) auto-generates register structs
// from SVD files. All reads/writes use volatile access internally.
use stm32f4::stm32f407 as pac;

let gpioa = unsafe { &*pac::GPIOA::ptr() };

// Set PA5 high (read-modify-write via typed API)
gpioa.odr.modify(|r, w| unsafe { w.bits(r.bits() | (1 << 5)) });

// Read all input pins
let pins = gpioa.idr.read().bits();

// Or with HAL (fully type-safe, no raw bit manipulation):
// let mut pa5 = gpioa.pa5.into_push_pull_output();
// pa5.set_high();
```

```cpp
// C++ wrapper using a reference for cleaner syntax
#include "stm32f4xx.h"

inline auto& gpioa() {
    return *reinterpret_cast<GPIO_TypeDef*>(GPIOA_BASE);
}

// Usage:
gpioa().ODR |= (1 << 5);          // Set PA5 high
uint32_t pins = gpioa().IDR;      // Read all input pins
```
<!-- /tabs -->

## Why `volatile` Is Required

The `volatile` keyword tells the compiler: "this value can change at any time for reasons outside the program's control -- do not optimize away reads or writes."

### Without volatile (Dangerous)

<!-- tabs -->
```c
uint32_t *reg = (uint32_t *)0x40020010;  // No volatile!
while (*reg & 0x01) {
    // Wait for bit 0 to clear
}
```

```rust
// Rust equivalent of the WRONG approach (would require unsafe + raw ptr):
let reg = 0x4002_0010 as *const u32;
let cached = unsafe { *reg };  // Read once -- compiler may never re-read!
while cached & 0x01 != 0 {
    // Infinite loop -- `cached` never changes
}
```
<!-- /tabs -->

The compiler may optimize this to:

<!-- tabs -->
```c
uint32_t cached = *reg;     // Read once
while (cached & 0x01) {     // Loop forever -- never re-reads hardware
}
```

```rust
// This is what the compiler optimizes the non-volatile read to:
let cached = unsafe { *reg };  // Single read, value is cached
while cached & 0x01 != 0 {    // Loops forever -- never re-reads
}
```
<!-- /tabs -->

The compiler sees that `*reg` isn't modified inside the loop, so it "helpfully" caches the value. But the hardware can change the register at any time (e.g., a button is pressed, a timer overflows). Without `volatile`, the program never sees the change.

### With volatile (Correct)

<!-- tabs -->
```c
volatile uint32_t *reg = (volatile uint32_t *)0x40020010;
while (*reg & 0x01) {
    // Compiler re-reads *reg every iteration
}
```

```rust
use core::ptr;

let reg = 0x4002_0010 as *const u32;
// read_volatile forces a re-read every iteration (equivalent to C volatile)
while unsafe { ptr::read_volatile(reg) } & 0x01 != 0 {
    // Compiler re-reads the register every iteration
}
```
<!-- /tabs -->

**Rule:** Every pointer to a peripheral register must be `volatile`.

## Read-Modify-Write Hazards

Many register operations follow a **read-modify-write** (RMW) pattern:

<!-- tabs -->
```c
GPIOA->ODR |= (1 << 5);   // Read ODR, OR in bit 5, write back
```

```rust
// Read-modify-write with PAC (same hazard as C)
let gpioa = unsafe { &*pac::GPIOA::ptr() };
gpioa.odr.modify(|r, w| unsafe { w.bits(r.bits() | (1 << 5)) });
```
<!-- /tabs -->

This compiles to three instructions:

```arm
LDR  R0, [R1]        @ Read current ODR value
ORR  R0, R0, #0x20   @ Set bit 5
STR  R0, [R1]        @ Write back
```

### The Problem

If an interrupt fires between the `LDR` and `STR`, and the interrupt handler also modifies ODR, the interrupt's changes are lost -- the main code writes back the stale value it read before the interrupt.

### Solutions

1. **Use atomic set/reset registers:** STM32 provides `BSRR` (Bit Set/Reset Register) that avoids RMW:
   <!-- tabs -->
   ```c
   GPIOA->BSRR = (1 << 5);        // Set PA5 (atomic, no RMW)
   GPIOA->BSRR = (1 << (5 + 16)); // Reset PA5 (atomic)
   ```

   ```rust
   let gpioa = unsafe { &*pac::GPIOA::ptr() };
   gpioa.bsrr.write(|w| w.bs5().set_bit());   // Set PA5 (atomic)
   gpioa.bsrr.write(|w| w.br5().set_bit());   // Reset PA5 (atomic)
   ```
   <!-- /tabs -->

2. **Disable interrupts around RMW:**
   <!-- tabs -->
   ```c
   __disable_irq();
   GPIOA->ODR |= (1 << 5);
   __enable_irq();
   ```

   ```rust
   use cortex_m::interrupt;

   interrupt::free(|_| {
       let gpioa = unsafe { &*pac::GPIOA::ptr() };
       gpioa.odr.modify(|r, w| unsafe { w.bits(r.bits() | (1 << 5)) });
   });
   ```
   <!-- /tabs -->

3. **Use bit-banding** (see below).

## Bit-Banding (Cortex-M3/M4)

[Bit-banding](https://embeddedprep.com/arm-cortex-m4-core-registers/) maps each bit in a region of memory to a full 32-bit word in a separate "alias" region. Writing to the alias word atomically sets or clears a single bit -- no read-modify-write needed.

### How It Works

Two bit-band regions exist:

| Region | Bit-Band Base | Alias Base | Size |
|---|---|---|---|
| SRAM | `0x2000_0000` | `0x2200_0000` | 1 MB -> 32 MB alias |
| Peripheral | `0x4000_0000` | `0x4200_0000` | 1 MB -> 32 MB alias |

Formula to compute the alias address:

```
alias_addr = alias_base + (byte_offset * 32) + (bit_number * 4)
```

### Example: Set Bit 5 of GPIOA->ODR (0x40020014)

<!-- tabs -->
```c
// ODR is at 0x40020014
// Byte offset from peripheral base: 0x20014
// Bit number: 5
// Alias address: 0x42000000 + (0x20014 * 32) + (5 * 4)
//              = 0x42000000 + 0x400280 + 0x14
//              = 0x42400294

#define BB_ALIAS(reg, bit) \
    (*(volatile uint32_t *)(0x42000000 + \
     ((uint32_t)(reg) - 0x40000000) * 32 + (bit) * 4))

// Atomic bit set (no RMW):
BB_ALIAS(&GPIOA->ODR, 5) = 1;  // Set PA5
BB_ALIAS(&GPIOA->ODR, 5) = 0;  // Clear PA5
```

```rust
use core::ptr;

/// Compute the bit-band alias address for a peripheral register bit.
const fn bb_alias(reg_addr: u32, bit: u32) -> *mut u32 {
    (0x4200_0000 + (reg_addr - 0x4000_0000) * 32 + bit * 4) as *mut u32
}

const GPIOA_ODR: u32 = 0x4002_0014;

// Atomic bit set (no RMW):
unsafe { ptr::write_volatile(bb_alias(GPIOA_ODR, 5), 1) };  // Set PA5
unsafe { ptr::write_volatile(bb_alias(GPIOA_ODR, 5), 0) };  // Clear PA5
```
<!-- /tabs -->

Writing `1` to the alias word sets the bit. Writing `0` clears it. This is a single `STR` instruction -- fully atomic.

**Note:** Bit-banding is available on Cortex-M3 and M4 but **not** on M0, M0+, M7, or M33.

## System Peripheral Registers

The Private Peripheral Bus (PPB) region at `0xE000_0000` contains system-level registers:

| Address | Peripheral | Purpose |
|---|---|---|
| `0xE000_E010` | SysTick | System tick timer |
| `0xE000_E100` | NVIC | Interrupt enable/priority |
| `0xE000_ED00` | SCB | System control block |
| `0xE000_EF00` | Debug | Debug registers |

These are also memory-mapped and accessed the same way as GPIO or timers.

## References

1. [Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) — Practical guide to STM32 memory-mapped peripheral access
2. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Cortex-M memory map and peripheral bus architecture
3. [ARM Cortex-M4 Core Registers](https://embeddedprep.com/arm-cortex-m4-core-registers/) — Bit-banding and special register access on Cortex-M4

## Related Topics

- [Memory Architecture](index.md) -- the full memory map
- [Registers and Register File](../registers-and-register-file.md) -- CPU registers vs peripheral registers
- [CPU Core and ALU](../cpu-core-and-alu.md) -- LDR/STR instructions that access MMIO
- [Memory Layout and Linker Scripts](memory-layout-and-linker-scripts.md) -- where peripheral addresses come from
