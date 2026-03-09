---
title: "OpenOCD and GDB"
created: 2026-03-08
updated: 2026-03-08
tags: [openocd, gdb, debugging, embedded, toolchain]
status: draft
sources:
  - url: "https://openocd.org/doc/html/GDB-and-OpenOCD.html"
    title: "GDB and OpenOCD - OpenOCD User's Guide"
  - url: "https://makeprogress.ee/blog/getting-started-with-openocd-a-beginner-s-guide-for-embedded-developers"
    title: "Getting Started with OpenOCD: Beginner's Guide"
  - url: "https://cushychicken.github.io/embedded-openocd-gdb/"
    title: "GDB + OpenOCD Setup"
  - url: "https://kickstartembedded.com/2024/03/26/openocd-one-software-to-rule-debug-them-all/"
    title: "OpenOCD - One Software to Rule (Debug) Them All"
---

[OpenOCD](https://openocd.org/doc/html/GDB-and-OpenOCD.html) and GDB form the standard open-source toolchain for embedded debugging. OpenOCD talks to your debug probe; GDB talks to OpenOCD. Together, they let you flash firmware, set breakpoints, step through code, and inspect memory on a real MCU.

## Architecture

```
+----------+       TCP/IP        +---------+      SWD/JTAG     +--------+
|   GDB    | <--- port 3333 ---> | OpenOCD | <--- probe -----> |  MCU   |
| (client) |                     | (server)|    (ST-Link,      | target |
+----------+                     +---------+     J-Link)       +--------+
```

- **GDB** is the debugger you interact with (command-line or IDE frontend)
- **OpenOCD** is the bridge that translates GDB commands into DAP transactions over JTAG or SWD
- **Debug probe** is the hardware that connects to the MCU

## OpenOCD Configuration

[OpenOCD needs two pieces of information](https://makeprogress.ee/blog/getting-started-with-openocd-a-beginner-s-guide-for-embedded-developers): which debug probe (interface) and which target MCU. These are specified as config files.

### Config File Structure

OpenOCD ships with many built-in config files:

```
/usr/share/openocd/scripts/
  interface/       # Debug probe configs
    stlink.cfg
    jlink.cfg
    cmsis-dap.cfg
  target/          # MCU target configs
    stm32f4x.cfg
    stm32f1x.cfg
    nrf52.cfg
  board/           # Combined board configs (interface + target)
    st_nucleo_f4.cfg
```

### Starting OpenOCD

Basic invocation specifying interface and target separately:

```bash
# ST-Link with STM32F4
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

# J-Link with nRF52
openocd -f interface/jlink.cfg -f target/nrf52.cfg

# Using a board config (includes both)
openocd -f board/st_nucleo_f4.cfg
```

When OpenOCD starts successfully, you will see:

```
Info : Listening on port 3333 for gdb connections
Info : Listening on port 4444 for telnet connections
Info : Listening on port 6666 for tcl connections
```

Port 3333 is the GDB server. Port 4444 is a telnet interface for direct OpenOCD commands.

### Common OpenOCD Commands (Telnet)

```
> reset halt          # Reset MCU and halt at first instruction
> flash write_image erase firmware.elf   # Flash the ELF file
> reg                 # Show all CPU registers
> mdw 0x40021000 4    # Read 4 words starting at address (RCC registers)
> bp 0x08000100 2 hw  # Set hardware breakpoint
> resume              # Resume execution
```

## Connecting GDB

Once OpenOCD is running, connect GDB in a separate terminal:

```bash
# Start GDB with your ELF file (which contains debug symbols)
arm-none-eabi-gdb firmware.elf

# Inside GDB, connect to OpenOCD
(gdb) target remote localhost:3333

# Load firmware into flash
(gdb) load

# Reset and halt
(gdb) monitor reset halt

# Set a breakpoint at main
(gdb) break main

# Continue execution
(gdb) continue
```

## Essential GDB Commands

### Execution Control

| Command | Shortcut | Description |
|---------|----------|-------------|
| `continue` | `c` | Resume execution until next breakpoint |
| `step` | `s` | Step into (follows function calls) |
| `next` | `n` | Step over (skips function internals) |
| `stepi` | `si` | Step one assembly instruction |
| `finish` | `fin` | Run until current function returns |
| `until <line>` | | Run until specified line |

### Breakpoints and Watchpoints

```gdb
break main              # Break at function
break app.c:42          # Break at file:line
break *0x08000100       # Break at address
watch my_variable       # Break when variable changes (watchpoint)
info breakpoints        # List all breakpoints
delete 2                # Delete breakpoint #2
```

**Note**: Cortex-M MCUs have a limited number of hardware breakpoints (typically 4-8). If you exceed this, GDB will fall back to software breakpoints, which require modifying flash -- usually not what you want.

### Inspecting State

```gdb
print my_var            # Print variable value
print/x my_var          # Print in hex
print *my_struct        # Print struct contents
x/16xw 0x20000000      # Examine 16 words in hex at address (SRAM start)
x/8xb &my_array        # Examine 8 bytes of an array
info registers          # Show all CPU registers
info reg sp pc lr       # Show specific registers
display my_var          # Auto-print variable after each step
```

### Memory and Registers

```gdb
set $r0 = 0x42          # Modify register
set my_var = 100        # Modify variable
set {int}0x20000000 = 0 # Write to memory address
```

## Example Debug Session

Suppose your firmware hangs after calling `uart_init()`. Here is how you would debug it:

```bash
# Terminal 1: Start OpenOCD
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

# Terminal 2: Start GDB
arm-none-eabi-gdb build/firmware.elf
```

```gdb
(gdb) target remote :3333
(gdb) monitor reset halt
(gdb) load
(gdb) break uart_init
(gdb) continue
Breakpoint 1, uart_init () at src/uart.c:23
(gdb) next       # Step through uart_init line by line
(gdb) next
(gdb) print USART2->BRR    # Check baud rate register
$1 = 0x0                   # Oops -- BRR is zero, clock not enabled!
(gdb) print RCC->APB1ENR   # Check if USART2 clock is enabled
$2 = 0x0                   # Clock not enabled -- found the bug!
```

## VS Code Integration with Cortex-Debug

The **Cortex-Debug** extension for VS Code provides a graphical frontend for GDB + OpenOCD. Add this to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug (OpenOCD)",
      "type": "cortex-debug",
      "request": "launch",
      "servertype": "openocd",
      "cwd": "${workspaceFolder}",
      "executable": "build/firmware.elf",
      "configFiles": [
        "interface/stlink.cfg",
        "target/stm32f4x.cfg"
      ],
      "svdFile": "STM32F407.svd",
      "runToEntryPoint": "main"
    }
  ]
}
```

Key features of Cortex-Debug:

- **Peripheral registers** -- load an SVD file to view named peripheral registers with bit-field descriptions
- **Live watch** -- variables update in real-time while stepping
- **Memory view** -- hex dump of any memory region
- **Disassembly view** -- see the generated assembly alongside C code
- **ITM/SWO console** -- view trace output directly in VS Code

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Error: open failed" | Check probe USB connection; install udev rules on Linux |
| "Target not examined yet" | Wrong target config; verify MCU part number |
| "No flash bank found" | Flash config mismatch; check target .cfg file |
| Breakpoint not hit | Firmware not loaded; run `load` then `monitor reset halt` |
| GDB shows wrong source | ELF file does not match flashed firmware; rebuild and reload |

## References

1. [GDB and OpenOCD - OpenOCD User's Guide](https://openocd.org/doc/html/GDB-and-OpenOCD.html) — Official documentation for GDB-OpenOCD integration
2. [Getting Started with OpenOCD: Beginner's Guide](https://makeprogress.ee/blog/getting-started-with-openocd-a-beginner-s-guide-for-embedded-developers) — Step-by-step OpenOCD setup for beginners
3. [GDB + OpenOCD Setup](https://cushychicken.github.io/embedded-openocd-gdb/) — Practical walkthrough of GDB and OpenOCD workflow
4. [OpenOCD - One Software to Rule (Debug) Them All](https://kickstartembedded.com/2024/03/26/openocd-one-software-to-rule-debug-them-all/) — Overview of OpenOCD capabilities and configuration

## Related Topics

- [JTAG and SWD](jtag-and-swd.md) -- the protocols OpenOCD uses to talk to the probe
- [Fault Debugging Techniques](fault-debugging-techniques.md) -- using GDB to diagnose crashes
- [Semihosting and Printf](semihosting-and-printf.md) -- getting text output through OpenOCD
