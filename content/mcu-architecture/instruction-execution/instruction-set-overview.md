---
title: "Instruction Set Overview"
created: 2026-03-08
updated: 2026-03-08
tags: [mcu, isa, thumb, thumb-2, risc, cisc, arm, cortex-m]
status: draft
sources:
  - url: "https://medium.com/@wadixtech/arm-cortex-m-thumb-encoding-fdb5f5c6b87b"
    title: "ARM Cortex-M: Thumb Encoding"
  - url: "https://en.wikipedia.org/wiki/ARM_architecture_family"
    title: "ARM Architecture Family - Wikipedia"
  - url: "https://embeddedsecurity.io/sec-arm-arch-core"
    title: "Arm M-profile architectures and Cortex-M"
---

## RISC vs CISC Philosophy

Two fundamental approaches to instruction set design:

### CISC (Complex Instruction Set Computing)

- Many instructions, some very powerful (e.g., x86 `MOVSB` copies a string in one instruction)
- Instructions vary widely in length (1 to 15 bytes on x86)
- One instruction can do memory access + computation
- Fewer instructions needed per program, but each may take many cycles

### RISC (Reduced Instruction Set Computing)

- Fewer, simpler instructions -- each does one thing well
- Fixed-length instructions (easier to decode, better for pipelining)
- **Load-store architecture**: only `LDR`/`STR` access memory; all computation happens between registers
- More instructions per program, but each takes fewer cycles (often 1)

**[ARM Cortex-M](https://en.wikipedia.org/wiki/ARM_architecture_family) is RISC.** To add a value from memory to a register, you need two instructions:

```arm
LDR  R0, [R1]        @ Load value from memory into R0
ADD  R0, R0, R2      @ Add R2 to R0
```

On a CISC processor (x86), this might be one instruction: `ADD EAX, [EBX]`.

The RISC approach wins in embedded because:
- Simple instructions = simple hardware = lower power consumption
- Fixed-length (or limited-length) instructions = predictable timing
- Small silicon area = cheaper chips

## Thumb and Thumb-2 Instruction Sets

ARM Cortex-M processors do **not** use the full 32-bit ARM instruction set. Instead, they use [**Thumb** and **Thumb-2**](https://medium.com/@wadixtech/arm-cortex-m-thumb-encoding-fdb5f5c6b87b).

### Original Thumb (16-bit)

- All instructions are 16 bits (2 bytes) wide
- Very compact code (good for small flash sizes)
- Limited: can only access R0--R7 (low registers), fewer operations
- Used exclusively on Cortex-M0 and M0+

```arm
@ 16-bit Thumb instructions (2 bytes each)
MOVS R0, #5          @ 0x2005
ADDS R0, R0, R1      @ 0x1840
CMP  R0, #10         @ 0x280A
```

### Thumb-2 (Mixed 16/32-bit)

- Extends Thumb with additional 32-bit instructions
- Variable length: each instruction is either 16 or 32 bits
- 32-bit instructions give access to R0--R12, larger immediates, more operations
- Used on Cortex-M3, M4, M7, M33

```arm
@ 16-bit Thumb instruction
ADDS R0, R1, R2      @ 2 bytes

@ 32-bit Thumb-2 instruction
MOVW R0, #0x1234     @ 4 bytes (16-bit immediate value)
ADD.W R8, R9, R10    @ 4 bytes (high registers)
```

### How the CPU Distinguishes 16-bit from 32-bit

The first halfword's upper bits determine the length:
- If bits [15:11] are `11101`, `11110`, or `11111` -> 32-bit instruction (fetch second halfword)
- Otherwise -> 16-bit instruction (complete)

This is transparent to the programmer -- the assembler and CPU handle it automatically.

### Code Density Comparison

| Format | Code Size | Performance | Available On |
|---|---|---|---|
| ARM (32-bit) | Largest | Highest (no decode overhead) | Cortex-A only |
| Thumb (16-bit) | Smallest | Limited (fewer operations) | All Cortex-M |
| Thumb-2 (mixed) | ~70% of ARM | ~95% of ARM | Cortex-M3+ |

Thumb-2 achieves nearly the performance of full ARM instructions at roughly 70% of the code size -- ideal for flash-constrained MCUs.

## Addressing Modes

Addressing modes determine **how operands are specified** in an instruction.

### Immediate

The operand value is encoded directly in the instruction:

```arm
MOV  R0, #42         @ R0 = 42 (value is in the instruction itself)
ADD  R1, R1, #1      @ R1 = R1 + 1
```

Thumb limits immediates to 8 bits (0--255). Thumb-2 allows 12-bit modified immediates or `MOVW`/`MOVT` for full 32-bit values:

```arm
MOVW R0, #0x1234     @ Lower 16 bits: R0 = 0x0000_1234
MOVT R0, #0x5678     @ Upper 16 bits: R0 = 0x5678_1234
```

### Register

Operands come from registers:

```arm
ADD  R0, R1, R2      @ R0 = R1 + R2
MOV  R0, R1          @ R0 = R1
```

### Register with Shift

One operand can be shifted before the ALU operation:

```arm
ADD  R0, R1, R2, LSL #3   @ R0 = R1 + (R2 << 3) = R1 + R2*8
```

### Register Offset (for Load/Store)

Used to access memory with a base address plus an offset:

```arm
LDR  R0, [R1]             @ R0 = memory[R1]          (no offset)
LDR  R0, [R1, #8]         @ R0 = memory[R1 + 8]      (immediate offset)
LDR  R0, [R1, R2]         @ R0 = memory[R1 + R2]     (register offset)
LDR  R0, [R1, R2, LSL #2] @ R0 = memory[R1 + R2*4]   (scaled register)
LDR  R0, [R1, #4]!        @ R1 += 4, then R0 = mem[R1]   (pre-increment)
LDR  R0, [R1], #4         @ R0 = mem[R1], then R1 += 4   (post-increment)
```

Pre/post-increment modes are useful for walking through arrays.

## Common Instruction Categories

### Data Processing

Arithmetic and logic operations between registers:

```arm
ADD  R0, R1, R2      @ Add
SUB  R0, R1, R2      @ Subtract
AND  R0, R1, R2      @ Bitwise AND
ORR  R0, R1, R2      @ Bitwise OR
EOR  R0, R1, R2      @ Bitwise XOR (exclusive OR)
LSL  R0, R1, #4      @ Logical shift left
CMP  R0, R1          @ Compare (sets flags, discards result)
```

### Load / Store

Move data between registers and memory (the only way to access memory in RISC):

```arm
LDR  R0, [R1]        @ Load 32-bit word
LDRH R0, [R1]        @ Load 16-bit halfword (zero-extended)
LDRB R0, [R1]        @ Load 8-bit byte (zero-extended)
STR  R0, [R1]        @ Store 32-bit word
STRH R0, [R1]        @ Store 16-bit halfword
STRB R0, [R1]        @ Store 8-bit byte
LDMIA R0!, {R1-R4}   @ Load multiple: R1-R4 from consecutive addresses
STMDB R0!, {R1-R4}   @ Store multiple (used for PUSH)
```

### Branch

Change the program counter (control flow):

```arm
B    label            @ Unconditional branch
BEQ  label            @ Branch if equal (Z=1)
BL   function         @ Branch with link (subroutine call)
BX   LR               @ Branch to address in register (return)
CBZ  R0, label        @ Compare and Branch if Zero (M3+)
CBNZ R0, label        @ Compare and Branch if Not Zero (M3+)
TBB  [R0, R1]         @ Table branch byte (switch-case, M3+)
```

### System

Special instructions for system control:

```arm
MRS  R0, PRIMASK      @ Read special register
MSR  PRIMASK, R0      @ Write special register
CPSID I               @ Disable interrupts
CPSIE I               @ Enable interrupts
SVC  #0               @ Supervisor Call (trigger SVCall exception)
WFI                   @ Wait For Interrupt (enter sleep)
WFE                   @ Wait For Event
ISB                   @ Instruction Sync Barrier
DSB                   @ Data Sync Barrier
DMB                   @ Data Memory Barrier
NOP                   @ No operation (1 cycle delay)
```

## References

1. [ARM Cortex-M: Thumb Encoding](https://medium.com/@wadixtech/arm-cortex-m-thumb-encoding-fdb5f5c6b87b) — Thumb and Thumb-2 instruction encoding explained
2. [ARM Architecture Family - Wikipedia](https://en.wikipedia.org/wiki/ARM_architecture_family) — RISC philosophy and ARM instruction set evolution
3. [Arm M-profile architectures and Cortex-M](https://embeddedsecurity.io/sec-arm-arch-core) — Cortex-M instruction set features and addressing modes

## Related Topics

- [CPU Core and ALU](../cpu-core-and-alu.md) -- data processing in the ALU
- [Fetch-Decode-Execute](fetch-decode-execute.md) -- how instructions are decoded
- [Pipeline Basics](pipeline-basics.md) -- IT blocks for conditional execution
- [Registers and Register File](../registers-and-register-file.md) -- the operands for all instructions
