---
title: "Flashing Firmware onto an MCU"
created: 2026-03-08
updated: 2026-03-08
tags: [flashing, swd, jtag, bootloader, uart, dfu, openocd, st-flash]
status: draft
sources:
  - url: "https://stm32world.com/wiki/STM32_How_to_flash"
    title: "STM32 How to Flash - Stm32World Wiki"
  - url: "https://scienceprog.com/flashing-programs-to-stm32-embedded-bootloader/"
    title: "Flashing Programs to STM32 - Embedded Bootloader"
  - url: "https://embeddedprojects101.com/how-to-program-an-stm32-via-uart/"
    title: "How to Program an STM32 via UART"
  - url: "https://github.com/ARMinARM/stm32flash"
    title: "stm32flash - Open Source Serial Bootloader Flasher"
  - url: "https://pypi.org/project/stm32loader/"
    title: "stm32loader - Python STM32 Bootloader Tool"
---

"Flashing" means writing your compiled firmware binary into the MCU's flash memory so it executes on power-up. There are multiple methods, each with different hardware requirements, speed, and use cases.

## Method 1: Debug Probe (SWD / JTAG)

The most common method for development. A debug probe connects to the MCU's [debug port](../mcu-toolchain-and-practice/debugging-and-probes/jtag-and-swd.md) and writes firmware directly into flash.

### Hardware Setup

```
PC (USB) ──── Debug Probe ──── MCU
               ST-Link          SWDIO, SWCLK, GND, (optional NRST)
               J-Link
               CMSIS-DAP
```

Most STM32 development boards (Nucleo, Discovery) have an **on-board ST-Link** — just plug in USB.

### Using st-flash (ST-Link only)

```bash
# Flash a binary at the start of flash (0x08000000 for STM32)
st-flash write firmware.bin 0x08000000

# Read flash contents
st-flash read dump.bin 0x08000000 0x10000

# Erase entire flash
st-flash erase
```

### Using OpenOCD (any probe)

```bash
# One-shot flash command
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
  -c "program firmware.elf verify reset exit"

# Or from the OpenOCD telnet console (port 4444)
> program firmware.elf verify reset

# Flash a raw binary (must specify base address)
> flash write_image erase firmware.bin 0x08000000
> reset run
```

### Using GDB (for debug sessions)

```bash
arm-none-eabi-gdb firmware.elf
(gdb) target remote :3333
(gdb) load                    # writes firmware to flash
(gdb) monitor reset halt      # reset and halt at entry
(gdb) continue                # run
```

### Using pyOCD (CMSIS-DAP probes)

```bash
pyocd flash -t stm32f401re firmware.hex
pyocd erase -t stm32f401re --chip
```

**Pros**: fastest, supports debugging, no special MCU pin configuration needed.
**Cons**: requires a debug probe (~$3 for ST-Link clone, ~$20 for official).

## Method 2: Built-in UART Bootloader

Every STM32 has a [factory-programmed bootloader](boot-process-deep-dive.md) in system memory ROM. It supports firmware upload over UART (and sometimes I2C, SPI, CAN, or USB depending on the chip).

### Entering Bootloader Mode

The MCU checks the **BOOT0 pin** on reset. According to the [STM32 wiki](https://stm32world.com/wiki/STM32_How_to_flash), if BOOT0 is high on power-up, the built-in bootloader executes instead of user flash:

| BOOT0 | BOOT1 | Boot Source |
|-------|-------|-------------|
| 0     | x     | User flash (normal operation) |
| 1     | 0     | System memory (bootloader) |
| 1     | 1     | Embedded SRAM |

Steps:
1. Connect BOOT0 to 3.3V (or press the BOOT0 button)
2. Reset the MCU (press NRST or power cycle)
3. The bootloader is now active on UART1 (typically PA9/PA10)

### Using stm32flash (Linux/macOS/Windows)

```bash
# Write firmware via serial
stm32flash -w firmware.bin -v -g 0x0 /dev/ttyUSB0

# Read current firmware
stm32flash -r backup.bin /dev/ttyUSB0

# Erase all flash
stm32flash -o /dev/ttyUSB0
```

### Using stm32loader (Python)

```bash
pip install stm32loader

# Flash firmware
stm32loader -p /dev/ttyUSB0 -e -w -v firmware.bin

# Flags: -e = erase, -w = write, -v = verify
```

### Bootloader Protocol (AN3155)

The UART bootloader uses a simple binary protocol at any standard baud rate. Key commands:

| Command | Code | Description |
|---------|------|-------------|
| Get     | 0x00 | List supported commands |
| Get ID  | 0x02 | Read chip ID |
| Read    | 0x11 | Read memory |
| Go      | 0x21 | Jump to address |
| Write   | 0x31 | Write up to 256 bytes |
| Erase   | 0x43/0x44 | Erase pages/sectors |

Each command is acknowledged with 0x79 (ACK) or 0x1F (NACK).

**Pros**: no debug probe needed, just a USB-to-serial adapter (~$1).
**Cons**: slower, requires physical access to BOOT0 pin, no debugging capability.

## Method 3: USB DFU (Device Firmware Update)

Some STM32 chips (F0, F3, F4, L4, etc.) support USB DFU in their built-in bootloader. The MCU appears as a USB device when in bootloader mode.

```bash
# Using dfu-util
dfu-util -a 0 -s 0x08000000:leave -D firmware.bin

# List connected DFU devices
dfu-util -l
```

Enter DFU mode the same way as UART bootloader (BOOT0 high + reset), but connect via USB instead of UART.

**Pros**: no adapter needed (just USB cable), faster than UART.
**Cons**: not all STM32 chips support it, still need BOOT0 access.

## Method 4: STM32CubeProgrammer

ST's official all-in-one GUI/CLI tool. Supports SWD, JTAG, UART, USB, and I2C.

```bash
# CLI: flash via SWD
STM32_Programmer_CLI -c port=SWD -w firmware.bin 0x08000000 -v -rst

# CLI: flash via UART
STM32_Programmer_CLI -c port=/dev/ttyUSB0 -w firmware.bin 0x08000000 -v
```

## Method 5: Custom Bootloader

For production devices, you write your own bootloader that lives in a protected region of flash and updates the application firmware via any interface you choose (UART, CAN, BLE, WiFi, etc.).

```
Flash Layout with Custom Bootloader:
+-------------------+ 0x08000000
| Bootloader (16KB) |  ← Always runs first
+-------------------+ 0x08004000
| Application       |  ← Bootloader jumps here if valid
|                   |
+-------------------+ 0x0807FFFF
```

See [Boot Process Deep Dive](boot-process-deep-dive.md) for implementation details.

## Which Method to Use?

| Scenario | Best Method |
|----------|-------------|
| Development & debugging | SWD with ST-Link/J-Link |
| No debug probe available | UART bootloader |
| Production firmware update | Custom bootloader or USB DFU |
| One-time programming | STM32CubeProgrammer GUI |
| CI/CD automated flashing | OpenOCD or pyOCD scripts |

## Flash Memory Address Map

Know where flash starts on your MCU:

| MCU Family | Flash Base | Typical Size |
|------------|------------|-------------|
| STM32F0    | 0x08000000 | 16-256 KB |
| STM32F1    | 0x08000000 | 16-512 KB |
| STM32F4    | 0x08000000 | 256 KB-2 MB |
| STM32H7    | 0x08000000 | 128 KB-2 MB |
| nRF52      | 0x00000000 | 256-1024 KB |
| ATmega328P | 0x0000      | 32 KB |

## References

1. [STM32 How to Flash - Stm32World Wiki](https://stm32world.com/wiki/STM32_How_to_flash) — Overview of all STM32 flashing methods and BOOT pin configuration
2. [Flashing Programs to STM32 - Embedded Bootloader](https://scienceprog.com/flashing-programs-to-stm32-embedded-bootloader/) — Detailed guide on using the factory bootloader
3. [How to Program an STM32 via UART](https://embeddedprojects101.com/how-to-program-an-stm32-via-uart/) — Step-by-step UART bootloader programming
4. [stm32flash on GitHub](https://github.com/ARMinARM/stm32flash) — Open source serial bootloader flash tool
5. [stm32loader on PyPI](https://pypi.org/project/stm32loader/) — Python-based STM32 bootloader utility

## Related Topics

- [Boot Process Deep Dive](boot-process-deep-dive.md) — BOOT0/BOOT1 pins and custom bootloaders
- [OpenOCD and GDB](../mcu-toolchain-and-practice/debugging-and-probes/openocd-and-gdb.md) — Debug probe setup
- [JTAG and SWD](../mcu-toolchain-and-practice/debugging-and-probes/jtag-and-swd.md) — Debug interface hardware
- [Makefile and Build System](makefile-and-build-system.md) — Integrating flash targets into your build
