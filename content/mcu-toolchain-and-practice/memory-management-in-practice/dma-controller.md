---
title: "DMA Controller"
created: 2026-03-08
updated: 2026-03-08
tags: [dma, memory, peripheral, embedded, stm32]
status: draft
sources:
  - url: "https://deepbluembedded.com/stm32-dma-tutorial-using-direct-memory-access-dma-in-stm32/"
    title: "STM32 DMA Tutorial - Using Direct Memory Access in STM32"
  - url: "https://controllerstech.com/stm32-uart-4-receive-data-using-dma/"
    title: "STM32 UART DMA Receive Example - Normal and Circular Mode"
  - url: "https://stm32f4-discovery.net/2017/07/stm32-tutorial-efficiently-receive-uart-data-using-dma/"
    title: "STM32 Tutorial: Efficiently Receive UART Data Using DMA"
  - url: "https://blog.stratifylabs.dev/device/2021-12-30-UART-FIFO-with-DMA-on-STM32/"
    title: "UART FIFO with DMA on STM32"
---

[DMA (Direct Memory Access)](https://deepbluembedded.com/stm32-dma-tutorial-using-direct-memory-access-dma-in-stm32/) allows data to move between memory and peripherals without CPU involvement. While the DMA controller handles a UART transfer or an ADC conversion stream, the CPU is free to do other work. On memory-constrained MCUs, DMA is essential for efficient data handling.

## What DMA Does

Without DMA, every byte transferred between a peripheral and memory requires the CPU to:

1. Wait for a peripheral flag (or handle an interrupt)
2. Read the data register
3. Store it in a RAM buffer
4. Repeat

With DMA, the hardware does steps 1-4 automatically. The CPU only needs to set up the transfer once and handle a completion interrupt.

```
Without DMA:                    With DMA:
CPU <--byte--> UART             CPU (doing other work)
CPU <--byte--> UART                    |
CPU <--byte--> UART             DMA <--byte--> UART
  (CPU busy 100%)               DMA <--byte--> UART
                                DMA --> RAM buffer
                                  (CPU free ~100%)
```

## DMA Architecture

### Channels and Streams

DMA controllers are organized into **channels** (or **streams** on STM32F4/F7). Each channel can be configured independently for a different transfer.

- **STM32F1/F0**: DMA1 has 7 channels, each mapped to specific peripherals
- **STM32F4/F7**: DMA1 and DMA2 each have 8 streams, each with 8 channel selections

The mapping between peripherals and DMA channels is fixed in hardware. You must consult the reference manual to find which DMA channel serves which peripheral.

**Example (STM32F4)**:
```
DMA1 Stream 5, Channel 4 -> USART2_RX
DMA1 Stream 6, Channel 4 -> USART2_TX
DMA2 Stream 0, Channel 0 -> ADC1
```

### Transfer Configuration

Each DMA channel/stream needs:

| Parameter | Options |
|-----------|---------|
| **Direction** | Peripheral-to-memory, Memory-to-peripheral, Memory-to-memory |
| **Source address** | Peripheral register or memory address |
| **Destination address** | Memory address or peripheral register |
| **Data size** | Byte (8-bit), Half-word (16-bit), Word (32-bit) |
| **Transfer count** | Number of data items |
| **Mode** | Normal (one-shot) or Circular (continuous) |
| **Priority** | Low, Medium, High, Very High |
| **Increment** | Source/destination address increment enable |

## Transfer Modes

### Peripheral-to-Memory

The most common mode. Data flows from a peripheral data register into a RAM buffer.

**Use cases**: UART RX, ADC conversions, SPI RX

<!-- tabs -->
```c
// Conceptual setup: UART RX -> RAM buffer
DMA_Channel->CPAR = (uint32_t)&USART2->DR;   // Source: UART data register
DMA_Channel->CMAR = (uint32_t)rx_buffer;       // Dest: RAM buffer
DMA_Channel->CNDTR = BUFFER_SIZE;              // Transfer count
// Config: peripheral-to-memory, memory increment, circular mode
```

```rust
// Rust embedded — using STM32 PAC for direct register access
use core::ptr::write_volatile;

unsafe fn dma_uart_rx_setup(rx_buffer: &mut [u8; BUFFER_SIZE]) {
    let dma_ch = &(*DMA1::ptr()).ch5; // DMA1 Channel 5 for USART2_RX
    // Source: UART data register
    write_volatile(&dma_ch.par as *const _ as *mut u32,
                   &(*USART2::ptr()).dr as *const _ as u32);
    // Dest: RAM buffer
    write_volatile(&dma_ch.mar as *const _ as *mut u32,
                   rx_buffer.as_ptr() as u32);
    // Transfer count
    write_volatile(&dma_ch.ndtr as *const _ as *mut u32,
                   BUFFER_SIZE as u32);
    // Config: peripheral-to-memory, memory increment, circular mode
}
```
<!-- /tabs -->

### Memory-to-Peripheral

Data flows from a RAM buffer to a peripheral data register.

**Use cases**: UART TX, DAC output, SPI TX

### Memory-to-Memory

Data copied between two RAM locations. Useful for fast buffer copies, but not available on all DMA controllers (often only DMA2 on STM32).

## Circular Mode

In **normal mode**, the DMA stops after transferring the specified number of items. You must reconfigure and restart it.

In **circular mode**, the DMA automatically restarts from the beginning of the buffer when it reaches the end. This creates a continuous ring buffer managed entirely by hardware.

```
Buffer layout in circular mode:

    Write position (DMA)
         |
         v
[0][1][2][3][4][5][6][7]  <- DMA fills continuously
            ^
            |
    Read position (CPU software)
```

The CPU can read the current DMA position from the NDTR (Number of Data To Register) counter:

<!-- tabs -->
```c
// How many bytes have been received so far
uint16_t dma_pos = BUFFER_SIZE - DMA_Channel->CNDTR;
```

```rust
// How many bytes have been received so far
let dma_pos: u16 = unsafe {
    BUFFER_SIZE as u16 - core::ptr::read_volatile(
        &(*DMA1::ptr()).ch5.ndtr as *const _ as *const u16
    )
};
```
<!-- /tabs -->

## DMA Interrupts

DMA generates interrupts at key points:

| Interrupt | When | Typical Use |
|-----------|------|-------------|
| **Transfer Complete (TC)** | All items transferred | Process full buffer |
| **Half Transfer (HT)** | Half the items transferred | Double-buffer processing |
| **Transfer Error (TE)** | Bus error or config error | Error handling |

In circular mode, both HT and TC fire repeatedly. This enables a **ping-pong** processing pattern:

```
Buffer: [----first half----][----second half----]
              ^                      ^
         HT interrupt           TC interrupt
         Process 2nd half       Process 1st half
```

While the DMA fills one half, the CPU processes the other. This ensures no data is lost.

## Example: UART RX with DMA Circular Buffer

This is one of the most common DMA patterns. Instead of handling a UART interrupt for every byte, let DMA [collect bytes into a buffer continuously](https://stm32f4-discovery.net/2017/07/stm32-tutorial-efficiently-receive-uart-data-using-dma/).

### Setup (STM32 HAL)

<!-- tabs -->
```c
#define RX_BUF_SIZE 256
uint8_t rx_buf[RX_BUF_SIZE];
volatile uint16_t rx_read_pos = 0;

void uart_dma_init(void) {
    // Enable clocks for USART2 and DMA1
    __HAL_RCC_USART2_CLK_ENABLE();
    __HAL_RCC_DMA1_CLK_ENABLE();

    // Configure UART (115200, 8N1)
    huart2.Instance = USART2;
    huart2.Init.BaudRate = 115200;
    huart2.Init.WordLength = UART_WORDLENGTH_8B;
    huart2.Init.StopBits = UART_STOPBITS_1;
    huart2.Init.Parity = UART_PARITY_NONE;
    HAL_UART_Init(&huart2);

    // Start DMA reception in circular mode
    HAL_UART_Receive_DMA(&huart2, rx_buf, RX_BUF_SIZE);
}
```

```rust
// Rust embedded — using stm32f4xx-hal crate
use stm32f4xx_hal::{pac, prelude::*, serial};

const RX_BUF_SIZE: usize = 256;
static mut RX_BUF: [u8; RX_BUF_SIZE] = [0; RX_BUF_SIZE];
static mut RX_READ_POS: u16 = 0;

fn uart_dma_init(
    dp: pac::Peripherals,
) -> serial::Serial<pac::USART2> {
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.freeze();

    let gpioa = dp.GPIOA.split();
    let tx_pin = gpioa.pa2.into_alternate();
    let rx_pin = gpioa.pa3.into_alternate();

    // Configure UART at 115200 baud
    let serial = serial::Serial::new(
        dp.USART2,
        (tx_pin, rx_pin),
        serial::config::Config::default().baudrate(115_200.bps()),
        &clocks,
    ).unwrap();

    // DMA circular mode setup would use the stm32f4xx-hal DMA API
    // or direct register access for circular buffer reception
    serial
}
```
<!-- /tabs -->

### Reading Data

<!-- tabs -->
```c
// Call this from the main loop to process received data
void uart_process(void) {
    // Current DMA write position
    uint16_t dma_write_pos = RX_BUF_SIZE - __HAL_DMA_GET_COUNTER(huart2.hdmarx);

    while (rx_read_pos != dma_write_pos) {
        uint8_t byte = rx_buf[rx_read_pos];
        rx_read_pos = (rx_read_pos + 1) % RX_BUF_SIZE;

        // Process byte
        handle_byte(byte);
    }
}
```

```rust
// Call this from the main loop to process received data
unsafe fn uart_process() {
    // Current DMA write position
    let dma_write_pos = RX_BUF_SIZE as u16
        - core::ptr::read_volatile(
            &(*pac::DMA1::ptr()).st[5].ndtr as *const _ as *const u16,
        );

    while RX_READ_POS != dma_write_pos {
        let byte = RX_BUF[RX_READ_POS as usize];
        RX_READ_POS = (RX_READ_POS + 1) % RX_BUF_SIZE as u16;

        // Process byte
        handle_byte(byte);
    }
}
```
<!-- /tabs -->

### Why This Works Well

- **No byte-level interrupts** -- the CPU is not interrupted for each byte
- **No data loss** -- DMA captures every byte, even during long ISR processing
- **Low latency** -- check `dma_write_pos` at any time to see new data
- **Deterministic memory** -- buffer is statically allocated, fixed size

## DMA Pitfalls

### Cache Coherency (Cortex-M7)

Cortex-M7 has data caches. DMA writes to RAM bypass the cache, so the CPU might read stale cached data. Solutions:

- Place DMA buffers in non-cacheable memory (using MPU)
- Call `SCB_InvalidateDCache_by_Addr()` before reading DMA buffer
- Use TCM (Tightly Coupled Memory) which is not cached

### Alignment

Some DMA controllers require buffers to be aligned to the data size (e.g., 4-byte aligned for word transfers). Use `__attribute__((aligned(4)))` on buffer declarations.

### Peripheral Clock

The DMA and the peripheral it serves must both be clocked. A common mistake is forgetting to enable the DMA clock.

## References

1. [STM32 DMA Tutorial - Using Direct Memory Access in STM32](https://deepbluembedded.com/stm32-dma-tutorial-using-direct-memory-access-dma-in-stm32/) — Comprehensive STM32 DMA setup and configuration guide
2. [STM32 UART DMA Receive Example - Normal and Circular Mode](https://controllerstech.com/stm32-uart-4-receive-data-using-dma/) — Practical UART DMA receive examples
3. [STM32 Tutorial: Efficiently Receive UART Data Using DMA](https://stm32f4-discovery.net/2017/07/stm32-tutorial-efficiently-receive-uart-data-using-dma/) — Efficient DMA-based UART reception patterns
4. [UART FIFO with DMA on STM32](https://blog.stratifylabs.dev/device/2021-12-30-UART-FIFO-with-DMA-on-STM32/) — DMA circular buffer design for UART FIFO

## Related Topics

- [Static Allocation Patterns](static-allocation-patterns.md) -- ring buffer implementation in software
- [MPU Memory Protection](mpu-memory-protection.md) -- marking DMA buffers as non-cacheable
- [Stack vs Heap](stack-vs-heap.md) -- DMA buffers should be statically allocated
