---
title: "Register-Level Programming"
created: 2026-03-08
updated: 2026-03-08
tags: [registers, MMIO, CMSIS, bit-manipulation, GPIO, peripheral]
status: draft
sources:
  - url: "https://blog.feabhas.com/2019/01/peripheral-register-access-using-c-structs-part-1/"
    title: "Peripheral Register Access Using C Structs - Feabhas"
  - url: "https://medium.com/@adityagarg4277/blinking-an-led-on-stm32f405rgt6-using-cmsis-a-deep-dive-into-register-level-programming-b59c19440091"
    title: "Blinking an LED Using CMSIS: Register-Level Programming"
  - url: "https://hackmd.io/@hrbenitez/158_2s2223_GPIO"
    title: "STM32 Register Level Programming and GPIO"
  - url: "https://kleinembedded.com/stm32-without-cubeide-part-2-cmsis-make-and-clock-configuration/"
    title: "STM32 Without CubeIDE Part 2: CMSIS, make and clock configuration"
---

## Direct Pointer Access

Every peripheral on an ARM Cortex-M MCU is mapped to a fixed memory address. You interact with hardware by reading and writing these addresses. In C, you do this with pointers:

<!-- tabs -->
```c
/* Turn on GPIOA clock on STM32F4 (RCC_AHB1ENR register) */
*(volatile uint32_t *)0x40023830 |= (1 << 0);

/* Set GPIOA pin 5 as output (GPIOA_MODER register) */
*(volatile uint32_t *)0x40020000 &= ~(3 << 10);  /* Clear bits 11:10 */
*(volatile uint32_t *)0x40020000 |=  (1 << 10);   /* Set bit 10 = output mode */

/* Set pin 5 high (GPIOA_ODR register) */
*(volatile uint32_t *)0x40020014 |= (1 << 5);
```

```rust
use core::ptr::{read_volatile, write_volatile};

unsafe {
    // Turn on GPIOA clock on STM32F4 (RCC_AHB1ENR register)
    let rcc_ahb1enr = 0x4002_3830 as *mut u32;
    write_volatile(rcc_ahb1enr, read_volatile(rcc_ahb1enr) | (1 << 0));

    // Set GPIOA pin 5 as output (GPIOA_MODER register)
    let gpioa_moder = 0x4002_0000 as *mut u32;
    let val = read_volatile(gpioa_moder);
    write_volatile(gpioa_moder, (val & !(3 << 10)) | (1 << 10));

    // Set pin 5 high (GPIOA_ODR register)
    let gpioa_odr = 0x4002_0014 as *mut u32;
    write_volatile(gpioa_odr, read_volatile(gpioa_odr) | (1 << 5));
}
```
<!-- /tabs -->

This works but is hard to read and error-prone. The address `0x40020014` means nothing without a datasheet open.

## Struct Overlay Pattern

A [better approach](https://blog.feabhas.com/2019/01/peripheral-register-access-using-c-structs-part-1/) maps a C struct over the peripheral's register block. Because peripheral registers are laid out at consecutive addresses with fixed offsets, a struct mirrors this layout exactly:

<!-- tabs -->
```c
typedef struct {
    volatile uint32_t MODER;    /* Offset 0x00: Mode register */
    volatile uint32_t OTYPER;   /* Offset 0x04: Output type */
    volatile uint32_t OSPEEDR;  /* Offset 0x08: Output speed */
    volatile uint32_t PUPDR;    /* Offset 0x0C: Pull-up/pull-down */
    volatile uint32_t IDR;      /* Offset 0x10: Input data */
    volatile uint32_t ODR;      /* Offset 0x14: Output data */
    volatile uint32_t BSRR;     /* Offset 0x18: Bit set/reset */
    volatile uint32_t LCKR;     /* Offset 0x1C: Lock */
    volatile uint32_t AFR[2];   /* Offset 0x20: Alternate function */
} GPIO_TypeDef;

#define GPIOA  ((GPIO_TypeDef *)0x40020000)
#define GPIOB  ((GPIO_TypeDef *)0x40020400)
```

```rust
use core::ptr::{read_volatile, write_volatile};

/// Register block for GPIO peripheral.
/// Each field is accessed via volatile reads/writes.
#[repr(C)]
struct GpioRegs {
    moder: u32,     // Offset 0x00: Mode register
    otyper: u32,    // Offset 0x04: Output type
    ospeedr: u32,   // Offset 0x08: Output speed
    pupdr: u32,     // Offset 0x0C: Pull-up/pull-down
    idr: u32,       // Offset 0x10: Input data
    odr: u32,       // Offset 0x14: Output data
    bsrr: u32,      // Offset 0x18: Bit set/reset
    lckr: u32,      // Offset 0x1C: Lock
    afr: [u32; 2],  // Offset 0x20: Alternate function
}

const GPIOA: *mut GpioRegs = 0x4002_0000 as *mut GpioRegs;
const GPIOB: *mut GpioRegs = 0x4002_0400 as *mut GpioRegs;

// Access fields with volatile operations:
// unsafe { write_volatile(&mut (*GPIOA).moder, value); }
```

```cpp
// C++ can add type safety with a register wrapper
#include <cstdint>

struct GPIO_TypeDef {
    volatile uint32_t MODER;
    volatile uint32_t OTYPER;
    volatile uint32_t OSPEEDR;
    volatile uint32_t PUPDR;
    volatile uint32_t IDR;
    volatile uint32_t ODR;
    volatile uint32_t BSRR;
    volatile uint32_t LCKR;
    volatile uint32_t AFR[2];

    // Member functions provide a cleaner API
    void set_pin(uint8_t pin)   { BSRR = (1U << pin); }
    void clear_pin(uint8_t pin) { BSRR = (1U << (pin + 16)); }
    void set_mode(uint8_t pin, uint8_t mode) {
        uint32_t tmp = MODER;
        tmp &= ~(0x3U << (pin * 2));
        tmp |= (mode << (pin * 2));
        MODER = tmp;
    }
};

inline auto* GPIOA = reinterpret_cast<GPIO_TypeDef*>(0x40020000);
inline auto* GPIOB = reinterpret_cast<GPIO_TypeDef*>(0x40020400);
```
<!-- /tabs -->

Now you can write clear, readable code:

<!-- tabs -->
```c
GPIOA->MODER |= (1 << 10);    /* Pin 5 as output */
GPIOA->ODR   |= (1 << 5);     /* Pin 5 high */
```

```rust
unsafe {
    let moder = read_volatile(&(*GPIOA).moder);
    write_volatile(&mut (*GPIOA).moder, moder | (1 << 10));  // Pin 5 as output

    let odr = read_volatile(&(*GPIOA).odr);
    write_volatile(&mut (*GPIOA).odr, odr | (1 << 5));       // Pin 5 high
}
```
<!-- /tabs -->

The compiler generates the same instructions as the raw pointer approach. There is no runtime overhead.

**Important**: every struct member must be `volatile` because the hardware can change register values at any time (e.g., an input data register changes when a pin changes state).

## CMSIS Header Files

You do not need to write these structs yourself. ARM and chip vendors provide [**CMSIS**](https://kleinembedded.com/stm32-without-cubeide-part-2-cmsis-make-and-clock-configuration/) (Cortex Microcontroller Software Interface Standard) headers that define:

- **Peripheral register structs** (e.g., `GPIO_TypeDef`, `USART_TypeDef`, `TIM_TypeDef`)
- **Base address macros** (e.g., `GPIOA`, `USART1`, `TIM2`)
- **Bit position constants** (e.g., `GPIO_MODER_MODER5_Pos`, `GPIO_MODER_MODER5_Msk`)
- **Core register access** (e.g., `SCB->VTOR`, `NVIC->ISER[0]`)

For STM32, the key header file is `stm32f1xx.h` (or `stm32f4xx.h`, etc.) which includes the device-specific definitions.

<!-- tabs -->
```c
#include "stm32f4xx.h"

/* Using CMSIS definitions */
GPIOA->MODER |= (1 << GPIO_MODER_MODER5_Pos);
```

```rust
// Using stm32f4 PAC (Peripheral Access Crate)
// The PAC is the Rust equivalent of CMSIS headers
use stm32f4::stm32f405;

let dp = stm32f405::Peripherals::take().unwrap();
dp.GPIOA.moder.modify(|r, w| unsafe {
    w.bits(r.bits() | (1 << 10))  // MODER5 = 01 (output)
});
```
<!-- /tabs -->

The `_Pos` suffix gives the bit position, and `_Msk` gives the bitmask. This eliminates magic numbers.

## Bit Manipulation: Set, Clear, Toggle, Read

Register-level programming is fundamentally bit manipulation. Here are the four core operations:

### Set a Bit (without affecting others)

<!-- tabs -->
```c
register |= (1 << bit);
```

```rust
let val = read_volatile(register);
write_volatile(register, val | (1 << bit));
```
<!-- /tabs -->

### Clear a Bit

<!-- tabs -->
```c
register &= ~(1 << bit);
```

```rust
let val = read_volatile(register);
write_volatile(register, val & !(1 << bit));
```
<!-- /tabs -->

### Toggle a Bit

<!-- tabs -->
```c
register ^= (1 << bit);
```

```rust
let val = read_volatile(register);
write_volatile(register, val ^ (1 << bit));
```
<!-- /tabs -->

### Read a Bit

<!-- tabs -->
```c
if (register & (1 << bit)) {
    /* Bit is set */
}
```

```rust
if read_volatile(register) & (1 << bit) != 0 {
    // Bit is set
}
```
<!-- /tabs -->

### Multi-bit Fields

Some register fields span multiple bits (e.g., GPIO mode is 2 bits per pin):

<!-- tabs -->
```c
/* Clear the 2-bit field first, then set the new value */
reg &= ~(0x3 << (pin * 2));       /* Clear */
reg |=  (mode << (pin * 2));       /* Set */
```

```rust
let mut val = read_volatile(reg);
val &= !(0x3 << (pin * 2));       // Clear
val |= (mode as u32) << (pin * 2); // Set
write_volatile(reg, val);
```
<!-- /tabs -->

## Macro Patterns

Common macros you will see in vendor headers and bare-metal codebases:

<!-- tabs -->
```c
#define SET_BIT(REG, BIT)     ((REG) |= (BIT))
#define CLEAR_BIT(REG, BIT)   ((REG) &= ~(BIT))
#define READ_BIT(REG, BIT)    ((REG) & (BIT))
#define TOGGLE_BIT(REG, BIT)  ((REG) ^= (BIT))
#define MODIFY_REG(REG, CLEARMASK, SETMASK) \
    ((REG) = ((REG) & ~(CLEARMASK)) | (SETMASK))
```

```rust
use core::ptr::{read_volatile, write_volatile};

/// Volatile register helper functions for bare-metal Rust
unsafe fn set_bit(reg: *mut u32, bit: u32) {
    write_volatile(reg, read_volatile(reg) | bit);
}

unsafe fn clear_bit(reg: *mut u32, bit: u32) {
    write_volatile(reg, read_volatile(reg) & !bit);
}

unsafe fn read_bit(reg: *const u32, bit: u32) -> u32 {
    read_volatile(reg) & bit
}

unsafe fn toggle_bit(reg: *mut u32, bit: u32) {
    write_volatile(reg, read_volatile(reg) ^ bit);
}

unsafe fn modify_reg(reg: *mut u32, clear_mask: u32, set_mask: u32) {
    write_volatile(reg, (read_volatile(reg) & !clear_mask) | set_mask);
}
```
<!-- /tabs -->

STM32 HAL headers define exactly these macros. Even in bare-metal code, they make intent clearer:

<!-- tabs -->
```c
SET_BIT(RCC->AHB1ENR, RCC_AHB1ENR_GPIOAEN);
```

```rust
// Using the PAC (Peripheral Access Crate) — Rust's CMSIS equivalent
dp.RCC.ahb1enr.modify(|_, w| w.gpioaen().enabled());

// Or with raw volatile helpers:
unsafe { set_bit(RCC_AHB1ENR, RCC_AHB1ENR_GPIOAEN); }
```
<!-- /tabs -->

## Example: Blink an LED on PA5 (STM32F4)

A complete example that enables the GPIOA clock and toggles pin 5:

<!-- tabs -->
```c
#include <stdint.h>

/* Minimal register definitions (normally from CMSIS) */
#define RCC_BASE      0x40023800
#define GPIOA_BASE    0x40020000

#define RCC_AHB1ENR   (*(volatile uint32_t *)(RCC_BASE + 0x30))
#define GPIOA_MODER   (*(volatile uint32_t *)(GPIOA_BASE + 0x00))
#define GPIOA_ODR     (*(volatile uint32_t *)(GPIOA_BASE + 0x14))

void delay(volatile uint32_t count) {
    while (count--);
}

int main(void) {
    /* 1. Enable GPIOA clock (bit 0 of AHB1ENR) */
    RCC_AHB1ENR |= (1 << 0);

    /* 2. Set PA5 as general-purpose output (MODER5 = 01) */
    GPIOA_MODER &= ~(3 << 10);   /* Clear bits 11:10 */
    GPIOA_MODER |=  (1 << 10);   /* Set bit 10 */

    /* 3. Toggle LED forever */
    while (1) {
        GPIOA_ODR ^= (1 << 5);   /* Toggle PA5 */
        delay(500000);
    }
}
```

```rust
#![no_std]
#![no_main]

use core::ptr::{read_volatile, write_volatile};

const RCC_AHB1ENR: *mut u32 = 0x4002_3830 as *mut u32;
const GPIOA_MODER: *mut u32 = 0x4002_0000 as *mut u32;
const GPIOA_ODR: *mut u32 = 0x4002_0014 as *mut u32;

#[inline(never)]
fn delay(mut count: u32) {
    while count > 0 {
        unsafe { core::ptr::read_volatile(&count) };
        count -= 1;
    }
}

#[no_mangle]
pub unsafe extern "C" fn main() -> ! {
    // 1. Enable GPIOA clock (bit 0 of AHB1ENR)
    write_volatile(RCC_AHB1ENR, read_volatile(RCC_AHB1ENR) | (1 << 0));

    // 2. Set PA5 as general-purpose output (MODER5 = 01)
    let moder = read_volatile(GPIOA_MODER);
    write_volatile(GPIOA_MODER, (moder & !(3 << 10)) | (1 << 10));

    // 3. Toggle LED forever
    loop {
        write_volatile(GPIOA_ODR, read_volatile(GPIOA_ODR) ^ (1 << 5));
        delay(500_000);
    }
}
```
<!-- /tabs -->

This is the "hello world" of embedded programming -- blinking an LED with nothing but register writes.

## References

1. [Peripheral Register Access Using C Structs - Feabhas](https://blog.feabhas.com/2019/01/peripheral-register-access-using-c-structs-part-1/) — Struct overlay pattern for clean peripheral access
2. [Blinking an LED Using CMSIS: Register-Level Programming](https://medium.com/@adityagarg4277/blinking-an-led-on-stm32f405rgt6-using-cmsis-a-deep-dive-into-register-level-programming-b59c19440091) — LED blink example using CMSIS register definitions
3. [STM32 Register Level Programming and GPIO](https://hackmd.io/@hrbenitez/158_2s2223_GPIO) — GPIO configuration at the register level
4. [STM32 Without CubeIDE Part 2: CMSIS, make and clock configuration](https://kleinembedded.com/stm32-without-cubeide-part-2-cmsis-make-and-clock-configuration/) — Using CMSIS headers without vendor IDEs

## Related Topics

- [Volatile and Compiler Barriers](volatile-and-compiler-barriers.md) -- why `volatile` is essential for register access
- [Cross-Compilation Toolchain](cross-compilation-toolchain.md) -- compiling this code for the target
