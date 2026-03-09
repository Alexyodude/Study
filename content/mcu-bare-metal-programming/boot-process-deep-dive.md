---
title: "Boot Process Deep Dive"
created: 2026-03-08
updated: 2026-03-08
tags: [boot, reset, bootloader, BOOT0, BOOT1, secure-boot, STM32]
status: draft
sources:
  - url: "https://community.st.com/t5/stm32-mcus/faq-stm32-boot-process/ta-p/49358"
    title: "FAQ: STM32 Boot Process - STMicroelectronics Community"
  - url: "https://deepbluembedded.com/stm32-boot-modes-stm32-boot0-boot1-pins/"
    title: "STM32 Boot Modes | STM32 Boot0 Boot1 Pins"
  - url: "https://github.com/frolovilya/stm32-boot-explained"
    title: "STM32 Boot Explained - GitHub"
  - url: "https://stm32world.com/wiki/Boot0"
    title: "Boot0 - STM32World Wiki"
  - url: "https://embeddedsecurity.io/sec-stm32i-firmware"
    title: "Bare-Metal Firmware Build and Boot Process - Embedded Security"
---

## Power-On Reset Sequence

When power is applied to an ARM Cortex-M MCU, the following happens in hardware before any software runs:

1. **Power supply stabilization** -- internal voltage regulators settle. A power-on reset (POR) circuit holds the processor in reset until voltage is stable.
2. **Reset release** -- the internal reset signal deasserts. External reset pins (NRST) must also be high.
3. **Boot pin sampling** -- the processor samples the BOOT0 (and BOOT1 on some devices) pin levels on the 4th rising edge of SYSCLK after reset.
4. **Memory aliasing** -- based on boot pin configuration, the processor maps the selected memory region to address `0x00000000`.
5. **SP load** -- the processor reads the 32-bit value at address `0x00000000` and loads it into the stack pointer (SP).
6. **PC load** -- the processor reads the 32-bit value at address `0x00000004` (the reset vector) and branches to it.

From this point, software takes over.

## Boot Pin Configuration (STM32)

[STM32 devices](https://deepbluembedded.com/stm32-boot-modes-stm32-boot0-boot1-pins/) use BOOT0 and BOOT1 pins to select the boot source. The pin values are latched at reset:

### STM32F1/F4 Boot Modes

| BOOT1 | BOOT0 | Boot Source | Mapped to 0x0000_0000 |
|-------|-------|-------------|----------------------|
| X | 0 | Main Flash | `0x0800_0000` |
| 0 | 1 | System Memory | `0x1FFF_0000` (varies) |
| 1 | 1 | Embedded SRAM | `0x2000_0000` |

- **X** means "don't care" -- only BOOT0 matters when it is 0.

### Hardware Recommendations

- **Normal operation**: Tie BOOT0 to GND through a 10k resistor. The MCU boots from user flash.
- **DFU programming**: Pull BOOT0 high, reset the MCU, program via UART/USB, then pull BOOT0 low and reset again.
- **Never leave BOOT0 floating**. It is high-impedance and susceptible to noise, which can cause unpredictable boot behavior.

On newer STM32 families (L4, G4, H7), BOOT0 behavior can also be configured through option bytes, allowing software control without a physical pin.

## System Memory Bootloader

Every STM32 ships with a bootloader programmed by ST in a protected region called **System Memory**. This bootloader is permanently stored and cannot be erased.

It supports programming the main flash through one or more interfaces:

| Interface | STM32F1 | STM32F4 | STM32H7 |
|-----------|---------|---------|---------|
| USART | Yes | Yes | Yes |
| USB DFU | No | Yes | Yes |
| I2C | No | Some | Yes |
| SPI | No | Some | Yes |
| CAN | No | Some | Some |

### Using the UART Bootloader

```bash
# Program using stm32flash utility (BOOT0 = 1)
stm32flash -w firmware.bin -v -g 0x08000000 /dev/ttyUSB0
```

### Using USB DFU

```bash
# Program using dfu-util (BOOT0 = 1, USB connected)
dfu-util -a 0 -s 0x08000000:leave -D firmware.bin
```

The system bootloader is particularly useful for:
- Initial programming of a blank chip without a debug probe
- Field firmware updates via UART or USB
- Recovery when user flash is corrupted

## User Flash Boot (Normal Operation)

In normal operation (BOOT0 = 0), the MCU boots from main flash:

```
0x0800_0000:  [Initial SP]        --> loaded into SP
0x0800_0004:  [Reset_Handler]     --> loaded into PC
0x0800_0008:  [NMI_Handler]
0x0800_000C:  [HardFault_Handler]
...
```

The flash memory at `0x0800_0000` is aliased to `0x0000_0000`, so the processor reads SP from `0x0000_0000` which is actually `0x0800_0000`.

After loading SP and branching to `Reset_Handler`, the startup code initializes `.data`, zeros `.bss`, and calls `main()` as described in [Startup Code](startup-code.md).

## Custom Bootloaders

A custom bootloader is a small program that runs before your main application. It occupies the first portion of flash and decides whether to run the application or perform an update.

### Why Use a Custom Bootloader

- **Over-the-air (OTA) updates** -- receive new firmware via WiFi, BLE, or cellular and write it to flash.
- **Dual-bank updates** -- maintain two copies of the application; the bootloader switches between them.
- **Integrity checking** -- verify a CRC or cryptographic signature before booting.
- **Recovery** -- if the application is corrupted, fall back to the bootloader for re-programming.

### Flash Layout with a Bootloader

```
Flash Memory
+------------------------+ 0x0800_0000
|    Bootloader (16 KB)  |
+------------------------+ 0x0800_4000
|  Application (48 KB)   |
|                        |
+------------------------+ 0x0801_0000
```

The bootloader occupies the first 16 KB. The application starts at `0x0800_4000` with its own vector table.

### Bootloader to Application Jump

The bootloader jumps to the application by:

1. Reading the application's initial SP from its vector table.
2. Reading the application's reset vector.
3. Setting the VTOR to point to the application's vector table.
4. Loading the SP and branching to the reset vector.

<!-- tabs -->
```c
#define APP_ADDRESS  0x08004000

void jump_to_app(void) {
    /* Read the application's vector table */
    uint32_t app_sp   = *(volatile uint32_t *)(APP_ADDRESS);
    uint32_t app_reset = *(volatile uint32_t *)(APP_ADDRESS + 4);

    /* Basic sanity check: SP should point to SRAM */
    if ((app_sp & 0x2FF00000) != 0x20000000) {
        return;  /* Invalid application */
    }

    /* Relocate vector table to application */
    SCB->VTOR = APP_ADDRESS;
    __DSB();
    __ISB();

    /* Set stack pointer and jump */
    __set_MSP(app_sp);
    void (*app_entry)(void) = (void (*)(void))app_reset;
    app_entry();

    /* Should never reach here */
    while (1);
}
```

```rust
const APP_ADDRESS: u32 = 0x0800_4000;

unsafe fn jump_to_app() {
    use core::ptr::read_volatile;

    // Read the application's vector table
    let app_sp = read_volatile(APP_ADDRESS as *const u32);
    let app_reset = read_volatile((APP_ADDRESS + 4) as *const u32);

    // Basic sanity check: SP should point to SRAM
    if (app_sp & 0x2FF0_0000) != 0x2000_0000 {
        return; // Invalid application
    }

    // Relocate vector table to application
    let scb = &*cortex_m::peripheral::SCB::PTR;
    scb.vtor.write(APP_ADDRESS);
    cortex_m::asm::dsb();
    cortex_m::asm::isb();

    // Set stack pointer and jump
    cortex_m::register::msp::write(app_sp);
    let app_entry: unsafe extern "C" fn() = core::mem::transmute(app_reset);
    app_entry();

    // Should never reach here
    loop {}
}
```
<!-- /tabs -->

**Important**: Before jumping, the bootloader should:
- Disable all interrupts
- Deinitialize any peripherals it configured
- Reset the clock to its default state

If any interrupt fires after the jump but before the application sets up its own handlers, the processor will use the bootloader's vector table (or worse, an invalid handler), causing a hard fault.

## Secure Boot Concepts

[Secure boot](https://embeddedsecurity.io/sec-stm32i-firmware) ensures that only authenticated firmware runs on the device:

### Chain of Trust

```
[ROM Bootloader] --> verifies --> [Bootloader]
[Bootloader]     --> verifies --> [Application]
```

Each stage verifies the cryptographic signature of the next stage before executing it. The root of trust is the ROM bootloader, which cannot be modified.

### Key Mechanisms

- **Digital signatures** -- the firmware image is signed with a private key. The bootloader verifies the signature using the corresponding public key stored in protected flash or OTP (One-Time Programmable) memory.
- **Read-out protection (RDP)** -- STM32 provides RDP levels that prevent reading flash contents via the debug interface.
- **Write protection (WRP)** -- specific flash pages can be write-protected to prevent bootloader corruption.
- **Secure firmware install (SFI)** -- some STM32 families (L4, H7, U5) support encrypted firmware installation.

### STM32 RDP Levels

| Level | Protection |
|-------|-----------|
| 0 | No protection. Flash readable via debug. |
| 1 | Flash not readable via debug. Setting back to 0 erases flash. |
| 2 | Permanent. Debug interface disabled. Irreversible. |

Secure boot is critical for IoT devices and any product where firmware integrity matters.

## References

1. [FAQ: STM32 Boot Process - STMicroelectronics Community](https://community.st.com/t5/stm32-mcus/faq-stm32-boot-process/ta-p/49358) — Official ST FAQ on boot modes and sequences
2. [STM32 Boot Modes | STM32 Boot0 Boot1 Pins](https://deepbluembedded.com/stm32-boot-modes-stm32-boot0-boot1-pins/) — Detailed explanation of BOOT0/BOOT1 pin configurations
3. [STM32 Boot Explained - GitHub](https://github.com/frolovilya/stm32-boot-explained) — Visual walkthrough of STM32 boot process stages
4. [Boot0 - STM32World Wiki](https://stm32world.com/wiki/Boot0) — Quick reference for BOOT0 pin behavior
5. [Bare-Metal Firmware Build and Boot Process - Embedded Security](https://embeddedsecurity.io/sec-stm32i-firmware) — Secure boot and firmware integrity concepts

## Related Topics

- [Startup Code](startup-code.md) -- what Reset_Handler does after the boot process
- [Vector Table](vector-table.md) -- the structure the boot process reads
- [Linker Scripts in Practice](linker-scripts-in-practice.md) -- flash layout for bootloader + application
