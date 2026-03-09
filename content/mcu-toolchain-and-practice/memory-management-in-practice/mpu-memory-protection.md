---
title: "MPU Memory Protection"
created: 2026-03-08
updated: 2026-03-08
tags: [mpu, memory-protection, cortex-m, security, embedded]
status: draft
sources:
  - url: "https://developer.arm.com/documentation/107565/latest/Memory-protection/Memory-Protection-Unit"
    title: "Memory Protection Unit - ARM Developer"
  - url: "https://blog.feabhas.com/2013/02/setting-up-the-cortex-m34-armv7-m-memory-protection-unit-mpu/"
    title: "Setting up the Cortex-M3/4 MPU - Feabhas"
  - url: "https://interrupt.memfault.com/blog/fix-bugs-and-secure-firmware-with-the-mpu"
    title: "Fix Bugs and Secure Firmware with the MPU - Memfault"
  - url: "https://tickelton.gitlab.io/understanding-the-arm-cortex-m-mpu.html"
    title: "Understanding the ARM Cortex-M MPU"
---

The [Memory Protection Unit (MPU)](https://developer.arm.com/documentation/107565/latest/Memory-protection/Memory-Protection-Unit) is an optional hardware component in Cortex-M processors that enforces access rules on memory regions. It cannot perform address translation like an MMU (Memory Management Unit) on application processors, but it can prevent code from accessing memory it should not touch -- catching bugs early and improving system robustness.

## What the MPU Does

The MPU divides the address space into **regions**, each with configurable:

- **Base address** and **size**
- **Access permissions** (read, write, execute, privileged vs unprivileged)
- **Memory attributes** (cacheable, bufferable, shareable)

When code violates a region's rules, the MPU triggers a **MemManage fault** (exception #4) with a precise address in the MMFAR register.

## MPU Availability

| Processor | Max Regions | Notes |
|-----------|-------------|-------|
| Cortex-M0/M0+ | 0 or 8 | Optional, rarely included |
| Cortex-M3 | 8 | Optional |
| Cortex-M4 | 8 | Common on mid-range MCUs |
| Cortex-M7 | 8 or 16 | Often 16 regions |
| Cortex-M33 | 8 or 16 | ARMv8-M with enhanced MPU |

Check if your MCU has an MPU by reading the MPU TYPE register:

<!-- tabs -->
```c
if (MPU->TYPE == 0) {
    // No MPU available
} else {
    uint8_t num_regions = (MPU->TYPE >> 8) & 0xFF;
    // num_regions is typically 8 or 16
}
```

```rust
use core::ptr::read_volatile;

unsafe {
    let mpu_type = read_volatile(0xE000_ED90 as *const u32);
    if mpu_type == 0 {
        // No MPU available
    } else {
        let num_regions = ((mpu_type >> 8) & 0xFF) as u8;
        // num_regions is typically 8 or 16
    }
}
```
<!-- /tabs -->

## Region Configuration

Each region is defined by three register values: the region number (RNR), the base address (RBAR), and the region attributes (RASR).

### Region Number Register (RNR)

Selects which region (0 to N-1) you are configuring:

<!-- tabs -->
```c
MPU->RNR = 0;  // Configure region 0
```

```rust
unsafe {
    core::ptr::write_volatile(0xE000_ED98 as *mut u32, 0); // Configure region 0
}
```
<!-- /tabs -->

### Base Address Register (RBAR)

Sets the base address of the region. The address must be aligned to the region size.

<!-- tabs -->
```c
MPU->RBAR = 0x20000000;  // Region starts at SRAM base
```

```rust
unsafe {
    core::ptr::write_volatile(0xE000_ED9C as *mut u32, 0x2000_0000); // SRAM base
}
```
<!-- /tabs -->

### Region Attribute and Size Register (RASR)

This is the main configuration register:

```
Bits [31:29] - Reserved
Bit  [28]    - XN (Execute Never): 1 = prevent code execution
Bits [26:24] - AP (Access Permission)
Bits [21:19] - TEX (Type Extension)
Bit  [18]    - S (Shareable)
Bit  [17]    - C (Cacheable)
Bit  [16]    - B (Bufferable)
Bits [15:8]  - SRD (Subregion Disable) - 8 bits, one per subregion
Bits [5:1]   - SIZE (Region size as power of 2, min 5 = 32 bytes)
Bit  [0]     - ENABLE
```

### Access Permissions (AP Field)

| AP Value | Privileged | Unprivileged | Description |
|----------|-----------|--------------|-------------|
| 000 | No access | No access | All accesses fault |
| 001 | RW | No access | Privileged only |
| 010 | RW | RO | Unprivileged read-only |
| 011 | RW | RW | Full access |
| 101 | RO | No access | Privileged read-only |
| 110 | RO | RO | Read-only for all |

### Size Encoding

The SIZE field encodes region size as a power of 2:

| SIZE value | Region size |
|-----------|-------------|
| 4 | 32 bytes (minimum) |
| 7 | 256 bytes |
| 9 | 1 KB |
| 12 | 8 KB |
| 14 | 32 KB |
| 19 | 1 MB |
| 31 | 4 GB (entire address space) |

Formula: `region_size = 2^(SIZE + 1)`

### Subregions

Each region can be divided into 8 equal **subregions**. Individual subregions can be disabled using the SRD bits, allowing finer-grained control without using additional regions.

## Enabling the MPU

<!-- tabs -->
```c
void mpu_enable(void) {
    // Enable MemManage fault handler
    SCB->SHCSR |= SCB_SHCSR_MEMFAULTENA_Msk;

    // Enable MPU with default memory map for privileged access
    // PRIVDEFENA = 1: privileged code can access anything not
    //   explicitly denied by an MPU region
    MPU->CTRL = MPU_CTRL_ENABLE_Msk | MPU_CTRL_PRIVDEFENA_Msk;

    // Ensure MPU settings take effect
    __DSB();
    __ISB();
}
```

```rust
use core::ptr::{read_volatile, write_volatile};
use cortex_m::asm;

unsafe fn mpu_enable() {
    // Enable MemManage fault handler
    let shcsr = 0xE000_ED24 as *mut u32;
    write_volatile(shcsr, read_volatile(shcsr) | (1 << 16));

    // Enable MPU with default memory map for privileged access
    // PRIVDEFENA = 1, ENABLE = 1
    let mpu_ctrl = 0xE000_ED94 as *mut u32;
    write_volatile(mpu_ctrl, (1 << 2) | (1 << 0)); // PRIVDEFENA | ENABLE

    // Ensure MPU settings take effect
    asm::dsb();
    asm::isb();
}
```
<!-- /tabs -->

The `PRIVDEFENA` bit is important for getting started. When set, privileged code can access the default memory map for any address not covered by an MPU region. This means you only need to define regions for the areas you want to **restrict**, rather than mapping the entire address space.

## Use Cases

### Stack Overflow Protection

Place a ["no access" region at the bottom of the stack](https://interrupt.memfault.com/blog/fix-bugs-and-secure-firmware-with-the-mpu). If the stack overflows into this guard region, you get an immediate MemManage fault instead of silent memory corruption.

<!-- tabs -->
```c
void mpu_configure_stack_guard(uint32_t stack_bottom) {
    MPU->RNR = 0;  // Use region 0

    // 32-byte guard at the bottom of the stack
    MPU->RBAR = stack_bottom & ~0x1F;  // Align to 32 bytes

    MPU->RASR = (0 << 24)    // AP = 000 (no access)
              | (1 << 28)    // XN = 1 (no execute)
              | (4 << 1)     // SIZE = 4 (32 bytes)
              | (1 << 0);    // ENABLE

    __DSB();
    __ISB();
}
```

```rust
use core::ptr::write_volatile;
use cortex_m::asm;

unsafe fn mpu_configure_stack_guard(stack_bottom: u32) {
    let mpu_rnr  = 0xE000_ED98 as *mut u32;
    let mpu_rbar = 0xE000_ED9C as *mut u32;
    let mpu_rasr = 0xE000_EDA0 as *mut u32;

    write_volatile(mpu_rnr, 0); // Use region 0

    // 32-byte guard at the bottom of the stack
    write_volatile(mpu_rbar, stack_bottom & !0x1F); // Align to 32 bytes

    write_volatile(mpu_rasr,
          (0 << 24)    // AP = 000 (no access)
        | (1 << 28)    // XN = 1 (no execute)
        | (4 << 1)     // SIZE = 4 (32 bytes)
        | (1 << 0));   // ENABLE

    asm::dsb();
    asm::isb();
}
```
<!-- /tabs -->

### Peripheral Access Control

Prevent unprivileged code from directly accessing peripheral registers:

<!-- tabs -->
```c
void mpu_protect_peripherals(void) {
    MPU->RNR = 1;  // Use region 1

    // Protect peripheral address range 0x40000000 - 0x5FFFFFFF
    MPU->RBAR = 0x40000000;

    MPU->RASR = (1 << 24)    // AP = 001 (privileged RW only)
              | (1 << 28)    // XN = 1 (no execute)
              | (28 << 1)    // SIZE = 28 (512 MB)
              | (1 << 0);    // ENABLE

    __DSB();
    __ISB();
}
```

```rust
unsafe fn mpu_protect_peripherals() {
    let mpu_rnr  = 0xE000_ED98 as *mut u32;
    let mpu_rbar = 0xE000_ED9C as *mut u32;
    let mpu_rasr = 0xE000_EDA0 as *mut u32;

    core::ptr::write_volatile(mpu_rnr, 1); // Use region 1

    // Protect peripheral address range 0x40000000 - 0x5FFFFFFF
    core::ptr::write_volatile(mpu_rbar, 0x4000_0000);

    core::ptr::write_volatile(mpu_rasr,
          (1 << 24)    // AP = 001 (privileged RW only)
        | (1 << 28)    // XN = 1 (no execute)
        | (28 << 1)    // SIZE = 28 (512 MB)
        | (1 << 0));   // ENABLE

    cortex_m::asm::dsb();
    cortex_m::asm::isb();
}
```
<!-- /tabs -->

### Null Pointer Protection

Create a "no access" region at address 0x00000000 to catch null pointer dereferences:

<!-- tabs -->
```c
void mpu_null_pointer_guard(void) {
    MPU->RNR = 2;

    MPU->RBAR = 0x00000000;

    MPU->RASR = (0 << 24)    // AP = 000 (no access)
              | (1 << 28)    // XN = 1
              | (4 << 1)     // SIZE = 4 (32 bytes)
              | (1 << 0);    // ENABLE

    __DSB();
    __ISB();
}
```

```rust
unsafe fn mpu_null_pointer_guard() {
    let mpu_rnr  = 0xE000_ED98 as *mut u32;
    let mpu_rbar = 0xE000_ED9C as *mut u32;
    let mpu_rasr = 0xE000_EDA0 as *mut u32;

    core::ptr::write_volatile(mpu_rnr, 2);
    core::ptr::write_volatile(mpu_rbar, 0x0000_0000);
    core::ptr::write_volatile(mpu_rasr,
          (0 << 24)    // AP = 000 (no access)
        | (1 << 28)    // XN = 1
        | (4 << 1)     // SIZE = 4 (32 bytes)
        | (1 << 0));   // ENABLE

    cortex_m::asm::dsb();
    cortex_m::asm::isb();
}
```
<!-- /tabs -->

### DMA Buffer Non-Cacheable (Cortex-M7)

On Cortex-M7, mark DMA buffers as non-cacheable to avoid cache coherency issues:

<!-- tabs -->
```c
void mpu_dma_buffer_nocache(uint32_t addr, uint32_t size_log2) {
    MPU->RNR = 3;

    MPU->RBAR = addr;

    // TEX=1, C=0, B=0 -> Non-cacheable
    MPU->RASR = (3 << 24)              // AP = 011 (full access)
              | (1 << 28)              // XN = 1
              | (1 << 19)              // TEX = 001
              | (0 << 17)              // C = 0
              | (0 << 16)              // B = 0
              | ((size_log2 - 1) << 1) // SIZE
              | (1 << 0);              // ENABLE

    __DSB();
    __ISB();
}
```

```rust
unsafe fn mpu_dma_buffer_nocache(addr: u32, size_log2: u32) {
    let mpu_rnr  = 0xE000_ED98 as *mut u32;
    let mpu_rbar = 0xE000_ED9C as *mut u32;
    let mpu_rasr = 0xE000_EDA0 as *mut u32;

    core::ptr::write_volatile(mpu_rnr, 3);
    core::ptr::write_volatile(mpu_rbar, addr);

    // TEX=1, C=0, B=0 -> Non-cacheable
    core::ptr::write_volatile(mpu_rasr,
          (3 << 24)                  // AP = 011 (full access)
        | (1 << 28)                  // XN = 1
        | (1 << 19)                  // TEX = 001
        | (0 << 17)                  // C = 0
        | (0 << 16)                  // B = 0
        | ((size_log2 - 1) << 1)     // SIZE
        | (1 << 0));                 // ENABLE

    cortex_m::asm::dsb();
    cortex_m::asm::isb();
}
```
<!-- /tabs -->

## MemManage Fault Handling

When an MPU violation occurs:

1. The MemManage exception fires (if enabled)
2. `SCB->CFSR` bits [7:0] (MMFSR) indicate the type of violation
3. If `MMARVALID` is set, `SCB->MMFAR` contains the faulting address

<!-- tabs -->
```c
void MemManage_Handler(void) {
    uint32_t mmfsr = SCB->CFSR & 0xFF;
    uint32_t mmfar = SCB->MMFAR;

    if (mmfsr & (1 << 7)) {  // MMARVALID
        // mmfar contains the address that caused the violation
    }
    if (mmfsr & (1 << 1)) {  // DACCVIOL
        // Data access violation
    }
    if (mmfsr & (1 << 0)) {  // IACCVIOL
        // Instruction access violation
    }

    // Clear fault flags
    SCB->CFSR = 0xFF;

    while (1) {}  // Halt for debugging
}
```

```rust
use core::ptr::{read_volatile, write_volatile};

#[no_mangle]
unsafe extern "C" fn MemManage_Handler() {
    let cfsr  = read_volatile(0xE000_ED28 as *const u32);
    let mmfsr = cfsr & 0xFF;
    let mmfar = read_volatile(0xE000_ED34 as *const u32);

    if mmfsr & (1 << 7) != 0 {  // MMARVALID
        // mmfar contains the address that caused the violation
        let _ = mmfar;
    }
    if mmfsr & (1 << 1) != 0 {  // DACCVIOL
        // Data access violation
    }
    if mmfsr & (1 << 0) != 0 {  // IACCVIOL
        // Instruction access violation
    }

    // Clear fault flags
    write_volatile(0xE000_ED28 as *mut u32, 0xFF);

    loop {} // Halt for debugging
}
```
<!-- /tabs -->

## Common Mistakes

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Forgetting `__DSB(); __ISB()` | MPU changes not applied | Always issue barriers after config |
| Misaligned base address | Unpredictable region boundaries | Align base to region size |
| Not enabling MemManage handler | MPU violations escalate to HardFault | Set `MEMFAULTENA` in `SCB->SHCSR` |
| Overlapping regions | Higher-numbered region wins | Design regions carefully |
| PRIVDEFENA = 0 without full coverage | Privileged code also faults | Enable PRIVDEFENA or map all regions |

## References

1. [Memory Protection Unit - ARM Developer](https://developer.arm.com/documentation/107565/latest/Memory-protection/Memory-Protection-Unit) — Official ARM documentation on MPU architecture and usage
2. [Setting up the Cortex-M3/4 MPU - Feabhas](https://blog.feabhas.com/2013/02/setting-up-the-cortex-m34-armv7-m-memory-protection-unit-mpu/) — Practical guide to MPU region configuration
3. [Fix Bugs and Secure Firmware with the MPU - Memfault](https://interrupt.memfault.com/blog/fix-bugs-and-secure-firmware-with-the-mpu) — Using MPU to catch bugs and improve security
4. [Understanding the ARM Cortex-M MPU](https://tickelton.gitlab.io/understanding-the-arm-cortex-m-mpu.html) — Clear introduction to MPU concepts and registers

## Related Topics

- [Fault Debugging Techniques](../debugging-and-probes/fault-debugging-techniques.md) -- interpreting MemManage faults
- [Stack vs Heap](stack-vs-heap.md) -- stack guard use case
- [DMA Controller](dma-controller.md) -- marking DMA buffers non-cacheable
