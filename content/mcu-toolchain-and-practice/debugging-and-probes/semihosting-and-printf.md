---
title: "Semihosting and Printf"
created: 2026-03-08
updated: 2026-03-08
tags: [semihosting, printf, itm, swo, rtt, debugging, embedded]
status: draft
sources:
  - url: "https://blog.segger.com/getting-printf-output-from-target-to-debugger/"
    title: "Getting printf Output from Target to Debugger - SEGGER Blog"
  - url: "https://www.segger.com/products/debug-probes/j-link/technology/about-real-time-transfer/"
    title: "J-Link RTT - Real Time Transfer"
  - url: "https://mcuoneclipse.com/2023/03/09/using-semihosting-the-direct-way/"
    title: "Using Semihosting the Direct Way"
  - url: "https://mcuoneclipse.com/2023/01/29/arm-swo-itm-console-bidirectional-standard-i-o-retargeting/"
    title: "ARM SWO ITM Console Bidirectional Standard I/O Retargeting"
  - url: "https://www.gabevso.dev/posts/semihosting/part-1/"
    title: "ARM Semihosting Part 1 - Introduction"
---

Getting text output from a microcontroller to your PC is one of the first things you need when developing firmware. There are several methods, each with different trade-offs in speed, intrusiveness, and hardware requirements.

## Overview of Methods

| Method | Speed | Pins Needed | Bidirectional | Real-Time Safe | Probe Required |
|--------|-------|-------------|---------------|----------------|----------------|
| UART printf | Medium | 1-2 (TX/RX) | Yes | No (blocking) | No |
| Semihosting | Very slow | 0 (uses debug) | Yes | No (halts CPU) | Yes |
| ITM/SWO | Fast | 1 (SWO pin) | No (output only) | Mostly | Yes |
| SEGGER RTT | Very fast | 0 (uses debug) | Yes | Yes | J-Link |

## Semihosting

[Semihosting](https://www.gabevso.dev/posts/semihosting/part-1/) redirects standard I/O calls (like `printf`, `fopen`, `fwrite`) from the MCU to the host PC through the debug connection. The MCU does not need a UART or any extra pins.

### How It Works

1. Your code calls `printf("Hello\n")`
2. The C library triggers a special **BKPT** (breakpoint) instruction with a specific code
3. The debug probe detects this breakpoint and **halts the CPU**
4. The debugger reads the string from target memory
5. The debugger displays the string on the host
6. The CPU is resumed

<!-- tabs -->
```c
// Enable semihosting in your code
extern void initialise_monitor_handles(void);

int main(void) {
    initialise_monitor_handles();  // Initialize semihosting
    printf("Hello from MCU!\n");   // This goes to the debugger console
    // ...
}
```

```rust
// Rust embedded — using cortex-m-semihosting crate
#![no_std]
#![no_main]

use cortex_m_semihosting::hprintln;
use cortex_m_rt::entry;

#[entry]
fn main() -> ! {
    hprintln!("Hello from MCU!");  // This goes to the debugger console
    loop {}
}
```
<!-- /tabs -->

### Enabling Semihosting

In OpenOCD, enable semihosting with:

```
monitor arm semihosting enable
```

Link with the semihosting-compatible C library:

```makefile
LDFLAGS += --specs=rdimon.specs -lrdimon
```

### Performance Impact

Semihosting is **extremely slow** -- each `printf` can take 10-100+ milliseconds because the CPU halts completely. This makes it unsuitable for:

- Interrupt service routines
- Real-time control loops
- Any time-sensitive code

Semihosting is acceptable for one-time initialization messages or infrequent diagnostic output.

### Critical Limitation

If you build with semihosting enabled and run **without** a debugger connected, the BKPT instruction will cause a **HardFault**. Your firmware will crash immediately. Always have a way to conditionally disable semihosting in release builds.

## ITM and SWO (Instrumentation Trace Macrocell)

ITM is a hardware trace peripheral built into Cortex-M3, M4, M7, and M33 processors (not available on M0/M0+). It sends data out through the **SWO** (Serial Wire Output) pin, which is part of the SWD debug connector.

### How It Works

1. Your code writes a byte to an ITM stimulus port register
2. The ITM hardware serializes the data
3. The data is sent out through the SWO pin to the debug probe
4. The probe forwards it to the host PC

<!-- tabs -->
```c
// Write a character to ITM stimulus port 0
void ITM_SendChar(char c) {
    // Wait until stimulus port is ready
    while ((ITM->PORT[0].u32 & 1) == 0);
    ITM->PORT[0].u8 = c;
}

// Retarget _write for printf
int _write(int file, char *data, int len) {
    for (int i = 0; i < len; i++) {
        ITM_SendChar(data[i]);
    }
    return len;
}
```

```rust
// Rust embedded — using cortex-m ITM support
use cortex_m::itm;

fn itm_send_char(itm_port: &mut cortex_m::peripheral::itm::Stim, c: u8) {
    // cortex_m::itm::write_all handles the ready-wait internally
    itm::write_all(itm_port, &[c]);
}

// Write a string to ITM port 0
fn itm_write(itm: &mut cortex_m::peripheral::ITM, data: &[u8]) {
    itm::write_all(&mut itm.stim[0], data);
}
```
<!-- /tabs -->

### Configuration

ITM requires configuration on both sides:

**Target side** -- enable ITM in the Debug Exception and Monitor Control Register:

<!-- tabs -->
```c
// Enable TRCENA in DEMCR
CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;

// Unlock ITM
ITM->LAR = 0xC5ACCE55;

// Enable ITM, set trace bus ID
ITM->TCR = ITM_TCR_ITMENA_Msk | ITM_TCR_SYNCENA_Msk;

// Enable stimulus port 0
ITM->TER = 0x1;
```

```rust
use core::ptr::{read_volatile, write_volatile};

unsafe fn itm_init() {
    // Enable TRCENA in DEMCR
    let demcr = 0xE000_EDFC as *mut u32;
    write_volatile(demcr, read_volatile(demcr) | (1 << 24));

    // Unlock ITM
    write_volatile(0xE000_0FB0 as *mut u32, 0xC5AC_CE55);

    // Enable ITM, set trace bus ID
    let tcr = 0xE000_0E80 as *mut u32;
    write_volatile(tcr, (1 << 0) | (1 << 2)); // ITMENA | SYNCENA

    // Enable stimulus port 0
    write_volatile(0xE000_0E00 as *mut u32, 0x1);
}
```
<!-- /tabs -->

**OpenOCD side** -- configure SWO speed:

```
# In OpenOCD config or telnet
tpiu config internal /dev/stdout uart off 168000000
# Parameters: internal/external, output, format, enable/disable, CPU clock
```

### Performance

ITM output is **non-blocking** as long as the FIFO does not fill up. At 10 MHz SWO speed, each character takes about 1.5 microseconds. An 80-character line takes roughly 120 microseconds -- much faster than semihosting, but not zero cost.

### Limitations

- Only available on Cortex-M3 and above (not M0/M0+)
- Requires the SWO pin to be connected (not always routed on cheap boards)
- Output only -- you cannot send data from host to target through ITM
- SWO speed is limited by the probe and the target's SWO output divider

## SEGGER RTT (Real Time Transfer)

[RTT](https://www.segger.com/products/debug-probes/j-link/technology/about-real-time-transfer/) is a proprietary technology from SEGGER that uses the debug probe's memory access capability to transfer data in and out of the target without halting the CPU or using any extra pins.

### How It Works

1. A small **control block** is placed in target RAM, containing ring buffer descriptors
2. Your code writes data into an **up buffer** (target to host) in RAM
3. The J-Link probe continuously reads this buffer over the debug connection in the background
4. For input, the probe writes to a **down buffer** (host to target) that your code polls

<!-- tabs -->
```c
#include "SEGGER_RTT.h"

int main(void) {
    SEGGER_RTT_Init();
    SEGGER_RTT_printf(0, "Hello via RTT! Count: %d\n", 42);

    // Non-blocking read from host
    char c;
    if (SEGGER_RTT_Read(0, &c, 1) > 0) {
        // Process input character
    }
}
```

```rust
// Rust embedded — using the rtt-target crate
#![no_std]
#![no_main]

use rtt_target::{rprintln, rtt_init_print};
use cortex_m_rt::entry;

#[entry]
fn main() -> ! {
    rtt_init_print!();
    rprintln!("Hello via RTT! Count: {}", 42);

    // For bidirectional RTT, use rtt_init! with channels
    // let channels = rtt_init! { up: { 0: { size: 1024 } } down: { 0: { size: 16 } } };
    // Non-blocking read would use the down channel

    loop {}
}
```
<!-- /tabs -->

### Performance

RTT is remarkably fast:

- An average line of text takes **less than 1 microsecond** to output
- Speed comes from the fact that writing to a RAM buffer is just a memory copy
- The probe reads the buffer asynchronously -- the CPU is never halted

### Requirements

- **SEGGER J-Link** debug probe (or J-Link OB on some dev boards)
- Add the RTT source files to your project (freely available from SEGGER)
- Use SEGGER's J-Link RTT Viewer or Telnet client to see output

### Host-Side Tools

```bash
# RTT Viewer (GUI) -- bundled with J-Link Software Pack
JLinkRTTViewer

# Or connect via telnet after starting J-Link GDB Server
telnet localhost 19021
```

## When to Use Which

| Scenario | Recommended Method |
|----------|--------------------|
| Quick prototype, no spare UART | Semihosting |
| Production-like timing matters | RTT (if J-Link) or ITM/SWO |
| Need output from ISR | RTT or ITM (never semihosting) |
| Cortex-M0/M0+ target | RTT (ITM not available) |
| No SEGGER probe available | ITM/SWO or UART |
| Bidirectional console | RTT or UART |
| Release build logging | UART (no debug probe dependency) |

### Decision Flowchart

```
Do you have a J-Link?
  Yes -> Use SEGGER RTT (fastest, most flexible)
  No  -> Is your target Cortex-M3 or above?
           Yes -> Is SWO pin connected?
                    Yes -> Use ITM/SWO
                    No  -> Use UART or semihosting (non-real-time only)
           No  -> Use UART
```

## References

1. [Getting printf Output from Target to Debugger - SEGGER Blog](https://blog.segger.com/getting-printf-output-from-target-to-debugger/) — Comparison of printf output methods for embedded
2. [J-Link RTT - Real Time Transfer](https://www.segger.com/products/debug-probes/j-link/technology/about-real-time-transfer/) — Official SEGGER documentation on RTT technology
3. [Using Semihosting the Direct Way](https://mcuoneclipse.com/2023/03/09/using-semihosting-the-direct-way/) — Low-level semihosting implementation details
4. [ARM SWO ITM Console Bidirectional Standard I/O Retargeting](https://mcuoneclipse.com/2023/01/29/arm-swo-itm-console-bidirectional-standard-i-o-retargeting/) — ITM/SWO setup for printf-style output
5. [ARM Semihosting Part 1 - Introduction](https://www.gabevso.dev/posts/semihosting/part-1/) — Introduction to ARM semihosting mechanism

## Related Topics

- [OpenOCD and GDB](openocd-and-gdb.md) -- configuring SWO output in OpenOCD
- [JTAG and SWD](jtag-and-swd.md) -- the SWO pin is part of the SWD connector
- [Fault Debugging Techniques](fault-debugging-techniques.md) -- semihosting can trigger HardFault if debugger is disconnected
