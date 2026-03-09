---
title: "PLL and Prescalers"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, pll, prescaler, clock-gating, rcc, stm32, arm]
status: draft
sources:
  - url: "https://tonyfu97.github.io/MCU1/04_clock_tree/"
    title: "Clock Tree - Peripheral Driver Development"
  - url: "https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/"
    title: "STM32 Clock System"
  - url: "https://www.ampheo.com/blog/how-to-choose-stm32-clock"
    title: "How to Choose STM32 Clock"
---

## What a PLL Does

A [**Phase-Locked Loop (PLL)**](https://tonyfu97.github.io/MCU1/04_clock_tree/) takes a low-frequency input clock and multiplies it to produce a higher-frequency output. Without a PLL, you'd need a 168 MHz crystal to run a Cortex-M4 at full speed -- expensive and impractical. Instead, you use a cheap 8 MHz crystal and let the PLL multiply it.

```
  Input: 8 MHz (from HSE crystal)
     |
     v
  +-----+     +-----+     +-----+
  | / M  |---->| x N  |---->| / P  |----> PLL Output
  | (div)|     |(mult)|     | (div)|      e.g., 168 MHz
  +-----+     +-----+     +-----+

  8 MHz / 8 = 1 MHz  -->  1 MHz * 336 = 336 MHz  -->  336 MHz / 2 = 168 MHz
```

## PLL Parameters (STM32F4)

The STM32F4 PLL has three key dividers:

| Parameter | Range | Purpose |
|---|---|---|
| **M** | 2--63 | Input divider: brings HSE down to 1--2 MHz reference |
| **N** | 50--432 | Multiplier: generates VCO frequency (100--432 MHz) |
| **P** | 2, 4, 6, 8 | Main output divider (for SYSCLK) |
| **Q** | 2--15 | USB/SDIO output divider (must produce 48 MHz for USB) |

### PLL Output Formula

```
  f_VCO = f_input * (N / M)
  f_SYSCLK = f_VCO / P
  f_USB = f_VCO / Q

  Constraints:
    1 MHz <= f_input / M <= 2 MHz  (recommended: 2 MHz for lower jitter)
    100 MHz <= f_VCO <= 432 MHz
    f_SYSCLK <= 168 MHz
    f_USB = 48 MHz (required for USB)
```

## Example: Configuring STM32F4 to 168 MHz from 8 MHz HSE

Goal: SYSCLK = 168 MHz, USB clock = 48 MHz

```
  Input:   8 MHz HSE
  M = 8:   8 / 8 = 1 MHz
  N = 336: 1 * 336 = 336 MHz (VCO)
  P = 2:   336 / 2 = 168 MHz (SYSCLK)
  Q = 7:   336 / 7 = 48 MHz  (USB)
```

<!-- tabs -->
```c
// Step 1: Enable HSE and wait for it to stabilize
RCC->CR |= RCC_CR_HSEON;
while (!(RCC->CR & RCC_CR_HSERDY));

// Step 2: Configure flash wait states BEFORE increasing clock
FLASH->ACR = FLASH_ACR_LATENCY_5WS  // 5 wait states for 168 MHz
           | FLASH_ACR_PRFTEN        // Prefetch enable
           | FLASH_ACR_ICEN          // Instruction cache enable
           | FLASH_ACR_DCEN;         // Data cache enable

// Step 3: Configure PLL (M=8, N=336, P=2, Q=7)
RCC->PLLCFGR = (8  << RCC_PLLCFGR_PLLM_Pos)   // M = 8
             | (336 << RCC_PLLCFGR_PLLN_Pos)    // N = 336
             | (0  << RCC_PLLCFGR_PLLP_Pos)     // P = 2 (0 means /2)
             | (7  << RCC_PLLCFGR_PLLQ_Pos)     // Q = 7
             | RCC_PLLCFGR_PLLSRC_HSE;          // PLL source = HSE

// Step 4: Enable PLL and wait for lock
RCC->CR |= RCC_CR_PLLON;
while (!(RCC->CR & RCC_CR_PLLRDY));

// Step 5: Configure bus prescalers
RCC->CFGR |= RCC_CFGR_HPRE_DIV1     // AHB prescaler = /1 (HCLK = 168 MHz)
           |  RCC_CFGR_PPRE1_DIV4    // APB1 prescaler = /4 (PCLK1 = 42 MHz)
           |  RCC_CFGR_PPRE2_DIV2;   // APB2 prescaler = /2 (PCLK2 = 84 MHz)

// Step 6: Switch SYSCLK to PLL
RCC->CFGR |= RCC_CFGR_SW_PLL;
while ((RCC->CFGR & RCC_CFGR_SWS) != RCC_CFGR_SWS_PLL);

// Now running at 168 MHz!
```

```rust
// Using stm32f4xx-hal -- the HAL handles all PLL math, flash wait states,
// and prescaler configuration in a single builder chain:
use stm32f4xx_hal::{pac, prelude::*};

let dp = pac::Peripherals::take().unwrap();
let rcc = dp.RCC.constrain();

let clocks = rcc.cfgr
    .use_hse(8.MHz())          // 8 MHz external crystal
    .sysclk(168.MHz())         // Target SYSCLK = 168 MHz
    .hclk(168.MHz())           // AHB = 168 MHz
    .pclk1(42.MHz())           // APB1 = 42 MHz
    .pclk2(84.MHz())           // APB2 = 84 MHz
    .require_pll48clk()        // Ensure 48 MHz for USB
    .freeze();                 // Apply configuration (sets flash wait states automatically)

// Now running at 168 MHz!
```

```cpp
// Using C++ CMSIS abstraction with constexpr validation
#include "stm32f4xx.h"

struct PllConfig {
    uint32_t m, n, p, q;
    constexpr uint32_t vco_mhz(uint32_t hse_mhz) const { return hse_mhz / m * n; }
    constexpr uint32_t sysclk_mhz(uint32_t hse_mhz) const { return vco_mhz(hse_mhz) / p; }
    constexpr uint32_t usb_mhz(uint32_t hse_mhz) const { return vco_mhz(hse_mhz) / q; }
};

// Compile-time validation of PLL parameters
constexpr PllConfig pll{.m = 8, .n = 336, .p = 2, .q = 7};
static_assert(pll.sysclk_mhz(8) == 168, "SYSCLK must be 168 MHz");
static_assert(pll.usb_mhz(8) == 48, "USB clock must be 48 MHz");

void configure_168mhz() {
    RCC->CR |= RCC_CR_HSEON;
    while (!(RCC->CR & RCC_CR_HSERDY));

    FLASH->ACR = FLASH_ACR_LATENCY_5WS | FLASH_ACR_PRFTEN
               | FLASH_ACR_ICEN | FLASH_ACR_DCEN;

    RCC->PLLCFGR = (pll.m << RCC_PLLCFGR_PLLM_Pos)
                 | (pll.n << RCC_PLLCFGR_PLLN_Pos)
                 | ((pll.p / 2 - 1) << RCC_PLLCFGR_PLLP_Pos)
                 | (pll.q << RCC_PLLCFGR_PLLQ_Pos)
                 | RCC_PLLCFGR_PLLSRC_HSE;

    RCC->CR |= RCC_CR_PLLON;
    while (!(RCC->CR & RCC_CR_PLLRDY));

    RCC->CFGR |= RCC_CFGR_HPRE_DIV1 | RCC_CFGR_PPRE1_DIV4 | RCC_CFGR_PPRE2_DIV2;
    RCC->CFGR |= RCC_CFGR_SW_PLL;
    while ((RCC->CFGR & RCC_CFGR_SWS) != RCC_CFGR_SWS_PLL);
}
```
<!-- /tabs -->

**Critical ordering:** Set flash wait states **before** increasing the clock. If you increase the clock first, the CPU tries to read flash faster than flash can respond -- causing HardFaults or data corruption.

## Bus Prescalers

After the PLL output becomes SYSCLK, it's divided by prescalers for different bus domains:

### AHB Prescaler

Divides SYSCLK to produce **HCLK** (AHB clock). HCLK feeds:
- CPU core
- AHB bus (DMA, memory interface)
- SysTick timer (optionally divided by 8)

Available dividers: /1, /2, /4, /8, /16, /64, /128, /256, /512

Usually set to /1 -- you want the CPU running at full speed.

### APB1 Prescaler (Low-Speed Peripheral Bus)

Produces **PCLK1**. Maximum frequency varies by MCU family:
- STM32F1: max 36 MHz
- STM32F4: max 42 MHz

Peripherals on APB1: UART2/3/4/5, SPI2/3, I2C1/2, TIM2--7, DAC

### APB2 Prescaler (High-Speed Peripheral Bus)

Produces **PCLK2**. Typically allowed up to SYSCLK speed:
- STM32F1: max 72 MHz
- STM32F4: max 84 MHz

Peripherals on APB2: USART1/6, SPI1/4, TIM1/8/9/10/11, ADC1/2/3

### Summary for 168 MHz Configuration

```
  SYSCLK = 168 MHz
     |
     +-- AHB /1  --> HCLK  = 168 MHz (CPU, DMA, memory)
     |
     +-- APB1 /4 --> PCLK1 = 42 MHz  (UART2-5, I2C, TIM2-7)
     |                                 Timers: 84 MHz (auto-doubled)
     |
     +-- APB2 /2 --> PCLK2 = 84 MHz  (USART1, SPI1, ADC, TIM1)
                                       Timers: 168 MHz (auto-doubled)
```

## Clock Gating (RCC Enable Bits)

By default, [**all peripheral clocks are disabled**](https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/) to save power. Before using any peripheral, you must enable its clock through the **RCC (Reset and Clock Control)** registers.

<!-- tabs -->
```c
// Enable GPIOA clock (AHB1 peripheral)
RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;

// Enable USART2 clock (APB1 peripheral)
RCC->APB1ENR |= RCC_APB1ENR_USART2EN;

// Enable SPI1 clock (APB2 peripheral)
RCC->APB2ENR |= RCC_APB2ENR_SPI1EN;
```

```rust
// Using PAC (Peripheral Access Crate)
let rcc = unsafe { &*pac::RCC::ptr() };

// Enable GPIOA clock (AHB1 peripheral)
rcc.ahb1enr.modify(|_, w| w.gpioaen().set_bit());

// Enable USART2 clock (APB1 peripheral)
rcc.apb1enr.modify(|_, w| w.usart2en().set_bit());

// Enable SPI1 clock (APB2 peripheral)
rcc.apb2enr.modify(|_, w| w.spi1en().set_bit());

// With stm32f4xx-hal, clocks are enabled automatically when
// you take ownership of a peripheral (e.g., Serial::new() enables USART clock)
```
<!-- /tabs -->

**Forgetting to enable the peripheral clock** is one of the most common beginner mistakes. The peripheral registers exist in the address space, but reads return 0 and writes have no effect until the clock is enabled.

### Disabling Unused Clocks

To save power, disable clocks for peripherals you're not using:

<!-- tabs -->
```c
RCC->APB1ENR &= ~RCC_APB1ENR_USART2EN;  // Disable USART2 clock
```

```rust
let rcc = unsafe { &*pac::RCC::ptr() };
rcc.apb1enr.modify(|_, w| w.usart2en().clear_bit()); // Disable USART2 clock
```
<!-- /tabs -->

This is particularly useful in battery-powered applications where every milliwatt counts.

## STM32F1 PLL (Simpler)

The STM32F1 PLL is simpler than the F4:

```
  HSE (8 MHz) --> optional /2 --> PLL multiplier (x2..x16) --> SYSCLK

  Example: 8 MHz * 9 = 72 MHz
```

<!-- tabs -->
```c
// STM32F1: Configure PLL for 72 MHz
RCC->CFGR |= RCC_CFGR_PLLSRC      // PLL source = HSE
           |  RCC_CFGR_PLLMULL9;   // PLL multiplier = 9 (8 * 9 = 72)
```

```rust
// Using stm32f1xx-hal
use stm32f1xx_hal::{pac, prelude::*};

let dp = pac::Peripherals::take().unwrap();
let rcc = dp.RCC.constrain();
let mut flash = dp.FLASH.constrain();

let clocks = rcc.cfgr
    .use_hse(8.MHz())
    .sysclk(72.MHz())       // HAL sets PLL multiplier = 9 automatically
    .freeze(&mut flash.acr);
```
<!-- /tabs -->

## Common Pitfalls

1. **Wrong flash wait states:** Always set wait states before increasing clock speed
2. **APB1 exceeds max frequency:** Remember APB1 has a lower max than SYSCLK
3. **Forgetting to enable peripheral clock:** Reads return 0, writes silently fail
4. **PLL input out of range:** The VCO input should be 1--2 MHz for stability
5. **Modifying PLL while it's running:** Disable PLL first, reconfigure, then re-enable

## References

1. [Clock Tree - Peripheral Driver Development](https://tonyfu97.github.io/MCU1/04_clock_tree/) — PLL configuration and bus prescaler setup walkthrough
2. [STM32 Clock System](https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/) — RCC registers, clock gating, and peripheral clock enable
3. [How to Choose STM32 Clock](https://www.ampheo.com/blog/how-to-choose-stm32-clock) — PLL parameter selection and common configuration pitfalls

## Related Topics

- [Clock Sources and Tree](clock-sources-and-tree.md) -- HSI, HSE, and clock tree routing
- [Sleep and Low-Power Modes](sleep-and-low-power-modes.md) -- PLL is disabled in Stop/Standby
- [Flash Memory](../memory-architecture/flash-memory.md) -- wait states must match clock speed
- [Clock Cycles and Timing](../instruction-execution/clock-cycles-and-timing.md) -- faster clock = more throughput
