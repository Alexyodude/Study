---
title: "Clock Sources and Tree"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, clock, oscillator, hsi, hse, lsi, lse, clock-tree, stm32]
status: draft
sources:
  - url: "https://tonyfu97.github.io/MCU1/04_clock_tree/"
    title: "Clock Tree - Peripheral Driver Development"
  - url: "https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/"
    title: "STM32 Clock System"
  - url: "https://www.ampheo.com/blog/how-to-choose-stm32-clock"
    title: "How to Choose STM32 Clock"
---

## Clock Sources

An MCU needs an oscillating signal to operate. [STM32 devices](https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/) provide four clock sources -- two high-speed and two low-speed.

### HSI -- High-Speed Internal RC Oscillator

- **Frequency:** 8 MHz (STM32F1) or 16 MHz (STM32F4/L4)
- **Accuracy:** +/- 1% at 25 C (varies with temperature and voltage)
- **Startup time:** A few microseconds
- **No external components needed**

The HSI is the **default clock source** at reset. The MCU can boot and run immediately without any external crystal. It's fast to start and good enough for many applications, but its frequency drifts with temperature.

<!-- tabs -->
```c
// HSI is already running at reset -- no setup needed
// On STM32F4, SYSCLK = HSI = 16 MHz by default
```

```rust
// HSI is already running at reset -- no setup needed
// On STM32F4, SYSCLK = HSI = 16 MHz by default
// Using stm32f4xx-hal, HSI is the default clock source:
// let dp = pac::Peripherals::take().unwrap();
// let clocks = dp.RCC.constrain().cfgr.freeze();  // defaults to HSI
```
<!-- /tabs -->

**Use when:** External crystal is not available, or during early startup before the HSE is stable.

### HSE -- High-Speed External Crystal/Oscillator

- **Frequency:** Typically 4--25 MHz (8 MHz is most common on STM32 boards)
- **Accuracy:** +/- 20 ppm (0.002%) -- far better than HSI
- **Startup time:** 1--5 ms (crystal must stabilize)
- **Requires:** External crystal + two load capacitors, or an external clock source

<!-- tabs -->
```c
// Enable HSE and wait for it to stabilize
RCC->CR |= RCC_CR_HSEON;
while (!(RCC->CR & RCC_CR_HSERDY)) { /* wait */ }
```

```rust
// Using raw register access (PAC)
let rcc = unsafe { &*pac::RCC::ptr() };
rcc.cr.modify(|_, w| w.hseon().set_bit());
while rcc.cr.read().hserdy().bit_is_clear() {}

// Or with stm32f4xx-hal:
// let clocks = dp.RCC.constrain().cfgr
//     .use_hse(8.MHz())
//     .freeze();
```
<!-- /tabs -->

**Use when:** You need accurate timing (UART communication, USB, precise timers) or want to drive the PLL to reach high SYSCLK frequencies.

### LSI -- Low-Speed Internal RC Oscillator

- **Frequency:** ~32 kHz (varies, typically 30--60 kHz)
- **Accuracy:** Poor (+/- 10% or worse)
- **Always available**, even in deep low-power modes

**Use for:** Independent Watchdog (IWDG), wake-up from Standby mode. Not suitable for accurate timekeeping.

### LSE -- Low-Speed External Crystal

- **Frequency:** 32.768 kHz (exactly 2^15 Hz -- divides evenly into 1 Hz)
- **Accuracy:** Excellent (+/- 20 ppm)
- **Requires:** External 32.768 kHz crystal
- **Ultra-low power consumption**

**Use for:** Real-Time Clock (RTC) for accurate date/time keeping, even in low-power modes.

<!-- tabs -->
```c
// Enable LSE
RCC->BDCR |= RCC_BDCR_LSEON;
while (!(RCC->BDCR & RCC_BDCR_LSERDY)) { /* wait */ }

// Select LSE as RTC clock source
RCC->BDCR |= RCC_BDCR_RTCSEL_0;  // LSE selected
RCC->BDCR |= RCC_BDCR_RTCEN;     // Enable RTC
```

```rust
// Using raw register access (PAC)
let rcc = unsafe { &*pac::RCC::ptr() };
rcc.bdcr.modify(|_, w| w.lseon().set_bit());
while rcc.bdcr.read().lserdy().bit_is_clear() {}

// Select LSE as RTC clock source
rcc.bdcr.modify(|_, w| w.rtcsel().lse());
rcc.bdcr.modify(|_, w| w.rtcen().set_bit());
```
<!-- /tabs -->

## Clock Source Comparison

| Source | Freq | Accuracy | External Parts | Start Time | Power |
|---|---|---|---|---|---|
| HSI | 8/16 MHz | +/- 1% | None | us | Low |
| HSE | 4--25 MHz | +/- 20 ppm | Crystal + caps | 1--5 ms | Medium |
| LSI | ~32 kHz | +/- 10% | None | us | Very low |
| LSE | 32.768 kHz | +/- 20 ppm | Crystal | 0.5--2 s | Very low |

## The Clock Tree

The [clock tree](https://tonyfu97.github.io/MCU1/04_clock_tree/) is the routing network that distributes clock signals from sources to consumers. It consists of **multiplexers** (MUXes) that select between sources and **prescalers** (dividers) that reduce frequency.

### SYSCLK: The System Clock

**SYSCLK** is the main clock that drives the CPU and most of the chip. It can be sourced from:

1. HSI (default at reset)
2. HSE
3. PLL output (most common for high-performance operation)

The SYSCLK source is selected via the `RCC_CFGR` register:

<!-- tabs -->
```c
// Select PLL as SYSCLK source
RCC->CFGR |= RCC_CFGR_SW_PLL;

// Wait until PLL is confirmed as SYSCLK source
while ((RCC->CFGR & RCC_CFGR_SWS) != RCC_CFGR_SWS_PLL) { /* wait */ }
```

```rust
// Using raw register access (PAC)
let rcc = unsafe { &*pac::RCC::ptr() };
rcc.cfgr.modify(|_, w| w.sw().pll());

// Wait until PLL is confirmed as SYSCLK source
while !rcc.cfgr.read().sws().is_pll() {}
```
<!-- /tabs -->

### Clock Distribution

From SYSCLK, the clock is distributed through a hierarchy of buses:

```
  SYSCLK (e.g., 72 MHz)
     |
     v
  AHB Prescaler (/1, /2, /4, ... /512)
     |
     +---> HCLK (e.g., 72 MHz)
     |       |
     |       +---> CPU core, AHB bus, DMA, memory interface
     |       +---> Cortex System Timer (SysTick)
     |
     +---> APB1 Prescaler (/1, /2, /4, /8, /16)
     |       |
     |       +---> PCLK1 (max 36 MHz on STM32F1)
     |               +---> TIM2-7, UART2-5, SPI2/3, I2C1/2
     |
     +---> APB2 Prescaler (/1, /2, /4, /8, /16)
             |
             +---> PCLK2 (max 72 MHz on STM32F1)
                     +---> TIM1/8, USART1, SPI1, ADC
```

**Important:** APB1 peripherals on STM32F1 are limited to 36 MHz, even if SYSCLK is 72 MHz. The APB1 prescaler must be set to /2 or more.

### Timer Clock Quirk

If the APB prescaler is not /1, the timer clock is **doubled**. For example, with PCLK1 = 36 MHz (APB1 prescaler = /2), timers on APB1 get 72 MHz, not 36 MHz. This ensures timers can run at full system speed.

## Clock Output (MCO)

STM32 can output a clock signal on a GPIO pin (MCO -- Microcontroller Clock Output). This is useful for:

- Debugging: verify your clock configuration with an oscilloscope
- Clocking external devices
- Testing clock accuracy

<!-- tabs -->
```c
// Output HSI on MCO1 pin (PA8 on STM32F4)
RCC->CFGR |= RCC_CFGR_MCO1_0 | RCC_CFGR_MCO1_1;  // Select HSI
// Configure PA8 as alternate function
```

```rust
// Using raw register access (PAC)
let rcc = unsafe { &*pac::RCC::ptr() };
rcc.cfgr.modify(|_, w| unsafe { w.mco1().bits(0b11) }); // Select HSI
// Configure PA8 as alternate function
```
<!-- /tabs -->

## Clock Security System (CSS)

The CSS monitors the HSE oscillator. If the HSE fails (crystal breaks, bad solder joint), the CSS automatically:

1. Switches SYSCLK back to HSI
2. Generates an NMI (Non-Maskable Interrupt)

This prevents the MCU from hanging if the external crystal stops. Enable it with:

<!-- tabs -->
```c
RCC->CR |= RCC_CR_CSSON;  // Enable Clock Security System
```

```rust
let rcc = unsafe { &*pac::RCC::ptr() };
rcc.cr.modify(|_, w| w.csson().set_bit()); // Enable Clock Security System
```
<!-- /tabs -->

## References

1. [Clock Tree - Peripheral Driver Development](https://tonyfu97.github.io/MCU1/04_clock_tree/) — Visual clock tree walkthrough with register configuration
2. [STM32 Clock System](https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/) — STM32 clock sources and SYSCLK selection explained
3. [How to Choose STM32 Clock](https://www.ampheo.com/blog/how-to-choose-stm32-clock) — Practical guide for selecting clock sources and crystals

## Related Topics

- [PLL and Prescalers](pll-and-prescalers.md) -- how to multiply HSE to get high SYSCLK
- [Sleep and Low-Power Modes](sleep-and-low-power-modes.md) -- which clocks run in each power mode
- [Clock Cycles and Timing](../instruction-execution/clock-cycles-and-timing.md) -- clock speed affects instruction throughput
