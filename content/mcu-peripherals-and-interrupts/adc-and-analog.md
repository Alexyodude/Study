---
title: "ADC and Analog"
created: 2026-03-08
updated: 2026-03-08
tags: [adc, analog, sar, stm32, cortex-m, peripheral]
status: draft
sources:
  - url: "https://deepbluembedded.com/stm32-adc-tutorial-complete-guide-with-examples/"
    title: "STM32 ADC Tutorial + ADC Examples"
  - url: "https://wiki.st.com/stm32mcu/wiki/Getting_started_with_ADC"
    title: "Getting started with ADC - STM32 MCU Wiki"
  - url: "https://www.st.com/resource/en/application_note/an3116-stm32s-adc-modes-and-their-applications-stmicroelectronics.pdf"
    title: "AN3116: STM32 ADC Modes and Their Applications"
---

The ADC (Analog-to-Digital Converter) converts a continuous analog voltage into a discrete digital number. This is how your MCU reads sensors like potentiometers, temperature sensors, light sensors, and microphones.

## SAR ADC Operation

STM32 MCUs use a **Successive Approximation Register (SAR)** ADC. It works like a [binary search](https://deepbluembedded.com/stm32-adc-tutorial-complete-guide-with-examples/):

```
1. Start with MSB. Set bit 11 = 1, compare with input voltage.
2. If input > threshold: keep bit 11 = 1. Else: set bit 11 = 0.
3. Move to bit 10. Repeat.
4. Continue for all bits (12 steps for 12-bit resolution).
5. Result is a 12-bit number (0-4095).
```

The SAR ADC uses an internal DAC and comparator. Each step takes one clock cycle, so a 12-bit conversion needs at least 12 ADC clock cycles plus sampling time.

## Resolution and Reference Voltage

| Resolution | Range | Precision at 3.3V |
|-----------|-------|-------------------|
| 8-bit | 0-255 | 12.9 mV per step |
| 10-bit | 0-1023 | 3.2 mV per step |
| 12-bit | 0-4095 | 0.8 mV per step |

The conversion formula:

```
Voltage = (ADC_Value / 2^N) * V_REF
ADC_Value = (Voltage / V_REF) * 2^N
```

Where N is the resolution (typically 12) and V_REF is the reference voltage (usually VDDA, which is 3.3V).

**Example:** Reading 1.65V with 12-bit resolution at 3.3V reference:
```
ADC_Value = (1.65 / 3.3) * 4095 = 2048 (approximately)
```

## Sampling Time and Conversion Time

Before the SAR algorithm starts, the ADC must **sample** the input voltage -- charge an internal capacitor to match the analog voltage. Longer sampling time gives more accuracy, especially for high-impedance sources.

```
Total conversion time = Sampling time + 12 ADC cycles (for 12-bit)
```

STM32 ADC sampling time is configurable per channel: 3, 15, 28, 56, 84, 112, 144, or 480 ADC clock cycles.

**Rule of thumb:** Use longer sampling time for high-impedance sources (potentiometers, thermistors). Short sampling time is fine for low-impedance signals.

## Conversion Modes

### Single Conversion
Converts one channel once, sets EOC flag, then stops. You must trigger each conversion manually.

### Continuous Conversion
After completing one conversion, the ADC immediately starts another. The DR register always has the latest value. Good for monitoring a signal continuously.

### Scan Mode
Converts **multiple channels in sequence** (a "group"), one after another. Often combined with DMA to store each channel's result in memory automatically. The [AN3116 application note](https://www.st.com/resource/en/application_note/an3116-stm32s-adc-modes-and-their-applications-stmicroelectronics.pdf) covers all conversion modes in detail.

| Mode | Use case |
|------|----------|
| Single | One-shot reading (e.g., battery voltage check) |
| Continuous | Real-time monitoring (e.g., analog joystick) |
| Scan + DMA | Multiple sensors read periodically |

## Key Registers (STM32F4)

| Register | Purpose |
|----------|---------|
| ADC_CR1 | Resolution, scan mode, interrupt enable |
| ADC_CR2 | ADON (enable), continuous mode, external trigger, alignment |
| ADC_SMPR1/2 | Sampling time for each channel |
| ADC_SQR1/2/3 | Sequence: which channels to convert and in what order |
| ADC_DR | Data register -- holds conversion result |
| ADC_SR | Status: EOC (end of conversion), STRT, OVR (overrun) |

### Important Bits

| Register | Bit | Purpose |
|----------|-----|---------|
| CR2 | ADON | Turn ADC on/off |
| CR2 | SWSTART | Start conversion (software trigger) |
| CR2 | CONT | 0 = single, 1 = continuous |
| CR2 | ALIGN | 0 = right-aligned (default), 1 = left-aligned |
| CR1 | SCAN | Enable scan mode |
| CR1 | RES | Resolution: 00=12-bit, 01=10-bit, 10=8-bit, 11=6-bit |
| SR | EOC | End of conversion flag |

## Example: Reading a Potentiometer on PA0

PA0 is ADC1 channel 0 on most STM32 chips. A potentiometer wiper connected to PA0 gives a voltage between 0V and 3.3V.

<!-- tabs -->
```c
// 1. Enable clocks
RCC->APB2ENR |= RCC_APB2ENR_ADC1EN;
RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;

// 2. Configure PA0 as analog mode
GPIOA->MODER |= (0x3 << (0 * 2));   // analog mode (11)

// 3. Configure ADC1
ADC1->CR1 = 0;                       // 12-bit resolution, no scan
ADC1->CR2 = 0;                       // single conversion, software trigger
ADC1->SMPR2 |= (0x3 << (0 * 3));    // 56 cycles sampling for channel 0
ADC1->SQR3 = 0;                      // channel 0 is first (and only) in sequence
ADC1->SQR1 &= ~(0xF << 20);         // sequence length = 1 conversion

// 4. Enable ADC
ADC1->CR2 |= ADC_CR2_ADON;

// 5. Read function
uint16_t read_adc(void) {
    ADC1->CR2 |= ADC_CR2_SWSTART;           // start conversion
    while (!(ADC1->SR & ADC_SR_EOC)) { }    // wait for completion
    return ADC1->DR;                          // read 12-bit result (0-4095)
}

// Convert to millivolts
uint32_t voltage_mv = (uint32_t)read_adc() * 3300 / 4095;
```

```rust
use core::ptr::{read_volatile, write_volatile};

// Register base addresses (STM32F4)
const RCC_BASE: u32 = 0x4002_3800;
const GPIOA_BASE: u32 = 0x4002_0000;
const ADC1_BASE: u32 = 0x4001_2000;

unsafe {
    // 1. Enable clocks
    let rcc_apb2enr = (RCC_BASE + 0x44) as *mut u32;
    let rcc_ahb1enr = (RCC_BASE + 0x30) as *mut u32;
    write_volatile(rcc_apb2enr, read_volatile(rcc_apb2enr) | (1 << 8));  // ADC1EN
    write_volatile(rcc_ahb1enr, read_volatile(rcc_ahb1enr) | (1 << 0));  // GPIOAEN

    // 2. Configure PA0 as analog mode
    let gpioa_moder = GPIOA_BASE as *mut u32;
    write_volatile(gpioa_moder, read_volatile(gpioa_moder) | (0x3 << (0 * 2)));

    // 3. Configure ADC1
    let adc1_cr1 = (ADC1_BASE + 0x04) as *mut u32;
    let adc1_cr2 = (ADC1_BASE + 0x08) as *mut u32;
    let adc1_smpr2 = (ADC1_BASE + 0x10) as *mut u32;
    let adc1_sqr3 = (ADC1_BASE + 0x34) as *mut u32;
    let adc1_sqr1 = (ADC1_BASE + 0x2C) as *mut u32;
    write_volatile(adc1_cr1, 0);
    write_volatile(adc1_cr2, 0);
    write_volatile(adc1_smpr2, read_volatile(adc1_smpr2) | (0x3 << (0 * 3)));
    write_volatile(adc1_sqr3, 0);
    write_volatile(adc1_sqr1, read_volatile(adc1_sqr1) & !(0xF << 20));

    // 4. Enable ADC
    write_volatile(adc1_cr2, read_volatile(adc1_cr2) | (1 << 0)); // ADON
}

// 5. Read function
unsafe fn read_adc() -> u16 {
    let adc1_cr2 = (ADC1_BASE + 0x08) as *mut u32;
    let adc1_sr = ADC1_BASE as *const u32;
    let adc1_dr = (ADC1_BASE + 0x4C) as *const u32;

    write_volatile(adc1_cr2, read_volatile(adc1_cr2) | (1 << 30)); // SWSTART
    while read_volatile(adc1_sr) & (1 << 1) == 0 {}                // wait EOC
    read_volatile(adc1_dr) as u16
}

// Convert to millivolts
let voltage_mv: u32 = unsafe { read_adc() } as u32 * 3300 / 4095;
```
<!-- /tabs -->

## Calibration and Accuracy

### Sources of Error
- **Offset error:** ADC reads non-zero when input is 0V
- **Gain error:** Full-scale reading is slightly off
- **INL/DNL:** Non-linearity -- some codes are wider/narrower than ideal
- **Noise:** Analog supply noise couples into conversions

### Improving Accuracy

1. **Use the internal calibration:** Many STM32 ADCs have a built-in calibration routine. Run it at startup before any conversions.

<!-- tabs -->
```c
// STM32F3/L4 calibration example
ADC1->CR &= ~ADC_CR_ADEN;        // ensure ADC is off
ADC1->CR |= ADC_CR_ADCAL;        // start calibration
while (ADC1->CR & ADC_CR_ADCAL); // wait for completion
```

```rust
use core::ptr::{read_volatile, write_volatile};

const ADC1_CR: *mut u32 = (0x4001_2000 + 0x08) as *mut u32;
const ADC_CR_ADEN: u32 = 1 << 0;
const ADC_CR_ADCAL: u32 = 1 << 31;

unsafe {
    // Ensure ADC is off
    write_volatile(ADC1_CR, read_volatile(ADC1_CR) & !ADC_CR_ADEN);
    // Start calibration
    write_volatile(ADC1_CR, read_volatile(ADC1_CR) | ADC_CR_ADCAL);
    // Wait for completion
    while read_volatile(ADC1_CR) & ADC_CR_ADCAL != 0 {}
}
```
<!-- /tabs -->

2. **Oversampling:** Read multiple times and average. Reading 16 times and dividing by 16 reduces noise by 4x (equivalent to gaining 2 extra bits).

3. **Stable reference:** Use a dedicated VREF+ pin with a low-noise voltage reference instead of VDDA.

4. **Decoupling:** Place 100nF + 1uF capacitors close to VDDA and VREF+ pins.

5. **Longer sampling time** for high-impedance sources.

## References

1. [STM32 ADC Tutorial + ADC Examples](https://deepbluembedded.com/stm32-adc-tutorial-complete-guide-with-examples/) — Complete guide to STM32 ADC with code examples
2. [Getting started with ADC - STM32 MCU Wiki](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_ADC) — Official ST wiki guide for ADC peripheral setup
3. [AN3116: STM32 ADC Modes and Their Applications](https://www.st.com/resource/en/application_note/an3116-stm32s-adc-modes-and-their-applications-stmicroelectronics.pdf) — ST application note on conversion modes and DMA usage

## Related Topics

- [GPIO Configuration](gpio-register-level.md) -- analog mode for ADC input pins
- [Timers](timers-and-counters.md) -- timers can trigger periodic ADC conversions
- [Interrupt System](interrupt-system/index.md) -- EOC interrupt for non-blocking ADC reads
