---
title: "Timers and Counters"
created: 2026-03-08
updated: 2026-03-08
tags: [timer, pwm, counter, stm32, cortex-m, peripheral]
status: draft
sources:
  - url: "https://deepbluembedded.com/stm32-timers-tutorial-hardware-timers-explained/"
    title: "STM32 Timers Explained Tutorial"
  - url: "https://deepbluembedded.com/stm32-pwm-example-timer-pwm-mode-tutorial/"
    title: "STM32 PWM Example Timer PWM Mode Tutorial"
  - url: "https://wiki.st.com/stm32mcu/wiki/Getting_started_with_TIM"
    title: "Getting started with TIM - STM32 MCU Wiki"
  - url: "https://www.k-space.org/Class_Info/STM32_Lec5.pdf"
    title: "STM32 General-Purpose Timers Lecture"
---

Timers are one of the most versatile peripherals on a microcontroller. At their core, they are just **hardware counters** that [count clock ticks](https://deepbluembedded.com/stm32-timers-tutorial-hardware-timers-explained/) -- but the features built around that counter enable PWM generation, pulse measurement, event counting, and precise time delays.

## Timer Hardware Block

```
                    +-------------------+
  Timer Clock ----->| Prescaler (PSC)   |----> Divided Clock
  (e.g. 72 MHz)    +-------------------+          |
                                                   v
                                          +------------------+
                                          | Counter (CNT)    |
                                          +------------------+
                                                   |
                            Compare <--------------+-------------> Auto-Reload
                           (CCRx)                                   (ARR)
                              |                                       |
                              v                                       v
                        PWM Output /                          Update Event
                        Input Capture                         (UEV interrupt)
```

### Key Registers

| Register | Purpose |
|----------|---------|
| TIMx_PSC | Prescaler -- divides input clock by (PSC + 1) |
| TIMx_ARR | Auto-reload -- counter resets when it reaches this value |
| TIMx_CNT | Current counter value |
| TIMx_CR1 | Control: enable timer, direction, alignment |
| TIMx_CCRx | Capture/Compare -- threshold for PWM or captured value |
| TIMx_CCMRx | Capture/Compare mode (PWM mode 1/2, input capture filter) |
| TIMx_CCER | Capture/Compare enable -- connects output to pin |
| TIMx_DIER | DMA/Interrupt enable |
| TIMx_SR | Status flags (update, capture/compare) |

## Basic Timer Operation

The counter counts from 0 up to ARR, then resets to 0 and generates an **update event** (UEV). The time for one full cycle:

```
Timer Period = (PSC + 1) * (ARR + 1) / Timer_Clock_Hz
```

**Example:** With a 72 MHz clock, to get a 1-second period:
- PSC = 7199 (divides 72 MHz by 7200 = 10 kHz)
- ARR = 9999 (10,000 ticks at 10 kHz = 1 second)

<!-- tabs -->
```c
TIM2->PSC = 7199;
TIM2->ARR = 9999;
TIM2->CR1 |= TIM_CR1_CEN;  // start counting
```

```rust
use core::ptr::{read_volatile, write_volatile};

const TIM2_BASE: u32 = 0x4000_0000;
const TIM2_PSC: *mut u32 = (TIM2_BASE + 0x28) as *mut u32;
const TIM2_ARR: *mut u32 = (TIM2_BASE + 0x2C) as *mut u32;
const TIM2_CR1: *mut u32 = TIM2_BASE as *mut u32;

unsafe {
    write_volatile(TIM2_PSC, 7199);
    write_volatile(TIM2_ARR, 9999);
    write_volatile(TIM2_CR1, read_volatile(TIM2_CR1) | (1 << 0)); // CEN
}
```
<!-- /tabs -->

## PWM Generation

[PWM (Pulse Width Modulation)](https://deepbluembedded.com/stm32-pwm-example-timer-pwm-mode-tutorial/) compares the counter against a threshold (CCRx):

- **Counter < CCRx** --> output HIGH
- **Counter >= CCRx** --> output LOW

This produces a square wave whose duty cycle is `CCRx / (ARR + 1)`.

```
ARR = 999
CCR = 250 (25% duty cycle)

        ____          ____          ____
Output |    |________|    |________|    |________
       0   250      999  0   250      999
```

### PWM Mode Configuration

<!-- tabs -->
```c
// PWM Mode 1: output active while CNT < CCR
TIM2->CCMR1 &= ~TIM_CCMR1_OC1M;
TIM2->CCMR1 |= (0x6 << TIM_CCMR1_OC1M_Pos);  // PWM mode 1

// Enable preload (buffered CCR updates)
TIM2->CCMR1 |= TIM_CCMR1_OC1PE;

// Enable output on channel 1
TIM2->CCER |= TIM_CCER_CC1E;
```

```rust
use core::ptr::{read_volatile, write_volatile};

const TIM2_CCMR1: *mut u32 = (0x4000_0000 + 0x18) as *mut u32;
const TIM2_CCER: *mut u32 = (0x4000_0000 + 0x20) as *mut u32;

unsafe {
    // PWM Mode 1: output active while CNT < CCR
    let ccmr1 = read_volatile(TIM2_CCMR1);
    write_volatile(TIM2_CCMR1, (ccmr1 & !(0x7 << 4)) | (0x6 << 4)); // OC1M = PWM mode 1

    // Enable preload (buffered CCR updates)
    write_volatile(TIM2_CCMR1, read_volatile(TIM2_CCMR1) | (1 << 3)); // OC1PE

    // Enable output on channel 1
    write_volatile(TIM2_CCER, read_volatile(TIM2_CCER) | (1 << 0)); // CC1E
}
```
<!-- /tabs -->

## Input Capture

Input capture **records the counter value** when an edge is detected on a pin. This lets you measure:
- Pulse width (time between rising and falling edge)
- Frequency (time between two rising edges)

<!-- tabs -->
```c
// Configure channel 1 as input capture on rising edge
TIM2->CCMR1 &= ~TIM_CCMR1_CC1S;
TIM2->CCMR1 |= TIM_CCMR1_CC1S_0;   // IC1 mapped to TI1

TIM2->CCER &= ~TIM_CCER_CC1P;       // rising edge
TIM2->CCER |= TIM_CCER_CC1E;        // enable capture

// After capture, read TIM2->CCR1 for the timestamp
```

```rust
use core::ptr::{read_volatile, write_volatile};

const TIM2_CCMR1: *mut u32 = (0x4000_0000 + 0x18) as *mut u32;
const TIM2_CCER: *mut u32 = (0x4000_0000 + 0x20) as *mut u32;
const TIM2_CCR1: *const u32 = (0x4000_0000 + 0x34) as *const u32;

unsafe {
    // Configure channel 1 as input capture on rising edge
    let ccmr1 = read_volatile(TIM2_CCMR1);
    write_volatile(TIM2_CCMR1, (ccmr1 & !(0x3 << 0)) | (0x1 << 0)); // CC1S = 01

    let ccer = read_volatile(TIM2_CCER);
    write_volatile(TIM2_CCER, (ccer & !(1 << 1)) | (1 << 0)); // CC1P=0 (rising), CC1E=1

    // After capture, read TIM2->CCR1 for the timestamp
    let _timestamp = read_volatile(TIM2_CCR1);
}
```
<!-- /tabs -->

To measure pulse width: capture on rising edge (store value), then capture on falling edge (subtract).

## Timer Interrupts

Enable the update interrupt to run code at a fixed rate:

<!-- tabs -->
```c
TIM2->DIER |= TIM_DIER_UIE;     // enable update interrupt
NVIC_EnableIRQ(TIM2_IRQn);      // enable in NVIC

void TIM2_IRQHandler(void) {
    if (TIM2->SR & TIM_SR_UIF) {
        TIM2->SR &= ~TIM_SR_UIF;  // clear flag (MUST do this)
        // your periodic code here
    }
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const TIM2_DIER: *mut u32 = (0x4000_0000 + 0x0C) as *mut u32;
const TIM2_SR: *mut u32 = (0x4000_0000 + 0x10) as *mut u32;
const NVIC_ISER0: *mut u32 = 0xE000_E100 as *mut u32;

unsafe {
    write_volatile(TIM2_DIER, read_volatile(TIM2_DIER) | (1 << 0)); // UIE
    write_volatile(NVIC_ISER0, 1 << 28);  // TIM2_IRQn = 28
}

#[no_mangle]
pub unsafe extern "C" fn TIM2_IRQHandler() {
    if read_volatile(TIM2_SR) & (1 << 0) != 0 {  // UIF
        write_volatile(TIM2_SR, read_volatile(TIM2_SR) & !(1 << 0)); // clear flag
        // your periodic code here
    }
}
```
<!-- /tabs -->

## Example: 1 kHz PWM on TIM2 CH1 (PA0)

Assuming a 72 MHz system clock:

<!-- tabs -->
```c
// 1. Enable clocks
RCC->APB1ENR |= RCC_APB1ENR_TIM2EN;
RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;

// 2. Configure PA0 as TIM2_CH1 (AF1 on STM32F4)
GPIOA->MODER &= ~(0x3 << (0 * 2));
GPIOA->MODER |=  (0x2 << (0 * 2));   // alternate function
GPIOA->AFR[0] |= (0x1 << (0 * 4));   // AF1 = TIM2

// 3. Set timer for 1 kHz PWM
//    72 MHz / (71+1) = 1 MHz tick
//    1 MHz / (999+1) = 1 kHz PWM frequency
TIM2->PSC = 71;
TIM2->ARR = 999;

// 4. Set 50% duty cycle
TIM2->CCR1 = 500;

// 5. Configure PWM mode 1 on channel 1
TIM2->CCMR1 &= ~TIM_CCMR1_OC1M;
TIM2->CCMR1 |= (0x6 << TIM_CCMR1_OC1M_Pos);
TIM2->CCMR1 |= TIM_CCMR1_OC1PE;  // preload enable

// 6. Enable output
TIM2->CCER |= TIM_CCER_CC1E;

// 7. Start timer
TIM2->CR1 |= TIM_CR1_CEN;

// To change duty cycle at runtime:
// TIM2->CCR1 = new_value;  // 0 to 999
```

```rust
use core::ptr::{read_volatile, write_volatile};

const RCC_APB1ENR: *mut u32 = (0x4002_3800 + 0x40) as *mut u32;
const RCC_AHB1ENR: *mut u32 = (0x4002_3800 + 0x30) as *mut u32;
const GPIOA_MODER: *mut u32 = 0x4002_0000 as *mut u32;
const GPIOA_AFRL: *mut u32 = (0x4002_0000 + 0x20) as *mut u32;
const TIM2_BASE: u32 = 0x4000_0000;

unsafe {
    // 1. Enable clocks
    write_volatile(RCC_APB1ENR, read_volatile(RCC_APB1ENR) | (1 << 0)); // TIM2EN
    write_volatile(RCC_AHB1ENR, read_volatile(RCC_AHB1ENR) | (1 << 0)); // GPIOAEN

    // 2. Configure PA0 as TIM2_CH1 (AF1)
    let moder = read_volatile(GPIOA_MODER);
    write_volatile(GPIOA_MODER, (moder & !(0x3 << 0)) | (0x2 << 0)); // AF mode
    let afrl = read_volatile(GPIOA_AFRL);
    write_volatile(GPIOA_AFRL, afrl | (0x1 << 0)); // AF1 = TIM2

    // 3. Set timer for 1 kHz PWM
    write_volatile((TIM2_BASE + 0x28) as *mut u32, 71);  // PSC
    write_volatile((TIM2_BASE + 0x2C) as *mut u32, 999); // ARR

    // 4. Set 50% duty cycle
    write_volatile((TIM2_BASE + 0x34) as *mut u32, 500); // CCR1

    // 5. Configure PWM mode 1 on channel 1
    let ccmr1 = (TIM2_BASE + 0x18) as *mut u32;
    let val = read_volatile(ccmr1);
    write_volatile(ccmr1, (val & !(0x7 << 4)) | (0x6 << 4) | (1 << 3)); // OC1M + OC1PE

    // 6. Enable output
    let ccer = (TIM2_BASE + 0x20) as *mut u32;
    write_volatile(ccer, read_volatile(ccer) | (1 << 0)); // CC1E

    // 7. Start timer
    let cr1 = TIM2_BASE as *mut u32;
    write_volatile(cr1, read_volatile(cr1) | (1 << 0)); // CEN

    // To change duty cycle at runtime:
    // write_volatile((TIM2_BASE + 0x34) as *mut u32, new_value); // 0 to 999
}
```
<!-- /tabs -->

## Timer Types on STM32

| Type | Examples | Features |
|------|----------|----------|
| Basic | TIM6, TIM7 | Count only, no I/O. Good for timebase/DAC trigger |
| General-purpose | TIM2-TIM5 | PWM, input capture, encoder mode, 4 channels |
| Advanced | TIM1, TIM8 | Dead-time insertion, break input, complementary outputs (motor control) |

## References

1. [STM32 Timers Explained Tutorial](https://deepbluembedded.com/stm32-timers-tutorial-hardware-timers-explained/) — Comprehensive guide to STM32 timer hardware and registers
2. [STM32 PWM Example Timer PWM Mode Tutorial](https://deepbluembedded.com/stm32-pwm-example-timer-pwm-mode-tutorial/) — Practical PWM configuration and duty cycle examples
3. [Getting started with TIM - STM32 MCU Wiki](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_TIM) — Official ST wiki guide for timer peripherals
4. [STM32 General-Purpose Timers Lecture](https://www.k-space.org/Class_Info/STM32_Lec5.pdf) — Academic lecture covering timer theory and operation

## Related Topics

- [GPIO Alternate Functions](gpio-register-level.md) -- connecting timer channels to pins
- [Interrupt System](interrupt-system/index.md) -- timer update interrupts
- [ADC](adc-and-analog.md) -- timers can trigger ADC conversions
