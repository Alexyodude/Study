---
title: "EEPROM and Non-Volatile Memory"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, eeprom, nvm, flash-emulation, wear-leveling]
status: draft
sources:
  - url: "https://en.wikipedia.org/wiki/EEPROM"
    title: "EEPROM - Wikipedia"
  - url: "https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/"
    title: "Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts"
  - url: "https://www.st.com/resource/en/application_note/an4894-eeprom-emulation-techniques-and-software-for-stm32-microcontrollers-stmicroelectronics.pdf"
    title: "ST AN4894: EEPROM Emulation for STM32"
---

## What EEPROM Is

**EEPROM (Electrically Erasable Programmable Read-Only Memory)** is a type of non-volatile memory that can be erased and reprogrammed **byte by byte**. Unlike flash, which requires erasing an entire sector/page before rewriting, EEPROM allows you to update a single byte without affecting its neighbors.

## EEPROM vs Flash

| Feature | EEPROM | Flash (NOR) |
|---|---|---|
| Erase granularity | Single byte | Sector/page (1 KB -- 128 KB) |
| Write speed | Slow (~5 ms per byte) | Moderate (~16 us per word) |
| Endurance | ~1,000,000 cycles | ~10,000--100,000 cycles |
| Density | Small (256 B -- 16 KB) | Large (16 KB -- 2 MB) |
| Cost per bit | Higher | Lower |
| Use case | Config data, counters | Code storage |

The key advantage of EEPROM is **byte-level writes** and **higher endurance**. The trade-off is slower writes and much smaller capacity.

## Common Use Cases

### Configuration Storage

Settings that change occasionally but must survive power cycles:

<!-- tabs -->
```c
// Example: storing user-configurable parameters
typedef struct {
    uint8_t  brightness;     // 0-255
    uint16_t motor_speed;    // RPM target
    float    pid_kp;         // PID proportional gain
    uint32_t checksum;       // Integrity check
} Config;
```

```rust
// Example: storing user-configurable parameters
#[repr(C)]
struct Config {
    brightness: u8,          // 0-255
    motor_speed: u16,        // RPM target
    pid_kp: f32,             // PID proportional gain
    checksum: u32,           // Integrity check
}
```

```cpp
// C++ version with default values and auto-checksum
#include <cstdint>

struct Config {
    uint8_t  brightness  = 128;
    uint16_t motor_speed = 1000;
    float    pid_kp      = 1.0f;
    uint32_t checksum    = 0;

    constexpr uint32_t compute_checksum() const {
        return brightness ^ motor_speed ^ *reinterpret_cast<const uint32_t*>(&pid_kp);
    }

    bool is_valid() const { return checksum == compute_checksum(); }
};
```
<!-- /tabs -->

### Calibration Data

Factory-set values determined during manufacturing:

- ADC offset and gain corrections
- Sensor scaling coefficients
- Temperature compensation tables

### Usage Counters and Logs

- Operating hours counter
- Error event log
- Boot count

### Last-Known-Good State

- Motor position before power loss
- Communication parameters (baud rate, device address)
- User preferences

## How EEPROM Works

[EEPROM](https://en.wikipedia.org/wiki/EEPROM) uses floating-gate transistors similar to flash, but with a thinner oxide layer that allows single-byte erase/program operations through **Fowler-Nordheim tunneling**.

```
  Write sequence for one byte:
  1. Apply high voltage to erase the target byte (bits -> 1)
  2. Program desired bits to 0
  3. Verify written data
  Total time: ~3-5 ms per byte
```

Because of the slow write speed, EEPROM is unsuitable for storing data that changes rapidly.

## MCUs With Built-In EEPROM

Some MCU families include dedicated EEPROM:

| MCU | EEPROM Size | Notes |
|---|---|---|
| ATmega328P (AVR) | 1 KB | Direct byte read/write |
| STM32L0/L1 series | 2--16 KB | Memory-mapped, accessible via load/store |
| PIC18F series | 256 B -- 1 KB | Register-based access |
| MSP430 | 256 B | Info segments |

On STM32L0, EEPROM is memory-mapped starting at `0x0808_0000` and can be read like regular memory. Writing requires unlocking the data EEPROM and waiting for completion.

<!-- tabs -->
```c
// STM32L0 EEPROM write (simplified)
HAL_FLASHEx_DATAEEPROM_Unlock();
HAL_FLASHEx_DATAEEPROM_Program(FLASH_TYPEPROGRAMDATA_BYTE, 0x08080000, 0x42);
HAL_FLASHEx_DATAEEPROM_Lock();
```

```rust
// Using raw register access for STM32L0 data EEPROM
const EEPROM_BASE: u32 = 0x0808_0000;

unsafe {
    // Unlock data EEPROM (write magic keys to FLASH_PEKEYR)
    let flash = &*pac::FLASH::ptr();
    flash.pekeyr.write(|w| w.bits(0x89AB_CDEF));
    flash.pekeyr.write(|w| w.bits(0x0203_0405));

    // Write byte
    core::ptr::write_volatile(EEPROM_BASE as *mut u8, 0x42);

    // Wait for completion
    while flash.sr.read().bsy().bit_is_set() {}

    // Lock data EEPROM
    flash.pecr.modify(|_, w| w.pelock().set_bit());
}
```
<!-- /tabs -->

## Emulated EEPROM in Flash

Many popular MCUs (STM32F1, F4, F7, H7) do **not** have dedicated EEPROM hardware. Instead, you emulate EEPROM behavior using regular flash memory. ST provides [application notes (AN2594, AN4894)](https://www.st.com/resource/en/application_note/an4894-eeprom-emulation-techniques-and-software-for-stm32-microcontrollers-stmicroelectronics.pdf) describing this technique.

### How Flash EEPROM Emulation Works

The basic idea: use two flash sectors (or pages) and alternate between them.

```
  Sector A (Active)           Sector B (Receiving)
  +-------------------+      +-------------------+
  | Tag=0x01 Val=0x42 |      | (erased: 0xFFFF)  |
  | Tag=0x02 Val=0x10 |      |                   |
  | Tag=0x01 Val=0x55 |  <-- latest value for     |
  | (free space)      |      tag 0x01 is 0x55     |
  +-------------------+      +-------------------+
```

1. Each "variable" gets a **tag** (virtual address)
2. New values are appended sequentially (old values are not erased)
3. To read, scan backward to find the latest entry for a given tag
4. When the active sector fills up, **compact**: copy only the latest value for each tag to the other sector, then erase the full sector
5. Swap roles: the receiving sector becomes active

### Advantages of Emulation

- Works on any MCU with flash (no dedicated EEPROM hardware needed)
- Spreads writes across the sector, extending lifetime
- Atomic updates -- a power failure during write leaves the old value intact

### Disadvantages

- Uses two flash sectors (e.g., 2 x 16 KB for just a few bytes of data)
- More complex software
- Slower than real EEPROM for reads (must scan entries)

## Wear Leveling Basics

Both EEPROM and flash have limited write endurance. **Wear leveling** distributes writes evenly to prevent any single cell from wearing out prematurely.

### Simple Wear Leveling Strategies

**Round-robin writes:** Instead of always writing to the same address, cycle through multiple locations:

<!-- tabs -->
```c
// Writing a counter that updates every second
// Instead of always writing to address 0, use a rotating index:
uint32_t write_index = find_next_free_slot();
write_to_slot(write_index, counter_value);
// Each slot is used once before cycling back
```

```rust
// Writing a counter that updates every second
// Instead of always writing to address 0, use a rotating index:
let write_index = find_next_free_slot();
write_to_slot(write_index, counter_value);
// Each slot is used once before cycling back
```
<!-- /tabs -->

**Effective endurance calculation:**

```
  Base endurance: 10,000 cycles per sector
  Sector size: 16 KB
  Data size: 4 bytes (one uint32_t)
  Entries per sector: 16384 / 8 = 2048 (4 bytes data + 4 bytes tag)
  Two sectors: 2 x 2048 = 4096 writes before a sector erase
  Effective endurance: 4096 x 10,000 = 40,960,000 writes
```

## External EEPROM

For applications needing more NVM than on-chip options provide, external EEPROM ICs are common:

| Part | Interface | Capacity | Endurance |
|---|---|---|---|
| AT24C256 | I2C | 32 KB | 1,000,000 cycles |
| 25LC512 | SPI | 64 KB | 1,000,000 cycles |
| CAT24M01 | I2C | 128 KB | 1,000,000 cycles |

External EEPROM communicates over I2C or SPI, making it slower but offering larger and more durable storage.

## References

1. [EEPROM - Wikipedia](https://en.wikipedia.org/wiki/EEPROM) — How EEPROM technology works and its characteristics
2. [Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) — STM32 memory organization and non-volatile storage
3. [ST AN4894: EEPROM Emulation for STM32](https://www.st.com/resource/en/application_note/an4894-eeprom-emulation-techniques-and-software-for-stm32-microcontrollers-stmicroelectronics.pdf) — Official ST guide for flash-based EEPROM emulation techniques

## Related Topics

- [Flash Memory](flash-memory.md) -- the primary non-volatile memory, also used for EEPROM emulation
- [SRAM](sram.md) -- volatile runtime memory
- [Memory-Mapped I/O](memory-mapped-io.md) -- how EEPROM registers are accessed on some MCUs
