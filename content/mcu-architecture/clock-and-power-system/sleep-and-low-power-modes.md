---
title: "Sleep and Low-Power Modes"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, low-power, sleep, stop, standby, wfi, wfe, stm32, arm]
status: draft
sources:
  - url: "https://tonyfu97.github.io/MCU1/04_clock_tree/"
    title: "Clock Tree - Peripheral Driver Development"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
  - url: "https://mischianti.org/stm32-power-saving-stm32f1-blue-pill-manages-clock-and-frequencies-1/"
    title: "STM32 Power Saving: Clock and Frequencies"
---

## Why Low-Power Modes Matter

Many embedded devices run on batteries -- a wireless sensor, a wearable, a remote control. If the MCU runs at full speed continuously, the battery drains in hours. Low-power modes let the MCU sleep when idle and wake up only when needed, extending battery life from hours to **months or years**.

Even mains-powered devices benefit: less power means less heat, which means higher reliability and no need for cooling.

### Typical Current Consumption (STM32L4 at 3.3V)

| Mode | Current | Battery Life (200 mAh) |
|---|---|---|
| Run at 80 MHz | ~10 mA | 20 hours |
| Run at 1 MHz | ~1 mA | 8 days |
| Sleep | ~0.5 mA | 17 days |
| Stop | ~1 uA | 23 years |
| Standby | ~0.3 uA | 76 years |
| Shutdown | ~30 nA | theoretical centuries |

## ARM Cortex-M Low-Power Architecture

The [Cortex-M core](https://embeddedsecurity.io/sec-arm-arch-core) provides two mechanisms for entering low-power states:

### WFI -- Wait For Interrupt

```arm
WFI         @ CPU sleeps until ANY enabled interrupt fires
```

The CPU stops executing instructions. When an enabled interrupt occurs, the CPU wakes up and enters the interrupt handler. This is the most common way to enter sleep.

<!-- tabs -->
```c
// Enter sleep mode
__WFI();  // CMSIS intrinsic

// Execution resumes HERE after interrupt handler returns
process_data();
```

```rust
// Using cortex-m crate
use cortex_m::asm;

asm::wfi();  // CPU sleeps until interrupt

// Execution resumes here after interrupt handler returns
process_data();
```
<!-- /tabs -->

### WFE -- Wait For Event

```arm
WFE         @ CPU sleeps until an EVENT occurs
```

Similar to WFI but responds to **events**, not just interrupts. Events can come from:
- The SEVONPEND bit (pending interrupt, even if not enabled, can wake)
- The SEV instruction from another core (multi-core MCUs)
- An external event signal
- The Event Register being set

WFE is useful in multi-core systems and for spinlocks without consuming power.

## STM32 Power Modes

[STM32 devices](https://mischianti.org/stm32-power-saving-stm32f1-blue-pill-manages-clock-and-frequencies-1/) build on the Cortex-M sleep architecture to offer several power modes. The `SLEEPDEEP` bit in the Cortex-M System Control Register determines whether WFI/WFE enters **Sleep** or **Deep Sleep** (Stop/Standby).

### Sleep Mode

**What stays on:** All peripherals, all clocks, SRAM, flash
**What stops:** CPU core only

```
  CPU:          OFF (halted)
  SRAM:         Retained
  Flash:        ON
  Peripherals:  ON (UART can receive, timers keep counting)
  Clocks:       All running
  Wakeup:       Any interrupt
```

Sleep mode is the lightest low-power mode. The CPU stops but everything else keeps running. Wake-up is instant -- the CPU resumes from the next instruction after WFI.

<!-- tabs -->
```c
// Enter Sleep mode
HAL_SuspendTick();        // Stop SysTick (optional, prevents immediate wake)
HAL_PWR_EnterSLEEPMode(PWR_MAINREGULATOR_ON, PWR_SLEEPENTRY_WFI);
HAL_ResumeTick();
```

```rust
// Using cortex-m and PAC -- Sleep mode (SLEEPDEEP = 0)
use cortex_m::asm;
use cortex_m::peripheral::SCB;

// Ensure SLEEPDEEP is cleared (Sleep, not Stop)
let scb = unsafe { &*SCB::PTR };
scb.scr.modify(|v| v & !(1 << 2)); // Clear SLEEPDEEP bit

asm::wfi(); // Enter Sleep mode -- wakes on any enabled interrupt
```
<!-- /tabs -->

### Stop Mode

**What stays on:** SRAM content, register values, LSI, LSE, some wake-up peripherals
**What stops:** CPU, HSI, HSE, PLL, flash, most peripherals

```
  CPU:          OFF
  SRAM:         Retained
  Flash:        OFF (or in low-power mode)
  Peripherals:  Most OFF
  Clocks:       HSI/HSE/PLL OFF, LSI/LSE optionally ON
  Wakeup:       EXTI line (GPIO interrupt), RTC alarm, UART (some MCUs)
```

Stop mode provides dramatically lower power (~1 uA) while preserving all SRAM and register contents. After waking, the MCU resumes from where it stopped, but **the clock reverts to HSI**. You must reconfigure PLL and switch SYSCLK back.

<!-- tabs -->
```c
// Enter Stop mode
HAL_PWR_EnterSTOPMode(PWR_LOWPOWERREGULATOR_ON, PWR_STOPENTRY_WFI);

// After wake-up: reconfigure clocks (PLL is off, running on HSI now)
SystemClock_Config();   // Re-enable HSE, PLL, set SYSCLK back to PLL
```

```rust
use cortex_m::asm;
use cortex_m::peripheral::SCB;

// Set SLEEPDEEP bit for Stop mode
let scb = unsafe { &*SCB::PTR };
scb.scr.modify(|v| v | (1 << 2)); // Set SLEEPDEEP

// Configure low-power regulator via PWR registers
let pwr = unsafe { &*pac::PWR::ptr() };
pwr.cr.modify(|_, w| w.lpds().set_bit()); // Low-power regulator in Stop

asm::wfi(); // Enter Stop mode

// After wake-up: reconfigure clocks (PLL is off, running on HSI now)
system_clock_config(); // Re-enable HSE, PLL, set SYSCLK back to PLL
```
<!-- /tabs -->

### Standby Mode

**What stays on:** Backup domain (RTC, backup SRAM if VBAT is powered), wake-up logic
**What stops:** Almost everything -- main SRAM is lost!

```
  CPU:          OFF
  SRAM:         LOST (contents are garbage after wake)
  Flash:        OFF
  Peripherals:  OFF (except RTC if enabled)
  Clocks:       All OFF except LSI/LSE for RTC
  Wakeup:       WKUP pin, RTC alarm, RTC tamper, IWDG reset
```

Standby mode provides the lowest power (~0.3 uA) but **SRAM content is lost**. Waking from Standby is effectively a **reset** -- execution starts from the Reset_Handler, not from where you left off.

<!-- tabs -->
```c
// Enter Standby mode
HAL_PWR_EnterSTANDBYMode();

// Code NEVER reaches here -- wake-up causes a reset
```

```rust
use cortex_m::asm;
use cortex_m::peripheral::SCB;

// Set SLEEPDEEP bit
let scb = unsafe { &*SCB::PTR };
scb.scr.modify(|v| v | (1 << 2));

// Set PDDS bit in PWR_CR for Standby (instead of Stop)
let pwr = unsafe { &*pac::PWR::ptr() };
pwr.cr.modify(|_, w| w.pdds().set_bit());
pwr.cr.modify(|_, w| w.cwuf().set_bit()); // Clear wake-up flag

asm::wfi(); // Enter Standby mode

// Code NEVER reaches here -- wake-up causes a reset
```
<!-- /tabs -->

To pass information across standby wake-ups, use:
- **Backup registers** (RTC_BKPxR) -- small set of 32-bit registers that survive Standby
- **Backup SRAM** (4 KB on some MCUs, powered by VBAT)

## Mode Comparison

| Feature | Run | Sleep | Stop | Standby |
|---|---|---|---|---|
| CPU | ON | OFF | OFF | OFF |
| SRAM | Retained | Retained | Retained | **Lost** |
| Peripherals | ON | ON | Mostly OFF | OFF |
| PLL/HSE | ON | ON | OFF | OFF |
| Current (typical) | mA | 100s uA | ~1 uA | ~0.3 uA |
| Wake-up time | -- | ~1 us | ~5 us + PLL lock | Full reset |
| Resume point | -- | Next instruction | Next instruction | Reset_Handler |

## Wake-Up Sources

| Source | Sleep | Stop | Standby |
|---|---|---|---|
| Any interrupt | Yes | No | No |
| EXTI (GPIO edge) | Yes | Yes | No |
| RTC alarm | Yes | Yes | Yes |
| WKUP pin (rising edge) | Yes | Yes | Yes |
| IWDG reset | -- | -- | Yes |
| NRST pin | Yes | Yes | Yes |

### Configuring a GPIO Wake-Up from Stop Mode

<!-- tabs -->
```c
// Configure PA0 as EXTI wake-up source (rising edge)
GPIO_InitTypeDef gpio = {0};
gpio.Pin = GPIO_PIN_0;
gpio.Mode = GPIO_MODE_IT_RISING;  // Interrupt on rising edge
gpio.Pull = GPIO_PULLDOWN;
HAL_GPIO_Init(GPIOA, &gpio);

HAL_NVIC_SetPriority(EXTI0_IRQn, 0, 0);
HAL_NVIC_EnableIRQ(EXTI0_IRQn);

// Now entering Stop mode -- PA0 rising edge will wake up
HAL_PWR_EnterSTOPMode(PWR_LOWPOWERREGULATOR_ON, PWR_STOPENTRY_WFI);
```

```rust
use cortex_m::asm;
use cortex_m::peripheral::{SCB, NVIC};

// Configure PA0 as EXTI wake-up source (rising edge)
let syscfg = unsafe { &*pac::SYSCFG::ptr() };
let exti = unsafe { &*pac::EXTI::ptr() };

// Map EXTI0 to PA0
syscfg.exticr1.modify(|_, w| unsafe { w.exti0().bits(0) }); // Port A

// Configure rising edge trigger
exti.rtsr.modify(|_, w| w.tr0().set_bit());  // Rising trigger
exti.imr.modify(|_, w| w.mr0().set_bit());   // Unmask EXTI0

// Enable EXTI0 interrupt in NVIC
unsafe { NVIC::unmask(pac::Interrupt::EXTI0) };

// Enter Stop mode
let scb = unsafe { &*SCB::PTR };
scb.scr.modify(|v| v | (1 << 2)); // SLEEPDEEP
asm::wfi();
```
<!-- /tabs -->

## Practical Low-Power Strategy

A common pattern for battery-powered sensors:

<!-- tabs -->
```c
while (1) {
    // 1. Wake up (from Stop mode, clock is HSI)
    SystemClock_Config();         // Reconfigure PLL

    // 2. Do useful work quickly
    float temp = read_sensor();
    transmit_data(temp);

    // 3. Set RTC alarm for next wake-up (e.g., 60 seconds)
    set_rtc_alarm(60);

    // 4. Enter Stop mode
    HAL_PWR_EnterSTOPMode(PWR_LOWPOWERREGULATOR_ON, PWR_STOPENTRY_WFI);
}
```

```rust
use cortex_m::asm;

loop {
    // 1. Wake up (from Stop mode, clock is HSI)
    system_clock_config();          // Reconfigure PLL

    // 2. Do useful work quickly
    let temp = read_sensor();
    transmit_data(temp);

    // 3. Set RTC alarm for next wake-up (e.g., 60 seconds)
    set_rtc_alarm(60);

    // 4. Enter Stop mode
    enter_stop_mode();  // Sets SLEEPDEEP + calls asm::wfi()
}
```
<!-- /tabs -->

The MCU spends >99.9% of its time in Stop mode (~1 uA), waking briefly every 60 seconds to sample and transmit. This can achieve months of battery life.

## References

1. [Clock Tree - Peripheral Driver Development](https://tonyfu97.github.io/MCU1/04_clock_tree/) — Clock behavior across power modes and wake-up reconfiguration
2. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — WFI/WFE instructions and Cortex-M sleep architecture
3. [STM32 Power Saving: Clock and Frequencies](https://mischianti.org/stm32-power-saving-stm32f1-blue-pill-manages-clock-and-frequencies-1/) — Practical STM32 low-power mode configuration and current measurements

## Related Topics

- [Clock Sources and Tree](clock-sources-and-tree.md) -- which clocks are available in each mode
- [PLL and Prescalers](pll-and-prescalers.md) -- PLL must be reconfigured after Stop mode
- [MCU Architecture Overview](../index.md) -- execution modes and system context
