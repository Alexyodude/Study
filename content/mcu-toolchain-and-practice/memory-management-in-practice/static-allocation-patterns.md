---
title: "Static Allocation Patterns"
created: 2026-03-08
updated: 2026-03-08
tags: [memory-pool, ring-buffer, static-allocation, embedded, patterns]
status: draft
sources:
  - url: "https://embeddedartistry.com/blog/2017/05/17/creating-a-circular-buffer-in-c-and-c/"
    title: "Creating a Circular Buffer in C and C++ - Embedded Artistry"
  - url: "https://embedded-code-patterns.readthedocs.io/en/latest/pool/"
    title: "Memory Allocation Using Pool - Embedded Code Patterns"
  - url: "https://www.informit.com/articles/article.aspx?p=30309&seqNum=4"
    title: "Fixed Sized Buffer Pattern - Real-Time Design Patterns"
  - url: "https://theembeddedgeorge.github.io/theEmbeddedNewTestament.github.io/Embedded_C/Memory_Management.html"
    title: "Memory Management in Embedded Systems"
---

When `malloc()` is off the table, embedded developers use a set of well-established patterns for managing memory at compile time. These patterns provide the flexibility of dynamic allocation without the risks of fragmentation and non-deterministic timing.

## Why No Malloc

A quick recap of why dynamic allocation is avoided in most embedded systems:

- **Fragmentation** -- after many alloc/free cycles, free memory becomes scattered. With 4 KB of heap, a few hundred-byte fragments can make the system unusable.
- **Non-determinism** -- `malloc()` search time depends on heap state, violating real-time guarantees.
- **No recovery** -- when `malloc()` returns NULL on an MCU, there is usually no fallback path.
- **Certification** -- safety standards (MISRA C, DO-178C, IEC 62304) ban or restrict dynamic allocation.

The patterns below solve the same problem -- giving code "temporary ownership" of memory -- using only fixed, pre-allocated structures.

## Memory Pools

A [memory pool](https://embedded-code-patterns.readthedocs.io/en/latest/pool/) is a pre-allocated array of fixed-size blocks. Code "allocates" by taking a free block and "frees" by returning it. Since all blocks are the same size, there is zero external fragmentation.

### Implementation

<!-- tabs -->
```c
#include <stdint.h>
#include <stdbool.h>

#define POOL_BLOCK_SIZE  64    // Bytes per block
#define POOL_BLOCK_COUNT 16    // Number of blocks

typedef struct {
    uint8_t  data[POOL_BLOCK_COUNT][POOL_BLOCK_SIZE];
    bool     used[POOL_BLOCK_COUNT];
    uint16_t free_count;
} MemPool;

static MemPool pool;

void pool_init(MemPool *p) {
    for (int i = 0; i < POOL_BLOCK_COUNT; i++) {
        p->used[i] = false;
    }
    p->free_count = POOL_BLOCK_COUNT;
}

void *pool_alloc(MemPool *p) {
    for (int i = 0; i < POOL_BLOCK_COUNT; i++) {
        if (!p->used[i]) {
            p->used[i] = true;
            p->free_count--;
            return p->data[i];
        }
    }
    return NULL;  // Pool exhausted
}

void pool_free(MemPool *p, void *ptr) {
    // Find which block this pointer belongs to
    for (int i = 0; i < POOL_BLOCK_COUNT; i++) {
        if (ptr == p->data[i]) {
            p->used[i] = false;
            p->free_count++;
            return;
        }
    }
    // ptr was not from this pool -- bug!
}
```

```rust
const POOL_BLOCK_SIZE: usize = 64;
const POOL_BLOCK_COUNT: usize = 16;

struct MemPool {
    data: [[u8; POOL_BLOCK_SIZE]; POOL_BLOCK_COUNT],
    used: [bool; POOL_BLOCK_COUNT],
    free_count: u16,
}

impl MemPool {
    const fn new() -> Self {
        Self {
            data: [[0; POOL_BLOCK_SIZE]; POOL_BLOCK_COUNT],
            used: [false; POOL_BLOCK_COUNT],
            free_count: POOL_BLOCK_COUNT as u16,
        }
    }

    fn init(&mut self) {
        self.used = [false; POOL_BLOCK_COUNT];
        self.free_count = POOL_BLOCK_COUNT as u16;
    }

    fn alloc(&mut self) -> Option<&mut [u8; POOL_BLOCK_SIZE]> {
        for i in 0..POOL_BLOCK_COUNT {
            if !self.used[i] {
                self.used[i] = true;
                self.free_count -= 1;
                return Some(&mut self.data[i]);
            }
        }
        None // Pool exhausted
    }

    fn free(&mut self, ptr: *const u8) {
        for i in 0..POOL_BLOCK_COUNT {
            if core::ptr::eq(ptr, self.data[i].as_ptr()) {
                self.used[i] = false;
                self.free_count += 1;
                return;
            }
        }
        // ptr was not from this pool -- bug!
    }
}

static mut POOL: MemPool = MemPool::new();
```
<!-- /tabs -->

### Optimized Version with Free List

The O(n) search above can be replaced with an O(1) free list. Each free block stores a pointer to the next free block:

<!-- tabs -->
```c
typedef struct {
    uint8_t   data[POOL_BLOCK_COUNT][POOL_BLOCK_SIZE];
    uint8_t  *free_list;  // Points to first free block
} MemPoolFast;

void pool_fast_init(MemPoolFast *p) {
    // Chain free blocks together using first bytes as next-pointer
    for (int i = 0; i < POOL_BLOCK_COUNT - 1; i++) {
        *(uint8_t **)p->data[i] = p->data[i + 1];
    }
    *(uint8_t **)p->data[POOL_BLOCK_COUNT - 1] = NULL;
    p->free_list = p->data[0];
}

void *pool_fast_alloc(MemPoolFast *p) {
    if (p->free_list == NULL) return NULL;
    void *block = p->free_list;
    p->free_list = *(uint8_t **)block;  // Advance to next free
    return block;
}

void pool_fast_free(MemPoolFast *p, void *ptr) {
    *(uint8_t **)ptr = p->free_list;  // Point to current head
    p->free_list = ptr;                // New head
}
```

```rust
/// O(1) memory pool using an intrusive free list.
/// Each free block stores a pointer to the next free block in its first bytes.
struct MemPoolFast {
    data: [[u8; POOL_BLOCK_SIZE]; POOL_BLOCK_COUNT],
    free_list: Option<usize>, // Index of first free block
}

impl MemPoolFast {
    fn init(&mut self) {
        // Chain free blocks: each stores the index of the next free block
        for i in 0..POOL_BLOCK_COUNT - 1 {
            self.data[i][0] = (i + 1) as u8; // next-free index
        }
        self.data[POOL_BLOCK_COUNT - 1][0] = 0xFF; // sentinel (no next)
        self.free_list = Some(0);
    }

    fn alloc(&mut self) -> Option<&mut [u8; POOL_BLOCK_SIZE]> {
        let idx = self.free_list?;
        let next = self.data[idx][0] as usize;
        self.free_list = if next == 0xFF { None } else { Some(next) };
        Some(&mut self.data[idx])
    }

    fn free(&mut self, idx: usize) {
        self.data[idx][0] = self.free_list.unwrap_or(0xFF) as u8;
        self.free_list = Some(idx);
    }
}
```
<!-- /tabs -->

### When to Use

- Fixed-size messages in a protocol stack
- Network packet buffers (all the same MTU size)
- RTOS task control blocks
- Any scenario where you need N objects of the same size

## Ring Buffers (Circular Buffers)

A [ring buffer](https://embeddedartistry.com/blog/2017/05/17/creating-a-circular-buffer-in-c-and-c/) is a fixed-size FIFO (First In, First Out) queue. It is the standard pattern for buffering streaming data between a producer and a consumer -- for example, between an ISR that receives UART bytes and the main loop that processes them.

### How It Works

```
Write (head)             Read (tail)
    |                       |
    v                       v
[  ][  ][D3][D4][D5][D6][  ][  ]
  0   1   2   3   4   5   6   7

head = 7 (next write position)
tail = 2 (next read position)
Items in buffer: (head - tail) % size = 5
```

The head advances when data is written; the tail advances when data is read. When either index reaches the end of the array, it wraps around to zero.

### Implementation

<!-- tabs -->
```c
#include <stdint.h>
#include <stdbool.h>

#define RING_SIZE 256  // Must be power of 2 for mask trick

typedef struct {
    uint8_t  buf[RING_SIZE];
    volatile uint16_t head;  // Write index (producer)
    volatile uint16_t tail;  // Read index (consumer)
} RingBuffer;

void ring_init(RingBuffer *rb) {
    rb->head = 0;
    rb->tail = 0;
}

bool ring_is_empty(RingBuffer *rb) {
    return rb->head == rb->tail;
}

bool ring_is_full(RingBuffer *rb) {
    return ((rb->head + 1) & (RING_SIZE - 1)) == rb->tail;
}

// Returns false if buffer is full
bool ring_put(RingBuffer *rb, uint8_t byte) {
    uint16_t next_head = (rb->head + 1) & (RING_SIZE - 1);
    if (next_head == rb->tail) {
        return false;  // Full
    }
    rb->buf[rb->head] = byte;
    rb->head = next_head;
    return true;
}

// Returns false if buffer is empty
bool ring_get(RingBuffer *rb, uint8_t *byte) {
    if (rb->head == rb->tail) {
        return false;  // Empty
    }
    *byte = rb->buf[rb->tail];
    rb->tail = (rb->tail + 1) & (RING_SIZE - 1);
    return true;
}

uint16_t ring_count(RingBuffer *rb) {
    return (rb->head - rb->tail) & (RING_SIZE - 1);
}
```

```rust
use core::sync::atomic::{AtomicU16, Ordering};

const RING_SIZE: usize = 256; // Must be power of 2 for mask trick

struct RingBuffer {
    buf: [u8; RING_SIZE],
    head: AtomicU16, // Write index (producer)
    tail: AtomicU16, // Read index (consumer)
}

impl RingBuffer {
    const fn new() -> Self {
        Self {
            buf: [0; RING_SIZE],
            head: AtomicU16::new(0),
            tail: AtomicU16::new(0),
        }
    }

    fn is_empty(&self) -> bool {
        self.head.load(Ordering::Acquire) == self.tail.load(Ordering::Acquire)
    }

    fn is_full(&self) -> bool {
        let next = (self.head.load(Ordering::Acquire) + 1) & (RING_SIZE as u16 - 1);
        next == self.tail.load(Ordering::Acquire)
    }

    /// Returns false if buffer is full
    fn put(&mut self, byte: u8) -> bool {
        let head = self.head.load(Ordering::Relaxed);
        let next_head = (head + 1) & (RING_SIZE as u16 - 1);
        if next_head == self.tail.load(Ordering::Acquire) {
            return false; // Full
        }
        self.buf[head as usize] = byte;
        self.head.store(next_head, Ordering::Release);
        true
    }

    /// Returns None if buffer is empty
    fn get(&mut self) -> Option<u8> {
        let tail = self.tail.load(Ordering::Relaxed);
        if self.head.load(Ordering::Acquire) == tail {
            return None; // Empty
        }
        let byte = self.buf[tail as usize];
        self.tail.store((tail + 1) & (RING_SIZE as u16 - 1), Ordering::Release);
        Some(byte)
    }

    fn count(&self) -> u16 {
        (self.head.load(Ordering::Acquire)
            .wrapping_sub(self.tail.load(Ordering::Acquire)))
            & (RING_SIZE as u16 - 1)
    }
}
```
<!-- /tabs -->

### Key Design Decisions

- **Power-of-2 size** -- using `& (SIZE - 1)` instead of `% SIZE` avoids an expensive division on CPUs without hardware divide (Cortex-M0).
- **One slot wasted** -- the buffer holds `SIZE - 1` items, because `head == tail` means empty. The alternative is a separate `count` variable, but that requires atomic access from ISR and main loop.
- **Volatile indices** -- `head` and `tail` are `volatile` because they are accessed from both ISR context and the main loop.

### Thread Safety

A ring buffer is **safe without locks** if there is exactly one producer and one consumer, and the size is a power of 2. This is because:

- Only the producer modifies `head`
- Only the consumer modifies `tail`
- Both are read atomically (single 16/32-bit load)

If you have multiple producers or multiple consumers, you need a mutex or critical section.

### When to Use

- UART RX/TX buffering
- ADC sample queues
- Inter-task communication (producer/consumer pattern)
- Audio sample buffers

## Object Pools

An object pool is a specialized memory pool for a specific struct type. It combines the memory pool pattern with type safety:

<!-- tabs -->
```c
typedef struct {
    uint16_t id;
    uint8_t  data[32];
    uint8_t  len;
} Packet;

#define MAX_PACKETS 8

static Packet packet_pool[MAX_PACKETS];
static bool   packet_used[MAX_PACKETS];

Packet *packet_alloc(void) {
    for (int i = 0; i < MAX_PACKETS; i++) {
        if (!packet_used[i]) {
            packet_used[i] = true;
            return &packet_pool[i];
        }
    }
    return NULL;
}

void packet_free(Packet *pkt) {
    int idx = pkt - packet_pool;  // Pointer arithmetic
    if (idx >= 0 && idx < MAX_PACKETS) {
        packet_used[idx] = false;
    }
}
```

```rust
struct Packet {
    id: u16,
    data: [u8; 32],
    len: u8,
}

const MAX_PACKETS: usize = 8;

struct PacketPool {
    pool: [Packet; MAX_PACKETS],
    used: [bool; MAX_PACKETS],
}

impl PacketPool {
    fn alloc(&mut self) -> Option<&mut Packet> {
        for i in 0..MAX_PACKETS {
            if !self.used[i] {
                self.used[i] = true;
                return Some(&mut self.pool[i]);
            }
        }
        None
    }

    fn free(&mut self, idx: usize) {
        if idx < MAX_PACKETS {
            self.used[idx] = false;
        }
    }
}
```
<!-- /tabs -->

## Compile-Time Allocation with static and const

The simplest "allocation" is no allocation at all:

<!-- tabs -->
```c
// Lookup table in flash (const -> .rodata -> flash)
static const uint16_t crc_table[256] = { /* ... */ };

// Persistent state in SRAM (static -> .bss or .data)
static uint32_t uptime_seconds = 0;

// Fixed buffer in SRAM
static uint8_t uart_tx_buf[128];
```

```rust
// Lookup table in flash (const -> .rodata -> flash)
static CRC_TABLE: [u16; 256] = [ /* ... */ ];

// Persistent state in SRAM (static mut -> .bss or .data)
static mut UPTIME_SECONDS: u32 = 0;

// Fixed buffer in SRAM
static mut UART_TX_BUF: [u8; 128] = [0; 128];
```
<!-- /tabs -->

**`const`** data lives in flash and costs zero SRAM. Use it for lookup tables, strings, configuration data, and calibration values.

**`static`** variables in functions persist across calls and have a fixed address known at link time.

## Summary Table

| Pattern | Allocation Time | Fragmentation | Use Case |
|---------|----------------|---------------|----------|
| Static global | Compile-time | None | Known-size buffers, state |
| Memory pool | O(1) with free list | None | Fixed-size objects |
| Ring buffer | O(1) | None | Streaming data FIFO |
| Object pool | O(n) or O(1) | None | Typed, reusable objects |
| `const` in flash | None (ROM) | None | Lookup tables, strings |

## References

1. [Creating a Circular Buffer in C and C++ - Embedded Artistry](https://embeddedartistry.com/blog/2017/05/17/creating-a-circular-buffer-in-c-and-c/) — Thorough ring buffer implementation walkthrough
2. [Memory Allocation Using Pool - Embedded Code Patterns](https://embedded-code-patterns.readthedocs.io/en/latest/pool/) — Memory pool pattern documentation and examples
3. [Fixed Sized Buffer Pattern - Real-Time Design Patterns](https://www.informit.com/articles/article.aspx?p=30309&seqNum=4) — Design pattern for fixed-size buffer allocation
4. [Memory Management in Embedded Systems](https://theembeddedgeorge.github.io/theEmbeddedNewTestament.github.io/Embedded_C/Memory_Management.html) — Overview of embedded memory management techniques

## Related Topics

- [Stack vs Heap](stack-vs-heap.md) -- why these patterns exist
- [DMA Controller](dma-controller.md) -- DMA buffers are typically statically allocated ring buffers
- [Memory Management Overview](index.md) -- the big picture of embedded memory strategies
