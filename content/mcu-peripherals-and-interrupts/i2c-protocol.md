---
title: "I2C Protocol"
created: 2026-03-08
updated: 2026-03-08
tags: [i2c, serial, communication, stm32, cortex-m, peripheral]
status: draft
sources:
  - url: "https://controllerstech.com/stm32-i2c-configuration-using-registers/"
    title: "STM32 I2C Register Configuration Tutorial"
  - url: "https://hackaday.com/2022/05/11/bare-metal-stm32-using-the-i2c-bus-in-master-transceiver-mode/"
    title: "Bare-Metal STM32: Using The I2C Bus In Master-Transceiver Mode"
  - url: "https://wiki.st.com/stm32mcu/wiki/Getting_started_with_I2C"
    title: "Getting started with I2C - STM32 MCU Wiki"
---

I2C (Inter-Integrated Circuit, pronounced "I-squared-C") is a **two-wire** bus for connecting low-speed peripherals like temperature sensors, EEPROMs, and displays. Unlike SPI, it supports **multiple masters and slaves on the same two wires** using device addresses.

## Bus Signals

| Signal | Description |
|--------|-------------|
| SDA | Serial Data -- bidirectional data line |
| SCL | Serial Clock -- driven by the master |

Both lines are **open-drain** with external pull-up resistors (typically 4.7k ohm to VCC). Devices can only pull the line LOW -- they release it to go HIGH via the pull-up. See the [STM32 MCU Wiki I2C guide](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_I2C) for hardware setup details.

```
VCC ----+--------+--------+
        |        |        |
       [R]      [R]      (pull-up resistors, ~4.7k)
        |        |
SDA ----+--------+------- Master + Slaves
SCL ----+--------+------- Master + Slaves
```

### Speed Modes

| Mode | Speed |
|------|-------|
| Standard | 100 kbit/s |
| Fast | 400 kbit/s |
| Fast-mode Plus | 1 Mbit/s |
| High-speed | 3.4 Mbit/s |

## 7-Bit Addressing

Each slave has a unique 7-bit address (set by the chip design and sometimes address pins). The first byte after a START condition is always: `[7-bit address][R/W bit]`.

- **R/W = 0** --> Master will write to slave
- **R/W = 1** --> Master will read from slave

```
START | A6 A5 A4 A3 A2 A1 A0 | R/W | ACK |  DATA  | ACK | ... | STOP
      |     7-bit address     |     |     |        |     |     |
```

## Start and Stop Conditions

- **START:** SDA goes LOW while SCL is HIGH
- **STOP:** SDA goes HIGH while SCL is HIGH
- During normal data transfer, SDA only changes while SCL is LOW

## ACK/NACK

After every 8 bits, the **receiver** pulls SDA LOW during the 9th clock cycle to acknowledge. If the receiver does not pull SDA LOW, it is a NACK (not acknowledged):

- Slave NACK on address byte --> no device at that address
- Master NACK after last read byte --> tells slave to stop sending

## Key Registers (STM32F4 I2C)

| Register | Purpose |
|----------|---------|
| I2C_CR1 | Enable, START, STOP, ACK control |
| I2C_CR2 | Peripheral clock frequency, DMA/interrupt enable |
| I2C_OAR1 | Own address (when acting as slave) |
| I2C_DR | Data register for send/receive |
| I2C_SR1 | Status: SB, ADDR, TXE, RXNE, BTF, AF |
| I2C_SR2 | Status: BUSY, MSL, TRA (reading clears ADDR flag) |
| I2C_CCR | Clock control -- sets SCL frequency |
| I2C_TRISE | Maximum rise time configuration |

### Important SR1 Flags

| Flag | Meaning |
|------|---------|
| SB | Start bit generated |
| ADDR | Address sent and acknowledged |
| TXE | TX register empty -- ready for next byte |
| RXNE | RX register not empty -- byte received |
| BTF | Byte transfer finished |
| AF | Acknowledge failure (NACK received) |

## Master Transmit Sequence

```
1. Wait until bus is not busy (SR2 BUSY flag)
2. Generate START condition (CR1 START bit)
3. Wait for SB flag in SR1
4. Write slave address + W bit (0) to DR
5. Wait for ADDR flag, then read SR1+SR2 to clear it
6. Write data byte to DR
7. Wait for TXE (or BTF) before writing next byte
8. After last byte, generate STOP (CR1 STOP bit)
```

<!-- tabs -->
```c
void i2c_write(uint8_t addr, uint8_t reg, uint8_t data) {
    while (I2C1->SR2 & I2C_SR2_BUSY) { }     // wait for bus free

    I2C1->CR1 |= I2C_CR1_START;               // generate START
    while (!(I2C1->SR1 & I2C_SR1_SB)) { }     // wait for SB

    I2C1->DR = (addr << 1) | 0;               // address + write
    while (!(I2C1->SR1 & I2C_SR1_ADDR)) { }   // wait for ADDR
    (void)I2C1->SR1; (void)I2C1->SR2;          // clear ADDR flag

    I2C1->DR = reg;                            // register address
    while (!(I2C1->SR1 & I2C_SR1_TXE)) { }

    I2C1->DR = data;                           // data byte
    while (!(I2C1->SR1 & I2C_SR1_BTF)) { }

    I2C1->CR1 |= I2C_CR1_STOP;                // generate STOP
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const I2C1_BASE: u32 = 0x4000_5400;
const I2C1_CR1: *mut u32 = I2C1_BASE as *mut u32;
const I2C1_DR: *mut u32 = (I2C1_BASE + 0x10) as *mut u32;
const I2C1_SR1: *const u32 = (I2C1_BASE + 0x14) as *const u32;
const I2C1_SR2: *const u32 = (I2C1_BASE + 0x18) as *const u32;

unsafe fn i2c_write(addr: u8, reg: u8, data: u8) {
    // Wait for bus free
    while read_volatile(I2C1_SR2) & (1 << 1) != 0 {}  // BUSY

    // Generate START
    write_volatile(I2C1_CR1, read_volatile(I2C1_CR1 as *const u32) | (1 << 8));
    while read_volatile(I2C1_SR1) & (1 << 0) == 0 {}  // SB

    // Address + write
    write_volatile(I2C1_DR, ((addr as u32) << 1) | 0);
    while read_volatile(I2C1_SR1) & (1 << 1) == 0 {}  // ADDR
    let _ = read_volatile(I2C1_SR1);                   // clear ADDR
    let _ = read_volatile(I2C1_SR2);

    // Register address
    write_volatile(I2C1_DR, reg as u32);
    while read_volatile(I2C1_SR1) & (1 << 7) == 0 {}  // TXE

    // Data byte
    write_volatile(I2C1_DR, data as u32);
    while read_volatile(I2C1_SR1) & (1 << 2) == 0 {}  // BTF

    // Generate STOP
    write_volatile(I2C1_CR1, read_volatile(I2C1_CR1 as *const u32) | (1 << 9));
}
```
<!-- /tabs -->

## Master Receive Sequence

Reading requires a **restart** between the write (register address) and the read phase, as described in the [bare-metal I2C master transceiver guide](https://hackaday.com/2022/05/11/bare-metal-stm32-using-the-i2c-bus-in-master-transceiver-mode/):

<!-- tabs -->
```c
uint8_t i2c_read(uint8_t addr, uint8_t reg) {
    // --- Write phase: send register address ---
    while (I2C1->SR2 & I2C_SR2_BUSY) { }
    I2C1->CR1 |= I2C_CR1_START;
    while (!(I2C1->SR1 & I2C_SR1_SB)) { }

    I2C1->DR = (addr << 1) | 0;               // address + write
    while (!(I2C1->SR1 & I2C_SR1_ADDR)) { }
    (void)I2C1->SR1; (void)I2C1->SR2;

    I2C1->DR = reg;                            // register to read
    while (!(I2C1->SR1 & I2C_SR1_BTF)) { }

    // --- Read phase: restart and read data ---
    I2C1->CR1 |= I2C_CR1_START;               // repeated START
    while (!(I2C1->SR1 & I2C_SR1_SB)) { }

    I2C1->DR = (addr << 1) | 1;               // address + read
    I2C1->CR1 &= ~I2C_CR1_ACK;                // NACK after 1 byte
    while (!(I2C1->SR1 & I2C_SR1_ADDR)) { }
    (void)I2C1->SR1; (void)I2C1->SR2;

    I2C1->CR1 |= I2C_CR1_STOP;                // prepare STOP
    while (!(I2C1->SR1 & I2C_SR1_RXNE)) { }
    return I2C1->DR;
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

const I2C1_BASE: u32 = 0x4000_5400;
const I2C1_CR1: *mut u32 = I2C1_BASE as *mut u32;
const I2C1_DR: *mut u32 = (I2C1_BASE + 0x10) as *mut u32;
const I2C1_SR1: *const u32 = (I2C1_BASE + 0x14) as *const u32;
const I2C1_SR2: *const u32 = (I2C1_BASE + 0x18) as *const u32;

unsafe fn i2c_read(addr: u8, reg: u8) -> u8 {
    // --- Write phase: send register address ---
    while read_volatile(I2C1_SR2) & (1 << 1) != 0 {}    // BUSY
    write_volatile(I2C1_CR1, read_volatile(I2C1_CR1 as *const u32) | (1 << 8)); // START
    while read_volatile(I2C1_SR1) & (1 << 0) == 0 {}    // SB

    write_volatile(I2C1_DR, ((addr as u32) << 1) | 0);  // address + write
    while read_volatile(I2C1_SR1) & (1 << 1) == 0 {}    // ADDR
    let _ = read_volatile(I2C1_SR1);
    let _ = read_volatile(I2C1_SR2);

    write_volatile(I2C1_DR, reg as u32);                 // register to read
    while read_volatile(I2C1_SR1) & (1 << 2) == 0 {}    // BTF

    // --- Read phase: restart and read data ---
    write_volatile(I2C1_CR1, read_volatile(I2C1_CR1 as *const u32) | (1 << 8)); // repeated START
    while read_volatile(I2C1_SR1) & (1 << 0) == 0 {}    // SB

    write_volatile(I2C1_DR, ((addr as u32) << 1) | 1);  // address + read
    write_volatile(I2C1_CR1, read_volatile(I2C1_CR1 as *const u32) & !(1 << 10)); // NACK
    while read_volatile(I2C1_SR1) & (1 << 1) == 0 {}    // ADDR
    let _ = read_volatile(I2C1_SR1);
    let _ = read_volatile(I2C1_SR2);

    write_volatile(I2C1_CR1, read_volatile(I2C1_CR1 as *const u32) | (1 << 9)); // STOP
    while read_volatile(I2C1_SR1) & (1 << 6) == 0 {}    // RXNE
    read_volatile(I2C1_DR as *const u32) as u8
}
```
<!-- /tabs -->

## Example: Reading Temperature from LM75

The LM75 temperature sensor has I2C address 0x48 (with A0-A2 grounded). The temperature register is at address 0x00, 2 bytes wide, with 0.5C resolution.

<!-- tabs -->
```c
int16_t read_temperature(void) {
    // Read 2 bytes from register 0x00
    uint8_t msb = i2c_read(0x48, 0x00);
    uint8_t lsb = i2c_read(0x48, 0x01);

    // Temperature = MSB (integer part) + bit 7 of LSB (0.5 degree)
    int16_t temp = (int16_t)(msb << 8 | lsb) >> 5;
    // Each LSB = 0.125 C for 11-bit resolution
    return temp;  // divide by 8 to get degrees C
}
```

```rust
unsafe fn read_temperature() -> i16 {
    // Read 2 bytes from register 0x00
    let msb = i2c_read(0x48, 0x00);
    let lsb = i2c_read(0x48, 0x01);

    // Temperature = MSB (integer part) + bit 7 of LSB (0.5 degree)
    let raw = ((msb as u16) << 8 | lsb as u16) as i16;
    let temp = raw >> 5;
    // Each LSB = 0.125 C for 11-bit resolution
    temp  // divide by 8 to get degrees C
}
```
<!-- /tabs -->

## Clock Stretching

A slave can hold SCL LOW to pause the master while it processes data. The master must wait for SCL to be released before continuing. This is handled automatically by the STM32 I2C hardware -- but some bit-banged I2C implementations do not support it.

## Common Pitfalls

- **Missing pull-up resistors:** I2C will not work without them. Symptoms: SDA/SCL stuck LOW.
- **Wrong address:** I2C addresses are sometimes stated as 8-bit (including R/W bit) in datasheets. Always check whether you need to shift.
- **ADDR flag not cleared:** On STM32, you must read both SR1 and SR2 to clear the ADDR flag. Forgetting this hangs the bus.
- **Bus lockup:** If a slave holds SDA LOW (crashed mid-transfer), toggle SCL manually to clock it out.

## References

1. [STM32 I2C Register Configuration Tutorial](https://controllerstech.com/stm32-i2c-configuration-using-registers/) — Step-by-step I2C register setup for master mode
2. [Bare-Metal STM32: Using The I2C Bus In Master-Transceiver Mode](https://hackaday.com/2022/05/11/bare-metal-stm32-using-the-i2c-bus-in-master-transceiver-mode/) — Bare-metal I2C master transmit and receive implementation
3. [Getting started with I2C - STM32 MCU Wiki](https://wiki.st.com/stm32mcu/wiki/Getting_started_with_I2C) — Official ST guide covering I2C hardware and configuration

## Related Topics

- [GPIO Configuration](gpio-register-level.md) -- open-drain + AF mode for SDA/SCL
- [SPI Protocol](spi-protocol.md) -- faster alternative when wiring is not constrained
- [Interrupt System](interrupt-system/index.md) -- I2C event and error interrupts
