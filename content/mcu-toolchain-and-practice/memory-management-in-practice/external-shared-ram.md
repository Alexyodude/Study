---
title: "External Shared RAM"
created: 2026-03-08
updated: 2026-03-08
tags: [external-ram, shared-memory, spi-sram, dual-port, parallel-bus, multi-mcu]
status: draft
sources:
  - url: "https://www.microchip.com/en-us/product/23lc1024"
    title: "23LC1024 - 1Mbit SPI Serial SRAM"
  - url: "https://www.analog.com/en/resources/design-notes/dual-port-ram.html"
    title: "Dual Port RAM - Analog Devices"
  - url: "https://www.renesas.com/en/products/memory-logic/multi-port-memory/asynchronous-dual-port-rams"
    title: "Asynchronous Dual-Port RAMs - Renesas"
  - url: "https://community.infineon.com/t5/SRAM/Memory-sharing-Between-two-microcontrollers/td-p/345889"
    title: "Memory Sharing Between Two Microcontrollers - Infineon"
  - url: "https://www.pjrc.com/teensy/23LC1024.pdf"
    title: "23LC1024 Datasheet"
---

When an MCU's internal SRAM is too small — like the CH32V003's 2 KB — external RAM chips solve the problem. When **multiple MCUs** need access to the same data, that external RAM becomes **shared memory**, and arbitration becomes the central challenge.

## Three Approaches to External Shared RAM

| Approach | Speed | Pin Count | Arbitration | Cost | Complexity |
|----------|-------|-----------|-------------|------|------------|
| SPI SRAM (time-shared) | ~3 MB/s | 4 per MCU | Software (CS gating) | ~$0.50 | Low |
| Parallel SRAM (bus-shared) | ~10-50 MB/s | 20-30 shared | Hardware (bus arbiter) | ~$1-3 | Medium |
| Dual-port SRAM | ~50 MB/s per port | 20-30 per port | Built-in hardware | ~$5-15 | Low (hardware handles it) |

## Approach 1: SPI SRAM (Simplest)

### How It Works

SPI SRAM chips like the [Microchip 23LC1024](https://www.microchip.com/en-us/product/23lc1024) (128 KB) or 23LC512 (64 KB) use the standard SPI bus. Multiple MCUs share the MOSI, MISO, and SCK lines but use **separate CS (chip select) pins** to take turns.

```
  MCU 0 ──┐  SCK  ──────────────┐
  MCU 1 ──┤  MOSI ──────────────┤──── 23LC1024
  MCU 2 ──┤  MISO ──────────────┤    (128 KB)
  MCU 3 ──┘                     │
           CS0 ────────────────►│ CS
           CS1 (active = this MCU has the bus)
           CS2
           CS3
```

**Problem**: SPI is single-master. Only one MCU can access the SRAM at a time.

### Software Arbitration with a Token Pin

Use a dedicated GPIO pin as a "bus grant" token. Only the MCU holding the token drives the SPI bus:

<!-- tabs -->
```c
#define TOKEN_PIN   GPIO_PIN_4   // shared open-drain wire

// Wait for bus access
void sram_acquire(void) {
    // Wait until token line is high (released)
    while (!(GPIOC->IDR & TOKEN_PIN));

    // Claim it by driving low
    GPIOC->BSRR = TOKEN_PIN << 16;   // drive low = "I have it"
}

void sram_release(void) {
    // Release by going high-impedance (open-drain pulls up)
    GPIOC->BSRR = TOKEN_PIN;         // release
}

void sram_write_byte(uint32_t addr, uint8_t data) {
    sram_acquire();

    CS_LOW();
    spi_send(0x02);               // WRITE command
    spi_send((addr >> 16) & 0xFF); // address byte 2
    spi_send((addr >> 8) & 0xFF);  // address byte 1
    spi_send(addr & 0xFF);         // address byte 0
    spi_send(data);
    CS_HIGH();

    sram_release();
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const TOKEN_PIN: u32 = 1 << 4; // GPIO pin 4

fn sram_acquire() {
    unsafe {
        let gpioc_idr = 0x4001_1010 as *const u32; // GPIOC IDR
        let gpioc_bsrr = 0x4001_1018 as *mut u32;  // GPIOC BSRR

        // Wait until token line is high (released)
        while read_volatile(gpioc_idr) & TOKEN_PIN == 0 {}

        // Claim it by driving low
        write_volatile(gpioc_bsrr, TOKEN_PIN << 16); // drive low
    }
}

fn sram_release() {
    unsafe {
        let gpioc_bsrr = 0x4001_1018 as *mut u32;
        write_volatile(gpioc_bsrr, TOKEN_PIN); // release (high)
    }
}

fn sram_write_byte(addr: u32, data: u8) {
    sram_acquire();

    cs_low();
    spi_send(0x02);                        // WRITE command
    spi_send(((addr >> 16) & 0xFF) as u8); // address byte 2
    spi_send(((addr >> 8) & 0xFF) as u8);  // address byte 1
    spi_send((addr & 0xFF) as u8);         // address byte 0
    spi_send(data);
    cs_high();

    sram_release();
}
```
<!-- /tabs -->

### Sequential Mode for Bulk Transfers

The 23LC1024 supports [sequential mode](https://www.pjrc.com/teensy/23LC1024.pdf) — after sending the address, you can stream data continuously without re-sending the address for each byte. This dramatically improves throughput:

<!-- tabs -->
```c
void sram_write_block(uint32_t addr, uint8_t *buf, uint32_t len) {
    sram_acquire();

    CS_LOW();
    spi_send(0x02);                    // WRITE command
    spi_send((addr >> 16) & 0xFF);
    spi_send((addr >> 8) & 0xFF);
    spi_send(addr & 0xFF);
    for (uint32_t i = 0; i < len; i++) {
        spi_send(buf[i]);              // sequential — no re-addressing
    }
    CS_HIGH();

    sram_release();
}
```

```rust
fn sram_write_block(addr: u32, buf: &[u8]) {
    sram_acquire();

    cs_low();
    spi_send(0x02);                        // WRITE command
    spi_send(((addr >> 16) & 0xFF) as u8);
    spi_send(((addr >> 8) & 0xFF) as u8);
    spi_send((addr & 0xFF) as u8);
    for &byte in buf {
        spi_send(byte);                    // sequential — no re-addressing
    }
    cs_high();

    sram_release();
}
```
<!-- /tabs -->

### SPI SRAM Specs

| Chip | Size | Max SPI Clock | Modes | Price |
|------|------|--------------|-------|-------|
| 23LC512 | 64 KB | 20 MHz | SPI, SDI (2-bit), SQI (4-bit) | ~$0.40 |
| 23LC1024 | 128 KB | 20 MHz | SPI, SDI, SQI | ~$0.60 |
| 23LCV512 | 64 KB | 20 MHz | + battery backup | ~$0.50 |
| 23LCV1024 | 128 KB | 20 MHz | + battery backup | ~$0.70 |
| IS62WVS2568 | 256 KB | 45 MHz (QSPI) | SPI, SQI | ~$0.80 |

**Throughput**: at 20 MHz SPI, ~2.5 MB/s (accounting for command/address overhead). With SQI (quad mode), ~8 MB/s.

### Pin Budget for CH32V003

The CH32V003 has 1 SPI peripheral and 18 GPIO. Using SPI SRAM:

| Function | Pins |
|----------|------|
| SPI (SCK, MOSI, MISO) | 3 |
| CS to SRAM | 1 |
| Token / arbitration | 1 |
| Remaining for other I/O | 13 |

Plenty of pins left. This is the most practical option for the CH32V003.

## Approach 2: Parallel SRAM (Fastest with Standard Parts)

### How It Works

Parallel SRAM (like IS62WV25616, 256K x 16-bit) connects via an address bus, data bus, and control signals. Much faster than SPI because you transfer 8 or 16 bits per clock cycle.

```
           Address Bus (A0-A17)
  MCU ─────────────────────────────── Parallel SRAM
           Data Bus (D0-D7 or D0-D15)    (IS62WV25616)
           /CE  (chip enable)              256K x 16-bit
           /OE  (output enable)
           /WE  (write enable)
```

### Sharing Between Multiple MCUs: Bus Arbitration

When multiple MCUs share a parallel SRAM, you need **bus arbitration** — only one MCU may drive the address and data buses at a time. Others must tri-state their pins.

#### Hardware Arbiter

Use a priority encoder or round-robin arbiter:

```
  MCU 0 ──── REQ0 ──┐
  MCU 1 ──── REQ1 ──┤── Bus Arbiter ──── GRANT0, GRANT1, GRANT2, GRANT3
  MCU 2 ──── REQ2 ──┤   (74HC148 +      (/CE to SRAM from granted MCU)
  MCU 3 ──── REQ3 ──┘    logic)
                              │
                         Bus Buffers (74HC245)
                         enable only granted MCU's data lines
```

Each MCU connects to the shared bus through **tri-state bus buffers** (74HC245). The arbiter enables only one buffer at a time.

#### Bus Buffer Detail

```
  MCU 0 data pins ── 74HC245 ──┐
  MCU 1 data pins ── 74HC245 ──┤── Shared Data Bus ── SRAM D0-D7
  MCU 2 data pins ── 74HC245 ──┤
  MCU 3 data pins ── 74HC245 ──┘

  Each 245's /OE pin is controlled by the arbiter's GRANT signal
  Only the granted MCU's buffer is enabled; others are high-impedance
```

### Software-Only Arbitration (No Extra Hardware)

If only 2 MCUs share the bus, you can use a simple GPIO handshake:

<!-- tabs -->
```c
// MCU A wants to access shared SRAM
void bus_acquire(void) {
    // 1. Assert REQUEST
    GPIOC->BSRR = REQ_PIN;

    // 2. Wait for GRANT (other MCU releases bus)
    while (GPIOC->IDR & BUSY_PIN);

    // 3. Configure data pins as outputs
    set_data_bus_output();
}

void bus_release(void) {
    // Configure data pins as inputs (high-Z)
    set_data_bus_input();

    // Deassert REQUEST
    GPIOC->BSRR = REQ_PIN << 16;
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

unsafe fn bus_acquire() {
    let gpioc_bsrr = 0x4001_1018 as *mut u32;
    let gpioc_idr = 0x4001_1010 as *const u32;

    // 1. Assert REQUEST
    write_volatile(gpioc_bsrr, REQ_PIN);

    // 2. Wait for GRANT (other MCU releases bus)
    while read_volatile(gpioc_idr) & BUSY_PIN != 0 {}

    // 3. Configure data pins as outputs
    set_data_bus_output();
}

unsafe fn bus_release() {
    // Configure data pins as inputs (high-Z)
    set_data_bus_input();

    // Deassert REQUEST
    let gpioc_bsrr = 0x4001_1018 as *mut u32;
    write_volatile(gpioc_bsrr, REQ_PIN << 16);
}
```
<!-- /tabs -->

### Pin Budget Problem for CH32V003

Parallel SRAM requires many pins:

| Signal | Pins Needed |
|--------|-------------|
| Address (A0-A14 for 32 KB) | 15 |
| Data (D0-D7) | 8 |
| /CE, /OE, /WE | 3 |
| **Total** | **26** |

The CH32V003 only has **18 GPIO**. This is not enough for a parallel SRAM interface without address latching.

#### Solution: Address Latch (74HC573)

Multiplex the address and data lines. Use a latch to capture the address, then reuse those pins for data:

```
  CH32V003 PA0-PA7 ──┬── 74HC573 Latch ──── SRAM A0-A7 (low address)
                     │                       SRAM A8-A14 (from other pins)
                     └── (direct)  ──────── SRAM D0-D7 (data)

  ALE (address latch enable) ────────────── 74HC573 /LE
```

This reduces the pin count to:

| Signal | Pins |
|--------|------|
| Multiplexed addr/data (AD0-AD7) | 8 |
| High address (A8-A14) | 7 |
| /CE, /OE, /WE, ALE | 4 |
| **Total** | **19** |

Still one pin over the CH32V003's 18 GPIO limit. You'd need to reduce the address range (5 high-address pins = 8 KB addressable) or use a smaller SRAM.

**Verdict**: parallel SRAM is impractical on the CH32V003 due to pin constraints. Use SPI SRAM instead.

## Approach 3: True Dual-Port SRAM (Best for Shared Access)

### What Dual-Port SRAM Is

A [dual-port SRAM](https://www.analog.com/en/resources/design-notes/dual-port-ram.html) has **two completely independent sets of address, data, and control pins**. Two MCUs can read and write simultaneously without any external arbitration — the chip handles contention internally.

```
  Port A (MCU 0)                        Port B (MCU 1)
  A0-A9 ──────┐                  ┌────── A0-A9
  D0-D7 ──────┤    Dual-Port    ├────── D0-D7
  /CE_A ──────┤      SRAM       ├────── /CE_B
  /OE_A ──────┤   (IDT7132)     ├────── /OE_B
  /WE_A ──────┤    1K x 8-bit   ├────── /WE_B
  /BUSY_A ◄───┤                 ├───► /BUSY_B
              └─────────────────┘
```

### Contention Resolution

When both ports access the **same address** simultaneously:

- **Both reading**: no conflict, both get the data
- **One reading, one writing**: the reader gets either old or new data (both are valid). The writer succeeds.
- **Both writing**: the chip asserts the **/BUSY** flag on the port that "loses" arbitration. That port must retry.

<!-- tabs -->
```c
// Write with contention check
void dpram_write(uint16_t addr, uint8_t data) {
    do {
        set_address(addr);
        set_data(data);
        WE_LOW();
        __NOP();
        WE_HIGH();
    } while (BUSY_PIN_ACTIVE());   // retry if contention
}
```

```rust
unsafe fn dpram_write(addr: u16, data: u8) {
    loop {
        set_address(addr);
        set_data(data);
        we_low();
        cortex_m::asm::nop();
        we_high();
        if !busy_pin_active() {
            break; // no contention, write succeeded
        }
    }
}
```
<!-- /tabs -->

### Interrupt Signaling Between Ports

Many dual-port SRAMs have **interrupt/semaphore registers** — special addresses that trigger an interrupt on the other port when written. This enables event-driven communication:

<!-- tabs -->
```c
// MCU A: signal MCU B that new data is ready
dpram_write(SEMAPHORE_ADDR, 0x01);   // triggers INT on port B

// MCU B: ISR fires
void EXTI_DPRAM_IRQHandler(void) {
    uint8_t signal = dpram_read(SEMAPHORE_ADDR);
    if (signal == 0x01) {
        // New data available — process it
        read_shared_buffer();
    }
}
```

```rust
// MCU A: signal MCU B that new data is ready
unsafe { dpram_write(SEMAPHORE_ADDR, 0x01); } // triggers INT on port B

// MCU B: ISR fires
#[interrupt]
fn EXTI_DPRAM() {
    unsafe {
        let signal = dpram_read(SEMAPHORE_ADDR);
        if signal == 0x01 {
            // New data available — process it
            read_shared_buffer();
        }
    }
}
```
<!-- /tabs -->

### Available Dual-Port SRAMs

| Chip | Size | Access Time | Package | Price | Notes |
|------|------|------------|---------|-------|-------|
| IDT7132 | 2 KB (1K x 8) | 35-55 ns | DIP-48 | ~$8 | Classic, still available |
| IDT7134 | 4 KB (2K x 8) | 35-55 ns | DIP-48 | ~$10 | |
| IDT70V28 | 32 KB (16K x 16) | 12-15 ns | TSSOP-44 | ~$12 | 16-bit data bus |
| CY7C136 | 2 KB (1K x 8) | 25 ns | DIP-48 | ~$6 | Cypress/Infineon |
| IS61SDPE... | 256 KB+ | 8 ns | BGA | ~$15+ | Synchronous, high speed |

**Pin count problem again**: IDT7132 needs 10 address + 8 data + 4 control = **22 pins per port**. Too many for CH32V003. Dual-port SRAMs are better suited to MCUs with more pins (STM32, RP2040) or FPGAs.

## Best Option for CH32V003: SPI SRAM Shared Pool

Given the CH32V003's 18-pin limit, the practical architecture is:

```
                    ┌──── CH32V003 (worker 0)
  23LC1024 ── SPI ──┼──── CH32V003 (worker 1)
  (128 KB)          ├──── CH32V003 (worker 2)
                    └──── CH32V003 (worker 3)
                           │
                    Token wire (open-drain, one at a time)
```

### Memory Map Convention

All MCUs agree on a shared memory layout:

<!-- tabs -->
```c
// Shared SRAM memory map (128 KB = 0x00000 - 0x1FFFF)
#define REGION_IMAGE     0x00000   // 76800 bytes: 320x240 grayscale image
#define REGION_RESULT    0x12C00   // 76800 bytes: processed output
#define REGION_MAILBOX   0x1F800   // 2048 bytes: inter-MCU communication

// Mailbox structure (per MCU)
// Offset 0x00: command (written by controller, read by worker)
// Offset 0x04: status  (written by worker, read by controller)
// Offset 0x08: tile_x  (column index of assigned tile)
// Offset 0x0C: tile_y  (row index of assigned tile)

#define MAILBOX(n)  (REGION_MAILBOX + (n) * 64)
```

```rust
// Shared SRAM memory map (128 KB = 0x00000 - 0x1FFFF)
const REGION_IMAGE: u32   = 0x00000;  // 76800 bytes: 320x240 grayscale image
const REGION_RESULT: u32  = 0x12C00;  // 76800 bytes: processed output
const REGION_MAILBOX: u32 = 0x1F800;  // 2048 bytes: inter-MCU communication

// Mailbox structure (per MCU)
// Offset 0x00: command (written by controller, read by worker)
// Offset 0x04: status  (written by worker, read by controller)
// Offset 0x08: tile_x  (column index of assigned tile)
// Offset 0x0C: tile_y  (row index of assigned tile)

const fn mailbox(n: u32) -> u32 {
    REGION_MAILBOX + n * 64
}
```
<!-- /tabs -->

### Complete Workflow

```
1. Controller writes image data into REGION_IMAGE
2. Controller writes tile assignments into each MCU's mailbox
3. Controller releases token

4. Worker 0 acquires token
   - Reads its mailbox: "process tile (2,3)"
   - Reads 1280 bytes of tile data from REGION_IMAGE
   - Releases token
   - Processes tile locally in internal 2 KB SRAM
   - Acquires token
   - Writes result to REGION_RESULT
   - Updates mailbox status = DONE
   - Releases token

5. Workers 1, 2, 3 do the same (round-robin token passing)

6. Controller polls mailboxes. When all DONE → frame complete.
```

### Throughput Analysis

```
SPI @ 20 MHz, 128 KB shared SRAM
Read 1280 bytes (one tile): ~70 us (including address overhead)
Write 1280 bytes (result):  ~70 us
Mailbox read/write:         ~5 us

Per worker per frame:       ~145 us bus time
4 workers sequential:       ~580 us total bus time
Processing per tile (3x3):  ~3 ms

Frame time = 580 us (bus) + 3 ms (compute, parallel) ≈ 3.6 ms
For 320x240 / 4 workers = tiles/worker varies, pipeline limited by bus
```

With 60 tiles and 4 workers doing 15 tiles each:
- Bus time: 15 × 145 us × 4 = 8.7 ms (sequential access)
- Compute: 15 × 3 ms = 45 ms (parallel across workers)
- Total: ~45 ms per frame → **~22 fps for QVGA 3x3 convolution**

Adding more workers speeds up compute but doesn't help bus contention (still one-at-a-time SPI).

### Scaling: Multiple SPI SRAMs

To reduce bus contention, add more SRAM chips — each shared by a subset of workers:

```
  23LC1024 #0 ── SPI ── Workers 0-3    (each 4-worker group
  23LC1024 #1 ── SPI ── Workers 4-7     shares one SRAM)
  23LC1024 #2 ── SPI ── Workers 8-11
  23LC1024 #3 ── SPI ── Workers 12-15
```

4 groups of 4 workers each, bus contention reduced 4x. The controller distributes image tiles to each SRAM.

## Memory Map Design Patterns

### Partitioned Regions (No Contention)

Assign each MCU a non-overlapping write region. Any MCU can read anywhere, but only writes to its own region:

```
  MCU 0 writes: 0x00000 - 0x07FFF
  MCU 1 writes: 0x08000 - 0x0FFFF
  MCU 2 writes: 0x10000 - 0x17FFF
  MCU 3 writes: 0x18000 - 0x1FFFF

  All MCUs can read any region
```

This eliminates write-write contention entirely.

### Producer-Consumer with Flags

<!-- tabs -->
```c
#define FLAG_EMPTY  0x00
#define FLAG_FULL   0xFF

// Producer writes data, then sets flag
void produce(uint32_t slot_addr, uint8_t *data, uint32_t len) {
    sram_acquire();
    sram_write_block(slot_addr + 4, data, len);
    sram_write_byte(slot_addr, FLAG_FULL);       // flag at offset 0
    sram_release();
}

// Consumer polls flag, reads data, clears flag
int consume(uint32_t slot_addr, uint8_t *data, uint32_t len) {
    sram_acquire();
    uint8_t flag = sram_read_byte(slot_addr);
    if (flag != FLAG_FULL) {
        sram_release();
        return 0;   // nothing to consume
    }
    sram_read_block(slot_addr + 4, data, len);
    sram_write_byte(slot_addr, FLAG_EMPTY);
    sram_release();
    return 1;
}
```

```rust
const FLAG_EMPTY: u8 = 0x00;
const FLAG_FULL: u8  = 0xFF;

// Producer writes data, then sets flag
fn produce(slot_addr: u32, data: &[u8]) {
    sram_acquire();
    sram_write_block(slot_addr + 4, data);
    sram_write_byte(slot_addr, FLAG_FULL);       // flag at offset 0
    sram_release();
}

// Consumer polls flag, reads data, clears flag
fn consume(slot_addr: u32, data: &mut [u8]) -> bool {
    sram_acquire();
    let flag = sram_read_byte(slot_addr);
    if flag != FLAG_FULL {
        sram_release();
        return false; // nothing to consume
    }
    sram_read_block(slot_addr + 4, data);
    sram_write_byte(slot_addr, FLAG_EMPTY);
    sram_release();
    true
}
```
<!-- /tabs -->

### Ring Buffer in Shared SRAM

<!-- tabs -->
```c
// Shared ring buffer header (in SRAM)
// Offset 0: write_idx (producer updates)
// Offset 4: read_idx  (consumer updates)
// Offset 8: data[RING_SIZE]

#define RING_BASE    0x1F000
#define RING_SIZE    1024
#define RING_WIDX    (RING_BASE + 0)
#define RING_RIDX    (RING_BASE + 4)
#define RING_DATA    (RING_BASE + 8)

void ring_push(uint8_t val) {
    sram_acquire();
    uint32_t widx = sram_read_word(RING_WIDX);
    sram_write_byte(RING_DATA + (widx % RING_SIZE), val);
    sram_write_word(RING_WIDX, widx + 1);
    sram_release();
}
```

```rust
// Shared ring buffer header (in SRAM)
// Offset 0: write_idx (producer updates)
// Offset 4: read_idx  (consumer updates)
// Offset 8: data[RING_SIZE]

const RING_BASE: u32 = 0x1F000;
const RING_SIZE: u32 = 1024;
const RING_WIDX: u32 = RING_BASE;
const RING_RIDX: u32 = RING_BASE + 4;
const RING_DATA: u32 = RING_BASE + 8;

fn ring_push(val: u8) {
    sram_acquire();
    let widx = sram_read_word(RING_WIDX);
    sram_write_byte(RING_DATA + (widx % RING_SIZE), val);
    sram_write_word(RING_WIDX, widx + 1);
    sram_release();
}
```
<!-- /tabs -->

## References

1. [23LC1024 - Microchip 1Mbit SPI Serial SRAM](https://www.microchip.com/en-us/product/23lc1024) — Product page with specs and documentation
2. [23LC1024 Datasheet](https://www.pjrc.com/teensy/23LC1024.pdf) — Command set, sequential mode, SQI interface details
3. [Dual Port RAM - Analog Devices](https://www.analog.com/en/resources/design-notes/dual-port-ram.html) — How dual-port SRAM arbitration works
4. [Asynchronous Dual-Port RAMs - Renesas](https://www.renesas.com/en/products/memory-logic/multi-port-memory/asynchronous-dual-port-rams) — Product family and contention resolution
5. [Memory Sharing Between Two Microcontrollers - Infineon](https://community.infineon.com/t5/SRAM/Memory-sharing-Between-two-microcontrollers/td-p/345889) — Community discussion of shared memory approaches

## Related Topics

- [SRAM](../../mcu-architecture/memory-architecture/sram.md) — How SRAM works at the cell level
- [SPI Protocol](../../mcu-peripherals-and-interrupts/spi-protocol.md) — SPI bus fundamentals for serial SRAM access
- [DMA Controller](dma-controller.md) — Accelerating SPI transfers with DMA
- [Static Allocation Patterns](static-allocation-patterns.md) — Ring buffers and memory pools
- [CH32V003 Parallel Image Processing](../mcu-families-compared/ch32v003-parallel-image-processing.md) — Applying shared RAM to the multi-MCU image processing case study
- [Parallel I/O and Multi-MCU Synchronization](../../mcu-peripherals-and-interrupts/parallel-io-and-multi-mcu-sync.md) — GPIO-level synchronization techniques
