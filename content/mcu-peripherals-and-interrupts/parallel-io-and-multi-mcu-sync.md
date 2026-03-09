---
title: "Parallel I/O and Multi-MCU Synchronization"
created: 2026-03-08
updated: 2026-03-08
tags: [parallel-io, synchronization, multi-mcu, handshake, gpio, bus]
status: draft
sources:
  - url: "https://www.st.com/resource/en/application_note/an4666-parallel-synchronous-transmission-using-gpio-and-dma-stmicroelectronics.pdf"
    title: "AN4666: Parallel Synchronous Transmission Using GPIO and DMA"
  - url: "https://circuitlabs.net/parallel-io-pario-interface/"
    title: "Parallel IO (ParIO) Interface"
  - url: "https://www.physicsforums.com/threads/recommend-architecture-protocol-to-sync-data-between-mcus.1078243/"
    title: "Recommend Architecture/Protocol to Sync Data Between MCUs"
  - url: "https://community.st.com/t5/stm32-mcus/how-to-implement-inter-processor-communication-in-an-stm32h7/ta-p/715704"
    title: "Inter-Processor Communication in STM32H7"
  - url: "https://workforce.libretexts.org/Bookshelves/Information_Technology/Information_Technology_Hardware/Advanced_Computer_Organization_Architecture_(Njoroge)/04:_Strategies_and_Interface_I_O/4.01:_Fundamentals_I_O-_handshake_and_buffering"
    title: "Fundamentals I/O: Handshake and Buffering"
---

Yes — you can absolutely synchronize multiple MCUs using parallel I/O. This page covers how to build parallel data buses between MCUs, the synchronization techniques that make them reliable, and when to use parallel I/O versus serial protocols.

## What is Parallel I/O?

Parallel I/O means transferring multiple bits **simultaneously** over multiple GPIO pins, as opposed to serial protocols (UART, SPI, I2C) that send bits one at a time.

```
Serial (UART):     ──┤D0├┤D1├┤D2├┤D3├┤D4├┤D5├┤D6├┤D7├──   1 pin, 8 clocks

Parallel (8-bit):  Pin 0  ──┤D0├──
                   Pin 1  ──┤D1├──
                   Pin 2  ──┤D2├──                           8 pins, 1 clock
                   Pin 3  ──┤D3├──
                   Pin 4  ──┤D4├──
                   Pin 5  ──┤D5├──
                   Pin 6  ──┤D6├──
                   Pin 7  ──┤D7├──
                   CLK    ──┤──├──
```

**Trade-off**: parallel uses more pins but transfers data faster per clock cycle.

## Building a Parallel Bus Between Two MCUs

### Minimum Signals

| Signal | Direction | Purpose |
|--------|-----------|---------|
| D0-D7 (or D0-D15) | Bidirectional | Data lines |
| CLK / STROBE | Sender → Receiver | "Data is valid — read now" |
| ACK / READY | Receiver → Sender | "I've read it — send next" |
| DIR (optional) | Either | Direction control for bidirectional bus |

### Hardware Connection

```
    MCU A                              MCU B
  ┌─────────┐                      ┌─────────┐
  │  PA0-PA7 ├──── D0-D7 ─────────┤ PB0-PB7  │  8-bit data bus
  │          │                      │          │
  │     PC0  ├──── STROBE ────────►│ PC0 (EXTI)│  "data ready" signal
  │          │                      │          │
  │ PC1(EXTI)│◄─── ACK ───────────┤ PC1      │  "data received" signal
  │          │                      │          │
  │     GND  ├──── GND ───────────┤ GND      │  common ground (essential!)
  └─────────┘                      └─────────┘
```

**Critical**: both MCUs must share a common ground. Without it, voltage levels are meaningless.

## Synchronization Method 1: Strobe Handshake

The simplest and most reliable method. The sender pulses a strobe line to say "data is valid"; the receiver acknowledges with an ACK pulse.

### Sender (MCU A)

<!-- tabs -->
```c
#define DATA_PORT   GPIOA
#define STROBE_PIN  GPIO_PIN_0   // PC0
#define ACK_PIN     GPIO_PIN_1   // PC1 (input, EXTI)
#define CTRL_PORT   GPIOC

void parallel_send(uint8_t data) {
    // 1. Put data on the bus
    DATA_PORT->ODR = (DATA_PORT->ODR & 0xFF00) | data;

    // 2. Pulse STROBE high — tells receiver "data is valid"
    CTRL_PORT->BSRR = STROBE_PIN;          // STROBE = 1

    // 3. Wait for ACK from receiver
    while (!(CTRL_PORT->IDR & ACK_PIN));    // wait for ACK = 1

    // 4. Release STROBE
    CTRL_PORT->BSRR = STROBE_PIN << 16;    // STROBE = 0

    // 5. Wait for ACK to drop (receiver ready for next byte)
    while (CTRL_PORT->IDR & ACK_PIN);       // wait for ACK = 0
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const GPIOA_ODR: *mut u32 = (0x4002_0000 + 0x14) as *mut u32;
const GPIOC_BSRR: *mut u32 = (0x4002_0800 + 0x18) as *mut u32;
const GPIOC_IDR: *const u32 = (0x4002_0800 + 0x10) as *const u32;
const STROBE_PIN: u32 = 1 << 0;  // PC0
const ACK_PIN: u32 = 1 << 1;     // PC1

unsafe fn parallel_send(data: u8) {
    // 1. Put data on the bus
    let odr = read_volatile(GPIOA_ODR);
    write_volatile(GPIOA_ODR, (odr & 0xFF00) | data as u32);

    // 2. Pulse STROBE high
    write_volatile(GPIOC_BSRR, STROBE_PIN);           // STROBE = 1

    // 3. Wait for ACK from receiver
    while read_volatile(GPIOC_IDR) & ACK_PIN == 0 {}   // wait for ACK = 1

    // 4. Release STROBE
    write_volatile(GPIOC_BSRR, STROBE_PIN << 16);     // STROBE = 0

    // 5. Wait for ACK to drop
    while read_volatile(GPIOC_IDR) & ACK_PIN != 0 {}   // wait for ACK = 0
}
```
<!-- /tabs -->

### Receiver (MCU B)

<!-- tabs -->
```c
volatile uint8_t rx_data;
volatile uint8_t data_ready = 0;

// EXTI ISR — fires on STROBE rising edge
void EXTI0_IRQHandler(void) {
    if (EXTI->PR & EXTI_PR_PR0) {
        EXTI->PR = EXTI_PR_PR0;             // clear pending

        // 1. Read data from bus
        rx_data = (DATA_PORT->IDR & 0xFF);

        // 2. Pulse ACK to sender
        CTRL_PORT->BSRR = ACK_PIN;          // ACK = 1
        data_ready = 1;

        // Small delay for sender to see ACK
        for (volatile int i = 0; i < 10; i++);

        CTRL_PORT->BSRR = ACK_PIN << 16;    // ACK = 0
    }
}

// Main loop processes received data
void main_loop(void) {
    while (1) {
        if (data_ready) {
            process(rx_data);
            data_ready = 0;
        }
    }
}
```

```rust
use core::ptr::{read_volatile, write_volatile};
use core::sync::atomic::{AtomicBool, AtomicU8, Ordering};

static RX_DATA: AtomicU8 = AtomicU8::new(0);
static DATA_READY: AtomicBool = AtomicBool::new(false);

const EXTI_PR: *mut u32 = (0x4001_3C00 + 0x14) as *mut u32;
const GPIOB_IDR: *const u32 = (0x4002_0400 + 0x10) as *const u32;  // DATA_PORT
const GPIOC_BSRR: *mut u32 = (0x4002_0800 + 0x18) as *mut u32;
const ACK_PIN: u32 = 1 << 1;

// EXTI ISR — fires on STROBE rising edge
#[no_mangle]
pub unsafe extern "C" fn EXTI0_IRQHandler() {
    if read_volatile(EXTI_PR) & (1 << 0) != 0 {
        write_volatile(EXTI_PR, 1 << 0);            // clear pending

        // 1. Read data from bus
        let data = (read_volatile(GPIOB_IDR) & 0xFF) as u8;
        RX_DATA.store(data, Ordering::Release);

        // 2. Pulse ACK to sender
        write_volatile(GPIOC_BSRR, ACK_PIN);        // ACK = 1
        DATA_READY.store(true, Ordering::Release);

        // Small delay for sender to see ACK
        for _ in 0..10 { core::hint::black_box(()); }

        write_volatile(GPIOC_BSRR, ACK_PIN << 16);  // ACK = 0
    }
}

// Main loop processes received data
fn main_loop() -> ! {
    loop {
        if DATA_READY.load(Ordering::Acquire) {
            process(RX_DATA.load(Ordering::Acquire));
            DATA_READY.store(false, Ordering::Release);
        }
    }
}
```
<!-- /tabs -->

### Timing Diagram

```
Data Bus:  ══╤════════════╤════════════╤══
             │  Byte 0    │  Byte 1    │
STROBE:   ___/‾‾‾‾‾‾‾‾‾‾‾\___________/‾‾‾
ACK:      ________/‾‾‾‾\______________/‾‾
                  ↑                   ↑
            Receiver reads      Receiver reads
```

## Synchronization Method 2: Clock-Synchronized (Fastest)

Instead of a handshake, use a shared clock. The sender drives data and clock; the receiver samples data on clock edges. This is essentially **a custom synchronous parallel bus** — similar to how the 8080 bus works.

<!-- tabs -->
```c
// Sender: output data, then pulse clock
void parallel_send_clocked(uint8_t *buf, uint32_t len) {
    for (uint32_t i = 0; i < len; i++) {
        DATA_PORT->ODR = (DATA_PORT->ODR & 0xFF00) | buf[i];
        __NOP(); __NOP();                    // setup time
        CLK_PORT->BSRR = CLK_PIN;           // CLK rising edge
        __NOP(); __NOP();                    // hold time
        CLK_PORT->BSRR = CLK_PIN << 16;     // CLK falling edge
    }
}
```

```rust
use core::arch::asm;
use core::ptr::{read_volatile, write_volatile};

unsafe fn parallel_send_clocked(buf: &[u8]) {
    for &byte in buf {
        let odr = read_volatile(DATA_PORT_ODR);
        write_volatile(DATA_PORT_ODR, (odr & 0xFF00) | byte as u32);
        asm!("nop"); asm!("nop");                     // setup time
        write_volatile(CLK_PORT_BSRR, CLK_PIN);      // CLK rising edge
        asm!("nop"); asm!("nop");                     // hold time
        write_volatile(CLK_PORT_BSRR, CLK_PIN << 16); // CLK falling edge
    }
}
```
<!-- /tabs -->

<!-- tabs -->
```c
// Receiver: EXTI on CLK rising edge, or use timer input capture
void EXTI_CLK_IRQHandler(void) {
    EXTI->PR = EXTI_PR_CLK;
    buffer[buf_idx++] = DATA_PORT->IDR & 0xFF;
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

static mut BUFFER: [u8; 256] = [0; 256];
static mut BUF_IDX: usize = 0;

// Receiver: EXTI on CLK rising edge
#[no_mangle]
pub unsafe extern "C" fn EXTI_CLK_IRQHandler() {
    write_volatile(EXTI_PR, EXTI_PR_CLK_BIT);
    BUFFER[BUF_IDX] = (read_volatile(DATA_PORT_IDR) & 0xFF) as u8;
    BUF_IDX += 1;
}
```
<!-- /tabs -->

**Speed**: with DMA + timer-driven GPIO, [ST's AN4666](https://www.st.com/resource/en/application_note/an4666-parallel-synchronous-transmission-using-gpio-and-dma-stmicroelectronics.pdf) demonstrates parallel transfers up to several MHz — far faster than UART or I2C.

## Synchronization Method 3: Shared Memory with Flag

If two MCUs share external SRAM (via a parallel bus), they can exchange data through predetermined memory addresses with flag-based synchronization:

<!-- tabs -->
```c
// Shared memory layout (both MCUs agree on this)
#define SHARED_BASE     0x60000000   // external SRAM via FSMC
#define FLAG_A_TO_B     (*(volatile uint32_t*)(SHARED_BASE + 0x000))
#define DATA_A_TO_B     (*(volatile uint32_t*)(SHARED_BASE + 0x004))
#define FLAG_B_TO_A     (*(volatile uint32_t*)(SHARED_BASE + 0x100))
#define DATA_B_TO_A     (*(volatile uint32_t*)(SHARED_BASE + 0x104))

// MCU A writes, MCU B reads
void mcu_a_send(uint32_t value) {
    while (FLAG_A_TO_B != 0);   // wait until B has consumed previous data
    DATA_A_TO_B = value;
    FLAG_A_TO_B = 1;            // signal: new data available
}

// MCU B polls for data
uint32_t mcu_b_receive(void) {
    while (FLAG_A_TO_B == 0);   // wait for new data
    uint32_t val = DATA_A_TO_B;
    FLAG_A_TO_B = 0;            // signal: data consumed
    return val;
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const SHARED_BASE: u32 = 0x6000_0000; // external SRAM via FSMC
const FLAG_A_TO_B: *mut u32 = SHARED_BASE as *mut u32;
const DATA_A_TO_B: *mut u32 = (SHARED_BASE + 0x004) as *mut u32;
// FLAG_B_TO_A and DATA_B_TO_A at +0x100, +0x104

// MCU A writes, MCU B reads
unsafe fn mcu_a_send(value: u32) {
    while read_volatile(FLAG_A_TO_B) != 0 {}  // wait until B consumed
    write_volatile(DATA_A_TO_B, value);
    write_volatile(FLAG_A_TO_B, 1);            // signal: new data available
}

// MCU B polls for data
unsafe fn mcu_b_receive() -> u32 {
    while read_volatile(FLAG_A_TO_B) == 0 {}   // wait for new data
    let val = read_volatile(DATA_A_TO_B);
    write_volatile(FLAG_A_TO_B, 0);            // signal: data consumed
    val
}
```
<!-- /tabs -->

This is the approach [described by a Bell Labs engineer](https://www.physicsforums.com/threads/recommend-architecture-protocol-to-sync-data-between-mcus.1078243/) for multi-MCU industrial systems — certain MCUs write to specific addresses, all MCUs can read any parameter.

## Bidirectional Parallel Bus

For two-way communication, you need direction control. Both MCUs can't drive the data lines simultaneously (bus contention → short circuit).

### Using a Direction Pin

<!-- tabs -->
```c
typedef enum { DIR_SEND, DIR_RECEIVE } BusDir_t;

void set_bus_direction(BusDir_t dir) {
    if (dir == DIR_SEND) {
        // Configure D0-D7 as outputs
        GPIOA->MODER &= ~0xFFFF;
        GPIOA->MODER |=  0x5555;   // 01 for each pin = output
    } else {
        // Configure D0-D7 as inputs
        GPIOA->MODER &= ~0xFFFF;   // 00 for each pin = input
    }
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const GPIOA_MODER: *mut u32 = 0x4002_0000 as *mut u32;

#[derive(PartialEq)]
enum BusDir { Send, Receive }

unsafe fn set_bus_direction(dir: BusDir) {
    let moder = read_volatile(GPIOA_MODER) & !0xFFFF; // clear D0-D7
    if dir == BusDir::Send {
        write_volatile(GPIOA_MODER, moder | 0x5555);  // 01 per pin = output
    } else {
        write_volatile(GPIOA_MODER, moder);            // 00 per pin = input
    }
}
```
<!-- /tabs -->

### Protocol

1. MCU A wants to send → asserts DIR pin, puts data, pulses STROBE
2. MCU B reads data, ACKs
3. MCU B wants to send → asserts DIR pin (or a separate REQ line), MCU A switches to input
4. Now MCU B drives data, pulses STROBE
5. MCU A reads, ACKs

## When to Use Parallel vs Serial

| Factor | Parallel GPIO | SPI | UART | I2C |
|--------|--------------|-----|------|-----|
| Speed | Very fast (MHz with DMA) | Fast (up to 50 MHz) | Moderate (up to ~1 Mbps) | Slow (100-400 kHz) |
| Pin count | 10-18 pins | 3-4 pins | 2 pins | 2 pins (shared bus) |
| Complexity | Medium | Low | Low | Medium |
| Multi-device | Hard (needs CS per device) | Easy (CS per device) | Point-to-point | Easy (addressing) |
| Distance | Short (<30 cm) | Short-medium | Long (with RS-485) | Short |
| Best for | High-speed bulk data, LCD, FPGA | Sensors, flash, ADC | Debug, config, logging | Sensors, EEPROMs |

### Use parallel I/O when:
- You need **maximum throughput** between two MCUs
- You have **spare GPIO pins** (8-16 data + 2-3 control)
- The MCUs are **physically close** (same board)
- You're interfacing with **parallel devices** (LCDs, external SRAM, FPGAs)

### Use serial (SPI/UART) instead when:
- Pins are scarce
- MCUs are far apart
- You need to connect many devices
- Throughput requirements are modest

## DMA-Accelerated Parallel I/O

For maximum speed, use DMA to transfer data between memory and GPIO without CPU involvement:

<!-- tabs -->
```c
// Timer triggers DMA at fixed intervals
// DMA reads from buffer[] and writes to GPIOA->ODR
// Result: parallel data output at timer frequency

// Configure DMA: memory → GPIO (peripheral)
DMA1_Stream5->PAR = (uint32_t)&GPIOA->ODR;   // destination: GPIO port
DMA1_Stream5->M0AR = (uint32_t)tx_buffer;      // source: memory buffer
DMA1_Stream5->NDTR = BUFFER_SIZE;              // transfer count
DMA1_Stream5->CR = DMA_SxCR_DIR_0              // memory → peripheral
                 | DMA_SxCR_MINC               // increment memory pointer
                 | DMA_SxCR_CIRC               // circular mode
                 | DMA_SxCR_EN;                // enable

// Timer generates DMA requests at desired data rate
TIM2->PSC = 0;
TIM2->ARR = 72 - 1;                           // 1 MHz at 72 MHz clock
TIM2->DIER = TIM_DIER_UDE;                    // update event → DMA request
TIM2->CR1 = TIM_CR1_CEN;                      // start timer
```

```rust
use core::ptr::write_volatile;

const DMA1_STREAM5_BASE: u32 = 0x4002_6000 + 0x10 + 5 * 0x18;
const DMA1_S5_PAR: *mut u32 = (DMA1_STREAM5_BASE + 0x08) as *mut u32;
const DMA1_S5_M0AR: *mut u32 = (DMA1_STREAM5_BASE + 0x0C) as *mut u32;
const DMA1_S5_NDTR: *mut u32 = (DMA1_STREAM5_BASE + 0x04) as *mut u32;
const DMA1_S5_CR: *mut u32 = DMA1_STREAM5_BASE as *mut u32;
const GPIOA_ODR: u32 = 0x4002_0000 + 0x14;

const TIM2_BASE: u32 = 0x4000_0000;

static TX_BUFFER: [u8; BUFFER_SIZE] = [0; BUFFER_SIZE];

unsafe {
    // Configure DMA: memory -> GPIO (peripheral)
    write_volatile(DMA1_S5_PAR, GPIOA_ODR);                // destination: GPIO port
    write_volatile(DMA1_S5_M0AR, TX_BUFFER.as_ptr() as u32); // source: memory buffer
    write_volatile(DMA1_S5_NDTR, BUFFER_SIZE as u32);       // transfer count
    write_volatile(DMA1_S5_CR,
          (1 << 6)    // DIR: memory -> peripheral
        | (1 << 10)   // MINC: increment memory pointer
        | (1 << 8)    // CIRC: circular mode
        | (1 << 0));  // EN: enable

    // Timer generates DMA requests at desired data rate
    write_volatile((TIM2_BASE + 0x28) as *mut u32, 0);     // PSC = 0
    write_volatile((TIM2_BASE + 0x2C) as *mut u32, 72 - 1); // ARR: 1 MHz at 72 MHz
    write_volatile((TIM2_BASE + 0x0C) as *mut u32, 1 << 8); // DIER: UDE
    write_volatile(TIM2_BASE as *mut u32, 1 << 0);          // CR1: CEN
}
```
<!-- /tabs -->

This produces a continuous 1 MHz parallel output — [ST's AN4666](https://www.st.com/resource/en/application_note/an4666-parallel-synchronous-transmission-using-gpio-and-dma-stmicroelectronics.pdf) describes this exact technique for GPIO-based parallel transmission.

## Multi-MCU Synchronization Patterns

### Pattern 1: Master-Slave with Interrupt

One MCU is the master; it initiates all transfers. Slaves respond.

```
Master MCU                        Slave MCU
    │                                 │
    ├── DATA on bus ──────────────────┤
    ├── STROBE pulse ─────► EXTI ISR ─┤
    │                     reads data  │
    │◄── ACK pulse ───── sends ACK ──┤
    │                                 │
```

### Pattern 2: Token-Passing (Multiple Slaves)

A shared bus with multiple MCUs. A "token" signal determines who can drive the bus:

```
         ┌─────── DATA BUS (shared) ──────┐
         │                                 │
    MCU A (master)    MCU B (slave)    MCU C (slave)
      CS_B ──────────► CS (input)
      CS_C ──────────────────────────► CS (input)
```

Only the MCU whose CS is asserted responds. Others keep their data pins as inputs (high-impedance).

### Pattern 3: Dual-Port RAM

For tight synchronization, use dedicated dual-port SRAM (like IDT7130). Both MCUs have independent access ports — no bus contention. Hardware arbitration handles simultaneous access.

### Pattern 4: HSEM (Hardware Semaphore)

Dual-core MCUs like the STM32H7 have [hardware semaphores (HSEM)](https://community.st.com/t5/stm32-mcus/how-to-implement-inter-processor-communication-in-an-stm32h7/ta-p/715704) — atomic lock/unlock at the register level for inter-core synchronization without disabling interrupts.

## Common Pitfalls

1. **Bus contention** — two MCUs driving the same line simultaneously. Always ensure only one drives at a time (use direction control or open-drain with pull-ups)
2. **Missing common ground** — voltage levels are relative. Without shared ground, logic levels are undefined
3. **Timing violations** — data must be stable before the clock/strobe edge (setup time) and remain stable after (hold time). Add `__NOP()` instructions if needed
4. **Signal integrity** — long wires pick up noise. Keep parallel connections short (<30 cm), use ground wires between data lines for longer runs
5. **Voltage mismatch** — if MCUs run at different voltages (3.3V vs 5V), use level shifters or voltage-tolerant pins

## References

1. [AN4666: Parallel Synchronous Transmission Using GPIO and DMA](https://www.st.com/resource/en/application_note/an4666-parallel-synchronous-transmission-using-gpio-and-dma-stmicroelectronics.pdf) — ST application note on DMA-driven parallel GPIO transfers
2. [Parallel IO (ParIO) Interface](https://circuitlabs.net/parallel-io-pario-interface/) — Overview of parallel bus signals, timing, and protocols
3. [Recommend Architecture/Protocol to Sync Data Between MCUs](https://www.physicsforums.com/threads/recommend-architecture-protocol-to-sync-data-between-mcus.1078243/) — Practical advice on shared memory and hardware handshaking between MCUs
4. [Inter-Processor Communication in STM32H7](https://community.st.com/t5/stm32-mcus/how-to-implement-inter-processor-communication-in-an-stm32h7/ta-p/715704) — HSEM and mailbox-based IPC on dual-core STM32
5. [Fundamentals I/O: Handshake and Buffering](https://workforce.libretexts.org/Bookshelves/Information_Technology/Information_Technology_Hardware/Advanced_Computer_Organization_Architecture_(Njoroge)/04:_Strategies_and_Interface_I_O/4.01:_Fundamentals_I_O-_handshake_and_buffering) — Strobe vs handshake synchronization theory

## Related Topics

- [GPIO at Register Level](gpio-register-level.md) — configuring pins as input/output for the data bus
- [Timers and Counters](timers-and-counters.md) — generating clock signals for synchronous parallel transfers
- [DMA Controller](../mcu-toolchain-and-practice/memory-management-in-practice/dma-controller.md) — DMA-driven GPIO for maximum throughput
- [Interrupt System](interrupt-system/index.md) — EXTI for strobe/clock edge detection
- [SPI Protocol](spi-protocol.md) — serial alternative when pins are limited
