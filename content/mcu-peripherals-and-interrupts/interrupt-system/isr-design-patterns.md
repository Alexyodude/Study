---
title: "ISR Design Patterns"
created: 2026-03-08
updated: 2026-03-08
tags: [isr, interrupts, design-patterns, ring-buffer, cortex-m]
status: draft
sources:
  - url: "https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic"
    title: "A Practical Guide to ARM Cortex-M Exception Handling"
  - url: "https://embetronicx.com/tutorials/microcontrollers/stm32/vectored-interrupt-controller-nested-vectored-interrupt-controller-vic-nvic/"
    title: "Vectored and Nested Vectored Interrupt Controller"
---

Writing good ISRs (Interrupt Service Routines) is one of the most important skills in embedded programming. A poorly written ISR can cause missed interrupts, data corruption, or system lockups. The core principle, as emphasized in the [Memfault exception handling guide](https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic): **get in, do the minimum, get out**.

## Rule 1: Keep ISRs Short

The ISR should do the **absolute minimum** necessary:
1. Clear the interrupt flag
2. Read or write hardware registers
3. Set a flag or enqueue data
4. Return

All heavy processing belongs in the main loop.

<!-- tabs -->
```c
// GOOD: ISR sets flag, main loop does work
volatile uint8_t button_pressed = 0;

void EXTI0_IRQHandler(void) {
    EXTI->PR = EXTI_PR_PR0;      // clear flag
    button_pressed = 1;           // signal main loop
}

int main(void) {
    while (1) {
        if (button_pressed) {
            button_pressed = 0;
            handle_button();      // heavy processing here
        }
        __WFI();                  // sleep until next interrupt
    }
}
```

```rust
use core::ptr::{read_volatile, write_volatile};
use core::sync::atomic::{AtomicBool, Ordering};

static BUTTON_PRESSED: AtomicBool = AtomicBool::new(false);

const EXTI_PR: *mut u32 = (0x4001_3C00 + 0x14) as *mut u32;

#[no_mangle]
pub unsafe extern "C" fn EXTI0_IRQHandler() {
    write_volatile(EXTI_PR, 1 << 0);              // clear flag
    BUTTON_PRESSED.store(true, Ordering::Release); // signal main loop
}

fn main() -> ! {
    loop {
        if BUTTON_PRESSED.load(Ordering::Acquire) {
            BUTTON_PRESSED.store(false, Ordering::Release);
            handle_button();      // heavy processing here
        }
        unsafe { core::arch::asm!("wfi"); }  // sleep until next interrupt
    }
}
```
<!-- /tabs -->

## Rule 2: Use `volatile` for Shared Variables

Any variable written in an ISR and read in main code (or vice versa) **must** be declared `volatile`. Without it, the compiler may optimize away the read, caching the value in a register.

<!-- tabs -->
```c
volatile uint32_t tick_count = 0;   // volatile: modified by ISR

void SysTick_Handler(void) {
    tick_count++;
}

void delay_ms(uint32_t ms) {
    uint32_t start = tick_count;
    while ((tick_count - start) < ms) { }  // would be optimized to infinite
                                            // loop without volatile
}
```

```rust
use core::sync::atomic::{AtomicU32, Ordering};

static TICK_COUNT: AtomicU32 = AtomicU32::new(0);  // atomic: modified by ISR

#[no_mangle]
pub unsafe extern "C" fn SysTick_Handler() {
    TICK_COUNT.fetch_add(1, Ordering::Relaxed);
}

fn delay_ms(ms: u32) {
    let start = TICK_COUNT.load(Ordering::Relaxed);
    while TICK_COUNT.load(Ordering::Relaxed).wrapping_sub(start) < ms {}
}
```
<!-- /tabs -->

**Important:** `volatile` prevents compiler reordering but does NOT guarantee atomicity. A 32-bit read on Cortex-M is atomic, but multi-step operations (read-modify-write) are not.

## Ring Buffer for Data Streams

A ring buffer (circular buffer) is the standard pattern for passing data between an ISR and main code. It is lock-free for a single producer / single consumer.

<!-- tabs -->
```c
#define BUF_SIZE 64  // must be power of 2 for mask trick

volatile uint8_t rx_buf[BUF_SIZE];
volatile uint16_t rx_head = 0;  // ISR writes here
volatile uint16_t rx_tail = 0;  // main reads here

void USART2_IRQHandler(void) {
    if (USART2->SR & USART_SR_RXNE) {
        uint8_t byte = USART2->DR;
        uint16_t next = (rx_head + 1) & (BUF_SIZE - 1);  // wrap around
        if (next != rx_tail) {        // not full
            rx_buf[rx_head] = byte;
            rx_head = next;
        }
        // if full: byte is dropped (overflow)
    }
}

int uart_read(void) {
    if (rx_head == rx_tail) return -1;  // empty
    uint8_t byte = rx_buf[rx_tail];
    rx_tail = (rx_tail + 1) & (BUF_SIZE - 1);
    return byte;
}
```

```rust
use core::ptr::read_volatile;
use core::sync::atomic::{AtomicU16, Ordering};

const BUF_SIZE: usize = 64;  // must be power of 2 for mask trick

static mut RX_BUF: [u8; BUF_SIZE] = [0; BUF_SIZE];
static RX_HEAD: AtomicU16 = AtomicU16::new(0);  // ISR writes here
static RX_TAIL: AtomicU16 = AtomicU16::new(0);  // main reads here

const USART2_SR: *const u32 = 0x4000_4400 as *const u32;
const USART2_DR: *const u32 = (0x4000_4400 + 0x04) as *const u32;

#[no_mangle]
pub unsafe extern "C" fn USART2_IRQHandler() {
    if read_volatile(USART2_SR) & (1 << 5) != 0 {  // RXNE
        let byte = read_volatile(USART2_DR) as u8;
        let head = RX_HEAD.load(Ordering::Relaxed);
        let next = (head + 1) & (BUF_SIZE as u16 - 1);  // wrap around
        if next != RX_TAIL.load(Ordering::Acquire) {     // not full
            RX_BUF[head as usize] = byte;
            RX_HEAD.store(next, Ordering::Release);
        }
        // if full: byte is dropped (overflow)
    }
}

fn uart_read() -> Option<u8> {
    let head = RX_HEAD.load(Ordering::Acquire);
    let tail = RX_TAIL.load(Ordering::Relaxed);
    if head == tail { return None; }  // empty
    let byte = unsafe { RX_BUF[tail as usize] };
    RX_TAIL.store((tail + 1) & (BUF_SIZE as u16 - 1), Ordering::Release);
    Some(byte)
}
```
<!-- /tabs -->

**Why ring buffer?** No mutex needed. ISR only writes `rx_head`, main only writes `rx_tail`. As long as buffer size is a power of 2, the wrap-around is a simple bitmask.

## Double Buffering

For bulk data (ADC DMA, audio), use two buffers. While the ISR/DMA fills one buffer, main code processes the other.

<!-- tabs -->
```c
volatile uint16_t adc_buf_a[256];
volatile uint16_t adc_buf_b[256];
volatile uint8_t active_buf = 0;   // 0 = filling A, 1 = filling B
volatile uint8_t buf_ready = 0;

void DMA1_Stream0_IRQHandler(void) {
    // DMA transfer complete
    clear_dma_flag();
    active_buf ^= 1;          // swap buffers
    buf_ready = 1;             // signal main loop
    // reconfigure DMA to point to the other buffer
}

int main(void) {
    while (1) {
        if (buf_ready) {
            buf_ready = 0;
            uint16_t *data = (active_buf == 0) ? adc_buf_b : adc_buf_a;
            process_audio(data, 256);  // process the completed buffer
        }
    }
}
```

```rust
use core::sync::atomic::{AtomicBool, AtomicU8, Ordering};

static mut ADC_BUF_A: [u16; 256] = [0; 256];
static mut ADC_BUF_B: [u16; 256] = [0; 256];
static ACTIVE_BUF: AtomicU8 = AtomicU8::new(0);   // 0 = filling A, 1 = filling B
static BUF_READY: AtomicBool = AtomicBool::new(false);

#[no_mangle]
pub unsafe extern "C" fn DMA1_Stream0_IRQHandler() {
    // DMA transfer complete
    clear_dma_flag();
    ACTIVE_BUF.fetch_xor(1, Ordering::Release);     // swap buffers
    BUF_READY.store(true, Ordering::Release);        // signal main loop
    // reconfigure DMA to point to the other buffer
}

fn main() -> ! {
    loop {
        if BUF_READY.load(Ordering::Acquire) {
            BUF_READY.store(false, Ordering::Release);
            let data = unsafe {
                if ACTIVE_BUF.load(Ordering::Acquire) == 0 {
                    &ADC_BUF_B
                } else {
                    &ADC_BUF_A
                }
            };
            process_audio(data, 256);  // process the completed buffer
        }
    }
}
```
<!-- /tabs -->

## Deferred Processing Pattern

For complex interrupt responses, use a two-stage approach:

```
ISR (fast):              Main Loop (slow):
  1. Clear flag            1. Check event flags
  2. Capture data          2. Process data
  3. Set event flag        3. Update state
  4. Return                4. Sleep (WFI)
```

This keeps ISR time short and predictable while allowing arbitrarily complex processing in the main loop.

## What to AVOID in ISRs

### Never Use `printf` or Logging Functions
`printf` is slow (hundreds to thousands of cycles), often uses dynamic memory, and is usually not reentrant. It will cause missed interrupts and potential crashes.

### Never Use `malloc` / `free`
Dynamic memory allocation is slow, non-deterministic, and not reentrant. If `malloc` is interrupted by another ISR that also calls `malloc`, the heap is corrupted.

### Never Use Long Loops or Blocking Waits
<!-- tabs -->
```c
// BAD: blocking delay in ISR
void TIM2_IRQHandler(void) {
    TIM2->SR &= ~TIM_SR_UIF;
    for (volatile int i = 0; i < 100000; i++);  // blocks all lower-priority ISRs!
    toggle_led();
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

// BAD: blocking delay in ISR
#[no_mangle]
pub unsafe extern "C" fn TIM2_IRQHandler() {
    let tim2_sr = 0x4000_0010 as *mut u32;
    write_volatile(tim2_sr, read_volatile(tim2_sr) & !(1 << 0)); // clear UIF
    for _ in 0..100_000 { core::hint::black_box(()); }  // blocks all lower-priority ISRs!
    toggle_led();
}
```
<!-- /tabs -->

### Never Forget to Clear the Interrupt Flag
If you do not clear the flag, the ISR will fire again immediately after returning, creating an infinite loop.

<!-- tabs -->
```c
void TIM2_IRQHandler(void) {
    // TIM2->SR &= ~TIM_SR_UIF;  // FORGETTING THIS = infinite ISR loop
    do_something();
}
```

```rust
#[no_mangle]
pub unsafe extern "C" fn TIM2_IRQHandler() {
    // write_volatile(tim2_sr, ...);  // FORGETTING THIS = infinite ISR loop
    do_something();
}
```
<!-- /tabs -->

## Protecting Shared Multi-Byte Data

For data larger than a single word that is shared between ISR and main:

<!-- tabs -->
```c
// Option 1: Disable interrupts briefly
__disable_irq();
uint32_t snapshot_low = shared_data.low;
uint32_t snapshot_high = shared_data.high;
__enable_irq();

// Option 2: Read twice and check consistency
do {
    uint32_t a = shared_counter;
    uint32_t b = shared_counter;
} while (a != b);
```

```rust
use core::arch::asm;
use core::ptr::read_volatile;

// Option 1: Disable interrupts briefly (cortex-m critical section)
unsafe {
    asm!("cpsid i");  // disable interrupts
    let snapshot_low = read_volatile(&shared_data.low);
    let snapshot_high = read_volatile(&shared_data.high);
    asm!("cpsie i");  // enable interrupts
}

// Option 2: Read twice and check consistency
let val = loop {
    let a = unsafe { read_volatile(&shared_counter) };
    let b = unsafe { read_volatile(&shared_counter) };
    if a == b { break a; }
};

// Idiomatic Rust: use the cortex-m crate's critical_section
// cortex_m::interrupt::free(|_| {
//     let snapshot_low = shared_data.low;
//     let snapshot_high = shared_data.high;
// });
```
<!-- /tabs -->

Keep the critical section (interrupts disabled) as short as possible.

## Summary Table

| Pattern | Use Case | Key Benefit |
|---------|----------|-------------|
| Flag + main loop | Button press, periodic events | Simplest |
| Ring buffer | UART RX, streaming data | Lock-free, no data loss |
| Double buffer | DMA audio, high-speed ADC | Zero-copy processing |
| Deferred processing | Complex event handling | Predictable ISR time |

## References

1. [A Practical Guide to ARM Cortex-M Exception Handling](https://interrupt.memfault.com/blog/arm-cortex-m-exceptions-and-nvic) — Best practices for ISR design and interrupt handling
2. [Vectored and Nested Vectored Interrupt Controller](https://embetronicx.com/tutorials/microcontrollers/stm32/vectored-interrupt-controller-nested-vectored-interrupt-controller-vic-nvic/) — Tutorial on VIC/NVIC and ISR implementation patterns

## Related Topics

- [NVIC Architecture](nvic-architecture.md) -- enabling and clearing interrupts
- [Priority and Preemption](priority-and-preemption.md) -- why short ISRs matter for nesting
- [UART Serial](../uart-serial.md) -- ring buffer for UART RX example
- [Context Switching](context-switching-mechanics.md) -- the hardware overhead of each ISR entry
