---
title: "Cross-Compilation Toolchain"
created: 2026-03-08
updated: 2026-03-08
tags: [toolchain, gcc, arm-none-eabi, cross-compilation, newlib, binutils]
status: draft
sources:
  - url: "https://developer.arm.com/downloads/-/gnu-rm"
    title: "GNU Arm Embedded Toolchain Downloads - ARM Developer"
  - url: "https://gcc.gnu.org/onlinedocs/gcc/ARM-Options.html"
    title: "ARM Options - GCC Documentation"
  - url: "https://mcuoneclipse.com/2023/01/28/which-embedded-gcc-standard-library-newlib-newlib-nano/"
    title: "Which Embedded GCC Standard Library? newlib, newlib-nano"
  - url: "https://interrupt.memfault.com/blog/boostrapping-libc-with-newlib"
    title: "From Zero to main(): Bootstrapping libc with Newlib - Memfault"
  - url: "https://metebalci.com/blog/demystifying-arm-gnu-toolchain-specs-nano-and-nosys/"
    title: "Demystifying Arm GNU Toolchain Specs: nano and nosys"
---

## What Cross-Compilation Is

When you compile code on your PC (the **host**) to run on your PC, that is native compilation. When you compile code on your PC to run on a different processor (the **target**), that is cross-compilation.

Your laptop has an x86-64 CPU. Your STM32 has an ARM Cortex-M CPU. They use completely different instruction sets. You need a compiler that runs on x86-64 but produces ARM machine code.

```
Host (x86-64 PC)          Target (ARM Cortex-M)
  gcc main.c -o main     --> runs on PC only
  arm-none-eabi-gcc       --> produces ARM binary
```

## The GNU ARM Toolchain: arm-none-eabi-gcc

The standard open-source toolchain for bare-metal ARM development is [`arm-none-eabi-gcc`](https://developer.arm.com/downloads/-/gnu-rm). The name encodes what it targets:

| Part | Meaning |
|------|---------|
| `arm` | ARM architecture |
| `none` | No operating system (bare-metal) |
| `eabi` | Embedded Application Binary Interface |

The toolchain includes:

- `arm-none-eabi-gcc` -- C/C++ compiler
- `arm-none-eabi-as` -- assembler
- `arm-none-eabi-ld` -- linker
- `arm-none-eabi-objcopy` -- binary format converter
- `arm-none-eabi-objdump` -- disassembler
- `arm-none-eabi-size` -- section size reporter
- `arm-none-eabi-gdb` -- debugger

## Key Compiler Flags

### CPU and Architecture

```bash
-mcpu=cortex-m4        # Target a specific core (m0, m0plus, m3, m4, m7, m33...)
-mthumb                # Generate Thumb instruction set (all Cortex-M use Thumb)
```

Always specify `-mcpu` so the compiler can use the right instruction set and select the correct `libgcc`.

### Floating Point

```bash
-mfloat-abi=soft       # Software floating point (no FPU)
-mfloat-abi=softfp     # Hardware FPU, but soft-float calling convention
-mfloat-abi=hard       # Hardware FPU with hardware calling convention
-mfpu=fpv4-sp-d16      # Specify FPU type (for Cortex-M4F)
```

Cortex-M0/M3 have no FPU -- use `soft`. Cortex-M4F/M7 typically use `hard` with the appropriate `-mfpu`.

### Optimization

```bash
-O0     # No optimization (best for debugging)
-O1     # Basic optimization
-O2     # Full optimization (good for release)
-Os     # Optimize for size (common for flash-constrained MCUs)
-Og     # Optimize for debugging (balances debug info and speed)
```

For most embedded projects, `-Os` is the default choice because flash space is limited.

### Section Control

```bash
-ffunction-sections    # Place each function in its own section
-fdata-sections        # Place each global variable in its own section
```

Combined with the linker flag `--gc-sections`, these allow the linker to discard unused functions and data, significantly reducing binary size.

## Newlib vs Newlib-Nano

Bare-metal programs still need a C library for functions like `memcpy`, `printf`, and `malloc`. The standard choice is **newlib**, an open-source C library designed for embedded systems. The [newlib vs newlib-nano comparison](https://mcuoneclipse.com/2023/01/28/which-embedded-gcc-standard-library-newlib-newlib-nano/) explains the tradeoffs in detail.

| Feature | newlib | newlib-nano |
|---------|--------|-------------|
| Flash usage | ~50 KB+ | ~15 KB |
| RAM usage | ~25 KB | ~2.5 KB |
| printf float support | Yes | No (unless enabled) |
| Wide character support | Yes | No |
| Spec file | (default) | `-specs=nano.specs` |

To use newlib-nano, add this to your link flags:

```bash
arm-none-eabi-gcc ... -specs=nano.specs -specs=nosys.specs
```

`nosys.specs` provides stub implementations of system calls (`_read`, `_write`, `_sbrk`, etc.) that would normally be provided by an OS.

## Binary Utilities

### objcopy -- Format Conversion

Most flash tools need raw binary or Intel HEX, not ELF:

```bash
# ELF to raw binary
arm-none-eabi-objcopy -O binary firmware.elf firmware.bin

# ELF to Intel HEX
arm-none-eabi-objcopy -O ihex firmware.elf firmware.hex
```

### objdump -- Disassembly and Inspection

```bash
# Disassemble with source interleaved
arm-none-eabi-objdump -dS firmware.elf

# Show section headers
arm-none-eabi-objdump -h firmware.elf
```

Invaluable for verifying that the vector table is at the right address or that a function was properly inlined.

### size -- Section Size Report

```bash
arm-none-eabi-size firmware.elf
#    text    data     bss     dec     hex filename
#    3240      12     284    3536     dd0 firmware.elf
```

- **text** = code + constants (lives in flash)
- **data** = initialized globals (stored in flash, copied to RAM)
- **bss** = zero-initialized globals (lives in RAM)
- **dec** = text + data + bss (total)

## Installing the Toolchain

### Linux (Debian/Ubuntu)

```bash
sudo apt install gcc-arm-none-eabi
```

### macOS (Homebrew)

```bash
brew install arm-none-eabi-gcc
```

### Windows

Download the installer from [ARM Developer](https://developer.arm.com/downloads/-/gnu-rm) or use the package manager:

```bash
# With Scoop
scoop install gcc-arm-none-eabi

# With Chocolatey
choco install gcc-arm-embedded
```

### Verify Installation

```bash
arm-none-eabi-gcc --version
arm-none-eabi-size --version
```

## References

1. [GNU Arm Embedded Toolchain Downloads - ARM Developer](https://developer.arm.com/downloads/-/gnu-rm) — Official ARM toolchain download page
2. [ARM Options - GCC Documentation](https://gcc.gnu.org/onlinedocs/gcc/ARM-Options.html) — GCC reference for ARM-specific compiler flags
3. [Which Embedded GCC Standard Library? newlib, newlib-nano](https://mcuoneclipse.com/2023/01/28/which-embedded-gcc-standard-library-newlib-newlib-nano/) — Comparison of newlib and newlib-nano tradeoffs
4. [From Zero to main(): Bootstrapping libc with Newlib - Memfault](https://interrupt.memfault.com/blog/boostrapping-libc-with-newlib) — Walkthrough of integrating newlib in bare-metal projects
5. [Demystifying Arm GNU Toolchain Specs: nano and nosys](https://metebalci.com/blog/demystifying-arm-gnu-toolchain-specs-nano-and-nosys/) — Explains spec files for nano and nosys linking

## Related Topics

- [Makefile and Build System](makefile-and-build-system.md) -- putting the toolchain to work
- [Linker Scripts in Practice](linker-scripts-in-practice.md) -- the linker script the toolchain needs
