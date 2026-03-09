---
title: "Makefile and Build System"
created: 2026-03-08
updated: 2026-03-08
tags: [makefile, build-system, openocd, st-flash, gcc, embedded]
status: draft
sources:
  - url: "https://github.com/stuianna/stm32f1xx_bare_template"
    title: "STM32F1xx Bare Metal Template - GitHub"
  - url: "https://github.com/lucasdietrich/stm32l011k4-bare-metal"
    title: "STM32L011K4 Bare Metal Dev - GitHub"
  - url: "https://www.hackster.io/yusefkarim/upload-code-to-stm32l4-using-linux-gnu-make-and-openocd-a3d4de"
    title: "Upload Code to STM32L4 Using Linux, GNU Make, and OpenOCD"
  - url: "https://jacobmossberg.se/posts/2018/08/11/run-c-program-bare-metal-on-arm-cortex-m3.html"
    title: "Run a C Program Bare Metal on ARM Cortex-M3"
---

## Why Use Make

A bare-metal project involves multiple compilation steps: compiling each source file, linking them together, converting the output, and flashing it to the MCU. Typing these commands by hand every time is tedious and error-prone. A Makefile automates the entire pipeline with a single command: `make`.

## The Build Pipeline

```
 .c/.s files     .o files       .elf file        .bin/.hex
 [source]  --->  [compile]  --> [link]  ------>  [convert]  --> [flash]
  main.c          main.o        firmware.elf      firmware.bin
  startup.c       startup.o
```

## Makefile Variables

The top of a Makefile defines the toolchain and flags:

```makefile
# Toolchain
CC      = arm-none-eabi-gcc
AS      = arm-none-eabi-gcc -x assembler-with-cpp
LD      = arm-none-eabi-gcc
OBJCOPY = arm-none-eabi-objcopy
OBJDUMP = arm-none-eabi-objdump
SIZE    = arm-none-eabi-size

# Project
TARGET   = firmware
LDSCRIPT = linker.ld

# MCU flags
MCU = -mcpu=cortex-m3 -mthumb -mfloat-abi=soft

# C flags
CFLAGS  = $(MCU) -Wall -Wextra -Os
CFLAGS += -ffunction-sections -fdata-sections
CFLAGS += -std=c11

# Linker flags
LDFLAGS  = $(MCU) -T$(LDSCRIPT)
LDFLAGS += -Wl,--gc-sections
LDFLAGS += -specs=nano.specs -specs=nosys.specs
LDFLAGS += -Wl,-Map=$(TARGET).map,--cref
```

Key points:
- We use `gcc` as the linker (not `ld` directly) so it adds `libgcc` automatically.
- [`--gc-sections`](https://jacobmossberg.se/posts/2018/08/11/run-c-program-bare-metal-on-arm-cortex-m3.html) removes unused code and data, reducing binary size.
- `-Wl,-Map=...` generates a map file showing where everything is placed in memory.

## Compile Targets: .c to .o

```makefile
# Source files
SRCS = main.c startup.c system.c
OBJS = $(SRCS:.c=.o)

# Pattern rule: compile .c to .o
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@
```

The `$<` is the input file, `$@` is the output file. Each source file is compiled independently.

## Link Target: .o to .elf

```makefile
$(TARGET).elf: $(OBJS)
	$(LD) $(LDFLAGS) $(OBJS) -o $@
	$(SIZE) $@
```

The linker combines all object files using the linker script and produces an ELF executable. The `size` command prints the section sizes as a quick sanity check.

## Binary Conversion: .elf to .bin/.hex

```makefile
$(TARGET).bin: $(TARGET).elf
	$(OBJCOPY) -O binary $< $@

$(TARGET).hex: $(TARGET).elf
	$(OBJCOPY) -O ihex $< $@
```

Most flash tools require raw binary (`.bin`) or Intel HEX (`.hex`), not ELF.

## Flash Target

### Using st-flash (ST-Link)

```makefile
flash: $(TARGET).bin
	st-flash write $< 0x08000000
```

### Using OpenOCD

```makefile
flash: $(TARGET).elf
	openocd -f interface/stlink-v2.cfg \
	        -f target/stm32f1x.cfg \
	        -c "program $< verify reset exit"
```

[OpenOCD](https://www.hackster.io/yusefkarim/upload-code-to-stm32l4-using-linux-gnu-make-and-openocd-a3d4de) can program, verify, and reset in a single command.

## Clean Target

```makefile
clean:
	rm -f $(OBJS) $(TARGET).elf $(TARGET).bin $(TARGET).hex $(TARGET).map
```

## Debug vs Release Builds

Use a variable to switch between debug and release configurations:

```makefile
# Set BUILD=debug or BUILD=release (default: debug)
BUILD ?= debug

ifeq ($(BUILD),debug)
  CFLAGS += -g3 -O0 -DDEBUG
else
  CFLAGS += -Os -DNDEBUG
endif
```

- **Debug**: `-g3` (full debug symbols), `-O0` (no optimization), `-DDEBUG` (enable debug code).
- **Release**: `-Os` (optimize for size), `-DNDEBUG` (disable assertions).

## Debug with GDB

```makefile
debug: $(TARGET).elf
	openocd -f interface/stlink-v2.cfg -f target/stm32f1x.cfg &
	arm-none-eabi-gdb $< \
	    -ex "target remote :3333" \
	    -ex "monitor reset halt" \
	    -ex "load"
```

This starts OpenOCD as a GDB server and connects GDB to it.

## Full Example Makefile

```makefile
######################################################################
# Bare-Metal STM32F103 Makefile
######################################################################

# Toolchain
CC      = arm-none-eabi-gcc
OBJCOPY = arm-none-eabi-objcopy
SIZE    = arm-none-eabi-size

# Project
TARGET   = firmware
LDSCRIPT = STM32F103C8Tx.ld

# Sources
SRCS = src/main.c src/startup.c src/system_stm32f1xx.c
OBJS = $(SRCS:.c=.o)

# MCU
MCU = -mcpu=cortex-m3 -mthumb -mfloat-abi=soft

# Build type: debug | release
BUILD ?= debug

# Flags
CFLAGS  = $(MCU) -Wall -Wextra -std=c11
CFLAGS += -ffunction-sections -fdata-sections
CFLAGS += -I./include

ifeq ($(BUILD),debug)
  CFLAGS += -g3 -O0 -DDEBUG
else
  CFLAGS += -Os -DNDEBUG
endif

LDFLAGS  = $(MCU) -T$(LDSCRIPT)
LDFLAGS += -Wl,--gc-sections
LDFLAGS += -specs=nano.specs -specs=nosys.specs
LDFLAGS += -Wl,-Map=$(TARGET).map,--cref

######################################################################
# Targets
######################################################################

all: $(TARGET).bin $(TARGET).hex

$(TARGET).elf: $(OBJS)
	$(CC) $(LDFLAGS) $^ -o $@
	$(SIZE) $@

$(TARGET).bin: $(TARGET).elf
	$(OBJCOPY) -O binary $< $@

$(TARGET).hex: $(TARGET).elf
	$(OBJCOPY) -O ihex $< $@

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

flash: $(TARGET).bin
	st-flash write $< 0x08000000

ocd-flash: $(TARGET).elf
	openocd -f interface/stlink-v2.cfg \
	        -f target/stm32f1x.cfg \
	        -c "program $< verify reset exit"

debug: $(TARGET).elf
	openocd -f interface/stlink-v2.cfg -f target/stm32f1x.cfg &
	arm-none-eabi-gdb $< \
	    -ex "target remote :3333" \
	    -ex "monitor reset halt" \
	    -ex "load"

disasm: $(TARGET).elf
	arm-none-eabi-objdump -dS $< > $(TARGET).lst

clean:
	rm -f $(OBJS) $(TARGET).elf $(TARGET).bin $(TARGET).hex \
	      $(TARGET).map $(TARGET).lst

.PHONY: all flash ocd-flash debug disasm clean
```

### Usage

```bash
make                        # Build debug (default)
make BUILD=release          # Build release
make flash                  # Flash with st-flash
make ocd-flash              # Flash with OpenOCD
make clean                  # Remove build artifacts
make disasm                 # Generate disassembly listing
```

## References

1. [STM32F1xx Bare Metal Template - GitHub](https://github.com/stuianna/stm32f1xx_bare_template) — Complete Makefile template for STM32F1 bare-metal projects
2. [STM32L011K4 Bare Metal Dev - GitHub](https://github.com/lucasdietrich/stm32l011k4-bare-metal) — Minimal bare-metal project structure with Makefile
3. [Upload Code to STM32L4 Using Linux, GNU Make, and OpenOCD](https://www.hackster.io/yusefkarim/upload-code-to-stm32l4-using-linux-gnu-make-and-openocd-a3d4de) — Guide to flashing STM32 with Make and OpenOCD
4. [Run a C Program Bare Metal on ARM Cortex-M3](https://jacobmossberg.se/posts/2018/08/11/run-c-program-bare-metal-on-arm-cortex-m3.html) — Build and link workflow for Cortex-M3 bare-metal

## Related Topics

- [Cross-Compilation Toolchain](cross-compilation-toolchain.md) -- the tools this Makefile invokes
- [Linker Scripts in Practice](linker-scripts-in-practice.md) -- the linker script referenced by LDSCRIPT
