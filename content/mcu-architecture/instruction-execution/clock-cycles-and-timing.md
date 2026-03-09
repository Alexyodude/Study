---
title: "Clock Cycles and Timing"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, clock-cycles, cpi, timing, wait-states, mips, arm, cortex-m]
status: draft
sources:
  - url: "https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/"
    title: "Instruction Pipeline in ARM Cortex-M Series"
  - url: "https://en.wikipedia.org/wiki/ARM_Cortex-M"
    title: "ARM Cortex-M - Wikipedia"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
---

## Clock Cycles: The CPU's Heartbeat

Every operation inside the CPU is synchronized to the **clock signal** -- a square wave that toggles between high and low at a fixed frequency. One complete high-low cycle is one **clock cycle**.

```
        ___     ___     ___     ___
  CLK: |   |   |   |   |   |   |   |
       |   |___|   |___|   |___|   |___
       <------->
       1 cycle

  At 72 MHz: 1 cycle = 1/72,000,000 s = ~13.9 ns
```

Everything in the CPU happens on clock edges. One instruction might take 1 cycle; a memory load might take 2. The clock frequency determines how fast instructions complete.

## CPI: Cycles Per Instruction

**CPI** measures how many clock cycles an instruction takes to complete. [ARM Cortex-M processors](https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/) are designed for low CPI -- most register-to-register operations complete in a single cycle.

### Cortex-M3/M4 Instruction Timing

| Instruction Category | Example | Cycles |
|---|---|---|
| Data processing (register) | `ADD R0, R1, R2` | 1 |
| Data processing (immediate) | `ADD R0, R0, #5` | 1 |
| Move | `MOV R0, R1` | 1 |
| Compare | `CMP R0, #10` | 1 |
| Multiply | `MUL R0, R1, R2` | 1 |
| Divide | `UDIV R0, R1, R2` | 2--12 |
| Load word | `LDR R0, [R1]` | 2 |
| Store word | `STR R0, [R1]` | 2 |
| Load multiple | `LDM R0, {R1-R4}` | 1 + N (N=4) |
| Branch (not taken) | `BNE label` | 1 |
| Branch (taken) | `BNE label` | 1 + pipeline refill |
| Branch with link | `BL function` | 1 + pipeline refill |

### Average CPI

For typical embedded code, the average CPI on Cortex-M3/M4 is around **1.2 to 1.7** -- most instructions are 1-cycle, but memory accesses and branches bring the average up.

## Flash Wait States and Their Impact

Flash memory is slower than the CPU core. At high clock speeds, the flash can't deliver data in a single cycle, so the CPU must insert **wait states** (stall cycles).

### Impact on Performance

Without mitigation, a 168 MHz Cortex-M4 with 5 wait states would need **6 cycles** to fetch each instruction from flash -- reducing effective performance to about 28 MIPS instead of 168 MIPS.

### Mitigation: Prefetch and Cache

STM32F4 devices include the **ART (Adaptive Real-Time) Accelerator**:

| Feature | Effect |
|---|---|
| **Prefetch buffer** | Fetches the next flash line while current instructions execute |
| **Instruction cache** (64 lines) | Caches recently-used code; loops run at 0 wait states |
| **Data cache** (8 lines) | Caches recently-read constants |

With the ART accelerator enabled, most code runs as if flash had 0 wait states:

<!-- tabs -->
```c
// Enable ART accelerator (do this early in startup)
FLASH->ACR |= FLASH_ACR_PRFTEN    // Prefetch enable
           |  FLASH_ACR_ICEN      // Instruction cache enable
           |  FLASH_ACR_DCEN;     // Data cache enable
```

```rust
// Using PAC
let flash = unsafe { &*pac::FLASH::ptr() };
flash.acr.modify(|_, w| {
    w.prften().set_bit()   // Prefetch enable
     .icen().set_bit()     // Instruction cache enable
     .dcen().set_bit()     // Data cache enable
});

// With stm32f4xx-hal, the ART accelerator is enabled automatically
// when calling rcc.cfgr.freeze() based on the target SYSCLK frequency.
```
<!-- /tabs -->

### Measuring Real Impact

```
  Tight loop performance (STM32F407 at 168 MHz):
    ART disabled: ~45 MIPS (limited by wait states)
    ART enabled:  ~210 MIPS (cache hides wait states)
```

## Deterministic Timing in Embedded Systems

A key advantage of [Cortex-M processors](https://embeddedsecurity.io/sec-arm-arch-core) is **timing predictability**. Unlike desktop CPUs with out-of-order execution, branch prediction, and multi-level caches that make cycle counts unpredictable, Cortex-M (M0 through M4) has:

- In-order execution only
- Fixed-cycle instruction timing (published in the Technical Reference Manual)
- Simple or no cache (results are predictable)
- No speculative execution

### Why This Matters

**Bit-banging:** Generating precise waveforms in software (e.g., WS2812B LED protocol requires 400 ns / 800 ns timing):

```arm
@ Each NOP takes exactly 1 cycle = 13.9 ns at 72 MHz
@ To generate a 400 ns pulse: need ~29 cycles
    STR  R1, [R0]     @ Set pin high (2 cycles)
    NOP                @ 1 cycle each
    NOP
    @ ... (total NOPs calculated for exact timing)
    STR  R2, [R0]     @ Set pin low (2 cycles)
```

**Interrupt latency:** Cortex-M3/M4 guarantees interrupt entry in **12 cycles** (from interrupt assertion to first handler instruction). This is deterministic and documented.

**Real-time control:** Motor control loops, PID controllers, and safety-critical code depend on instructions taking a known number of cycles.

## MIPS vs Real Throughput

**MIPS (Million Instructions Per Second)** is a simple metric:

```
  MIPS = Clock Frequency / Average CPI / 1,000,000
```

For a Cortex-M4 at 168 MHz with average CPI of 1.5:

```
  MIPS = 168,000,000 / 1.5 / 1,000,000 = 112 MIPS
```

### Why MIPS Can Be Misleading

- Different instructions do different amounts of work (a `MUL` does more useful computation than a `NOP`)
- MIPS doesn't account for memory access patterns
- Cache hits vs misses change effective throughput dramatically

**CoreMark** is a more meaningful benchmark for embedded processors. It measures real workload performance:

| Processor | Clock | CoreMark | CoreMark/MHz |
|---|---|---|---|
| Cortex-M0 | 48 MHz | 64 | 1.33 |
| Cortex-M3 | 72 MHz | 126 | 1.75 |
| Cortex-M4 | 168 MHz | 399 | 2.38 |
| Cortex-M7 | 480 MHz | 2400 | 5.00 |

CoreMark/MHz shows architectural efficiency independent of clock speed. Cortex-M7's dual-issue pipeline makes it significantly more efficient per clock than M0.

## Calculating Execution Time

To estimate how long a function takes:

```
  Time = Number_of_cycles * (1 / Clock_frequency)

  Example: 500 instructions, average 1.5 CPI, 72 MHz clock
    Cycles = 500 * 1.5 = 750
    Time   = 750 / 72,000,000 = 10.4 us
```

For precise measurement, use the **DWT Cycle Counter** (Data Watchpoint and Trace, available on Cortex-M3/M4/M7):

<!-- tabs -->
```c
// Enable cycle counter
CoreDebug->DEMCR |= CoreDebug_DEMCR_TRCENA_Msk;
DWT->CYCCNT = 0;
DWT->CTRL |= DWT_CTRL_CYCCNTENA_Msk;

// Measure
uint32_t start = DWT->CYCCNT;
my_function();
uint32_t cycles = DWT->CYCCNT - start;
```

```rust
// Using cortex-m crate for DWT cycle counter
use cortex_m::peripheral::{DWT, DCB};

let mut core = cortex_m::Peripherals::take().unwrap();

// Enable the DWT cycle counter
core.DCB.enable_trace();
DWT::unlock();
core.DWT.enable_cycle_counter();

// Measure
let start = DWT::cycle_count();
my_function();
let cycles = DWT::cycle_count().wrapping_sub(start);
```
<!-- /tabs -->

## References

1. [Instruction Pipeline in ARM Cortex-M Series](https://s-o-c.org/what-is-instruction-pipeline-in-arm-cortex-m-series/) — CPI analysis and pipeline timing for Cortex-M
2. [ARM Cortex-M - Wikipedia](https://en.wikipedia.org/wiki/ARM_Cortex-M) — CoreMark benchmarks and Cortex-M performance comparison
3. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Deterministic timing and real-time execution guarantees

## Related Topics

- [Fetch-Decode-Execute](fetch-decode-execute.md) -- the stages that consume clock cycles
- [Pipeline Basics](pipeline-basics.md) -- how pipelining achieves 1 CPI for most instructions
- [Flash Memory](../memory-architecture/flash-memory.md) -- wait states and the ART accelerator
- [Clock Sources and Tree](../clock-and-power-system/clock-sources-and-tree.md) -- where the clock frequency comes from
