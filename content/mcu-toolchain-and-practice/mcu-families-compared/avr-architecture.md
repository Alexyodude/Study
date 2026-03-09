---
title: "AVR Architecture"
created: 2026-03-08
updated: 2026-03-08
tags: [avr, atmega, arduino, 8-bit, embedded]
status: draft
sources:
  - url: "https://web.mit.edu/6.111/volume2/www/f2018/handouts/ATmega328P.pdf"
    title: "ATmega328/P Datasheet Complete - Microchip/MIT"
  - url: "https://circuitdigest.com/microcontroller-projects/understanding-fuse-bits-in-atmega328p-to-enhance-arduino-programming-skills"
    title: "Understanding Fuse Bits in ATmega328P"
  - url: "https://www.arnabkumardas.com/arduino-tutorial/avr-architecture/"
    title: "AVR Architecture: Arduino / ATmega328P"
  - url: "https://en.wikipedia.org/wiki/Atmel_AVR_instruction_set"
    title: "Atmel AVR Instruction Set - Wikipedia"
---

AVR is an 8-bit microcontroller architecture designed by Atmel (now Microchip). It became massively popular through the Arduino platform, which uses the ATmega328P. Despite the rise of 32-bit ARM cores, AVR remains relevant for simple, low-cost applications where 8 bits is more than enough.

## Architecture Overview

AVR uses a [**modified Harvard architecture**](https://www.arnabkumardas.com/arduino-tutorial/avr-architecture/) with separate buses and address spaces for program memory (flash) and data memory (SRAM). This allows the CPU to fetch the next instruction while executing the current one.

```
+-------+     +--------+     +--------+
| Flash | --> | CPU    | <-> | SRAM   |
| (pgm) |     | (ALU,  |     | (data) |
|       |     |  regs) |     |        |
+-------+     +--------+     +--------+
   16-bit        8-bit          8-bit
  address       data bus       data bus
```

Key characteristics:
- **8-bit data path** -- ALU operates on 8-bit values
- **16-bit instructions** -- most instructions are 16 bits wide (some are 32 bits)
- **Single-cycle execution** -- most instructions execute in one clock cycle
- **RISC design** -- load/store architecture, fixed instruction width
- **In-system programmable** -- flash can be reprogrammed via ISP or bootloader

## Register File

AVR has **32 general-purpose 8-bit registers** (R0-R31), all directly connected to the ALU. This is unusually generous for an 8-bit architecture.

```
R0  - R15   General purpose (some restrictions)
R16 - R25   General purpose (full access to immediate instructions)
R26:R27     X register (16-bit pointer)
R28:R29     Y register (16-bit pointer)
R30:R31     Z register (16-bit pointer, also used for LPM)
```

The upper six registers can be combined into three 16-bit **pointer registers** (X, Y, Z) for indirect addressing, which is essential for accessing arrays and data structures with only an 8-bit ALU.

### Status Register (SREG)

```
Bit 7: I  - Global Interrupt Enable
Bit 6: T  - Bit Copy Storage
Bit 5: H  - Half Carry Flag
Bit 4: S  - Sign Flag
Bit 3: V  - Overflow Flag
Bit 2: N  - Negative Flag
Bit 1: Z  - Zero Flag
Bit 0: C  - Carry Flag
```

The `I` bit is particularly important -- it is the global interrupt enable/disable flag, equivalent to `CPSIE/CPSID` on ARM.

## Memory Architecture

### ATmega328P Memory Map (as reference)

| Memory | Size | Address Range | Purpose |
|--------|------|---------------|---------|
| Flash | 32 KB | 0x0000 - 0x3FFF (word) | Program storage |
| SRAM | 2 KB | 0x0100 - 0x08FF | Runtime data |
| EEPROM | 1 KB | Separate address space | Non-volatile data |
| I/O Registers | 64 | 0x0020 - 0x005F | Peripheral control |
| Extended I/O | 160 | 0x0060 - 0x00FF | Additional peripherals |

Note: addresses 0x0000-0x001F in data space map to registers R0-R31.

### Program Memory

Flash stores the program code and is organized in 16-bit words. The reset vector is at address 0x0000 (word address), and interrupt vectors follow in a fixed order.

```
0x0000  RESET vector
0x0001  INT0 (External Interrupt 0)
0x0002  INT1 (External Interrupt 1)
0x0003  PCINT0 (Pin Change Interrupt)
...
0x0019  SPM_READY
```

### Data Memory (SRAM)

SRAM holds variables, the stack, and the heap. On the ATmega328P, the stack starts at the top of SRAM (0x08FF) and grows downward, just like on ARM.

## I/O Ports and Pin Registers

AVR uses three registers per GPIO port:

| Register | Purpose | Example |
|----------|---------|---------|
| **DDRx** | Data Direction -- 0 = input, 1 = output | `DDRB \|= (1 << 5);` // PB5 output |
| **PORTx** | Output data (or pull-up enable for inputs) | `PORTB \|= (1 << 5);` // PB5 high |
| **PINx** | Input data (read pin state) | `if (PINB & (1 << 3))` // Read PB3 |

**Example: Blink LED on PB5 (Arduino pin 13)**:

<!-- tabs -->
```c
#include <avr/io.h>
#include <util/delay.h>

int main(void) {
    DDRB |= (1 << PB5);      // Set PB5 as output

    while (1) {
        PORTB ^= (1 << PB5); // Toggle PB5
        _delay_ms(500);
    }
}
```

```rust
// Rust AVR — using avr-hal crate (e.g., arduino-hal)
#![no_std]
#![no_main]

use arduino_hal::prelude::*;

#[arduino_hal::entry]
fn main() -> ! {
    let dp = arduino_hal::Peripherals::take().unwrap();
    let pins = arduino_hal::pins!(dp);

    // Set PB5 (Arduino pin 13) as output
    let mut led = pins.d13.into_output();

    loop {
        led.toggle();
        arduino_hal::delay_ms(500);
    }
}
```

```cpp
// C++ with avr-g++ — uses the same registers but with type-safe wrappers
#include <avr/io.h>
#include <util/delay.h>

// Minimal type-safe GPIO wrapper
template <volatile uint8_t &Port, volatile uint8_t &DDR, uint8_t Pin>
struct OutputPin {
    static void init()   { DDR |= (1 << Pin); }
    static void toggle() { Port ^= (1 << Pin); }
};

using Led = OutputPin<PORTB, DDRB, PB5>;

int main() {
    Led::init();
    while (true) {
        Led::toggle();
        _delay_ms(500);
    }
}
```
<!-- /tabs -->

This is the "bare metal" equivalent of the Arduino `digitalWrite()` call, but executes in 2 clock cycles instead of ~50.

## Fuse Bits

Fuse bits are special non-volatile configuration bits that control fundamental MCU behavior. They are **not** part of the flash program -- they are programmed separately through the ISP interface.

### ATmega328P Fuse Bytes

**Low Fuse Byte** (clock configuration):
- **CKSEL[3:0]** -- clock source selection (internal RC, external crystal, external clock)
- **SUT[1:0]** -- startup time
- **CKOUT** -- output clock on pin
- **CKDIV8** -- divide clock by 8 (enabled by default on new chips!)

**High Fuse Byte** (boot/reset):
- **BOOTRST** -- reset vector location (application or bootloader)
- **BOOTSZ[1:0]** -- bootloader section size
- **EESAVE** -- preserve EEPROM on chip erase
- **WDTON** -- watchdog always on
- **SPIEN** -- SPI programming enable (do not disable this!)

**Extended Fuse Byte**:
- **BODLEVEL[2:0]** -- brown-out detection level

### Common Fuse Pitfall

[Fuse bits are active-low](https://circuitdigest.com/microcontroller-projects/understanding-fuse-bits-in-atmega328p-to-enhance-arduino-programming-skills) (0 = enabled, 1 = disabled). A new ATmega328P ships with `CKDIV8 = 0` (enabled), meaning it runs at 1 MHz (8 MHz / 8) instead of the expected 8 MHz. Many beginners are confused by this.

```bash
# Read fuses with avrdude
avrdude -c usbasp -p m328p -U lfuse:r:-:h

# Set fuses for 8 MHz internal RC, no divide
avrdude -c usbasp -p m328p -U lfuse:w:0xE2:m
```

**Warning**: Incorrect fuse settings can brick the chip (e.g., selecting a clock source that does not exist). Always use a fuse calculator before programming.

## AVR Toolchain

```bash
# Compile
avr-gcc -mmcu=atmega328p -Os -o main.elf main.c

# Convert to Intel HEX
avr-objcopy -O ihex main.elf main.hex

# Flash via ISP programmer
avrdude -c usbasp -p m328p -U flash:w:main.hex
```

The `-mmcu=` flag is critical -- it tells the compiler which chip to target, affecting register definitions, memory sizes, and instruction availability.

## AVR vs ARM: When 8-Bit Still Makes Sense

| Factor | AVR (ATmega) | ARM (Cortex-M0) |
|--------|-------------|-----------------|
| Bit width | 8-bit | 32-bit |
| Clock speed | 1-20 MHz | 24-64 MHz |
| Flash | 2-256 KB | 16-256 KB |
| SRAM | 128 B - 16 KB | 2-32 KB |
| Price (1K qty) | $0.50-3.00 | $0.50-2.00 |
| Power (active) | ~0.3 mA/MHz | ~0.1-0.3 mA/MHz |
| Ecosystem | Mature, huge Arduino community | Growing, professional tools |
| Debugging | Limited (debugWIRE, JTAG on larger chips) | SWD on all chips |

**AVR still makes sense when**:
- You have an existing AVR codebase or product
- The application is truly simple (a few GPIO, a timer, maybe UART)
- You need specific AVR peripherals (e.g., the precise timer control on ATtiny)
- Arduino compatibility is a hard requirement

**ARM is better when**:
- You need 32-bit math, DMA, or DSP
- You want proper debug support (SWD, breakpoints)
- You are starting a new design with no legacy constraints
- Price-competitive at the same capability level

## References

1. [ATmega328/P Datasheet Complete - Microchip/MIT](https://web.mit.edu/6.111/volume2/www/f2018/handouts/ATmega328P.pdf) — Full ATmega328P datasheet with register descriptions
2. [Understanding Fuse Bits in ATmega328P](https://circuitdigest.com/microcontroller-projects/understanding-fuse-bits-in-atmega328p-to-enhance-arduino-programming-skills) — Guide to AVR fuse bit configuration
3. [AVR Architecture: Arduino / ATmega328P](https://www.arnabkumardas.com/arduino-tutorial/avr-architecture/) — Walkthrough of AVR architecture fundamentals
4. [Atmel AVR Instruction Set - Wikipedia](https://en.wikipedia.org/wiki/Atmel_AVR_instruction_set) — Reference for the AVR instruction set

## Related Topics

- [ARM Cortex-M](arm-cortex-m.md) -- the 32-bit alternative
- [RISC-V Microcontrollers](risc-v-microcontrollers.md) -- another competitor
- [Choosing an MCU](choosing-an-mcu.md) -- decision framework
