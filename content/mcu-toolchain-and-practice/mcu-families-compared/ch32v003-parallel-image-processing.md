---
title: "Case Study: CH32V003 Array for Image Processing"
created: 2026-03-08
updated: 2026-03-08
tags: [ch32v003, risc-v, parallel-processing, image-processing, multi-mcu]
status: draft
sources:
  - url: "https://github.com/openwch/ch32v003"
    title: "CH32V003 - Ultra-Cheap RISC-V MCU (Official GitHub)"
  - url: "https://components101.com/ics/ch32v003-32-bit-general-purpose-risc-v-mcu"
    title: "CH32V003 Specifications and Pinout"
  - url: "https://github.com/cnlohr/ch32fun"
    title: "ch32fun - Open Source Minimal Stack for CH32V"
  - url: "https://hackaday.com/tag/parallel-processing/"
    title: "Parallel Processing Projects - Hackaday"
  - url: "https://www.st.com/resource/en/application_note/an4666-parallel-synchronous-transmission-using-gpio-and-dma-stmicroelectronics.pdf"
    title: "AN4666: Parallel Synchronous Transmission Using GPIO and DMA"
---

Can you build a parallel image processor from arrays of [CH32V003](https://github.com/openwch/ch32v003) chips — a $0.10 RISC-V MCU? Yes, but the constraints are severe and shape the entire architecture. This page works through the math, the hardware design, and the real trade-offs.

## CH32V003 Specifications — What You're Working With

| Spec | Value | Implication |
|------|-------|-------------|
| Core | QingKe RV32EC @ 48 MHz | ~24 MIPS, no multiply-accumulate, no FPU |
| SRAM | **2 KB** (2048 bytes) | Can hold ~2048 grayscale pixels or ~682 RGB pixels |
| Flash | 16 KB | Code space only — not much room for lookup tables |
| GPIO | 18 pins max (TSSOP20/QFN20) | 8 data + control leaves ~7 pins for I/O to camera/neighbors |
| DMA | 7 channels | Can move data GPIO↔SRAM without CPU |
| ADC | 10-bit, 8 external channels | Could digitize analog video directly |
| SPI | 1x (up to 24 MHz) | Serial data distribution alternative |
| I2C | 1x | Too slow for image data, fine for configuration |
| USART | 1x | Up to ~2 Mbps, modest throughput |
| Price | ~$0.10 USD | Cost is essentially irrelevant |
| Voltage | 3.3V or 5V | Easy mixed-voltage systems |

**The bottleneck is the 2 KB SRAM.** Everything else flows from this constraint.

## The Fundamental Problem: 2 KB per Chip

Let's see how much image data 2 KB holds:

| Image Size | Grayscale (1 bpp) | RGB (3 bpp) | Fits in 2 KB? |
|------------|-------------------|-------------|---------------|
| 16 x 16 | 256 B | 768 B | Yes |
| 32 x 32 | 1024 B | 3072 B | Grayscale only |
| 64 x 64 | 4096 B | 12288 B | No |
| 160 x 120 (QQVGA) | 19.2 KB | 57.6 KB | No |
| 320 x 240 (QVGA) | 76.8 KB | 230.4 KB | No |
| 640 x 480 (VGA) | 307.2 KB | 921.6 KB | No |

But you also need SRAM for:
- Stack (~256-512 bytes)
- Variables, buffers, output data
- Code variables (.data, .bss)

**Realistic usable pixel buffer: ~1.2-1.5 KB per chip**, or roughly a **32x40 grayscale tile**.

## How Many CH32V003s for Common Resolutions?

### Tile-Based Decomposition

Split the image into tiles, one tile per chip:

| Resolution | Pixels | Tile Size (per chip) | Chips Needed | Cost |
|------------|--------|---------------------|-------------|------|
| 64 x 64 | 4,096 | 16 x 16 (256 B) | 16 | $1.60 |
| 160 x 120 | 19,200 | 16 x 15 (240 B) | 80 | $8.00 |
| 320 x 240 | 76,800 | 20 x 15 (300 B) | 256 | $25.60 |
| 640 x 480 | 307,200 | 20 x 15 (300 B) | 1,024 | $102.40 |

These numbers assume grayscale, ~300 bytes per tile to leave room for code variables and stack.

**For a QVGA (320x240) grayscale image: ~256 chips.**

### Row-Based (Streaming) Decomposition

Instead of tiles, process one row at a time. Each chip handles a few rows:

| Resolution | Rows | Bytes/Row | Rows per Chip | Chips (pipeline) |
|------------|------|-----------|---------------|-----------------|
| 160 x 120 | 120 | 160 B | 8 rows (1280 B) | 15 |
| 320 x 240 | 240 | 320 B | 4 rows (1280 B) | 60 |
| 640 x 480 | 480 | 640 B | 2 rows (1280 B) | 240 |

Row-based is more efficient for streaming operations (convolutions, edge detection) where you process sequentially.

## Architecture Options

### Option A: Star Topology — One Controller, Many Workers

```
                    ┌──── Worker 0  (tile 0)
                    ├──── Worker 1  (tile 1)
  Controller ───SPI─┼──── Worker 2  (tile 2)
  (STM32F4)         ├──── Worker 3  (tile 3)
                    ├──── ...
                    └──── Worker N  (tile N)
```

- **Controller**: a more capable MCU (STM32F4, ESP32, RP2040) captures the image from a camera, splits it into tiles, and distributes via SPI daisy-chain or parallel bus
- **Workers**: CH32V003 chips, each receives one tile, processes it, returns result
- **SPI daisy-chain**: connect MOSI→MISO through each chip. Data flows through the chain like a shift register

**Pros**: simple, controller handles coordination
**Cons**: SPI distribution is serial — 76.8 KB at 24 MHz SPI = ~26 ms just to distribute QVGA

### Option B: 2D Grid — Neighbor Communication

```
  ┌─────┬─────┬─────┬─────┐
  │ 0,0 │ 0,1 │ 0,2 │ 0,3 │    Each chip talks to
  ├─────┼─────┼─────┼─────┤    its 4 neighbors via
  │ 1,0 │ 1,1 │ 1,2 │ 1,3 │    GPIO parallel bus
  ├─────┼─────┼─────┼─────┤
  │ 2,0 │ 2,1 │ 2,2 │ 2,3 │    Edge data shared for
  ├─────┼─────┼─────┼─────┤    convolution kernels
  │ 3,0 │ 3,1 │ 3,2 │ 3,3 │
  └─────┴─────┴─────┴─────┘
```

Each chip has GPIO connections to its north, south, east, west neighbors. This enables **halo exchange** — sharing border pixels needed for convolution filters.

**Pin budget for a grid node (TSSOP20, 18 GPIO):**

| Function | Pins Used |
|----------|-----------|
| Data bus to north neighbor | 4 pins (nibble) |
| Data bus to south neighbor | 4 pins (nibble) |
| STROBE in / out | 2 pins |
| ACK in / out | 2 pins |
| SPI (from controller) | 3 pins (SCK, MOSI, CS) |
| Status / sync | 1 pin |
| **Total** | **16 pins** |

Only 2 spare pins. A 4-bit nibble bus means transferring 1 byte takes 2 cycles — slower but feasible.

**Pros**: true parallel processing, scales naturally, local communication is fast
**Cons**: complex PCB routing, needs halo exchange protocol, programming/debugging 256 chips is hard

### Option C: Pipeline — Each Stage Processes Sequentially

```
Camera → [Stage 1: Bayer→Gray] → [Stage 2: Gaussian blur] → [Stage 3: Edge detect] → Output
           CH32V003 × 4           CH32V003 × 4               CH32V003 × 4
```

Each stage is a group of CH32V003s doing one operation. Data streams row-by-row through the pipeline. While stage 3 processes frame N, stage 2 processes frame N+1, stage 1 processes frame N+2.

**Pros**: naturally maps to image processing chains, simpler data flow
**Cons**: latency of N pipeline stages, each stage must match throughput

## Data Distribution: The Real Bottleneck

The critical question is not compute — it's **how fast you can move pixel data into and out of each chip**.

### SPI (Serial)

```
24 MHz SPI, 8-bit frames
Throughput: 3 MB/s
Time to fill 1.2 KB buffer: 0.4 ms
Time to distribute 320x240 grayscale: 25.6 ms → ~39 fps max (distribution only)
```

### Parallel GPIO (8-bit bus + clock)

```
8 data pins + 1 clock, conservative 4 MHz clock
Throughput: 4 MB/s
Time to fill 1.2 KB buffer: 0.3 ms
Time to distribute 320x240: 19.2 ms → ~52 fps
```

### DMA + Timer Parallel GPIO

Using the CH32V003's DMA and timer to [drive GPIO automatically](../../../mcu-peripherals-and-interrupts/parallel-io-and-multi-mcu-sync.md):

```
Timer-triggered DMA at 12 MHz (48 MHz / 4)
Throughput: 12 MB/s (theoretical, 4-bit nibble = 6 MB/s effective)
But: only 7 DMA channels, shared with other peripherals
```

### Bottom Line

| Method | QVGA Distribution Time | Achievable FPS |
|--------|----------------------|---------------|
| SPI daisy-chain | ~26 ms | ~38 fps |
| 8-bit parallel from controller | ~19 ms | ~52 fps |
| SPI broadcast (shared MOSI, individual CS) | ~26 ms per chip, but parallel | Depends on grouping |
| Pre-loaded (chips read from shared bus simultaneously) | ~0.3 ms per chip | High, but complex |

Distribution overhead dominates. The actual processing per chip at 48 MHz is fast — a 3x3 convolution on a 32x40 tile takes ~50,000 cycles = ~1 ms.

## What Operations Can a CH32V003 Realistically Do?

At 48 MHz with RV32EC (no hardware multiply, compressed instructions only):

| Operation | Cycles per Pixel | Time for 1280 pixels (32x40) | Feasible? |
|-----------|-----------------|------------------------------|-----------|
| Threshold (compare + branch) | ~5 | 0.13 ms | Easy |
| Invert (XOR 0xFF) | ~4 | 0.11 ms | Easy |
| Brightness/contrast (add + clamp) | ~10 | 0.27 ms | Easy |
| 3x3 convolution (9 multiplies + add) | ~80-120* | 2.1-3.2 ms | Possible |
| Histogram (256-bin, 256B) | ~8 | 0.21 ms | Easy |
| Sobel edge detect (two 3x3 kernels) | ~200* | 5.3 ms | Slow |
| Median filter 3x3 (sort 9 values) | ~150 | 4.0 ms | Slow |
| Binary morphology (dilate/erode) | ~20 | 0.53 ms | Easy |

*RV32EC has **no hardware multiply** — `MUL` is emulated in software (~30-40 cycles). This makes convolutions painful. Workaround: use shift-and-add for power-of-2 kernel coefficients (e.g., box filter, Gaussian approximation).

### Software Multiply Workaround

<!-- tabs -->
```c
// 3x3 box filter: all coefficients are 1, divide by 9
// Avoid multiply: sum 9 pixels, then approximate /9
// 9 ≈ 8 + 1, so x/9 ≈ (x >> 3) - (x >> 6) + (x >> 9)
uint8_t box_filter_3x3(uint8_t *pixels, int stride) {
    uint16_t sum = 0;
    for (int dy = -1; dy <= 1; dy++)
        for (int dx = -1; dx <= 1; dx++)
            sum += pixels[dy * stride + dx];
    // Approximate division by 9 using shifts
    return (uint8_t)((sum >> 3) + (sum >> 6));
}
```

```rust
/// 3x3 box filter: all coefficients are 1, divide by 9
/// Avoid multiply: sum 9 pixels, then approximate /9
fn box_filter_3x3(pixels: &[u8], center: usize, stride: usize) -> u8 {
    let offsets: [isize; 9] = [
        -(stride as isize) - 1, -(stride as isize), -(stride as isize) + 1,
        -1,                      0,                   1,
         (stride as isize) - 1,  (stride as isize),  (stride as isize) + 1,
    ];
    let sum: u16 = offsets.iter()
        .map(|&off| pixels[(center as isize + off) as usize] as u16)
        .sum();
    // Approximate division by 9 using shifts
    ((sum >> 3) + (sum >> 6)) as u8
}
```
<!-- /tabs -->

## The Halo Problem

Convolution filters need neighboring pixels. A 3x3 kernel on the edge of a tile needs 1 pixel from the adjacent tile. Each chip must exchange **border pixels** (the "halo") with its neighbors.

```
  Chip A tile          Halo exchange         Chip B tile
┌──────────┐                              ┌──────────┐
│          │◄──── 1-pixel column ────────►│          │
│  32 x 40 │      (40 bytes, both dirs)   │  32 x 40 │
│          │                              │          │
└──────────┘                              └──────────┘
```

For a 3x3 kernel: exchange 1 row/column with each neighbor. For 5x5: exchange 2 rows/columns.

**Halo cost per chip**: 4 neighbors x 40 bytes = 160 bytes transferred. At 4 MHz parallel: ~40 us. Negligible.

**But**: the halo exchange requires synchronization — all chips must finish loading before any chip starts processing. This is a **barrier synchronization** problem.

### Barrier Sync with a Shared Signal

```
Controller raises SYNC pin → all chips begin processing
All chips finish → each asserts DONE pin
Controller detects all DONE → raises SYNC for next phase
```

With 256 chips, wire-AND the DONE pins (open-drain, one pull-up). When all chips release, the line goes high — single-wire barrier completion.

## Adding External Shared RAM

The 2 KB SRAM bottleneck changes dramatically with [external shared RAM](../../memory-management-in-practice/external-shared-ram.md). An SPI SRAM chip like the 23LC1024 (128 KB, ~$0.60) gives the array a shared memory pool 64x larger than a single chip's internal RAM.

### Revised Architecture with Shared SPI SRAM

```
                          23LC1024         23LC1024
  Camera ── Controller    (128 KB)         (128 KB)
             (STM32F4)   SPI bus #0        SPI bus #1
                 │        │  │  │  │        │  │  │  │
                 │       W0  W1 W2 W3      W4  W5 W6 W7
                 │       CH32V003 ×4       CH32V003 ×4
                 │
                 ├── SYNC pin (broadcast to all workers)
                 └── reads DONE pins (wire-AND)
```

**Workflow with shared SRAM**:
1. Controller captures QVGA frame (76.8 KB) into two 23LC1024 chips (38.4 KB each)
2. Controller writes tile assignments to mailbox regions
3. Each worker acquires the SPI token, reads its tile (~1.3 KB), releases the token
4. Workers process locally in their 2 KB internal SRAM — all in parallel
5. Workers acquire token one at a time, write results back to shared SRAM
6. Controller reads results from shared SRAM

**Revised count**: with shared SRAM holding the full frame, you need far fewer workers — limited only by compute throughput, not memory. **8 workers with 2 shared SRAMs** can process QVGA at ~15-22 fps for simple filters. Total BOM: ~$2 in chips.

See [External Shared RAM](../../memory-management-in-practice/external-shared-ram.md) for full details on arbitration, memory maps, and throughput analysis.

## Practical Design Considerations

### PCB Complexity

256 CH32V003 chips on a PCB:
- **Power**: 256 × ~5 mA (active) = 1.28 A at 3.3V = 4.2W. Manageable with proper decoupling.
- **Decoupling caps**: 256 × 100nF = 256 capacitors minimum
- **Routing**: if grid topology, each chip connects to 4 neighbors + SPI bus + sync. Multilayer PCB required (4+ layers).
- **Board size**: QFN20 is 3x3mm. With spacing: ~8x8mm per chip. 16x16 grid = 128mm x 128mm (~5" x 5"). Achievable.

### Programming and Debugging

Flashing 256 chips individually via single-wire debug is impractical. Solutions:
- **SPI bootloader**: controller broadcasts firmware update over the shared SPI bus. Each chip has a small bootloader in protected flash.
- **Shared flash image**: all chips run identical firmware. Tile coordinates are set via hard-wired address pins (3-4 GPIO pins encoding chip ID) or assigned at boot via SPI command.

### Clock Synchronization

Each chip runs its own 48 MHz internal RC oscillator (±1% accuracy). Over 1 ms of processing, clocks can drift by ~10 ns. For image processing, this is fine — synchronization points (barriers) re-align execution.

For tighter sync, distribute a common external clock to all chips. The CH32V003 supports an external 4-25 MHz oscillator input.

### Cost Comparison

| Approach | Parts Cost | Processing Power |
|----------|-----------|-----------------|
| 256× CH32V003 | ~$30 (chips + passives) | 256 × 24 MIPS = 6,144 MIPS total |
| 1× STM32F407 | ~$8 | 210 MIPS, 192 KB SRAM |
| 1× ESP32-S3 | ~$3 | 480 MIPS (dual core), 512 KB SRAM, SIMD |
| 1× RP2040 | ~$1 | 266 MIPS (dual core), 264 KB SRAM |
| 1× FPGA (iCE40) | ~$5 | True pixel-level parallelism |

**The CH32V003 array wins on raw aggregate MIPS but loses badly on practical throughput** because of data distribution overhead and the lack of hardware multiply. A single STM32F4 with 192 KB SRAM can hold an entire QVGA frame and process it with hardware multiply and DSP instructions.

## When This Approach Actually Makes Sense

The CH32V003 array is compelling in a few specific scenarios:

1. **Sensor arrays** — each chip reads its own local sensor (photodiode, ADC) and processes locally. No distribution bottleneck because data is generated in-place.

2. **Binary image processing** — thresholding, morphology, connected-component labeling. These are cheap operations that don't need multiply.

3. **Pixel-level neural network inference** — each chip runs a tiny classifier on its tile. Results are 1 bit (detected / not detected). Output bandwidth is trivial.

4. **Learning exercise** — building a multi-MCU parallel computer is an excellent way to learn about distributed computing, synchronization, and hardware design.

5. **Art / installations** — LED matrix controllers where each chip drives a small section with local animation logic.

### If You Actually Want to Process Images on MCUs

Use a single more capable chip:
- **ESP32-S3**: 512 KB SRAM, SIMD instructions, camera interface, ~$3
- **STM32H7**: 1 MB SRAM, Cortex-M7 with FPU+DSP, 480 MHz
- **RP2040**: PIO state machines can implement custom parallel camera interfaces

Or combine: one capable MCU captures the image + a few CH32V003s for specific parallel subtasks.

## References

1. [CH32V003 Official GitHub](https://github.com/openwch/ch32v003) — Datasheets, reference manual, and examples for the CH32V003
2. [CH32V003 Specifications and Pinout](https://components101.com/ics/ch32v003-32-bit-general-purpose-risc-v-mcu) — Complete pin, peripheral, and package details
3. [ch32fun - Open Source Minimal Stack](https://github.com/cnlohr/ch32fun) — Bare-metal development framework for CH32V003
4. [Parallel Processing Projects - Hackaday](https://hackaday.com/tag/parallel-processing/) — Community projects including MCU clusters
5. [AN4666: Parallel Synchronous Transmission Using GPIO and DMA](https://www.st.com/resource/en/application_note/an4666-parallel-synchronous-transmission-using-gpio-and-dma-stmicroelectronics.pdf) — DMA-driven parallel data transfer technique

## Related Topics

- [RISC-V Microcontrollers](risc-v-microcontrollers.md) — CH32V003 architecture and ISA context
- [Choosing an MCU](choosing-an-mcu.md) — Decision framework for picking the right chip
- [Parallel I/O and Multi-MCU Synchronization](../../../mcu-peripherals-and-interrupts/parallel-io-and-multi-mcu-sync.md) — GPIO handshake and sync techniques
- [DMA Controller](../../memory-management-in-practice/dma-controller.md) — DMA-driven data transfers
- [External Shared RAM](../../memory-management-in-practice/external-shared-ram.md) — SPI SRAM, dual-port RAM, and shared memory patterns
