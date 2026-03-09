---
title: "Flash Memory"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, flash, nor-flash, memory, xip, wait-states]
status: draft
sources:
  - url: "https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/"
    title: "Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
  - url: "https://blog.thea.codes/the-most-thoroughly-commented-linker-script/"
    title: "The Most Thoroughly Commented Linker Script"
---

## What Flash Memory Does in an MCU

Flash is the **non-volatile** memory where your compiled program lives. When you power off the MCU and power it back on, the code is still there. On [STM32 devices](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/), on-chip flash starts at address `0x0800_0000`.

MCUs use **NOR flash** (not NAND flash like an SSD or SD card). The key difference: NOR flash supports **random access reads**, meaning the CPU can fetch any instruction directly by its address -- just like reading from RAM.

## How NOR Flash Works

NOR flash stores bits using floating-gate transistors. Each cell can be read individually by applying the correct address, making it suitable for code execution.

### Read: Fast and Random-Access

Reading flash is straightforward -- supply an address, get the data. This is why code runs directly from flash (see XIP below). However, flash reads are slower than SRAM, which introduces **wait states** at higher clock speeds.

### Write (Program): One Direction Only

Programming flash means changing bits from **1 to 0**. You cannot change a 0 back to 1 without erasing. Programming happens at a **word** or **half-word** granularity (2--4 bytes at a time on STM32).

### Erase: The Prerequisite for Rewriting

To set bits back to 1, you must **erase** an entire sector or page. Erasing sets all bits in the block to 1. Only then can you program new values.

```
  Erased state:  0xFFFF_FFFF  (all 1s)
  Program:       0xFFFF_FFFF -> 0x0800_1234  (some bits set to 0)
  Can't do:      0x0800_1234 -> 0xFFFF_FFFF  (need erase first)
```

This "erase before program" constraint is why firmware updates take time and why flash has limited write endurance (typically 10,000--100,000 erase cycles).

## Sector and Page Structure

Flash is organized into erasable units. The naming varies by vendor:

| MCU Family | Erase Unit | Typical Size |
|---|---|---|
| STM32F1 | Page | 1 KB or 2 KB |
| STM32F4 | Sector | 16 KB, 64 KB, or 128 KB |
| STM32L4 | Page | 2 KB |

**STM32F4 example** (1 MB flash):

```
  Sector 0:   0x0800_0000 -- 0x0800_3FFF   (16 KB)
  Sector 1:   0x0800_4000 -- 0x0800_7FFF   (16 KB)
  Sector 2:   0x0800_8000 -- 0x0800_BFFF   (16 KB)
  Sector 3:   0x0800_C000 -- 0x0800_FFFF   (16 KB)
  Sector 4:   0x0801_0000 -- 0x0801_FFFF   (64 KB)
  Sector 5-11: 0x0802_0000 -- 0x080F_FFFF  (128 KB each)
```

To update a single byte in Sector 5, you must erase all 128 KB of that sector first.

## Wait States

Flash memory is slower than the CPU core. At low clock speeds (e.g., 8 MHz), flash can keep up and requires **0 wait states**. At higher speeds, the CPU must wait for flash to respond.

| SYSCLK Speed | Wait States (STM32F4, 3.3V) |
|---|---|
| 0--30 MHz | 0 WS |
| 30--60 MHz | 1 WS |
| 60--90 MHz | 2 WS |
| 90--120 MHz | 3 WS |
| 120--150 MHz | 4 WS |
| 150--168 MHz | 5 WS |

Wait states are configured in the `FLASH_ACR` (Flash Access Control Register):

<!-- tabs -->
```c
// Set 5 wait states for 168 MHz operation
FLASH->ACR = FLASH_ACR_LATENCY_5WS   // 5 wait states
           | FLASH_ACR_PRFTEN         // Enable prefetch buffer
           | FLASH_ACR_ICEN           // Enable instruction cache
           | FLASH_ACR_DCEN;          // Enable data cache
```

```rust
// Using PAC
let flash = unsafe { &*pac::FLASH::ptr() };
flash.acr.write(|w| {
    w.latency().bits(5)    // 5 wait states for 168 MHz
     .prften().set_bit()   // Enable prefetch buffer
     .icen().set_bit()     // Enable instruction cache
     .dcen().set_bit()     // Enable data cache
});

// With stm32f4xx-hal, wait states are set automatically by .freeze()
```
<!-- /tabs -->

The **prefetch buffer** and **instruction cache** (ART Accelerator on STM32F4) help hide wait state penalties by fetching ahead.

## Execute in Place (XIP)

Unlike desktop computers that copy programs from disk into RAM before running them, MCUs execute code **directly from flash**. This is called **Execute in Place (XIP)**.

This works because NOR flash supports random-access reads. The CPU's program counter points into the flash address range (`0x0800_xxxx`), and the bus matrix fetches instructions from flash on every cycle.

**Advantage:** No need to copy the entire program into scarce SRAM.
**Disadvantage:** Flash reads are slower than SRAM, especially at high clock speeds.

For performance-critical code, you can [copy functions to SRAM](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/) and execute from there:

<!-- tabs -->
```c
// GCC attribute to place a function in RAM
__attribute__((section(".ramfunc")))
void fast_function(void) {
    // This runs from SRAM -- no flash wait states
}
```

```rust
// Place a function in RAM using linker section attribute
#[link_section = ".ramfunc"]
fn fast_function() {
    // This runs from SRAM -- no flash wait states
}

// The corresponding memory.x linker script must define
// a .ramfunc section in RAM with load address in FLASH.
```
<!-- /tabs -->

## Flash Programming in Practice

To write to flash at runtime (e.g., storing calibration data), you typically:

1. Unlock the flash controller (write magic keys to `FLASH_KEYR`)
2. Erase the target sector
3. Program new data word by word
4. Lock the flash controller again

<!-- tabs -->
```c
// STM32F4 flash programming (simplified)
HAL_FLASH_Unlock();
FLASH_Erase_Sector(FLASH_SECTOR_11, VOLTAGE_RANGE_3);
HAL_FLASH_Program(FLASH_TYPEPROGRAM_WORD, 0x080E0000, 0xDEADBEEF);
HAL_FLASH_Lock();
```

```rust
// Using stm32f4xx-hal flash API
use stm32f4xx_hal::flash::{FlashExt, LockedFlash, UnlockedFlash};

let flash = dp.FLASH;
let mut locked = LockedFlash::new(flash);
let mut unlocked = locked.unlocked();

// Erase sector 11
unlocked.erase(11).unwrap();

// Program a word at address 0x080E_0000
let data: [u8; 4] = 0xDEAD_BEEFu32.to_le_bytes();
unlocked.program(0x080E_0000 - 0x0800_0000, &data).unwrap();

// Flash is re-locked when `unlocked` is dropped
drop(unlocked);
```
<!-- /tabs -->

Flash writes are slow (microseconds per word) and interrupts should typically be disabled during programming to avoid conflicts.

## References

1. [Bare-Metal STM32: Memory-Mapped I/O And Linker Scripts](https://hackaday.com/2020/12/23/bare-metal-stm32-exploring-memory-mapped-i-o-and-linker-scripts/) — STM32 flash organization, addressing, and peripheral access
2. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — General reference for Cortex-M flash and XIP execution
3. [The Most Thoroughly Commented Linker Script](https://blog.thea.codes/the-most-thoroughly-commented-linker-script/) — Placing code sections in flash via linker scripts

## Related Topics

- [SRAM](sram.md) -- faster volatile memory for runtime data
- [EEPROM and NVM](eeprom-and-nvm.md) -- byte-level non-volatile alternatives
- [Memory Layout and Linker Scripts](memory-layout-and-linker-scripts.md) -- how .text is placed in flash
- [Clock Cycles and Timing](../instruction-execution/clock-cycles-and-timing.md) -- wait state impact on performance
