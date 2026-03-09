---
title: "Peripherals and Interrupts"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, peripherals, interrupts, stm32, cortex-m]
status: draft
sources:
  - url: "https://deepbluembedded.com/getting-started-with-stm32-arm-cortex-mcus/"
    title: "Getting Started With STM32 ARM Cortex MCUs"
  - url: "https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-bus-architecture/"
    title: "STM32 Bus Architecture"
  - url: "https://en.wikipedia.org/wiki/Advanced_Microcontroller_Bus_Architecture"
    title: "Advanced Microcontroller Bus Architecture - Wikipedia"
---

## What Are Peripherals?

Peripherals are **hardware engines built into the microcontroller** that handle specific tasks -- GPIO, timers, UART, SPI, I2C, ADC, and more. The CPU controls them by reading and writing to **memory-mapped registers** at fixed addresses.

Think of each peripheral as a small co-processor. You configure it by writing to its control registers, start it, and it runs independently. The CPU can then do other work or sleep.

<!-- tabs -->
```c
// Example: enabling GPIOA clock on STM32F4
RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;  // flip one bit, hardware does the rest
```

```rust
use core::ptr::{read_volatile, write_volatile};

const RCC_AHB1ENR: *mut u32 = (0x4002_3800 + 0x30) as *mut u32;

unsafe {
    write_volatile(RCC_AHB1ENR, read_volatile(RCC_AHB1ENR) | (1 << 0)); // GPIOAEN
}
```
<!-- /tabs -->

## How Peripherals Connect to the CPU

The CPU does not talk to peripherals directly. They are connected through a **bus system** based on ARM's [AMBA (Advanced Microcontroller Bus Architecture)](https://en.wikipedia.org/wiki/Advanced_Microcontroller_Bus_Architecture).

### Bus Hierarchy

```
CPU Core
  |
  +-- AHB (Advanced High-performance Bus) -- high speed, 72-180 MHz
  |     |-- Flash memory
  |     |-- SRAM
  |     |-- DMA controllers
  |     |-- GPIO ports
  |     |
  |     +-- AHB-APB Bridge
  |           |
  |           +-- APB2 (higher speed, up to 72-90 MHz)
  |           |     |-- USART1, SPI1, TIM1, TIM8, ADC, SYSCFG
  |           |
  |           +-- APB1 (lower speed, up to 36-45 MHz)
  |                 |-- USART2-5, SPI2/3, I2C1-3, TIM2-7, DAC
  |
  +-- Bus Matrix (arbitrates between CPU, DMA, etc.)
```

**Key takeaway:** Before using any peripheral, you must enable its clock through the RCC (Reset and Clock Control) registers. The clock gate is on the specific bus the peripheral sits on.

<!-- tabs -->
```c
RCC->APB1ENR |= RCC_APB1ENR_USART2EN;  // USART2 is on APB1
RCC->APB2ENR |= RCC_APB2ENR_SPI1EN;    // SPI1 is on APB2
RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;   // GPIOA is on AHB1
```

```rust
use core::ptr::{read_volatile, write_volatile};

const RCC_BASE: u32 = 0x4002_3800;
const RCC_APB1ENR: *mut u32 = (RCC_BASE + 0x40) as *mut u32;
const RCC_APB2ENR: *mut u32 = (RCC_BASE + 0x44) as *mut u32;
const RCC_AHB1ENR: *mut u32 = (RCC_BASE + 0x30) as *mut u32;

unsafe {
    write_volatile(RCC_APB1ENR, read_volatile(RCC_APB1ENR) | (1 << 17)); // USART2EN
    write_volatile(RCC_APB2ENR, read_volatile(RCC_APB2ENR) | (1 << 12)); // SPI1EN
    write_volatile(RCC_AHB1ENR, read_volatile(RCC_AHB1ENR) | (1 << 0));  // GPIOAEN
}
```
<!-- /tabs -->

## Three Ways to Move Data

### 1. Polling (Simplest)

The CPU repeatedly checks a status flag in a loop.

<!-- tabs -->
```c
while (!(USART2->SR & USART_SR_RXNE)) { }  // spin until data arrives
char c = USART2->DR;
```

```rust
use core::ptr::read_volatile;

const USART2_SR: *const u32 = 0x4000_4400 as *const u32;
const USART2_DR: *const u32 = (0x4000_4400 + 0x04) as *const u32;

unsafe {
    while read_volatile(USART2_SR) & (1 << 5) == 0 {}  // spin until RXNE
    let c = read_volatile(USART2_DR) as u8;
}
```
<!-- /tabs -->

**Pros:** Simple to write and debug.
**Cons:** Wastes CPU cycles. CPU cannot do anything else while waiting.

### 2. Interrupt-Driven

The peripheral signals the CPU when something happens. The CPU jumps to an ISR (Interrupt Service Routine), handles the event, and returns.

<!-- tabs -->
```c
void USART2_IRQHandler(void) {
    if (USART2->SR & USART_SR_RXNE) {
        rx_buffer[rx_head++] = USART2->DR;
    }
}
```

```rust
use core::ptr::read_volatile;

static mut RX_BUFFER: [u8; 256] = [0; 256];
static mut RX_HEAD: usize = 0;

const USART2_SR: *const u32 = 0x4000_4400 as *const u32;
const USART2_DR: *const u32 = (0x4000_4400 + 0x04) as *const u32;

#[no_mangle]
pub unsafe extern "C" fn USART2_IRQHandler() {
    if read_volatile(USART2_SR) & (1 << 5) != 0 {  // RXNE
        RX_BUFFER[RX_HEAD] = read_volatile(USART2_DR) as u8;
        RX_HEAD += 1;
    }
}
```
<!-- /tabs -->

**Pros:** CPU is free between events.
**Cons:** ISR overhead for every byte; complex at high data rates.

### 3. DMA (Direct Memory Access)

A dedicated DMA controller transfers data between peripheral and memory **without CPU involvement**.

```
Peripheral <---> DMA Channel <---> Memory Buffer
```

**Pros:** Zero CPU overhead during transfer. Best for high-throughput or continuous streams.
**Cons:** More complex setup. DMA channels are a shared resource.

## Choosing the Right Approach

| Scenario | Best Method |
|---|---|
| Read one ADC value on button press | Polling |
| Receive UART commands at moderate rate | Interrupt |
| Stream audio samples to DAC at 44.1 kHz | DMA |
| Blink an LED | Polling (or timer interrupt) |

## Child Pages

- [GPIO at Register Level](gpio-register-level.md) -- pins, modes, and atomic bit manipulation
- [Timers and Counters](timers-and-counters.md) -- counting, PWM, input capture
- [UART Serial Communication](uart-serial.md) -- asynchronous data frames
- [SPI Protocol](spi-protocol.md) -- fast synchronous full-duplex bus
- [I2C Protocol](i2c-protocol.md) -- two-wire addressed bus
- [ADC and Analog](adc-and-analog.md) -- converting the real world to numbers
- [Interrupt System](interrupt-system/index.md) -- NVIC, priorities, ISR design, faults

## References

1. [Getting Started With STM32 ARM Cortex MCUs](https://deepbluembedded.com/getting-started-with-stm32-arm-cortex-mcus/) — Overview of STM32 peripherals and getting started guide
2. [STM32 Bus Architecture](https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-bus-architecture/) — Detailed explanation of AHB and APB bus hierarchy
3. [Advanced Microcontroller Bus Architecture - Wikipedia](https://en.wikipedia.org/wiki/Advanced_Microcontroller_Bus_Architecture) — Reference on the AMBA bus standard used in ARM chips
