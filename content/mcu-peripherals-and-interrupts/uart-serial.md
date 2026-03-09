---
title: "UART Serial Communication"
created: 2026-03-08
updated: 2026-03-08
tags: [uart, usart, serial, stm32, cortex-m, peripheral, communication]
status: draft
sources:
  - url: "https://controllerstech.com/how-to-setup-uart-using-registers-in-stm32/"
    title: "Setup STM32 UART via Registers (Blocking Mode)"
  - url: "https://vivonomicon.com/2020/06/28/bare-metal-stm32-programming-part-10-uart-communication/"
    title: "Bare Metal STM32 Programming: UART Communication"
  - url: "https://deepbluembedded.com/stm32-usart-uart-tutorial/"
    title: "STM32 UART (USART) Tutorial + Examples"
  - url: "https://hackaday.com/2021/01/08/bare-metal-stm32-universal-asynchronous-communication-with-uarts/"
    title: "Bare-Metal STM32: Universal Asynchronous Communication With UARTs"
---

UART (Universal Asynchronous Receiver/Transmitter) is the most common way to get debug output from an MCU or communicate with GPS modules, Bluetooth adapters, and other serial devices. It uses **two wires** (TX and RX) with no clock -- both sides must agree on the baud rate.

## Frame Format

Each UART frame looks like this on the wire:

```
Idle (HIGH)
    |  Start  |  D0  D1  D2  D3  D4  D5  D6  D7  | Parity | Stop |
    |   (0)   |         8 data bits                | (opt)  | (1)  |
```

- **Start bit:** Always LOW. Signals the beginning of a frame.
- **Data bits:** 8 bits (or 7/9), LSB first.
- **Parity bit:** Optional error detection (even or odd).
- **Stop bit:** Always HIGH. 1 or 2 stop bits.
- **Idle:** Line stays HIGH when no data is being sent.

## Baud Rate

Baud rate = bits per second on the wire. Both transmitter and receiver must use the **exact same** baud rate.

Common values: 9600, 19200, 38400, 57600, **115200** (most popular for debug).

### Baud Rate Calculation

The USART divides its input clock to produce the baud rate:

```
USARTDIV = f_clock / (16 * baud_rate)     // for oversampling by 16
USARTDIV = f_clock / (8 * baud_rate)      // for oversampling by 8
```

The BRR register holds this value. On STM32F4 with [16x oversampling](https://controllerstech.com/how-to-setup-uart-using-registers-in-stm32/):

```
f_clock = 42 MHz (APB1), baud = 115200
USARTDIV = 42,000,000 / (16 * 115200) = 22.786
BRR mantissa = 22 (integer part)
BRR fraction = 0.786 * 16 = 12.58 ≈ 13

BRR = (22 << 4) | 13 = 0x16D
```

## Key Registers

| Register | Purpose |
|----------|---------|
| USART_BRR | Baud rate divisor (mantissa + fraction) |
| USART_CR1 | Enable USART, TX, RX; word length; parity; interrupts |
| USART_CR2 | Stop bits (1 or 2), clock settings |
| USART_CR3 | DMA enable, hardware flow control |
| USART_SR (or ISR) | Status flags: TXE, RXNE, TC, ORE, etc. |
| USART_DR (or TDR/RDR) | Data register for send/receive |

### Important Status Flags

| Flag | Meaning |
|------|---------|
| TXE | Transmit data register empty -- safe to write next byte |
| RXNE | Receive data register not empty -- new byte available |
| TC | Transmission complete -- all bits shifted out |
| ORE | Overrun error -- new byte arrived before previous was read |
| FE | Framing error -- stop bit was not HIGH |

## Transmit Flow

```
1. Wait for TXE (transmit buffer empty)
2. Write byte to DR
3. Hardware shifts it out bit-by-bit
4. TXE goes high again when ready for next byte
5. TC goes high when last bit is fully transmitted
```

<!-- tabs -->
```c
void uart_send_char(char c) {
    while (!(USART2->SR & USART_SR_TXE)) { }  // wait for empty
    USART2->DR = c;
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const USART2_SR: *const u32 = 0x4000_4400 as *const u32;
const USART2_DR: *mut u32 = (0x4000_4400 + 0x04) as *mut u32;

unsafe fn uart_send_char(c: u8) {
    while read_volatile(USART2_SR) & (1 << 7) == 0 {}  // wait TXE
    write_volatile(USART2_DR, c as u32);
}
```
<!-- /tabs -->

## Receive Flow

```
1. Hardware detects start bit, samples data bits
2. When full byte received, RXNE flag is set
3. Read DR to get the byte (also clears RXNE)
4. If you don't read before next byte arrives: ORE (overrun)
```

<!-- tabs -->
```c
char uart_recv_char(void) {
    while (!(USART2->SR & USART_SR_RXNE)) { }  // wait for data
    return USART2->DR;
}
```

```rust
use core::ptr::read_volatile;

const USART2_SR: *const u32 = 0x4000_4400 as *const u32;
const USART2_DR: *const u32 = (0x4000_4400 + 0x04) as *const u32;

unsafe fn uart_recv_char() -> u8 {
    while read_volatile(USART2_SR) & (1 << 5) == 0 {}  // wait RXNE
    read_volatile(USART2_DR) as u8
}
```
<!-- /tabs -->

## Example: Sending "Hello" at 115200 Baud

Using USART2 on STM32F4 (PA2 = TX, PA3 = RX), APB1 clock = 42 MHz (based on the [bare metal UART programming](https://vivonomicon.com/2020/06/28/bare-metal-stm32-programming-part-10-uart-communication/) approach):

<!-- tabs -->
```c
// 1. Enable clocks
RCC->APB1ENR |= RCC_APB1ENR_USART2EN;
RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;

// 2. Configure PA2 (TX) and PA3 (RX) as alternate function (AF7)
GPIOA->MODER &= ~((0x3 << (2*2)) | (0x3 << (3*2)));
GPIOA->MODER |=  ((0x2 << (2*2)) | (0x2 << (3*2)));
GPIOA->AFR[0] |= (0x7 << (2*4)) | (0x7 << (3*4));   // AF7

// 3. Configure UART: 8N1 at 115200
USART2->BRR = 0x016D;    // 42 MHz / (16 * 115200) ≈ 22.786

USART2->CR1 = 0;         // reset
USART2->CR1 |= USART_CR1_TE    // enable transmitter
             | USART_CR1_RE    // enable receiver
             | USART_CR1_UE;   // enable USART

// 4. Send "Hello\r\n"
const char *msg = "Hello\r\n";
while (*msg) {
    while (!(USART2->SR & USART_SR_TXE)) { }
    USART2->DR = *msg++;
}
// Wait for last byte to finish transmitting
while (!(USART2->SR & USART_SR_TC)) { }
```

```rust
use core::ptr::{read_volatile, write_volatile};

const RCC_APB1ENR: *mut u32 = (0x4002_3800 + 0x40) as *mut u32;
const RCC_AHB1ENR: *mut u32 = (0x4002_3800 + 0x30) as *mut u32;
const GPIOA_MODER: *mut u32 = 0x4002_0000 as *mut u32;
const GPIOA_AFRL: *mut u32 = (0x4002_0000 + 0x20) as *mut u32;
const USART2_BASE: u32 = 0x4000_4400;
const USART2_SR: *const u32 = USART2_BASE as *const u32;
const USART2_DR: *mut u32 = (USART2_BASE + 0x04) as *mut u32;
const USART2_BRR: *mut u32 = (USART2_BASE + 0x08) as *mut u32;
const USART2_CR1: *mut u32 = (USART2_BASE + 0x0C) as *mut u32;

unsafe {
    // 1. Enable clocks
    write_volatile(RCC_APB1ENR, read_volatile(RCC_APB1ENR) | (1 << 17)); // USART2EN
    write_volatile(RCC_AHB1ENR, read_volatile(RCC_AHB1ENR) | (1 << 0)); // GPIOAEN

    // 2. Configure PA2 (TX) and PA3 (RX) as AF7
    let moder = read_volatile(GPIOA_MODER);
    write_volatile(GPIOA_MODER,
        (moder & !((0x3 << 4) | (0x3 << 6))) | ((0x2 << 4) | (0x2 << 6)));
    let afrl = read_volatile(GPIOA_AFRL);
    write_volatile(GPIOA_AFRL, afrl | (0x7 << 8) | (0x7 << 12)); // AF7

    // 3. Configure UART: 8N1 at 115200
    write_volatile(USART2_BRR, 0x016D); // 42 MHz / (16 * 115200)

    write_volatile(USART2_CR1, 0); // reset
    write_volatile(USART2_CR1,
          (1 << 3)    // TE: enable transmitter
        | (1 << 2)    // RE: enable receiver
        | (1 << 13)); // UE: enable USART

    // 4. Send "Hello\r\n"
    for &byte in b"Hello\r\n" {
        while read_volatile(USART2_SR) & (1 << 7) == 0 {} // TXE
        write_volatile(USART2_DR, byte as u32);
    }
    // Wait for last byte to finish transmitting
    while read_volatile(USART2_SR) & (1 << 6) == 0 {} // TC
}
```
<!-- /tabs -->

## Common Issues

### Baud Rate Mismatch
If you see garbled characters, the baud rate is wrong. Double-check:
- Which clock bus feeds your USART (APB1 vs APB2 -- different speeds)
- Whether the system clock is actually what you think (check RCC configuration)

### Overrun Errors
If RXNE is not read before the next byte arrives, the overrun flag (ORE) is set and the new byte is **lost**. Solutions:
- Use interrupt-driven receive with a ring buffer
- Use DMA for high-speed reception

### Noise and Framing Errors
Long wires, mismatched ground, or electrical noise cause bit errors. Noise Error (NE) and Framing Error (FE) flags indicate this. Keep UART wires short or use RS-232/RS-485 level converters for longer distances.

### 8N1 vs Other Formats
"8N1" means 8 data bits, No parity, 1 stop bit -- the default and most common. If the other device expects a different format (e.g., 8E1 for even parity), configure CR1 and CR2 accordingly.

## References

1. [Setup STM32 UART via Registers (Blocking Mode)](https://controllerstech.com/how-to-setup-uart-using-registers-in-stm32/) — Register-level UART setup with BRR calculation details
2. [Bare Metal STM32 Programming: UART Communication](https://vivonomicon.com/2020/06/28/bare-metal-stm32-programming-part-10-uart-communication/) — Step-by-step bare metal UART implementation guide
3. [STM32 UART (USART) Tutorial + Examples](https://deepbluembedded.com/stm32-usart-uart-tutorial/) — Comprehensive UART tutorial with HAL and register examples
4. [Bare-Metal STM32: Universal Asynchronous Communication With UARTs](https://hackaday.com/2021/01/08/bare-metal-stm32-universal-asynchronous-communication-with-uarts/) — Hackaday guide to UART frame format and configuration

## Related Topics

- [GPIO Alternate Functions](gpio-register-level.md) -- setting up TX/RX pins
- [ISR Design Patterns](interrupt-system/isr-design-patterns.md) -- ring buffer for UART RX
- [Interrupt System](interrupt-system/index.md) -- RXNE and TXE interrupts
