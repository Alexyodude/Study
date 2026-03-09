---
title: "GPIO at Register Level"
created: 2026-03-08
updated: 2026-03-08
tags: [gpio, registers, stm32, cortex-m, peripheral]
status: draft
sources:
  - url: "https://deepbluembedded.com/stm32-gpio-registers-direct-access-fast-pin-control/"
    title: "STM32 GPIO Registers - Direct Access Fast Pin Control"
  - url: "https://controllerstech.com/stm32-gpio-output-config-using-registers/"
    title: "STM32 GPIO Output Register Configuration"
  - url: "https://embetronicx.com/tutorials/microcontrollers/stm32/stm32-gpio-tutorial/"
    title: "Step-by-Step STM32 GPIO Tutorial - Bare Metal"
---

GPIO (General-Purpose Input/Output) is the **simplest peripheral** on any MCU. Every pin can be independently configured as input, output, alternate function, or analog -- all by writing to a handful of registers.

## Register Map Overview

Each GPIO port (GPIOA, GPIOB, ...) has these [registers at fixed offsets](https://deepbluembedded.com/stm32-gpio-registers-direct-access-fast-pin-control/):

| Offset | Register | Purpose |
|--------|----------|---------|
| 0x00 | MODER | Pin mode (input/output/AF/analog) |
| 0x04 | OTYPER | Output type (push-pull / open-drain) |
| 0x08 | OSPEEDR | Output speed (slew rate) |
| 0x0C | PUPDR | Pull-up / pull-down |
| 0x10 | IDR | Input data (read-only) |
| 0x14 | ODR | Output data |
| 0x18 | BSRR | Bit set/reset (atomic) |
| 0x20 | AFRL | Alternate function for pins 0-7 |
| 0x24 | AFRH | Alternate function for pins 8-15 |

## MODER -- Mode Register

Two bits per pin (32 bits for 16 pins):

| MODER value | Mode | When to use |
|-------------|------|-------------|
| 00 | Input | Buttons, sensors with digital output |
| 01 | General-purpose output | LEDs, control signals |
| 10 | Alternate function | UART TX/RX, SPI, I2C, PWM |
| 11 | Analog | ADC input, DAC output |

<!-- tabs -->
```c
// Set PA5 to output mode (bits [11:10] = 01)
GPIOA->MODER &= ~(0x3 << (5 * 2));   // clear bits
GPIOA->MODER |=  (0x1 << (5 * 2));   // set to output
```

```rust
use core::ptr::{read_volatile, write_volatile};

const GPIOA_MODER: *mut u32 = 0x4002_0000 as *mut u32;

unsafe {
    // Set PA5 to output mode (bits [11:10] = 01)
    let val = read_volatile(GPIOA_MODER);
    write_volatile(GPIOA_MODER, (val & !(0x3 << (5 * 2))) | (0x1 << (5 * 2)));
}
```
<!-- /tabs -->

## OTYPER -- Output Type Register

One bit per pin. Only matters when pin is in output or AF mode.

| Bit value | Type | Behavior |
|-----------|------|----------|
| 0 | Push-pull | Drives both high and low actively |
| 1 | Open-drain | Drives low only; needs external pull-up for high |

**Push-pull** is the default and works for most cases (LEDs, SPI clock). **Open-drain** is required for I2C (SDA/SCL) and any bus where multiple devices share a line.

<!-- tabs -->
```c
GPIOA->OTYPER &= ~(1 << 5);  // PA5 push-pull (default)
```

```rust
use core::ptr::{read_volatile, write_volatile};

const GPIOA_OTYPER: *mut u32 = (0x4002_0000 + 0x04) as *mut u32;

unsafe {
    write_volatile(GPIOA_OTYPER, read_volatile(GPIOA_OTYPER) & !(1 << 5));
}
```
<!-- /tabs -->

## OSPEEDR -- Output Speed Register

Two bits per pin. Controls the slew rate (how fast the pin transitions).

| Value | Speed | Typical use |
|-------|-------|-------------|
| 00 | Low (~2 MHz) | GPIO toggling, LEDs |
| 01 | Medium (~25 MHz) | UART, I2C |
| 10 | High (~50 MHz) | SPI |
| 11 | Very high (~100 MHz) | SDIO, high-speed interfaces |

Higher speed means more EMI and power consumption. Use the lowest speed that works.

## PUPDR -- Pull-Up / Pull-Down Register

Two bits per pin. Connects an internal resistor (~40k ohm).

| Value | Configuration |
|-------|---------------|
| 00 | No pull-up, no pull-down (floating) |
| 01 | Pull-up |
| 10 | Pull-down |
| 11 | Reserved |

Use pull-up for active-low buttons. Use pull-down for active-high buttons. Floating inputs pick up noise and cause unpredictable reads.

## IDR -- Input Data Register (Read-Only)

One bit per pin. Read this to get the current logic level on the pin.

<!-- tabs -->
```c
if (GPIOA->IDR & (1 << 0)) {
    // PA0 is HIGH
}
```

```rust
use core::ptr::read_volatile;

const GPIOA_IDR: *const u32 = (0x4002_0000 + 0x10) as *const u32;

unsafe {
    if read_volatile(GPIOA_IDR) & (1 << 0) != 0 {
        // PA0 is HIGH
    }
}
```
<!-- /tabs -->

## ODR -- Output Data Register

One bit per pin. Writing sets the output level. **Not atomic** -- read-modify-write can be interrupted.

<!-- tabs -->
```c
GPIOA->ODR |= (1 << 5);   // set PA5 high (not atomic!)
GPIOA->ODR &= ~(1 << 5);  // set PA5 low
```

```rust
use core::ptr::{read_volatile, write_volatile};

const GPIOA_ODR: *mut u32 = (0x4002_0000 + 0x14) as *mut u32;

unsafe {
    write_volatile(GPIOA_ODR, read_volatile(GPIOA_ODR) | (1 << 5));   // set PA5 high (not atomic!)
    write_volatile(GPIOA_ODR, read_volatile(GPIOA_ODR) & !(1 << 5));  // set PA5 low
}
```
<!-- /tabs -->

## BSRR -- Bit Set/Reset Register (Atomic)

This is the preferred way to set or clear individual pins. It is a **write-only, 32-bit** register:

- Bits [15:0] -- **Set**: writing 1 sets the corresponding ODR bit
- Bits [31:16] -- **Reset**: writing 1 clears the corresponding ODR bit

<!-- tabs -->
```c
GPIOA->BSRR = (1 << 5);        // set PA5 high (atomic, single write)
GPIOA->BSRR = (1 << (5 + 16)); // set PA5 low  (atomic, single write)
```

```rust
use core::ptr::write_volatile;

const GPIOA_BSRR: *mut u32 = (0x4002_0000 + 0x18) as *mut u32;

unsafe {
    write_volatile(GPIOA_BSRR, 1 << 5);        // set PA5 high (atomic, single write)
    write_volatile(GPIOA_BSRR, 1 << (5 + 16)); // set PA5 low  (atomic, single write)
}
```
<!-- /tabs -->

Why use BSRR over ODR? Because `ODR |= ...` is a read-modify-write that can be corrupted if an interrupt changes another pin on the same port between the read and write. BSRR is a single write -- no race condition.

## Step-by-Step: Blink an LED on PA5

On the STM32 Nucleo-F401RE, the user LED is connected to PA5. This [step-by-step bare metal approach](https://embetronicx.com/tutorials/microcontrollers/stm32/stm32-gpio-tutorial/) shows the full configuration sequence.

<!-- tabs -->
```c
#include "stm32f4xx.h"

int main(void) {
    // 1. Enable GPIOA clock
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;

    // 2. Set PA5 as output (MODER bits [11:10] = 01)
    GPIOA->MODER &= ~(0x3 << (5 * 2));
    GPIOA->MODER |=  (0x1 << (5 * 2));

    // 3. Push-pull output (default, but explicit)
    GPIOA->OTYPER &= ~(1 << 5);

    // 4. Low speed is fine for an LED
    GPIOA->OSPEEDR &= ~(0x3 << (5 * 2));

    // 5. No pull-up/pull-down needed
    GPIOA->PUPDR &= ~(0x3 << (5 * 2));

    while (1) {
        GPIOA->BSRR = (1 << 5);         // LED on
        for (volatile int i = 0; i < 100000; i++);
        GPIOA->BSRR = (1 << (5 + 16));  // LED off
        for (volatile int i = 0; i < 100000; i++);
    }
}
```

```rust
#![no_std]
#![no_main]

use core::ptr::{read_volatile, write_volatile};

const RCC_AHB1ENR: *mut u32 = (0x4002_3800 + 0x30) as *mut u32;
const GPIOA_MODER: *mut u32 = 0x4002_0000 as *mut u32;
const GPIOA_OTYPER: *mut u32 = (0x4002_0000 + 0x04) as *mut u32;
const GPIOA_OSPEEDR: *mut u32 = (0x4002_0000 + 0x08) as *mut u32;
const GPIOA_PUPDR: *mut u32 = (0x4002_0000 + 0x0C) as *mut u32;
const GPIOA_BSRR: *mut u32 = (0x4002_0000 + 0x18) as *mut u32;

#[no_mangle]
pub unsafe extern "C" fn main() -> ! {
    // 1. Enable GPIOA clock
    write_volatile(RCC_AHB1ENR, read_volatile(RCC_AHB1ENR) | (1 << 0));

    // 2. Set PA5 as output (MODER bits [11:10] = 01)
    let moder = read_volatile(GPIOA_MODER);
    write_volatile(GPIOA_MODER, (moder & !(0x3 << 10)) | (0x1 << 10));

    // 3. Push-pull output (default, but explicit)
    write_volatile(GPIOA_OTYPER, read_volatile(GPIOA_OTYPER) & !(1 << 5));

    // 4. Low speed
    write_volatile(GPIOA_OSPEEDR, read_volatile(GPIOA_OSPEEDR) & !(0x3 << 10));

    // 5. No pull-up/pull-down
    write_volatile(GPIOA_PUPDR, read_volatile(GPIOA_PUPDR) & !(0x3 << 10));

    loop {
        write_volatile(GPIOA_BSRR, 1 << 5);        // LED on
        for _ in 0..100_000 { core::hint::black_box(()); }
        write_volatile(GPIOA_BSRR, 1 << (5 + 16));  // LED off
        for _ in 0..100_000 { core::hint::black_box(()); }
    }
}
```
<!-- /tabs -->

## Alternate Function Configuration

When a pin is used by a peripheral (UART TX, SPI clock, PWM output), you set MODER to `10` (alternate function) and then select **which** peripheral via the AFR registers.

Each pin has a 4-bit AF selection field. The mapping is fixed by the chip -- consult the datasheet's "alternate function mapping" table.

<!-- tabs -->
```c
// Configure PA2 as USART2_TX (AF7 on STM32F4)

// 1. Set PA2 to alternate function mode
GPIOA->MODER &= ~(0x3 << (2 * 2));
GPIOA->MODER |=  (0x2 << (2 * 2));   // AF mode

// 2. Select AF7 for PA2 (pins 0-7 use AFRL register)
GPIOA->AFR[0] &= ~(0xF << (2 * 4));  // clear AF bits for pin 2
GPIOA->AFR[0] |=  (0x7 << (2 * 4));  // AF7 = USART2

// 3. Set speed, type as needed
GPIOA->OSPEEDR |= (0x2 << (2 * 2));  // high speed for UART
```

```rust
use core::ptr::{read_volatile, write_volatile};

const GPIOA_MODER: *mut u32 = 0x4002_0000 as *mut u32;
const GPIOA_AFRL: *mut u32 = (0x4002_0000 + 0x20) as *mut u32;
const GPIOA_OSPEEDR: *mut u32 = (0x4002_0000 + 0x08) as *mut u32;

unsafe {
    // 1. Set PA2 to alternate function mode
    let moder = read_volatile(GPIOA_MODER);
    write_volatile(GPIOA_MODER, (moder & !(0x3 << (2 * 2))) | (0x2 << (2 * 2)));

    // 2. Select AF7 for PA2 (pins 0-7 use AFRL register)
    let afrl = read_volatile(GPIOA_AFRL);
    write_volatile(GPIOA_AFRL, (afrl & !(0xF << (2 * 4))) | (0x7 << (2 * 4)));

    // 3. Set speed
    write_volatile(GPIOA_OSPEEDR, read_volatile(GPIOA_OSPEEDR) | (0x2 << (2 * 2)));
}
```
<!-- /tabs -->

**Common AF mappings on STM32F4:**
- AF4: I2C1, I2C2, I2C3
- AF5: SPI1, SPI2
- AF6: SPI3
- AF7: USART1, USART2, USART3

Always verify with your specific chip's datasheet.

## References

1. [STM32 GPIO Registers - Direct Access Fast Pin Control](https://deepbluembedded.com/stm32-gpio-registers-direct-access-fast-pin-control/) — Register map and direct register manipulation for GPIO
2. [STM32 GPIO Output Register Configuration](https://controllerstech.com/stm32-gpio-output-config-using-registers/) — Configuring GPIO output mode via registers
3. [Step-by-Step STM32 GPIO Tutorial - Bare Metal](https://embetronicx.com/tutorials/microcontrollers/stm32/stm32-gpio-tutorial/) — Complete bare-metal GPIO tutorial with examples

## Related Topics

- [Timers and PWM](timers-and-counters.md) -- alternate function for timer output channels
- [UART](uart-serial.md) -- requires AF-mode GPIO for TX/RX pins
- [Interrupt System](interrupt-system/index.md) -- GPIO can trigger EXTI interrupts
