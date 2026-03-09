---
title: "Clock and Power System"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, clock, power, oscillator, sleep, arm, cortex-m, stm32]
status: draft
sources:
  - url: "https://tonyfu97.github.io/MCU1/04_clock_tree/"
    title: "Clock Tree - Peripheral Driver Development"
  - url: "https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/"
    title: "STM32 Clock System"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
---

## The Clock: Heartbeat of the MCU

Every digital operation inside an MCU is synchronized to a [clock signal](https://tonyfu97.github.io/MCU1/04_clock_tree/). The clock is a square wave that oscillates at a fixed frequency, and each rising edge triggers the next step of computation. Without a clock, nothing happens.

```
  Clock Signal at 72 MHz:
    ___     ___     ___     ___
   |   |   |   |   |   |   |   |
   |   |___|   |___|   |___|   |___
   ^       ^       ^       ^
   Each edge = one operation step
   Period = 1/72 MHz = ~13.9 ns
```

The clock drives:
- **CPU core** -- fetching, decoding, and executing instructions
- **Bus matrix** -- transferring data between CPU, memory, and peripherals
- **Peripherals** -- timers counting, UARTs shifting bits, ADCs sampling

## Clock Speed vs Power Consumption

Power consumption in digital CMOS circuits follows this relationship:

```
  P = C * V^2 * f

  P = dynamic power consumption
  C = switching capacitance (fixed by chip design)
  V = supply voltage
  f = clock frequency
```

Key takeaways:
- **Doubling the clock frequency doubles the power** (linear relationship)
- **Voltage has a squared effect** -- lowering voltage saves more power than lowering frequency
- Running at 72 MHz consumes roughly 4x the power of running at 18 MHz

This is why [MCUs offer multiple clock speeds](https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/) and power modes. A sensor node that reads temperature every 10 seconds doesn't need to run at 168 MHz continuously -- it can wake up, read the sensor at high speed, then drop to a low-power mode.

## STM32 Clock System at a Glance

```
  +--------+
  | HSI RC |--+
  | 16 MHz |  |    +---------+     +--------+     +-----------+
  +--------+  +--->|         |     | AHB    |     | CPU Core  |
               +-->| SYSCLK  |---->| Prescaler--->| AHB Bus   |
  +--------+  |   | MUX     |     | /1..512|     | DMA       |
  | HSE    |--+   |         |     +--------+     +-----------+
  | Crystal|  |   +---------+         |
  | 8 MHz  |--+                  +----+----+
  +--------+  |              +---+---+ +---+---+
              |              | APB1  | | APB2  |
  +--------+  |              | /1..16| | /1..16|
  |  PLL   |--+              +-------+ +-------+
  |  xN    |                 | UART  | | SPI1  |
  +--------+                 | I2C   | | ADC   |
                             | TIM2-7| | TIM1  |
                             +-------+ +-------+
```

## Child Pages

- [Clock Sources and Tree](clock-sources-and-tree.md) -- HSI, HSE, LSI, LSE and how they route through the clock tree
- [PLL and Prescalers](pll-and-prescalers.md) -- frequency multiplication, bus dividers, clock gating
- [Sleep and Low-Power Modes](sleep-and-low-power-modes.md) -- Sleep, Stop, Standby, and wake-up sources

## References

1. [Clock Tree - Peripheral Driver Development](https://tonyfu97.github.io/MCU1/04_clock_tree/) — Clock tree structure and configuration walkthrough
2. [STM32 Clock System](https://www.compilenrun.com/docs/iot/stm32/stm32-fundamentals/stm32-clock-system/) — STM32 clock sources, PLL, and bus prescaler details
3. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Cortex-M system clock and power management overview

## Related Topics

- [Clock Cycles and Timing](../instruction-execution/clock-cycles-and-timing.md) -- how clock speed affects instruction throughput
- [Flash Memory](../memory-architecture/flash-memory.md) -- wait states increase with clock speed
- [MCU Architecture Overview](../index.md) -- the clock system in context
