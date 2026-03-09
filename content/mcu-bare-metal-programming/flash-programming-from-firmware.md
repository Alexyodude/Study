---
title: "Flash Programming from Firmware"
created: 2026-03-08
updated: 2026-03-08
tags: [flash, self-programming, registers, erase, write, FLASH_CR, bare-metal]
status: draft
sources:
  - url: "https://blog.embeddedexpert.io/?p=1716"
    title: "Writing to Internal Flash of STM32Fxxx - EmbeddedExpertIO"
  - url: "https://nebkelectronics.wordpress.com/2016/10/15/writing-to-stm32-flash/"
    title: "Writing to STM32 Flash - Nebk Electronics"
  - url: "https://www.eevblog.com/forum/microcontrollers/programming-flash-memory-stm32-bare-metal/"
    title: "Programming Flash Memory STM32 Bare Metal - EEVblog Forum"
  - url: "https://embeddive.wordpress.com/2018/04/14/arm-cortex-architecture-flash-memory-controller/"
    title: "ARM Cortex Architecture: Flash Memory Controller"
  - url: "https://controllerstech.com/flash-programming-in-stm32/"
    title: "STM32 Flash Programming Guide"
---

Sometimes your running firmware needs to write to its own flash memory — to store configuration, implement a bootloader, or update calibration data. This is called **self-programming**. It requires direct control of the flash memory controller registers.

## Why Flash is Different from SRAM

You cannot write to flash the same way you write to SRAM. A simple `*(uint32_t*)0x08010000 = 42;` will trigger a **HardFault**.

Flash memory has fundamental physical constraints:

- **Reads** work like SRAM — just dereference the address
- **Writes** require the flash controller to apply high voltage (~12V internally) to program cells
- **Erasing** must happen before writing — you can only change bits from 1→0, never 0→1
- **Erase granularity** is large — you erase entire sectors or pages, not individual bytes

This is why the [Flash Memory Controller](../mcu-architecture/memory-architecture/flash-memory.md) exists — it mediates between the CPU and the flash array.

## Flash Controller Registers (STM32F4)

The flash interface lives at base address `0x40023C00` on STM32F4:

| Register | Offset | Purpose |
|----------|--------|---------|
| FLASH_ACR | 0x00 | Access control (wait states, prefetch) |
| FLASH_KEYR | 0x04 | Key register (unlock sequence) |
| FLASH_OPTKEYR | 0x08 | Option key register |
| FLASH_SR | 0x0C | Status register (busy, errors) |
| FLASH_CR | 0x10 | Control register (erase, program, lock) |

### FLASH_CR — Control Register Bits

| Bit | Name | Description |
|-----|------|-------------|
| 0 | PG | Programming enable — set before writing |
| 1 | SER | Sector erase — set before erasing a sector |
| 2 | MER | Mass erase — erases entire flash |
| 3:6 | SNB | Sector number to erase (0-11) |
| 8:9 | PSIZE | Program parallelism (00=8-bit, 01=16-bit, 10=32-bit, 11=64-bit) |
| 16 | STRT | Start erase operation |
| 31 | LOCK | Write-protect the flash controller |

### FLASH_SR — Status Register Bits

| Bit | Name | Description |
|-----|------|-------------|
| 0 | EOP | End of operation |
| 4 | WRPERR | Write protection error |
| 5 | PGAERR | Programming alignment error |
| 6 | PGPERR | Programming parallelism error |
| 7 | PGSERR | Programming sequence error |
| 16 | BSY | Busy — flash operation in progress |

## Step 1: Unlock the Flash

The flash controller is **locked by default** to prevent accidental writes. [Unlocking requires writing two magic keys](https://blog.embeddedexpert.io/?p=1716) to FLASH_KEYR in sequence:

<!-- tabs -->
```c
#define FLASH_KEY1  0x45670123U
#define FLASH_KEY2  0xCDEF89ABU

void flash_unlock(void) {
    if (FLASH->CR & FLASH_CR_LOCK) {
        FLASH->KEYR = FLASH_KEY1;
        FLASH->KEYR = FLASH_KEY2;
    }
}

void flash_lock(void) {
    FLASH->CR |= FLASH_CR_LOCK;
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const FLASH_BASE: u32 = 0x4002_3C00;
const FLASH_KEYR: *mut u32 = (FLASH_BASE + 0x04) as *mut u32;
const FLASH_CR: *mut u32 = (FLASH_BASE + 0x10) as *mut u32;

const FLASH_KEY1: u32 = 0x4567_0123;
const FLASH_KEY2: u32 = 0xCDEF_89AB;
const FLASH_CR_LOCK: u32 = 1 << 31;

unsafe fn flash_unlock() {
    if read_volatile(FLASH_CR) & FLASH_CR_LOCK != 0 {
        write_volatile(FLASH_KEYR, FLASH_KEY1);
        write_volatile(FLASH_KEYR, FLASH_KEY2);
    }
}

unsafe fn flash_lock() {
    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr | FLASH_CR_LOCK);
}
```
<!-- /tabs -->

**Always lock the flash when done.** Leaving it unlocked means a bug could corrupt your firmware.

## Step 2: Erase Before Writing

You **must** erase a sector before writing to it. Erasing sets all bits to 1 (0xFF bytes). Then programming changes selected bits to 0.

### Sector Erase (STM32F4)

STM32F4 flash is divided into sectors of varying sizes:

| Sector | Address Range | Size |
|--------|--------------|------|
| 0 | 0x08000000 - 0x08003FFF | 16 KB |
| 1 | 0x08004000 - 0x08007FFF | 16 KB |
| 2 | 0x08008000 - 0x0800BFFF | 16 KB |
| 3 | 0x0800C000 - 0x0800FFFF | 16 KB |
| 4 | 0x08010000 - 0x0801FFFF | 64 KB |
| 5 | 0x08020000 - 0x0803FFFF | 128 KB |
| 6 | 0x08040000 - 0x0805FFFF | 128 KB |
| 7 | 0x08060000 - 0x0807FFFF | 128 KB |

**Warning**: erasing sector 0 destroys your vector table and firmware entry point. Never erase sectors containing your running code.

<!-- tabs -->
```c
void flash_erase_sector(uint8_t sector) {
    // Wait for any ongoing operation
    while (FLASH->SR & FLASH_SR_BSY);

    // Clear previous error flags
    FLASH->SR = FLASH_SR_EOP | FLASH_SR_WRPERR |
                FLASH_SR_PGAERR | FLASH_SR_PGPERR | FLASH_SR_PGSERR;

    // Configure: sector erase, select sector number, 32-bit parallelism
    FLASH->CR &= ~(FLASH_CR_SNB_Msk);              // clear sector bits
    FLASH->CR |= FLASH_CR_SER                       // sector erase mode
              |  (sector << FLASH_CR_SNB_Pos)       // sector number
              |  FLASH_CR_PSIZE_1;                   // 32-bit parallelism

    // Start the erase
    FLASH->CR |= FLASH_CR_STRT;

    // Wait for completion
    while (FLASH->SR & FLASH_SR_BSY);

    // Clear the SER bit
    FLASH->CR &= ~FLASH_CR_SER;
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const FLASH_SR: *mut u32 = (0x4002_3C00 + 0x0C) as *mut u32;
const FLASH_CR: *mut u32 = (0x4002_3C00 + 0x10) as *mut u32;

const FLASH_SR_BSY: u32 = 1 << 16;
const FLASH_CR_SER: u32 = 1 << 1;
const FLASH_CR_SNB_POS: u32 = 3;
const FLASH_CR_SNB_MSK: u32 = 0xF << FLASH_CR_SNB_POS;
const FLASH_CR_PSIZE_1: u32 = 1 << 9; // 32-bit parallelism
const FLASH_CR_STRT: u32 = 1 << 16;

unsafe fn flash_erase_sector(sector: u8) {
    // Wait for any ongoing operation
    while read_volatile(FLASH_SR) & FLASH_SR_BSY != 0 {}

    // Clear previous error flags (write-1-to-clear)
    write_volatile(FLASH_SR, 0x0000_00F1);

    // Configure: sector erase, select sector number, 32-bit parallelism
    let mut cr = read_volatile(FLASH_CR);
    cr &= !FLASH_CR_SNB_MSK;
    cr |= FLASH_CR_SER
        | ((sector as u32) << FLASH_CR_SNB_POS)
        | FLASH_CR_PSIZE_1;
    write_volatile(FLASH_CR, cr);

    // Start the erase
    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr | FLASH_CR_STRT);

    // Wait for completion
    while read_volatile(FLASH_SR) & FLASH_SR_BSY != 0 {}

    // Clear the SER bit
    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr & !FLASH_CR_SER);
}
```
<!-- /tabs -->

### Page Erase (STM32F0/F1/L0)

Smaller MCUs use uniform page-based flash (typically 1 KB or 2 KB pages):

<!-- tabs -->
```c
void flash_erase_page(uint32_t page_address) {
    while (FLASH->SR & FLASH_SR_BSY);

    FLASH->CR |= FLASH_CR_PER;           // page erase mode
    FLASH->AR = page_address;             // page address
    FLASH->CR |= FLASH_CR_STRT;          // start erase

    while (FLASH->SR & FLASH_SR_BSY);

    FLASH->CR &= ~FLASH_CR_PER;
}
```

```rust
unsafe fn flash_erase_page(page_address: u32) {
    use core::ptr::{read_volatile, write_volatile};

    const FLASH_SR: *mut u32 = (0x4002_2000 + 0x0C) as *mut u32;
    const FLASH_CR: *mut u32 = (0x4002_2000 + 0x10) as *mut u32;
    const FLASH_AR: *mut u32 = (0x4002_2000 + 0x14) as *mut u32;
    const FLASH_SR_BSY: u32 = 1 << 0;
    const FLASH_CR_PER: u32 = 1 << 1;
    const FLASH_CR_STRT: u32 = 1 << 6;

    while read_volatile(FLASH_SR) & FLASH_SR_BSY != 0 {}

    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr | FLASH_CR_PER);      // page erase mode
    write_volatile(FLASH_AR, page_address);             // page address
    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr | FLASH_CR_STRT);      // start erase

    while read_volatile(FLASH_SR) & FLASH_SR_BSY != 0 {}

    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr & !FLASH_CR_PER);
}
```
<!-- /tabs -->

## Step 3: Write Data to Flash

After erasing, you can program the flash. The [write procedure](https://blog.embeddedexpert.io/?p=1716) involves setting the PG (programming) bit, writing to the target address, and waiting for completion.

### 32-bit Write (STM32F4)

<!-- tabs -->
```c
void flash_write_word(uint32_t address, uint32_t data) {
    // Wait for any ongoing operation
    while (FLASH->SR & FLASH_SR_BSY);

    // Set 32-bit parallelism and enable programming
    FLASH->CR &= ~(FLASH_CR_PSIZE_Msk);
    FLASH->CR |= FLASH_CR_PSIZE_1       // PSIZE = 10 → 32-bit
              |  FLASH_CR_PG;            // programming mode

    // Write the word — this triggers the flash controller
    *(volatile uint32_t*)address = data;

    // Wait for completion
    while (FLASH->SR & FLASH_SR_BSY);

    // Check for errors
    if (FLASH->SR & (FLASH_SR_WRPERR | FLASH_SR_PGAERR |
                     FLASH_SR_PGPERR | FLASH_SR_PGSERR)) {
        // Handle error — clear flags
        FLASH->SR = FLASH->SR;  // write 1 to clear
    }

    // Disable programming mode
    FLASH->CR &= ~FLASH_CR_PG;
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const FLASH_SR: *mut u32 = (0x4002_3C00 + 0x0C) as *mut u32;
const FLASH_CR: *mut u32 = (0x4002_3C00 + 0x10) as *mut u32;
const FLASH_SR_BSY: u32 = 1 << 16;
const FLASH_CR_PG: u32 = 1 << 0;
const FLASH_CR_PSIZE_MSK: u32 = 0x3 << 8;
const FLASH_CR_PSIZE_1: u32 = 1 << 9;
const FLASH_SR_ERR_MASK: u32 = 0xF0; // WRPERR | PGAERR | PGPERR | PGSERR

unsafe fn flash_write_word(address: u32, data: u32) {
    // Wait for any ongoing operation
    while read_volatile(FLASH_SR) & FLASH_SR_BSY != 0 {}

    // Set 32-bit parallelism and enable programming
    let mut cr = read_volatile(FLASH_CR);
    cr &= !FLASH_CR_PSIZE_MSK;
    cr |= FLASH_CR_PSIZE_1 | FLASH_CR_PG;
    write_volatile(FLASH_CR, cr);

    // Write the word — this triggers the flash controller
    write_volatile(address as *mut u32, data);

    // Wait for completion
    while read_volatile(FLASH_SR) & FLASH_SR_BSY != 0 {}

    // Check for errors
    let sr = read_volatile(FLASH_SR);
    if sr & FLASH_SR_ERR_MASK != 0 {
        // Clear error flags (write-1-to-clear)
        write_volatile(FLASH_SR, sr);
    }

    // Disable programming mode
    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr & !FLASH_CR_PG);
}
```
<!-- /tabs -->

### 16-bit Write (STM32F0/F1)

On F0/F1 series, flash [must be written as half-words (16-bit)](https://www.eevblog.com/forum/microcontrollers/programming-flash-memory-stm32-bare-metal/). Writing a 32-bit value causes a HardFault:

<!-- tabs -->
```c
void flash_write_halfword(uint32_t address, uint16_t data) {
    while (FLASH->SR & FLASH_SR_BSY);

    FLASH->CR |= FLASH_CR_PG;

    // MUST use 16-bit pointer — 32-bit write causes HardFault!
    *(volatile uint16_t*)address = data;

    while (FLASH->SR & FLASH_SR_BSY);

    FLASH->CR &= ~FLASH_CR_PG;
}
```

```rust
unsafe fn flash_write_halfword(address: u32, data: u16) {
    use core::ptr::{read_volatile, write_volatile};

    const FLASH_SR: *mut u32 = (0x4002_2000 + 0x0C) as *mut u32;
    const FLASH_CR: *mut u32 = (0x4002_2000 + 0x10) as *mut u32;
    const FLASH_SR_BSY: u32 = 1 << 0;
    const FLASH_CR_PG: u32 = 1 << 0;

    while read_volatile(FLASH_SR) & FLASH_SR_BSY != 0 {}

    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr | FLASH_CR_PG);

    // MUST use 16-bit pointer — 32-bit write causes HardFault!
    write_volatile(address as *mut u16, data);

    while read_volatile(FLASH_SR) & FLASH_SR_BSY != 0 {}

    let cr = read_volatile(FLASH_CR);
    write_volatile(FLASH_CR, cr & !FLASH_CR_PG);
}
```
<!-- /tabs -->

### Writing a Block of Data

<!-- tabs -->
```c
void flash_write_buffer(uint32_t start_address, uint32_t *data, uint32_t word_count) {
    flash_unlock();

    for (uint32_t i = 0; i < word_count; i++) {
        flash_write_word(start_address + (i * 4), data[i]);
    }

    flash_lock();
}
```

```rust
unsafe fn flash_write_buffer(start_address: u32, data: &[u32]) {
    flash_unlock();

    for (i, &word) in data.iter().enumerate() {
        flash_write_word(start_address + (i as u32 * 4), word);
    }

    flash_lock();
}
```
<!-- /tabs -->

## Complete Example: Store and Read Configuration

<!-- tabs -->
```c
#define CONFIG_SECTOR    7                  // last 128KB sector
#define CONFIG_ADDR      0x08060000U        // sector 7 base address

typedef struct {
    uint32_t magic;          // 0xDEADBEEF if valid
    uint32_t baud_rate;
    uint32_t adc_calibration;
    uint32_t device_id;
} Config_t;

void config_save(const Config_t *cfg) {
    flash_unlock();
    flash_erase_sector(CONFIG_SECTOR);

    const uint32_t *words = (const uint32_t*)cfg;
    uint32_t count = sizeof(Config_t) / 4;

    for (uint32_t i = 0; i < count; i++) {
        flash_write_word(CONFIG_ADDR + (i * 4), words[i]);
    }

    flash_lock();
}

Config_t config_load(void) {
    // Reading flash is just a pointer dereference — no unlock needed
    return *(const Config_t*)CONFIG_ADDR;
}

void config_init(void) {
    Config_t cfg = config_load();
    if (cfg.magic != 0xDEADBEEF) {
        // First boot or corrupted — write defaults
        Config_t defaults = {
            .magic = 0xDEADBEEF,
            .baud_rate = 115200,
            .adc_calibration = 2048,
            .device_id = 0x0001
        };
        config_save(&defaults);
    }
}
```

```rust
const CONFIG_SECTOR: u8 = 7;
const CONFIG_ADDR: u32 = 0x0806_0000;

#[repr(C)]
#[derive(Clone, Copy)]
struct Config {
    magic: u32,           // 0xDEAD_BEEF if valid
    baud_rate: u32,
    adc_calibration: u32,
    device_id: u32,
}

unsafe fn config_save(cfg: &Config) {
    flash_unlock();
    flash_erase_sector(CONFIG_SECTOR);

    let words = core::slice::from_raw_parts(
        cfg as *const Config as *const u32,
        core::mem::size_of::<Config>() / 4,
    );

    for (i, &word) in words.iter().enumerate() {
        flash_write_word(CONFIG_ADDR + (i as u32 * 4), word);
    }

    flash_lock();
}

unsafe fn config_load() -> Config {
    // Reading flash is just a pointer dereference — no unlock needed
    core::ptr::read_volatile(CONFIG_ADDR as *const Config)
}

unsafe fn config_init() {
    let cfg = config_load();
    if cfg.magic != 0xDEAD_BEEF {
        // First boot or corrupted — write defaults
        let defaults = Config {
            magic: 0xDEAD_BEEF,
            baud_rate: 115200,
            adc_calibration: 2048,
            device_id: 0x0001,
        };
        config_save(&defaults);
    }
}
```
<!-- /tabs -->

## Parallelism and Supply Voltage

The PSIZE field in FLASH_CR must match your supply voltage:

| PSIZE | Access Width | Required VCC |
|-------|-------------|-------------|
| 00    | 8-bit (byte) | 1.8V - 3.6V |
| 01    | 16-bit (half-word) | 2.1V - 3.6V |
| 10    | 32-bit (word) | 2.7V - 3.6V |
| 11    | 64-bit (double-word) | 2.7V - 3.6V + VPP |

If your board runs at 3.3V, use PSIZE = 10 (32-bit) for best speed. Using a wider parallelism than your voltage supports causes **programming errors**.

## Critical Pitfalls

### 1. Don't Execute from Flash While Writing to It

The CPU fetches instructions from flash. If you erase/write to the same flash bank the CPU is running from, it stalls or crashes. Solutions:

- **Run flash routines from RAM** — copy the function to SRAM and call it there
- **Use a dual-bank MCU** — write to bank 2 while executing from bank 1

<!-- tabs -->
```c
// Place function in RAM using linker attribute
__attribute__((section(".RamFunc")))
void flash_erase_from_ram(uint8_t sector) {
    // ... same erase code, but runs from SRAM
}
```

```rust
// In Rust, place a function in RAM using a linker section attribute
#[link_section = ".RamFunc"]
unsafe fn flash_erase_from_ram(sector: u8) {
    // ... same erase code, but runs from SRAM
}
```
<!-- /tabs -->

### 2. Interrupts During Flash Operations

Disable interrupts before flash erase/write. If an ISR fires and tries to read flash while it's being erased, the CPU stalls until the operation completes — or worse, reads garbage.

<!-- tabs -->
```c
__disable_irq();
flash_erase_sector(7);
flash_write_word(CONFIG_ADDR, 0xDEADBEEF);
__enable_irq();
```

```rust
unsafe {
    cortex_m::interrupt::disable();
    flash_erase_sector(7);
    flash_write_word(CONFIG_ADDR, 0xDEAD_BEEF);
    cortex_m::interrupt::enable();
}

// Idiomatic Rust: use critical_section for scoped interrupt disable
cortex_m::interrupt::free(|_cs| unsafe {
    flash_erase_sector(7);
    flash_write_word(CONFIG_ADDR, 0xDEAD_BEEF);
});
```
<!-- /tabs -->

### 3. Wear Leveling

Flash sectors have a limited number of erase cycles (~10,000 for STM32). If you write config frequently, implement wear leveling — cycle through multiple locations within a sector before erasing.

### 4. Alignment

Writes must be aligned to the parallelism width. Writing a 32-bit word to an address not divisible by 4 triggers PGAERR (programming alignment error).

### 5. Clear Error Flags First

Always clear FLASH_SR error flags before starting a new operation. Old error flags persist and can be misleading.

## Flash Programming on Other Architectures

### AVR (ATmega)

AVR uses a **Self-Programming Mode (SPM)** instruction. The bootloader section has special permissions to write to flash. Application code cannot write to flash directly — only bootloader code can.

### RISC-V (GD32VF103)

Similar unlock-erase-program sequence but with different register names and addresses. The principle is identical: unlock → erase → program → lock.

## References

1. [Writing to Internal Flash of STM32Fxxx - EmbeddedExpertIO](https://blog.embeddedexpert.io/?p=1716) — Register-level unlock, write, and lock procedures
2. [Writing to STM32 Flash - Nebk Electronics](https://nebkelectronics.wordpress.com/2016/10/15/writing-to-stm32-flash/) — Practical walkthrough with error handling
3. [Programming Flash Memory STM32 Bare Metal - EEVblog](https://www.eevblog.com/forum/microcontrollers/programming-flash-memory-stm32-bare-metal/) — Community discussion of pointer width pitfalls and HardFault causes
4. [ARM Cortex Architecture: Flash Memory Controller](https://embeddive.wordpress.com/2018/04/14/arm-cortex-architecture-flash-memory-controller/) — How the flash controller mediates between CPU and flash cells
5. [STM32 Flash Programming Guide](https://controllerstech.com/flash-programming-in-stm32/) — HAL and register-level erase/write/read procedures

## Related Topics

- [Flash Memory](../mcu-architecture/memory-architecture/flash-memory.md) — How NOR flash works at the cell level
- [Memory-Mapped I/O](../mcu-architecture/memory-architecture/memory-mapped-io.md) — Why volatile pointers are needed
- [EEPROM and NVM](../mcu-architecture/memory-architecture/eeprom-and-nvm.md) — Flash EEPROM emulation for frequent writes
- [Boot Process Deep Dive](boot-process-deep-dive.md) — Custom bootloaders that use flash self-programming
- [Flashing Firmware onto an MCU](flashing-firmware.md) — External programming methods
