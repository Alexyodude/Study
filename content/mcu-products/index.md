---
title: "MCU Product Catalog"
created: 2026-11-07
updated: 2026-11-07
tags: [mcu, microcontrollers, catalog, arm, risc-v, wireless, pricing]
status: review
sources:
  - url: "https://www.arrow.com/en/products/ae302f80f55d5le-y/alif-semiconductor"
    title: "Alif Semiconductor AE302F80F55D5LE-Y product page"
  - url: "https://www.digikey.sg/en/products/detail/ambiq-micro-inc/AMA3B2KK-KBR/20380332"
    title: "Ambiq AMA3B2KK-KBR (Apollo3 Blue Plus) product page"
  - url: "https://www.futureelectronics.com/p/semiconductors--microprocessors--embedded-processors/ama4b2kp-kbr-ambiq-7162807"
    title: "Ambiq AMA4B2KP-KBR (Apollo4 Blue Plus) product page"
  - url: "https://www.futureelectronics.com/p/semiconductors--microprocessors--embedded-processors/ap510nla-cbr-ambiq-4219874"
    title: "Ambiq AP510NLA-CBR (Apollo510 Lite) product page"
  - url: "https://www.digikey.com.au/en/product-highlight/a/analog-devices/max32655-arm-cortex-m4-processor"
    title: "Analog Devices MAX32655GXG+ product page"
  - url: "https://www.digikey.co.uk/en/products/detail/analog-devices-inc-maxim-integrated/MAX32670GTL/12178454"
    title: "Analog Devices MAX32670GTL+T product page"
  - url: "https://www.digikey.co.th/en/product-highlight/a/analog-devices/max32690-microcontroller"
    title: "Analog Devices MAX32690GTK+ product page"
  - url: "https://www.analog.com/en/products/max78000"
    title: "Analog Devices MAX78000 (ordering suffix to confirm) product page"
  - url: "https://www.analog.com/en/products/max78002"
    title: "Analog Devices MAX78002GXE product page"
  - url: "https://www.arterychip.com/en/product/AT32F403A.jsp"
    title: "Artery AT32F403ACGT7 product page"
  - url: "https://www.arterychip.com/en/product/AT32F415.jsp"
    title: "Artery AT32F415CBT7 product page"
  - url: "https://www.arterychip.com/en/product/AT32F421.jsp"
    title: "Artery AT32F421G8U7 product page"
---

# MCU Product Catalog

A searchable catalog of **256 microcontrollers from 43 vendors**, 158 of them with a distributor price. Open the interactive version at [`/mcu-products/`](../../site/mcu-products/index.html) to filter by category, architecture, vendor, radio, memory, clock, price and interfaces.

## What this catalog covers

This catalog lists real microcontroller parts you can buy. It has about 256 rows from more than 40 vendors. The site's concept pages explain how an MCU works. This page is about which parts exist, what they cost and what each one is good at.

It covers three kinds of part:

- **Classic MCUs**, from 8-bit OTP chips that cost a few cents up to 300 MHz Cortex-M7 parts.
- **Crossover MCUs**: very fast parts (400 MHz to 1 GHz) that still run from on-chip SRAM or flash, such as the i.MX RT line, STM32H7 and RA8.
- **Wireless SoCs that people use as the main MCU**, such as ESP32, nRF52/nRF54, CC23xx and CH59x.

It leaves out Linux-class application processors that need an MMU and external DRAM (i.MX 8, STM32MP2, Allwinner).

### How to read an entry

Each row is one part number. It shows the vendor and family, a category, the CPU core and clock, flash and SRAM, any radio and USB, a price, the launch year and status, and short highlights.

- **Prices are in USD and always come with a quantity.** "$0.29@5" and "$0.30@1000" are not the same kind of number, so compare the quantity first.
- **Each price has a confidence label:** *verified* means read from the JLCPCB/LCSC parts API for the exact part number, in stock, at 100 pieces; *listed* means a distributor price seen in search results, often an old snapshot; *est* means a rough figure (stale, conflicting, or for a different quantity or variant); *none* means no price found. 109 parts have a *verified* JLC price. Treat the other prices as pointers to go and check, not as quotes.
- **A blank or "?" means unknown, not zero.** "0 KB flash" means the chip has no on-chip flash and runs code from an external flash chip. Examples are ESP32-D0WD-V3, RP2040, RP2350A, HPM6750IVM2 and STM32N647Z0.
- **Some rows describe a family, not one part.** Their names say "variant not verified" or "orderable part to confirm", for example RA8M1, nRF54L10, i.MX RT700 and STM32V8. Their specs belong to the family, not to one orderable part.
- **Some Espressif rows are modules, not bare chips.** These are ESP8684-MINI-1-H4X, ESP32-C5-WROOM-1-N16R8, ESP32-C6-WROOM-1-N4 and ESP32-H2-MINI-1-N2. Their flash figure is the module's flash.
- **Most specs were checked only for plausibility, not against a datasheet.** Each entry's checked note says what was actually confirmed.

### Categories

Each part has one category, the one that fits best. Three rules settle the edge cases:

- **Radio wins.** Any part with a built-in radio is *wireless*, even if it is also cheap or low-power.
- **Price wins under $0.50.** A part that sells for under $0.50 is *ultra-low-cost*, whatever its core. Classic 8-bit parts (AVR, PIC, 8051, STM8) above that price are *legacy-8bit*.
- **High-performance means 400 MHz or more.** So 300 MHz Cortex-M7 parts such as ATSAME70Q21B-CN and the PIC32CZ CA70/CA80/CA90 rows sit in *general-purpose*.

## Market map

### By architecture

**Arm Cortex-M is most of the catalog.**

- **Cortex-M0/M0+** fills the low end: STM32C011F6P6, STM32G030C8T6, MSPM0C1104SDSGR, PY32F003L16S6TU, HK32F030MJ4M6 and LPC845M301JBD64E.
- **Cortex-M3/M4** is the mainstream: STM32F103C8T6, STM32F407VGT6, STM32G431CBT6, GD32F303RCT6, AT32F403ACGT7 and N32G455REL7.
- **Cortex-M33** brings TrustZone security and runs most new wireless chips: STM32U575RIT6, STM32H503CBT6, LPC55S69JBD64K, MCXA153VLH, nRF54L15-QFAA-R and EFR32MG24.
- **Cortex-M7 and M85** sit at the top: STM32H743VIT6, MIMXRT1062CVL5B, GD32H759IMT6 and the RA8 family.
- **Cortex-M55** is the core of most AI parts: STM32N647Z0, the Alif Ensemble E3, PSoC Edge E84, Himax HX6538 and Nuvoton M55M1.

**RISC-V is strongest at the cheap end and in Chinese and wireless parts.**

- **WCH** builds almost its whole line on its QingKe RISC-V cores, from CH32V003F4P6 to the dual-core 400 MHz CH32H417QEU6.
- **Espressif's newer chips** are all RISC-V: ESP32-C2/ESP8684, C3, C5, C6, C61, H2, H4, P4 and S31.
- **HPMicro** makes fast RISC-V parts: HPM5361IEG1 at 480 MHz and HPM6750IVM2 at 816 MHz.
- **Other RISC-V parts:** Bouffalo BL602, BL616 and BL702S; GigaDevice GD32VF103CBT6 and GD32VW553KIQ6; Canaan K210; GreenWaves GAP9.
- **Mixed Arm and RISC-V:** RP2350 lets you choose Cortex-M33 or Hazard3 RISC-V cores. Nordic's nRF54L parts pair a Cortex-M33 with a RISC-V coprocessor.

**Other architectures:**

- **Xtensa:** ESP32-D0WD-V3, ESP32-S2, ESP32-S3R8 and ESP8266EX.
- **8-bit:** AVR (ATmega328P-AU, the tinyAVR parts, AVR DD/DB/EB/DU); PIC (PIC10F320, PIC12F1840, PIC18F47Q84); 8051 (STC, Nuvoton MS51, Sinowealth, WCH CH552G/CH554E, Silicon Labs EFM8BB1); STM8; and proprietary cores from Padauk, Holtek, Nyquest and FMD.
- **16-bit:** MSP430 (MSP430FR2433, MSP430G2553), PIC24, dsPIC33, Renesas RL78 and Lapis nX-U16.
- **Vendor-specific cores:** Renesas RX (RX26T, RX72N, RX140), TI C28x DSCs (C2000), Infineon TriCore (AURIX), MIPS (PIC32MX170F256B) and Telink TC32 (TLSR8258).

### By segment: who leads where

- **Broad mainstream lines:** ST has the widest range here, from STM32C0 up to STM32H7, plus STM32N6 for AI. NXP (LPC, MCX, i.MX RT), Microchip (SAM, PIC32, AVR, PIC), Renesas (RA, RX, RL78) and TI (MSPM0, C2000, SimpleLink) also cover many segments each.
- **Low-cost and drop-in compatible parts:** Chinese vendors lead. GD32F103C8T6, APM32F103C8T6 and GD32VF103CBT6 are listed as pin-compatible with STM32F103. Puya, HK, WCH, STC, Padauk and Nyquest hold the sub-$0.50 tier.
- **Wireless:** Nordic (nRF52, nRF53, nRF54, nRF91), Espressif (Wi-Fi), Silicon Labs (EFR32), TI (CC23xx, CC26xx, CC35xx) and WCH (cheap BLE).
- **Motor and power control:** TI C2000, Microchip dsPIC33, Infineon XMC1300 and PSoC Control C3, Renesas RX26T and MindMotion MM32SPIN.
- **Automotive safety:** Infineon AURIX and Traveo are the only rows so far.

## Price tiers

| Tier | Parts in stock at JLCPCB (price @ 100 pcs) | Count |
|---|---|---|
| **Under $0.25** | PMS150C-S08 $0.03, PFS154-S08 $0.07, PY32F002AL15S6TU $0.15, PY32F003L16S6TU $0.18, HK32F030MJ4M6 $0.20, STC8G1K08A-36I-SOP8 $0.22, CH572D $0.23, CH32V003F4P6 $0.24 | 8 |
| **$0.25 to $0.50** | MSPM0C1104SDSGR $0.28, STM8S003F3P6 $0.29, CH552G $0.31, CH32X035G8U6 $0.31, APM32F003F6P6 $0.32, MM32F0010A1T $0.38, CH32V203G6U6 $0.45, STC8H8K64U-45I-QFN48 $0.46, GD32E230F8P6TR $0.47, N32G430C8L7 $0.47 | 10 |
| **$0.50 to $1** | CH592F $0.51, MM32SPIN05PT $0.51, STM32F030F4P6 $0.52, CH32L103C8T6 $0.55, AT32F421G8U7 $0.56, CH554E $0.59, BK7238QH321 $0.70, CH582F $0.75, AT32F415CBT7 $0.77, ATtiny202-SSFR $0.78, ATtiny1616-MNR $0.84, RP2040 $0.86 and 8 more | 20 |
| **$1 to $2** | ESP8266EX $1.06, GD32F303RCT6 $1.07, STM32F103C8T6 $1.12, STM32G030C8T6 $1.13, RP2350B $1.13, MSPM0G3507SPTR $1.13, RP2350A $1.13, GD32F103C8T6 $1.14, STM32L051C8T6 $1.27, ESP32-C3 $1.29, CH32V208RBT6 $1.30, CH32V303RCT6 $1.30 and 9 more | 21 |
| **$2 to $5** | ESP32-D0WD-V3 $2.11, ESP32-S3R8 $2.28, CH32V307VCT6 $2.39, BK7258QN8868 $2.39, AVR64DD32-I/PT $2.41, nRF52810-QCAA-R $2.42, DA14531-00000OG2 $2.50, MSP430G2553IPW20R $2.62, ATMEGA4809-AFR $2.66, dsPIC33CK64MC105-I/PT $2.85, ESP32-C6-WROOM-1-N4 $3.00, AT32F435RGT7 $3.27 and 20 more | 32 |
| **Over $5** | NRF52840-QIAA-R $5.88, ATSAMD51J19A-AU $6.17, MIMXRT1062CVL5B $7.20, STM32L432KCU6 $7.22, HPM5E3YIGN1 $7.34, STM32F722RET6 $7.75, STM32H743VIT6 $7.79, STM32WB55RGV6 $9.81, STM32U575RIT6 $10.48, HPM6750IVM2 $11.56, HPM6880IBD1 $11.74, STM32H7R7I8T6 $11.74 and 6 more | 18 |

Only the 109 parts with a verified JLC price are in this table, all at 100 pieces, so they compare directly. The catalog page shows the rest with their search-result prices.

Two things stand out:

- **Cheap now goes a long way.** About $1 buys a dual-core RP2040 ($0.86) or RP2350A ($1.13), or an 80 MHz MSPM0G3507 ($1.13).
- **Cheap BLE exists.** CH572D is $0.23 and CH592F $0.51 at JLCPCB.

## Notable 2025 to 2026 launches

- **Very cheap entry parts:** MSPM0C1104SDSGR (2025, claimed as the smallest MCU in a 1.38 mm² WCSP), Renesas RA0E1 and RA0E2 (2025) and RA0E3 (2026).
- **AI on small MCUs:** MSPM0G5187 (2026) adds a TinyEngine NPU to a Cortex-M0+. TI AM13E23019 (preview) is a motor-control part with an NPU. NXP's MCX N24 (2026) and Nordic's nRF54LM20B (2026, Axon NPU) bring AI to mainstream and wireless parts.
- **Fast Cortex-M85 parts:** Renesas RA8P1 and RA8M2 (2025, 1 GHz Cortex-M85 plus Cortex-M33). ST STM32V8 (announced November 2025, Cortex-M85 at 800 MHz on 18 nm FD-SOI).
- **Wireless:** ESP32-C5 (dual-band Wi-Fi 6, mass production announced April 2025); ESP32-S31 (2026, dual-core 320 MHz, Wi-Fi 6, Gigabit Ethernet MAC, DVP camera); nRF54LM20A (2025, 2 MB, high-speed USB); nRF54LV10A (2025, runs from 1.2 to 1.7 V); WCH CH572D (2025, USB plus BLE for about $0.43).
- **WCH:** CH32H417QEU6 (2026, dual RISC-V at 400 and 160 MHz, USB 3.2 Gen1, 150 MHz DVP). CH32V205 (192 MHz, USB high-speed PHY) and CH32V407 (200 MHz, Ethernet MAC and PHY), both 2026.
- **Others:** STM32U3B5CIT6 (2026, near-threshold low-power design), STM32C5 (2026), Microchip PIC32CM PL10 (2026, 5 V, pin-compatible with AVR), Raspberry Pi RP2354A and RP2354B (2025, 2 MB flash stacked in the package), Infineon PSoC Control C3 (2025), Toshiba TMPM4K4FYBUG (2025) and Renesas RL78/G24 (2025).

Many of these rows are still family-level. Check the exact order code before you design one in.

## How to pick from the catalog

### Cheapest possible

- **Simple fixed jobs** like a blinker, button logic or IR remote: Padauk PMS150C-S08 (one-time programmable), PFS154-S08 (reprogrammable) or Nyquest NY8A051H (has an IR carrier output).
- **When you want a real 32-bit chip with SWD debug:** PY32F003L16S6TU, HK32F030MJ4M6, CH32V003F4P6, CH32V006F8U6 or MSPM0C1104SDSGR.

### Battery-powered sensor

- **MSP430FR2433IRGE** (FRAM, 16 nA in LPM4.5).
- **Renesas RL78/G22, R7F102G8C3CLA#HC0** (37.5 µA/MHz, 200 nA STOP).
- **STM32 low-power lines:** STM32L051C8T6, STM32L432KCU6, STM32U031C8T6 and STM32U575RIT6.
- **RA0E1 and RA0E2**, and **MAX32670GTL+T**.
- **If the sensor also needs a radio:** nRF54LV10A, which hibernates below 50 nA and is listed as able to run from a 1.5 V silver-oxide cell.

### BLE or Wi-Fi product

- **Cheapest BLE:** CH592F, CH572D, CH582F, DA14531 and CC2340R5RGER.
- **Mainstream BLE with a large ecosystem:** NRF52832-QFAA-R, NRF52840-QIAA-R (adds USB) and nRF54L15-QFAA-R (adds Channel Sounding).
- **Thread, Zigbee or Matter:** nRF54L15-QFAA-R, ESP32-H2-MINI-1-N2, ESP32-C6-WROOM-1-N4, EFR32MG24, CC2652R7RGZR and MCXW71.
- **Wi-Fi:** ESP32-C3 or ESP8684 (ESP32-C2) for low cost. ESP32-C6 or CC3501E for Wi-Fi 6. ESP32-C5 for dual-band 2.4/5 GHz.
- **Cellular:** nRF9151-LACA-R (LTE-M, NB-IoT, GNSS).

### Motor control

- **Low cost:** dsPIC33CK64MC105 ($1.89), XMC1302 ($1.09) and MM32SPIN05PT ($0.67).
- **Bigger drives:** TMS320F280039C (16 ePWM channels, three 4 MSPS ADCs), TMS320F28P650DK6PZP, dsPIC33AK128MC106, Renesas RX26T and Infineon PSoC Control C3.
- **EtherCAT motion control:** HPM6E80IVM1.

### Camera and vision

- **Parallel camera port (DVP or DCMI):** STM32F407VGT6, STM32H743VIT6, CH32V307VCT6, CH32H417QEU6, AT32F435RGT7, HPM6750IVM2 (two DVP ports), ESP32-S2, ESP32-S31 and MIMXRT1062CVL5B.
- **MIPI CSI:** ESP32-P4NRW32 (with an ISP and H.264 encoder, $4.60), MIMXRT1171DVMAA, HPM6880IBD1, STM32N647Z0 and Realtek RTL8735B.
- **For study:** this site's CH32V003 parallel image-processing page shows that even the cheapest part can do simple vision work.

### ML at the edge

- **Biggest NPU:** STM32N647Z0, with a 600 GOPS NPU and 4.2 MB SRAM.
- **Ethos-U55 NPU parts:** Alif AE302F80F55D5LE-Y, Renesas RA8P1, PSoC Edge E84, Nuvoton M55M1H2LJAE and Himax HX6538.
- **Smaller NPUs:** NXP MCXN947VDFT, MCXN546VDFT and MCX N24 (eIQ Neutron NPU), MSPM0G5187 (2.56 GOPS) and TMS320F28P550SJ6PZR.
- **CNN accelerators:** MAX78000 and MAX78002GXE.
- **Older or niche:** K210 (KPU accelerator), plus ESP32-S3R8, which has vector instructions for neural networks.

### Boards assembled at JLCPCB

- **Use the *In stock at JLCPCB* filter.** 109 parts are in stock there under their exact part number. Each card shows the LCSC code and stock on 2026-11-07.
- **Expect the Extended-part fee.** None of the 165 MCUs found at JLCPCB is a Basic part.
- **56 parts are listed but out of stock**, so check stock again before you lay out a board.
- **Drop-in swaps:** GD32F103C8T6 ($1.14) or APM32F103C8T6 ($0.95) can replace STM32F103C8T6 ($1.12). They are listed as pin-compatible.
- **Programmers are not listed yet.** Check what each part needs before you commit to it.

## Categories at a glance

| Category | Summary | Standouts |
|---|---|---|
| Ultra-low-cost | Parts under $0.50. At the bottom are 8-bit chips from Padauk, Nyquest, Holtek and FMD. Above them, starting around $0.12, are 32-bit Cortex-M0/M0+ parts from Puya, HK, MindMotion and TI, and WCH's RISC-V CH32V00x. Most of the 32-bit parts here now have a verified JLC price; the 8-bit prices below $0.10 are still estimates at large quantities. | NY8A051H, PMS150C-S08, PFS154-S08, PY32F003L16S6TU, HK32F030MJ4M6, CH32V003F4P6, CH32V006F8U6, MSPM0C1104SDSGR, R7FA0E3034ZSD#VA0, STM8S003F3P6 |
| General purpose | The largest group: mainstream 32-bit parts below 400 MHz, from Cortex-M0+ up to 300 MHz Cortex-M7, plus RISC-V and a few 16-bit and 32-bit 8051-derived parts. It includes the STM32F103 and its pin-compatible clones, and the PIO-equipped RP2040 and RP2350. CH32V307VCT6 and AT32F435RGT7 add DVP camera ports at low cost. | STM32F103C8T6, GD32F103C8T6, RP2040, RP2350A, CH32V307VCT6, MSPM0G3507SPTR, AT32F435RGT7, STM32G431CBT6, ATSAME70Q21B-CN, CH32X035G8U6 |
| Low power | Parts designed around battery life: STM32 L0/L4/U0/U3/U5, MSP430FR, RL78/G22, RA0E1/RA0E2, RX140, Ambiq Apollo510, MAX32670, PSoC 6 and HC32L110. The best documented figures are MSP430FR2433 at 16 nA in LPM4.5 and RL78/G22 at 37.5 uA/MHz with 200 nA STOP. Most other rows still lack sleep-current numbers. | MSP430FR2433IRGE, R7F102G8C3CLA#HC0, STM32U3B5CIT6, STM32L051C8T6, STM32U575RIT6, AP510NLA-CBR, MAX32670GTL+T |
| Wireless | Integrated BLE, 802.15.4, Wi-Fi, sub-GHz or cellular. Nordic, Espressif, Silicon Labs, TI and WCH lead. Cheap BLE now starts at $0.23 (CH572D) and $0.51 (CH592F) at JLCPCB. Wi-Fi 6 is common on ESP32-C6, ESP32-C5, CC3501E, BL616 and SiWG917. Many Asian wireless rows still have no core, memory or price. | nRF54L15-QFAA-R, NRF52840-QIAA-R, ESP32-C3, ESP32-C6-WROOM-1-N4, ESP32-C5-WROOM-1-N16R8, CH592F, CH572D, CC2340R5RGER, nRF9151-LACA-R, STM32WLE5CCU6 |
| High performance | Parts at 400 MHz or more: i.MX RT, STM32H7 and H7R/S, RA8M1/RA8D1/RA8M2, GD32H759, HPMicro, ESP32-P4, CH32H417 and STM32V8. RISC-V offers the best value here: HPM5361IEG1 runs at 480 MHz with on-chip flash for $5.65, and ESP32-P4NRW32 adds MIPI-CSI with an ISP for $4.60. | HPM5361IEG1, ESP32-P4NRW32, STM32H743VIT6, MIMXRT1062CVL5B, MIMXRT1064DVL6A, CH32H417QEU6, HPM6750IVM2, GD32H759IMT6 |
| AI / NPU | Parts with an NPU or a dedicated ML accelerator, from the 600 GOPS STM32N6 down to TinyEngine NPUs on Cortex-M0+ and C28x parts. Most are Cortex-M55 with an Ethos-U55. Many rows are family-level, and only a few have even an est price. | STM32N647Z0, AE302F80F55D5LE-Y, R7KA8P1KFLCAB, MCXN947VDFT, MSPM0G5187, MAX78000, HX6538-A04TLDG, RTL8735B |
| Motor control | DSCs and MCUs with motor-control timers and fast ADCs: TI C2000, Microchip dsPIC33, Infineon XMC1300 and PSoC Control C3, Renesas RX26T, Toshiba TXZ+ and MindMotion MM32SPIN. Prices run from $0.67 (MM32SPIN05PT) to $20.57 (F28P650). HPMicro's EtherCAT parts cover industrial motion control. | dsPIC33CK64MC105-I/PT, TMS320F280039CPNS, XMC1302-T038X0032AB, MM32SPIN05PT, R5F526TFDGFP#30, PSC3M5FDS2AFQ1XQSA1, HPM6E80IVM1 |
| Automotive / safety | Only three Infineon rows so far: Traveo T2G for body control and AURIX TC3xx with up to 6 TriCore cores. None has a price. The other major automotive lines (NXP S32K, Renesas RH850, ST Stellar/SPC5) are missing. | TC375TP-96F300W AA, TC397XP-256F300S BD, CYT2B74CAB |
| Mixed-signal | Analog-rich parts: PSoC 4 with CapSense and programmable analog blocks, plus HPMicro's HPM6P41. The group is thin and no row has a price. | CY8C4024AXI-S402, CY8C4147AZI-S465, CY8C4014LQI-421, HPM6P41IPB1 |
| Classic 8-bit | Classic 8-bit families still sold above $0.50: AVR (megaAVR, tinyAVR and the new DD/DB/EB/DU), PIC (10F, 12F, 18-Q), 8051 (WCH CH55x, STC8H, EFM8) and STM8. CH552G and CH554E give USB on an 8051 for under about $1.10, and AVR64DU32 adds USB to AVR. | ATMEGA328P-AU, ATtiny1616-MNR, CH552G, CH554E, STC8H8K64U-45I-QFN48, AVR64DU32-I/PT, PIC18F47Q84-I/PT |

## Known gaps

- Verification is thin across the whole catalog. Every lane ran out of the shared 200-call search budget, vendor sites returned 403/404 or timed out (Microchip, silabs.com, NXP, ADI, ST), and WebFetch returned binary for PDFs. Most rows are 'plausibility only'; fewer than half were spot-checked against any vendor page, and very few against a datasheet.
- Prices: 109 rows have a verified JLC price. 98 rows still have no price at all, including every Microchip 32-bit gap row, most ai-edge rows and most Infineon, Silicon Labs and Asian wireless rows. Quantity tiers are mixed (@1, @5, @160, @1000, @5000, @20000) and some currencies are unresolved.
- Many specs are null or rest only on distributor titles: ST (G030, F722, WB55, STM8S, U031, WBA55), WCH core variants, GD32F103/F303/G553, AT32F415/F421, APM32, N32G430, HC32, Beken BK7231N/BK7238/BK7258, BL602, W801, Telink TLSR9218, RTL8720DN, Silicon Labs SRAM/GPIO, and the KW45/KW47 cores.
- About 25 rows are family-level or have no orderable suffix (RA8E1/M1/D1, the nRF54L10/L05/LM20A/LV10A variants, nRF52833/52820/5340/52811/52805, i.MX RT700, PSoC Edge E84, GAP9, MAX78000, STM32V8, STM32C5, PIC32CM PL10, MCX N24, MCX W72, CH32V205/407, CH583, CH32V004, PY32L020, ESP32-C61/H4/H21/S31). Their specs and prices do not belong to one part.
- Four Espressif rows are modules, not chips (ESP8684-MINI-1-H4X, ESP32-C5-WROOM-1-N16R8, ESP32-C6-WROOM-1-N4, ESP32-H2-MINI-1-N2). Module flash and PSRAM sizes were read from the name suffix only.
- Possible overlaps to merge or confirm: CH582F vs the CH583 row (same CH582/CH583 family; one has the price, the other the specs); nRF54LM20A vs nRF54LM20B; the two Lapis ML62Q rows, which are both family prefixes.
- Radio fields are empty on rows that have a radio: GD32VW553KIQ6 (its highlights say Wi-Fi 6 and BLE 5.2), nRF54LM20B, MCX W72, and the Ambiq Apollo3 and Apollo4 Blue Plus rows (recategorized to wireless on the Blue/BLE naming; confirm against the datasheet).
- Unresolved conflicts: W806 radio status; HT32F52352 core (M0 vs M0+); STC32G12K128 clock (35 vs 48 MHz); the nRF52810 LCSC ID and suffix; whether the dsPIC33CH 200 MHz figure covers both cores; RT1064 NRND vs Active; the ESP32-S31 production date; the MSPM0C1104 price ($0.30 LCSC vs $0.16-0.20 press).
- Coverage gaps by vendor. ST: C071, G071, F401/F411, L5, H723, H750. NXP: MCX E, MCX L, RT1176, RT500/600, S32K. TI: Hercules, MSP430FR5/6, TM4C129, CC1352R, CC3235. Microchip: PIC32A, AVR EA/SD, SAM L21/L11, SAM E54, PIC32MZ EF, WBZ451, PIC16F171xx. Renesas: RA4M2/E2, RX660/671, RL78/G15/G16, DA1469x, RA4W1. Infineon: PSoC 4 HV, 4000T, 4100S Plus, PSoC 61/64, XMC4500, AURIX TC4xx. Silicon Labs: BG26/MG26, BG27, BG29, FG2x, xG28, SiXG301, PG26/28, EFM8LB. Others: Alif E4/E6/E8 and Balletto, Apollo330/510B, BL706/BL618, W800, TL721x/751x, RTL8721Dx, Hi3861, BES2600, GD32E5/C2, AT32F402/F405/M412/M416, APM32F407, N32L40x, CS32F030, FM33LG, PY32F030/F071/F040/F002B, PFS173, PMS171B, PFC161, STC15, CMS8S/CMS32, Nuvoton M031/M2003/M480/M2354, Air001, CH32V002/V005/V007/M007/V103/V305/V317/F103/CH591.
- Automotive coverage is only three Infineon rows; NXP S32K, Renesas RH850 and ST Stellar/SPC5 are absent. Mixed-signal has only four rows and no prices.
- The schema has no fields for the programming tool and its cost, a dev board, camera interface type and maximum pixel clock, NPU GOPS, uA/MHz or sleep current. Camera info currently sits in free-text highlights.
- Launch year is missing on well over half the rows, including all Microchip 32-bit gap rows.
- Category policy decisions applied this round need to be written into the catalog schema notes so later lanes stay consistent: radio wins over every other category; price under $0.50 wins over architecture; high-performance means 400 MHz or more, so 300-360 MHz M7/M85 parts sit in general-purpose.

## Next research ideas

1. **Done: check every price and stock level against the JLC/LCSC parts API.** Finished on 2026-11-07: 109 verified prices, LCSC codes and stock on the cards. Parts with no exact JLC match still need a distributor price.
2. **Datasheet pass: download PDFs, extract the text locally, and fill the null specs** — WebFetch returned binary for PDFs, and vendor pages returned 403/404 or timed out (Microchip, silabs.com, NXP, ADI, ST). Most nulls in flash, SRAM, GPIO and clock can be answered from the datasheet's ordering table. Download each PDF to a scratch directory and run pdftotext on it, with a per-lane budget instead of the shared 200-call cap. Starter queries: `STM32G030C8T6 datasheet pdf`; `STM32F722RET6 datasheet ordering information`; `CH32V203 datasheet pdf openwch`; `GD32F303RCT6 datasheet pdf`
3. **Fill WCH core variants and specs from the real openwch GitHub repos** — Many WCH rows still carry 'QingKe (variant not verified)' with null specs, although the openwch repos publish the datasheets. Guessed repo names returned 404, so list the openwch organisation first. WCH is the owner's main cheap-part vendor. Starter queries: `github.com/openwch repositories list`; `openwch CH32V20x datasheet V4B`; `openwch CH32X035 datasheet`; `openwch CH58x CH59x CH57x datasheet`
4. **Deep dive on image-capable MCUs: camera interface, pixel clock, RAM, JPEG and price** — The owner cares about image processing, and the catalog has no camera field (DCMI and DVP sit in highlights). A focused pass should record interface type, maximum pixel clock, SRAM/PSRAM, JPEG/ISP hardware and price for every camera-capable part, and add missing cheap ones. Starter queries: `CH32V307 DVP OV2640 example frame rate`; `AT32F435 DVP camera interface max pixel clock`; `HPM6750 DVP camera dual sensor`; `ESP32-P4 MIPI CSI ISP resolution fps`
5. **Replace family-level rows with real orderable SKUs** — About 25 rows have no orderable part number, so their prices and specs cannot be pinned down. Examples: RA8E1/RA8M1/RA8D1, the nRF54L10/L05/LM20A/LV10A variants, nRF52833/52820/5340, i.MX RT700, PSoC Edge E84, GAP9, MAX78000, STM32V8, STM32C5, PIC32CM PL10, MCX N24, MCX W72, CH32V205/407, PY32L020, CH583 and CH32V004. Read each vendor's ordering-information table. Starter queries: `RA8M1 ordering part number R7FA8M1AHECBD`; `nRF54L10 order code QFAA`; `STM32V8 part number ordering`; `PY32L020 ordering suffix LCSC`
6. **Swap Espressif modules for bare chips and fill specs from the Espressif SoC selector** — Four rows are modules (ESP8684-MINI-1-H4X, ESP32-C5-WROOM-1-N16R8, ESP32-C6-WROOM-1-N4, ESP32-H2-MINI-1-N2), so their flash and price are module values. Add bare-chip rows with LCSC prices, and fill ESP32-H21, C61 and S31 from the selector or datasheet PDFs. Starter queries: `ESP32-C6FH4 LCSC price`; `ESP8684H4 chip LCSC`; `ESP32-H2FH4 LCSC`; `ESP32-H21 datasheet pdf`
7. **Get Silicon Labs data from distributors and datasheet PDFs (silabs.com returns 403)** — Every Silicon Labs row is at distributor-title level with SRAM, GPIO and voltage missing. Must-cover families are absent: BG26/MG26, BG27, BG29, FG23/FG25/FG28, xG28, SiXG301, PG26/PG28 and EFM8LB. Starter queries: `EFR32BG22C224F512GM32 datasheet pdf mouser`; `EFR32MG26 datasheet`; `EFR32BG27 LCSC price`; `SiXG301 Silicon Labs`
8. **Microchip 32-bit gaps and prices** — The Microchip 32-bit rows have no prices and no launch years, and the coverage leans towards 8-bit parts. Missing: PIC32A, AVR EA/SD, SAM L21/L11, SAM E54, PIC32MZ EF, WBZ451/PIC32WM-BZ6 and PIC16F171xx. Product pages return 403, so try ww1.microchip.com datasheet PDFs and DigiKey/Mouser. Starter queries: `PIC32AK1216GC datasheet`; `AVR64EA32 price LCSC`; `ATSAML21E18B LCSC`; `ATSAME54P20A LCSC price`
9. **Asia wireless gaps through known doc portals, not guessed URLs** — Guessed vendor URLs returned 404 or TLS errors. BK7231N, BL602 and W801 still lack core and memory, W806's radio status is unresolved, and BL706, BL618, W800, TL721x/TL751x, RTL8721Dx, Hi3861 and BES2600 are missing. Use Bouffalo's GitHub docs, the Telink wiki and the Realtek Ameba docs. Starter queries: `github bouffalolab bl_docs BL602 datasheet`; `W806 datasheet WinnerMicro radio`; `Telink TL721x datasheet`; `RTL8721DM datasheet ameba`
10. **Budget 8-bit and Puya additions, with programmer cost** — No programming tool was recorded for any part, yet for Padauk, WCH, STC and Puya the programmer decides whether a part is usable. Missing families: PY32F030/F071/F040/F002B, PFS173, PMS171B, PFC161, STC15, CMS8S/CMS32, Nuvoton M031/M2003 and Air001. Starter queries: `Padauk PDK programmer price free-pdk`; `WCH-LinkE price SWIO CH32V003`; `PY32F002B LCSC price`; `PFS173 LCSC price`
11. **Low-cost dev board per family** — A study site benefits from a cheap board to try each part on. Add a devBoard field with price for each popular part, for example a CH32V003 board, WeAct STM32 boards, Pico/Pico 2, ESP32-C3 SuperMini, an nRF54L15 DK and an HPM5300 EVK. Starter queries: `CH32V003 development board price`; `WeAct STM32G431 board`; `ESP32-C3 SuperMini price`; `nRF54L15 DK price`
12. **NXP and TI gaps and open spec questions** — Still missing: MCX E, MCX L, RT1176, RT500/600, Kinetis and S32K notes, Hercules, MSP430FR5/6, TM4C129, CC1352R and CC3235. Unresolved: KW45/KW47 specs, the RT1171 core count and the MCXC444 price. NXP datasheets are freely fetchable and answer most fields in one pass. Starter queries: `MIMXRT1176 datasheet`; `MCX E24 datasheet`; `KW45B41Z datasheet core frequency`; `MIMXRT1171 single core M7`
13. **Renesas and Infineon gaps** — Missing: RA4M2/RA4E2, RX660/RX671, RL78/G15/G16, DA1469x, RA4W1, PSoC 4 HV, 4000T, 4100S Plus, PSoC 61/64, XMC4500, AURIX TC4xx. Renesas pages carry prices in structured data, which an earlier lane used successfully. Starter queries: `R7FA4M2AD3CFP price renesas`; `RX671 R5F5671 price`; `RL78/G16 R5F121 price`; `DA14695 price`
14. **Normalise edge-AI and low-power figures** — Most AI rows have no GOPS, uA/MHz or camera interface, and core strings were copied from article titles. Pull MLPerf Tiny results and vendor uA/MHz figures so the parts can be compared. Also add Alif E4/E6/E8, Balletto B1, Apollo330 and Apollo510B. Starter queries: `MLPerf Tiny results MAX78000 STM32N6`; `Alif Ensemble E4 E6 E8 datasheet`; `Alif Balletto B1 BLE NPU`; `Ambiq Apollo330 datasheet`
15. **China mainstream Arm fills** — The GD32F303/G553, AT32F415/F421, APM32, N32G430 and HC32 rows are mostly null, and the agents filled values from part-number suffixes. Missing: GD32E5, GD32C2, AT32F402/F405, AT32M412/M416, APM32F407, N32L40x, CS32F030 and FM33LG. Starter queries: `AT32F421G8U7 datasheet flash SRAM`; `GD32G553RET7 datasheet`; `APM32F407 LCSC price`; `FM33LG0 datasheet`

## How this was researched

Opus planned the search lanes. One Haiku agent searched each lane, then a Sonnet moderator checked that lane's parts against vendor pages and datasheets, fixed or removed bad entries, and noted what it verified (shown as *Checked* on each card). Opus merged the lanes, dropped duplicates and out-of-scope parts, found gaps and ran a second round to fill them. Values that could not be confirmed for the exact part are left blank rather than copied from a sibling part.

Prices marked *verified* come from the [JLCPCB parts library](https://jlcpcb.com/parts) (the same stock as LCSC), looked up by exact part number on 2026-11-07, in stock, at 100 pieces. Out-of-stock listings show placeholder prices there, so they are not used.

## References

Every part's product page or datasheet (`url`), spec source and price source are stored per entry in `content/mcu-products/catalog.json`. Product pages:

1. [Alif Semiconductor AE302F80F55D5LE-Y](https://www.arrow.com/en/products/ae302f80f55d5le-y/alif-semiconductor) — vendor product page or datasheet
2. [Ambiq AMA3B2KK-KBR (Apollo3 Blue Plus)](https://www.digikey.sg/en/products/detail/ambiq-micro-inc/AMA3B2KK-KBR/20380332) — vendor product page or datasheet
3. [Ambiq AMA4B2KP-KBR (Apollo4 Blue Plus)](https://www.futureelectronics.com/p/semiconductors--microprocessors--embedded-processors/ama4b2kp-kbr-ambiq-7162807) — vendor product page or datasheet
4. [Ambiq AP510NLA-CBR (Apollo510 Lite)](https://www.futureelectronics.com/p/semiconductors--microprocessors--embedded-processors/ap510nla-cbr-ambiq-4219874) — vendor product page or datasheet
5. [Analog Devices MAX32655GXG+](https://www.digikey.com.au/en/product-highlight/a/analog-devices/max32655-arm-cortex-m4-processor) — vendor product page or datasheet
6. [Analog Devices MAX32670GTL+T](https://www.digikey.co.uk/en/products/detail/analog-devices-inc-maxim-integrated/MAX32670GTL/12178454) — vendor product page or datasheet
7. [Analog Devices MAX32690GTK+](https://www.digikey.co.th/en/product-highlight/a/analog-devices/max32690-microcontroller) — vendor product page or datasheet
8. [Analog Devices MAX78000 (ordering suffix to confirm)](https://www.analog.com/en/products/max78000) — vendor product page or datasheet
9. [Analog Devices MAX78002GXE](https://www.analog.com/en/products/max78002) — vendor product page or datasheet
10. [Artery AT32F403ACGT7](https://www.arterychip.com/en/product/AT32F403A.jsp) — vendor product page or datasheet
11. [Artery AT32F415CBT7](https://www.arterychip.com/en/product/AT32F415.jsp) — vendor product page or datasheet
12. [Artery AT32F421G8U7](https://www.arterychip.com/en/product/AT32F421.jsp) — vendor product page or datasheet
13. [Artery AT32F435RGT7](https://www.arterychip.com/en/product/AT32F435.jsp) — vendor product page or datasheet
14. [Beken BK7231N](https://www.sierraic.com/BK7) — vendor product page or datasheet
15. [Beken BK7238QH321](https://www.lcsc.com/product-detail/C53282000.html) — vendor product page or datasheet
16. [Beken BK7258QN8868](https://www.lcsc.com/product-detail/C53049811.html) — vendor product page or datasheet
17. [Bouffalo Lab BL602](https://www.lcsc.com/product-detail/C5187545.html) — vendor product page or datasheet
18. [Bouffalo Lab BL616 (QFN-40)](https://docs.ai-thinker.com/_media/bl616_bl618_ds_en_2.5_open_.pdf) — vendor product page or datasheet
19. [Bouffalo Lab BL702S-A0-Q2I](https://www.lcsc.com/product-detail/C2874059.html) — vendor product page or datasheet
20. [Canaan (Kendryte) K210 (LCSC C913414)](https://www.lcsc.com/product-detail/C913414.html) — vendor product page or datasheet
21. [EM Microelectronic EM9305BH209CS23B](https://www.digikey.co.uk/en/products/detail/em-microelectronic/EM9305BH209CS23B/26794125) — vendor product page or datasheet
22. [Epson S1C31W65 (Epson)](https://global.epson.com/products_and_drivers/semicon/offer/mcu.html) — vendor product page or datasheet
23. [Espressif ESP32-C3](https://www.espressif.com/en/products/socs/esp32-c3) — vendor product page or datasheet
24. [Espressif ESP32-C5-WROOM-1-N16R8](https://www.espressif.com/en/products/socs/esp32-c5) — vendor product page or datasheet
25. [Espressif ESP32-C6-WROOM-1-N4](https://www.espressif.com/en/products/socs/esp32-c6) — vendor product page or datasheet
26. [Espressif ESP32-C61](https://www.espressif.com/en/products/socs/esp32-c61) — vendor product page or datasheet
27. [Espressif ESP32-D0WD-V3](https://www.espressif.com/en/products/socs/esp32) — vendor product page or datasheet
28. [Espressif ESP32-H2-MINI-1-N2](https://www.espressif.com/en/products/socs/esp32-h2) — vendor product page or datasheet
29. [Espressif ESP32-H21](https://www.espressif.com/en/products/socs/esp32-h21) — vendor product page or datasheet
30. [Espressif ESP32-H4](https://www.espressif.com/en/products/socs/esp32-h4) — vendor product page or datasheet
31. [Espressif ESP32-P4NRW32](https://www.espressif.com/en/products/socs/esp32-p4) — vendor product page or datasheet
32. [Espressif ESP32-S2](https://www.espressif.com/en/products/socs/esp32-s2) — vendor product page or datasheet
33. [Espressif ESP32-S31](https://www.espressif.com/en/products/socs/esp32-s31) — vendor product page or datasheet
34. [Espressif ESP32-S3R8](https://www.espressif.com/en/products/socs/esp32-s3) — vendor product page or datasheet
35. [Espressif ESP8266EX](https://www.espressif.com/en/products/socs/esp8266) — vendor product page or datasheet
36. [Espressif ESP8684-MINI-1-H4X (ESP32-C2 family)](https://www.espressif.com/en/products/socs/esp8684) — vendor product page or datasheet
37. [FMD (Fremont Micro Devices) FT61F02F-MRB (MSOP-10)](https://www.lcsc.com/product-detail/C708777.html) — vendor product page or datasheet
38. [Geehy APM32F003F6P6](https://datasheet.lcsc.com/lcsc/2202161430_Geehy-APM32F003F6P6_C2975251.pdf) — vendor product page or datasheet
39. [Geehy APM32F103C8T6](https://www.lcsc.com/product-detail/C393540.html) — vendor product page or datasheet
40. [GigaDevice GD32E230F8P6TR](https://www.gigadevice.com/product/mcu/entry-level-mcus/gd32e23x-series/gd32e230) — vendor product page or datasheet
41. [GigaDevice GD32F103C8T6](https://www.lcsc.com/product-image/C77994.html) — vendor product page or datasheet
42. [GigaDevice GD32F303RCT6](https://www.gigadevice.com/product/mcu/main-stream-mcus/gd32f30x-series/gd32f303) — vendor product page or datasheet
43. [GigaDevice GD32F405RGT6](https://www.gigadevice.com/product/mcu/high-performance-mcus/gd32f4xx-series/gd32f405) — vendor product page or datasheet
44. [GigaDevice GD32G553RET7](https://www.gigadevice.com/product/mcu/mcus-product-selector/gd32g553ret7) — vendor product page or datasheet
45. [GigaDevice GD32H759IMT6](https://www.gigadevice.com/product/mcu/mcus-product-selector/gd32h759imt6) — vendor product page or datasheet
46. [GigaDevice GD32VF103CBT6](https://gigadevice.com/product/mcu/main-stream-mcus/gd32vf103-series/gd32vf103) — vendor product page or datasheet
47. [GigaDevice GD32VW553KIQ6](https://www.gigadevice.com/product/mcu/mcus-product-selector/gd32vw553kiq6) — vendor product page or datasheet
48. [GreenWaves Technologies GAP9 (ordering code to confirm)](https://greenwaves-technologies.com/gap9_processor/) — vendor product page or datasheet
49. [HK (Hangshun) HK32F030MJ4M6](https://www.lcsc.com/product-detail/C907709.html) — vendor product page or datasheet
50. [HPMicro HPM5361IEG1](https://www.lcsc.com/product-detail/C49451871.html) — vendor product page or datasheet
51. [HPMicro HPM5E3YIGN1](https://www.lcsc.com/product-image/C53262625.html) — vendor product page or datasheet
52. [HPMicro HPM6750IVM2](https://www.lcsc.com/product-detail/C49374601.html) — vendor product page or datasheet
53. [HPMicro HPM6880IBD1](https://www.hpmicro.com/en/product-center/microcontroller/hpm6800) — vendor product page or datasheet
54. [HPMicro HPM6E80IVM1](https://www.lcsc.com/product-detail/C49374603.html) — vendor product page or datasheet
55. [HPMicro HPM6P41IPB1](https://www.elexess.com/part/1608148/hpmicro/hpm6p41ipb1) — vendor product page or datasheet
56. [HiSilicon WS63 (Hi3863V100)](https://www.lcsc.com/product-detail/C48031351.html) — vendor product page or datasheet
57. [Himax HX6538-A04TLDG](https://www.digikey.jp/en/products/detail/himax/HX6538-A04TLDG/22492693) — vendor product page or datasheet
58. [Holtek HT32F52352-LQFP64 (C97188)](https://www.lcsc.com/product-detail/C97188.html) — vendor product page or datasheet
59. [Holtek HT66F002 (SOP-8)](https://www.lcsc.com/product-detail/C91298.html) — vendor product page or datasheet
60. [Infineon CY8C4014LQI-421](https://ie.rs-online.com/web/p/microcontrollers/2733111) — vendor product page or datasheet
61. [Infineon CY8C4024AXI-S402](https://www.digikey.de/en/products/detail/infineon-technologies/CY8C4024AXI-S402/11486333) — vendor product page or datasheet
62. [Infineon CY8C4147AZI-S465](https://www.lcsc.com/product-detail/C22951364.html) — vendor product page or datasheet
63. [Infineon CY8C6247FDI-D32T](https://www.lcsc.com/product-detail/C2952480.html) — vendor product page or datasheet
64. [Infineon CYT2B74CAB](https://www.infineon.com/cms/en/product/microcontroller/32-bit-traveo-t2g-arm-cortex-microcontroller/traveo-t2g-cyt2b7-series/) — vendor product page or datasheet
65. [Infineon CYW20829B0LKMLXQLA1](https://www.digikey.lv/en/products/detail/infineon-technologies/CYW20829B0LKMLXQLA1/21675694) — vendor product page or datasheet
66. [Infineon PSC3M5FDS2AFQ1XQSA1](https://infineon.com/psoccontrol) — vendor product page or datasheet
67. [Infineon PSOC Edge E84 (ordering code to confirm)](https://www.infineon.com/products/microcontroller/32-bit-psoc-arm-cortex/32-bit-psoc-edge-arm) — vendor product page or datasheet
68. [Infineon TC375TP-96F300W AA](https://my.element14.com/infineon/tc375tp96f300waakxuma1/mcu-32bit-300mhz-lqfp-176/dp/3625285RL) — vendor product page or datasheet
69. [Infineon TC397XP-256F300S BD](https://my.element14.com/infineon/tc397xx256f300sbdkxuma2/mcu-32bit-300mhz-lfbga-292/dp/4588993RL) — vendor product page or datasheet
70. [Infineon XMC1100-Q024X0016AB](https://www.lcsc.com/product-image/C540479.html) — vendor product page or datasheet
71. [Infineon XMC1302-T038X0032AB](https://lcsc.com/product-detail/Infineon_Infineon-Technologies_C540553.html) — vendor product page or datasheet
72. [Infineon XMC4700-F100K2048 AA](https://no.rs-online.com/web/p/microcontrollers/1658225) — vendor product page or datasheet
73. [Infineon XMC7200-F176K8384AA](https://infineon.com/cms/en/product/microcontroller/32-bit-industrial-microcontroller-based-on-arm-cortex-m/32-bit-xmc7000-industrial-microcontroller-arm-cortex-m7/xmc7200-f176k8384aa) — vendor product page or datasheet
74. [Lapis (ROHM group) ML62Q1200A](https://au.rs-online.com/web/p/microcontrollers/1808490) — vendor product page or datasheet
75. [Lapis (ROHM group) ML62Q1600](https://befr.rs-online.com/web/p/microcontrollers/1808472) — vendor product page or datasheet
76. [Microchip ATMEGA4809-AFR](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-ATMEGA4809-AFR_C189475.html) — vendor product page or datasheet
77. [Microchip ATSAMC21J18A-AUT](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-ATSAMC21J18A-AUT_C2052757.html) — vendor product page or datasheet
78. [Microchip ATSAMD21E18A-AU](https://www.lcsc.com/product-image/C618771.html) — vendor product page or datasheet
79. [Microchip ATSAMD51J19A-AU](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-ATSAMD51J19A-AU_C619214.html) — vendor product page or datasheet
80. [Microchip ATSAME70Q21B-CN](https://www.lcsc.com/product-image/C1339771.html) — vendor product page or datasheet
81. [Microchip ATmega328P-AU](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-ATMEGA328P-AU_C14877.html) — vendor product page or datasheet
82. [Microchip ATtiny1616-MNR](https://www.lcsc.com/product-image/C507118.html) — vendor product page or datasheet
83. [Microchip ATtiny202-SSFR](https://www.lcsc.com/product-detail/C616039.html) — vendor product page or datasheet
84. [Microchip ATtiny3226-MU](https://www.lcsc.com/product-detail/Microcontroller-Units-MCUs-MPUs-SOCs_Microchip-Tech-ATTINY3226-MU_C5227682.html) — vendor product page or datasheet
85. [Microchip AVR16EB14-E/SL](https://futureelectronics.com/p/semiconductors--microcontrollers--8-bit/avr16eb14-e-sl-microchip-2186967) — vendor product page or datasheet
86. [Microchip AVR64DB32-I/RXB](https://nz.element14.com/microchip/avr64db32-i-rxb/mcu-8bit-24mhz-vqfn-32/dp/3625506) — vendor product page or datasheet
87. [Microchip AVR64DD32-I/PT](https://se.rs-online.com/web/p/microcontrollers/2516960) — vendor product page or datasheet
88. [Microchip AVR64DU32-I/PT](https://www.digikey.de/en/products/detail/microchip-technology/AVR64DU32-I-PT/22611709) — vendor product page or datasheet
89. [Microchip PIC10F320-I/P](https://lcsc.com/product-detail/image/PIC10F320-I-P_C640475.html) — vendor product page or datasheet
90. [Microchip PIC12F1840-I/SN](https://www.lcsc.com/product-image/C39594.html) — vendor product page or datasheet
91. [Microchip PIC18F47Q84-I/PT](https://lcsc.com/datasheet/lcsc_datasheet_2204251600_Microchip-Tech-PIC18F47Q84-I-PT_C2987161.pdf) — vendor product page or datasheet
92. [Microchip PIC24FJ64GA002-I/SS](https://www.lcsc.com/product-image/C629050.html) — vendor product page or datasheet
93. [Microchip PIC32CK2051SG01100](https://microchip.com/en-us/product/pic32ck2051sg01100) — vendor product page or datasheet
94. [Microchip PIC32CM PL10 (orderable part number not verified)](https://www.microchip.com/en-us/product/pic32cm-pl10) — vendor product page or datasheet
95. [Microchip PIC32CM3204JH00064-I/5LX](https://uk.rs-online.com/web/p/microcontrollers/0930926) — vendor product page or datasheet
96. [Microchip PIC32CM5164JH00048-I/U5B](https://uk.rs-online.com/web/p/microcontrollers/0930928) — vendor product page or datasheet
97. [Microchip PIC32CX1012BZ25048-I/MYX](https://www.digikey.co.uk/en/products/detail/microchip-technology/PIC32CX1012BZ25048-E-MYX/16709283) — vendor product page or datasheet
98. [Microchip PIC32CZ1038CA70100-I/XEB](https://uk.rs-online.com/web/p/microcontrollers/0930938) — vendor product page or datasheet
99. [Microchip PIC32CZ4010CA80144-I/LUX](https://uk.rs-online.com/web/p/microcontrollers/0930945) — vendor product page or datasheet
100. [Microchip PIC32CZ8110CA90208](https://microchip.com/en-us/product/PIC32CZ8110CA90208) — vendor product page or datasheet
101. [Microchip PIC32MX170F256B-I/ML](https://www.lcsc.com/product-detail/C219870.html) — vendor product page or datasheet
102. [Microchip dsPIC33AK128MC106-I/PT](https://microchip.com/en-us/product/dsPIC33AK128MC106) — vendor product page or datasheet
103. [Microchip dsPIC33CH512MP508-I/PT](https://www.microchip.com/en-us/product/dspic33ch512mp508) — vendor product page or datasheet
104. [Microchip dsPIC33CK64MC105-I/PT](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-dsPIC33CK64MC105-I-PT_C5162259.html) — vendor product page or datasheet
105. [MindMotion MM32F0010A1T](https://www.lcsc.com/product-detail/C2686112.html) — vendor product page or datasheet
106. [MindMotion MM32SPIN05PT](https://www.lcsc.com/product-detail/C5182254.html) — vendor product page or datasheet
107. [NXP KW45Z41053AFTBT](https://www.nxp.com/part/KW45Z41053AFTBT) — vendor product page or datasheet
108. [NXP KW47Z420B3AFTB](https://www.nxp.com/part/KW47Z420B3AFTB) — vendor product page or datasheet
109. [NXP LPC5536JHI48](https://keil.arm.com/devices/nxp-lpc5536jhi48) — vendor product page or datasheet
110. [NXP LPC55S69JBD64K](https://www.digikey.sg/en/products/detail/nxp-usa-inc/LPC55S69JBD64K/10649974) — vendor product page or datasheet
111. [NXP LPC804M101JHI33Y](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_NXP-Semicon-LPC804M101JHI33Y_C2056847.html) — vendor product page or datasheet
112. [NXP LPC845M301JBD64E](https://www.lcsc.com/product-detail/C116150.html) — vendor product page or datasheet
113. [NXP MCX N24 (orderable part number not verified)](https://community.element14.com/products/manufacturers/nxp/b/blog/posts/new-product-release---mcx-n53-n52-n24-high-performance-cortex-m33-mcus-with-on-chip-accelerators-and-advanced-security) — vendor product page or datasheet
114. [NXP MCX W72 (variant not verified)](https://www.digikey.com.br/pt/product-highlight/n/nxp-semi/mcx-w72-multiprotocol-wireless-mcus) — vendor product page or datasheet
115. [NXP MCXA153VLH](https://www.futureelectronics.com/p/semiconductors--microcontrollers--32-bit/mcxa153vlh-nxp-1182400) — vendor product page or datasheet
116. [NXP MCXA154VLL](https://cn.element14.com/nxp/mcxa154vll/mcu-32bit-96mhz-lqfp-100/dp/4538853) — vendor product page or datasheet
117. [NXP MCXC444VLH](https://www.nxp.com/docs/en/data-sheet/MCXC44XP64M48SF6.pdf) — vendor product page or datasheet
118. [NXP MCXN546VDFT](https://www.nxp.com/docs/en/fact-sheet/MCXNFS.pdf) — vendor product page or datasheet
119. [NXP MCXW71 (48QFN 7x7 variant; orderable suffix not read)](https://www.nxp.com/products/MCX-W71) — vendor product page or datasheet
120. [NXP MIMXRT1011DAE5A](https://www.lcsc.com/product-detail/C1575810.html) — vendor product page or datasheet
121. [NXP MIMXRT1062CVL5B](https://www.lcsc.com/product-detail/C2990557.html) — vendor product page or datasheet
122. [NXP MIMXRT1064DVL6A](https://www.nxp.com/products/i.MX-RT1064) — vendor product page or datasheet
123. [NXP MIMXRT1171DVMAA](https://www.nxp.com/products/processors-and-microcontrollers/arm-microcontrollers/i-mx-rt-crossover-mcus/i-mx-rt1170-crossover-mcu-family:i.MX-RT1170) — vendor product page or datasheet
124. [NXP i.MX RT1180 (289 MAPBGA 14x14)](https://www.nxp.com/products/processors-and-microcontrollers/arm-microcontrollers/i-mx-rt-crossover-mcus/i-mx-rt1180-dual-core-crossover-mcu-with-time-sensitive-networking-switch-and-integrated-edgelock-secure-enclave:i.MX-RT1180) — vendor product page or datasheet
125. [NXP i.MX RT700 (orderable part to confirm)](https://www.nxp.com/docs/en/data-sheet/IMXRT700EC.pdf) — vendor product page or datasheet
126. [Nations Technologies N32G430C8L7](https://www.lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Nations-Technologies-Inc-N32G430C8L7_C3032170.html) — vendor product page or datasheet
127. [Nations Technologies N32G455REL7](https://www.lcsc.com/product-detail/C841392.html) — vendor product page or datasheet
128. [Nordic Semiconductor NRF52832-QFAA-R](https://www.nordicsemi.com/Products/nRF52832) — vendor product page or datasheet
129. [Nordic Semiconductor NRF52840-QIAA-R](https://www.nordicsemi.com/Products/nRF52840) — vendor product page or datasheet
130. [Nordic Semiconductor nRF52805](https://www.nordicsemi.com/Products/nRF52805) — vendor product page or datasheet
131. [Nordic Semiconductor nRF52810-QCAA-R](https://www.nordicsemi.com/Products/nRF52810) — vendor product page or datasheet
132. [Nordic Semiconductor nRF52811](https://www.nordicsemi.com/Products/nRF52811) — vendor product page or datasheet
133. [Nordic Semiconductor nRF52820 (QFN40 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF52820) — vendor product page or datasheet
134. [Nordic Semiconductor nRF52833 (aQFN73 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF52833) — vendor product page or datasheet
135. [Nordic Semiconductor nRF5340 (aQFN94 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF5340) — vendor product page or datasheet
136. [Nordic Semiconductor nRF54H20-CKAA-R7](https://www.nordicsemi.com/Products/nRF54H20) — vendor product page or datasheet
137. [Nordic Semiconductor nRF54L05 (QFN52/QFN48 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF54L05) — vendor product page or datasheet
138. [Nordic Semiconductor nRF54L10 (QFN52/QFN48 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF54L10) — vendor product page or datasheet
139. [Nordic Semiconductor nRF54L15-QFAA-R](https://www.nordicsemi.com/Products/nRF54L15) — vendor product page or datasheet
140. [Nordic Semiconductor nRF54LM20A (CSP98 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF54LM20A) — vendor product page or datasheet
141. [Nordic Semiconductor nRF54LM20B (CSP98 package)](https://www.nordicsemi.com/Products/nRF54LM20B) — vendor product page or datasheet
142. [Nordic Semiconductor nRF54LV10A (QFN48 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF54LV10A) — vendor product page or datasheet
143. [Nordic Semiconductor nRF9151-LACA-R](https://www.nordicsemi.com/Products/nRF9151) — vendor product page or datasheet
144. [Nuvoton M2351ZIAAE (QFN-33)](https://jlcpcb.com/partdetail/NUVOTON-M2351ZIAAE/C5150973/C5150973) — vendor product page or datasheet
145. [Nuvoton M55M1H2LJAE](https://www.nuvoton.com/products/microcontrollers/arm-cortex-m55-mcus/) — vendor product page or datasheet
146. [Nuvoton MS51XB9AE (QFN-20)](https://www.lcsc.com/product-detail/C2917204.html) — vendor product page or datasheet
147. [Nyquest NY8A051H (SOP-8)](https://www.lcsc.com/product-detail/C5143390.html) — vendor product page or datasheet
148. [Padauk PFS154-S08](https://lcsc.com/product-detail/Others_PADAUK-Tech-PFS154-S08_C317611.html) — vendor product page or datasheet
149. [Padauk PMS150C-S08](https://www.lcsc.com/product-detail/C129127.html) — vendor product page or datasheet
150. [Puya PY32F002AL15S6TU](https://www.lcsc.com/product-detail/Microcontroller-Units-MCUs-MPUs-SOCs_PUYA-PY32F002AL15S6TU_C5292060.html) — vendor product page or datasheet
151. [Puya PY32F003L16S6TU](https://www.lcsc.com/product-detail/C5128435.html) — vendor product page or datasheet
152. [Puya PY32L020 (orderable suffix not confirmed)](https://openpuya-website.pages.dev/en/mcu/PY32L020xx) — vendor product page or datasheet
153. [Raspberry Pi RP2040](https://www.raspberrypi.com/products/rp2040/) — vendor product page or datasheet
154. [Raspberry Pi RP2350A](https://www.raspberrypi.com/products/rp2350/) — vendor product page or datasheet
155. [Realtek RTL8720DN](https://www.fpgacenter.com/product/realtek/RTL8720DN) — vendor product page or datasheet
156. [Realtek RTL8735B](https://www.amebaiot.com/zh/amebapro2) — vendor product page or datasheet
157. [Renesas DA14531-00000OG2](https://www.renesas.com/en/products/da14531) — vendor product page or datasheet
158. [Renesas DA14592-010006F2](https://www.renesas.com/en/products/da14592) — vendor product page or datasheet
159. [Renesas DA16200-00000F22](https://www.renesas.com/en/products/da16200/part-details/da16200-00000f22) — vendor product page or datasheet
160. [Renesas R5F51403ADFM#30](https://www.renesas.com/en/products/rx140) — vendor product page or datasheet
161. [Renesas R5F526TFDGFP#30](https://www.renesas.com/en/products/rx26t) — vendor product page or datasheet
162. [Renesas R5F572NNHDFC#30](https://www.digikey.co.uk/en/products/detail/renesas-electronics-corporation/R5F572NNHDFC-30/12750889) — vendor product page or datasheet
163. [Renesas R7F100GGL3CFB#AA0](https://www.renesas.com/en/products/rl78-g23) — vendor product page or datasheet
164. [Renesas R7F101GLG2DFA#BA1](https://www.renesas.cn/zh/products/rl78-g24/part-details/r7f101glg2dfa-ba1) — vendor product page or datasheet
165. [Renesas R7F102G8C3CLA#HC0](https://www.renesas.cn/document/dst/rl78g22-datasheet) — vendor product page or datasheet
166. [Renesas R7FA0E1073CFJ](https://www.renesas.com/en/products/ra0e1) — vendor product page or datasheet
167. [Renesas R7FA0E2094CFM#UA0](https://www.renesas.com/en/products/ra0e2) — vendor product page or datasheet
168. [Renesas R7FA0E3034ZSD#VA0 (RA0E3)](https://www.renesas.com/en/products/ra0e3) — vendor product page or datasheet
169. [Renesas R7FA2E1A92DFM#AA0](https://www.renesas.com/en/products/ra2e1) — vendor product page or datasheet
170. [Renesas R7FA4M1AB3CFM](https://www.renesas.com/en/products/ra4m1) — vendor product page or datasheet
171. [Renesas R7FA6M5BH3CFC#BA0](https://www.renesas.com/en/products/ra6m5) — vendor product page or datasheet
172. [Renesas R7KA8M2JFLCAB#UC0](https://www.renesas.com/en/products/ra8m2) — vendor product page or datasheet
173. [Renesas R7KA8P1KFLCAB](https://www.renesas.com/en/products/ra8p1) — vendor product page or datasheet
174. [Renesas RA8D1 480 MHz variant (P/N not confirmed)](https://www.digikey.com/en/product-highlight/r/renesas/ra8d1-480-mhz-arm-cortex-m85-mcu) — vendor product page or datasheet
175. [Renesas RA8E1 (family level, P/N not confirmed)](https://www.renesas.com/en/products/ra8e1) — vendor product page or datasheet
176. [Renesas RA8M1 LQFP144 variant (P/N not confirmed)](https://www.digikey.com/en/product-highlight/r/renesas/ra8m1-arm-cortex-m85) — vendor product page or datasheet
177. [STC Micro STC32G12K128-35I-LQFP48](https://www.lcsc.com/product-detail/C5210760.html) — vendor product page or datasheet
178. [STC Micro STC8G1K08A-36I-SOP8](https://lcsc.com/product-detail/STC_STC-Micro-STC8G1K08A-36I-SOP8_C915663.html) — vendor product page or datasheet
179. [STC Micro STC8H8K64U-45I-QFN48](https://www.lcsc.com/product-detail/C5339175.html) — vendor product page or datasheet
180. [STMicroelectronics STM32C011F6P6](https://www.st.com/en/microcontrollers-microprocessors/stm32c011f6.html) — vendor product page or datasheet
181. [STMicroelectronics STM32C5 series (orderable part number not verified)](https://www.st.com/en/microcontrollers-microprocessors/stm32c5-series.html) — vendor product page or datasheet
182. [STMicroelectronics STM32F030F4P6](https://www.lcsc.com/product-image/C32908.html) — vendor product page or datasheet
183. [STMicroelectronics STM32F103C8T6](https://www.lcsc.com/product-image/C8734.html) — vendor product page or datasheet
184. [STMicroelectronics STM32F407VGT6](https://www.st.com/en/microcontrollers-microprocessors/stm32f407vg.html) — vendor product page or datasheet
185. [STMicroelectronics STM32F722RET6](https://lcsc.com/product-detail/image/STM32F722RET6_C118207.html) — vendor product page or datasheet
186. [STMicroelectronics STM32G030C8T6](https://www.lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_STMicroelectronics-STM32G030C8T6_C529329.html) — vendor product page or datasheet
187. [STMicroelectronics STM32G431CBT6](https://www.lcsc.com/datasheet/lcsc_datasheet_2304140030_STMicroelectronics-STM32G431CBT6_C529355.pdf) — vendor product page or datasheet
188. [STMicroelectronics STM32H503CBT6](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_STMicroelectronics-STM32H503CBT6_C17700273.html) — vendor product page or datasheet
189. [STMicroelectronics STM32H743VIT6](https://www.lcsc.com/product-image/C114409.html) — vendor product page or datasheet
190. [STMicroelectronics STM32H7R7I8T6](https://www.st.com/en/microcontrollers-microprocessors/stm32h7r7-7s7/products.html) — vendor product page or datasheet
191. [STMicroelectronics STM32L051C8T6](https://www.lcsc.com/product-detail/C110878.html) — vendor product page or datasheet
192. [STMicroelectronics STM32L432KCU6](https://www.st.com/en/product/stm32l432kc) — vendor product page or datasheet
193. [STMicroelectronics STM32N647Z0](https://www.st.com/en/microcontrollers-microprocessors/stm32n6-series/products.html) — vendor product page or datasheet
194. [STMicroelectronics STM32U031C8T6](https://www.st.com/en/microcontrollers-microprocessors/stm32u031c8.html) — vendor product page or datasheet
195. [STMicroelectronics STM32U3B5CIT6](https://www.digikey.at/en/products/detail/stmicroelectronics/STM32U3B5CIT6/29199139) — vendor product page or datasheet
196. [STMicroelectronics STM32U575RIT6](https://estore.st.com/en/products/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus/stm32-ultra-low-power-mcus/stm32u5-series/stm32u575-585/stm32u575ri.html) — vendor product page or datasheet
197. [STMicroelectronics STM32V8 series (orderable part number not verified)](https://www.st.com/en/microcontrollers-microprocessors/stm32v8-series.html) — vendor product page or datasheet
198. [STMicroelectronics STM32WB55RGV6](https://www.lcsc.com/product-image/C401505.html) — vendor product page or datasheet
199. [STMicroelectronics STM32WBA55CGU7](https://befr.rs-online.com/web/p/microcontrollers/0215157P) — vendor product page or datasheet
200. [STMicroelectronics STM32WLE5CCU6](https://www.lcsc.com/product-image/C2888218.html) — vendor product page or datasheet
201. [STMicroelectronics STM8S003F3P6](https://www.lcsc.com/product-image/C18615.html) — vendor product page or datasheet
202. [STMicroelectronics STM8S103F3P3](https://www.lcsc.com/product-image/C2053135.html) — vendor product page or datasheet
203. [Silicon Labs EFM32PG22C200F512IM32-C](https://www.lcsc.com/product-detail/C3225388.html) — vendor product page or datasheet
204. [Silicon Labs EFM8BB10F2G-A-QFN20](https://it.rs-online.com/web/p/microcontroller/1690180) — vendor product page or datasheet
205. [Silicon Labs EFR32BG22C224F512GM32-CR](https://www.lcsc.com/product-image/C1015253.html) — vendor product page or datasheet
206. [Silicon Labs EFR32BG24A020F1024IM40-B](https://jp.farnell.com/en-JP/silicon-labs/efr32bg24a020f1024im40-b/rf-soc-arm-cortex-m33-78mhz-qfn/dp/3958441) — vendor product page or datasheet
207. [Silicon Labs EFR32MG24B310F1536IM48-B](https://ie.farnell.com/silicon-labs/efr32mg24b310f1536im48-b/rf-soc-arm-cortex-m33-78mhz-qfn/dp/3958454) — vendor product page or datasheet
208. [Silicon Labs SIWG917M100MGTBA](https://www.digikey.co.uk/en/products/detail/silicon-labs/SIWG917M100MGTBA/24710281) — vendor product page or datasheet
209. [Sinowealth SH79F1612AM (SOP-20)](https://www.lcsc.com/product-detail/C181997.html) — vendor product page or datasheet
210. [Telink TLSR8258F512ET32](https://lcsc.com/product-detail/RF-Transceiver-ICs_Telink-TLSR8258F512ET32_C2836053.html) — vendor product page or datasheet
211. [Telink TLSR9218AER](https://findchips.com/detail/tlsr9218aer/Telink-Semiconductor) — vendor product page or datasheet
212. [Texas Instruments AM13E23019](https://www.ti.com/product/AM13E23019) — vendor product page or datasheet
213. [Texas Instruments CC2340R5RGER](https://www.ti.com/product/CC2340R5) — vendor product page or datasheet
214. [Texas Instruments CC2652R7RGZR](https://www.ti.com/product/CC2652R7) — vendor product page or datasheet
215. [Texas Instruments CC2745R10-Q1](https://www.ti.com/product/CC2745R10-Q1) — vendor product page or datasheet
216. [Texas Instruments CC3501E](https://www.ti.com/product/CC3501E) — vendor product page or datasheet
217. [Texas Instruments MSP430FR2433IRGE](https://www.ti.com/product/MSP430FR2433) — vendor product page or datasheet
218. [Texas Instruments MSP430G2553IPW20R](https://www.ti.com/product/MSP430G2553) — vendor product page or datasheet
219. [Texas Instruments MSPM0C1104SDSGR](https://www.ti.com/product/MSPM0C1104) — vendor product page or datasheet
220. [Texas Instruments MSPM0G3507SPTR](https://www.ti.com/product/MSPM0G3507) — vendor product page or datasheet
221. [Texas Instruments MSPM0G5187](https://www.ti.com/product/MSPM0G5187) — vendor product page or datasheet
222. [Texas Instruments MSPM0H3216PTR](https://www.ti.com/product/MSPM0H3216) — vendor product page or datasheet
223. [Texas Instruments MSPM0L1306TRHBR](https://www.ti.com/product/MSPM0L1306) — vendor product page or datasheet
224. [Texas Instruments TM4C123GH6PM](https://www.ti.com/product/TM4C123GH6PM) — vendor product page or datasheet
225. [Texas Instruments TMS320F280039CPNS](https://www.ti.com/product/TMS320F280039C) — vendor product page or datasheet
226. [Texas Instruments TMS320F28P550SJ6PZR](https://www.ti.com/product/TMS320F28P550SJ) — vendor product page or datasheet
227. [Texas Instruments TMS320F28P650DK6PZP](https://www.ti.com/product/TMS320F28P650DK) — vendor product page or datasheet
228. [Toshiba TMPM4K4FYBUG](https://toshiba.semicon-storage.com/eu/company/exhibition/campaign/txzplus-family-advanced-class-new-products.html) — vendor product page or datasheet
229. [WCH CH32F203RCT6](https://www.lcsc.com/datasheet/lcsc_datasheet_2403131353_WCH-Jiangsu-Qin-Heng-CH32F203RCT6_C5137038.pdf) — vendor product page or datasheet
230. [WCH CH32H417QEU6](https://ch32-riscv-ug.github.io/CH32H417/datasheet_en/CH32H417DS0.PDF) — vendor product page or datasheet
231. [WCH CH32L103C8T6](https://www.lcsc.com/product-detail/C22398291.html) — vendor product page or datasheet
232. [WCH CH32V003F4P6](https://www.lcsc.com/product-detail/C5187096.html) — vendor product page or datasheet
233. [WCH CH32V004 (orderable suffix not verified)](https://www.wch-ic.com/products/CH32V004.html) — vendor product page or datasheet
234. [WCH CH32V006F8U6](https://www.lcsc.com/product-detail/C42431288.html) — vendor product page or datasheet
235. [WCH CH32V203G6U6](https://www.lcsc.com/product-detail/C5142280.html) — vendor product page or datasheet
236. [WCH CH32V205 (variant not verified)](https://www.cnx-software.com/2026/04/14/192-mhz-wch-ch32v205-risc-v-mcu-offers-a-480-mbps-usb-2-0-interface/) — vendor product page or datasheet
237. [WCH CH32V208RBT6](https://www.lcsc.com/datasheet/lcsc_datasheet_2403131349_WCH-Jiangsu-Qin-Heng-CH32V208RBT6_C5448615.pdf) — vendor product page or datasheet
238. [WCH CH32V303RCT6](https://www.lcsc.com/product-image/C5456849.html) — vendor product page or datasheet
239. [WCH CH32V307VCT6](https://www.lcsc.com/product-detail/C2943979.html) — vendor product page or datasheet
240. [WCH CH32V407 (variant not verified)](https://www.cnx-software.com/2026/08/13/wch-ch32v407-467-risc-v-mcu-integrates-fast-ethernet-mac-phy-480-mbps-usb-2-0-phy-up-to-8-mb-on-chip-psram/) — vendor product page or datasheet
241. [WCH CH32X035G8U6](https://www.lcsc.com/product-detail/C7437027.html) — vendor product page or datasheet
242. [WCH CH552G](https://www.lcsc.com/product-detail/WCH_WCH-Jiangsu-Qin-Heng-CH552G_C111292.html) — vendor product page or datasheet
243. [WCH CH554E](https://lcsc.com/product-detail/USB_CH554E_C111293.html) — vendor product page or datasheet
244. [WCH CH572D](https://www.lcsc.com/product-detail/C46597863.html) — vendor product page or datasheet
245. [WCH CH582F](https://www.lcsc.com/product-detail/C3001175.html) — vendor product page or datasheet
246. [WCH CH583 (orderable suffix not verified)](https://github.com/openwch/ch583) — vendor product page or datasheet
247. [WCH CH585F](https://www.lcsc.com/product-detail/C42381475.html) — vendor product page or datasheet
248. [WCH CH592F](https://www.lcsc.com/product-detail/C39831287.html) — vendor product page or datasheet
249. [WinnerMicro W801](https://www.cnx-software.com/2021/11/30/hlk-w801-board-features-alibaba-xuantie-xt804-based-mcu-with-wifi-4-bluetooth-le-4-2/) — vendor product page or datasheet
250. [WinnerMicro W806](https://www.lcsc.com/product-detail/C2929889.html) — vendor product page or datasheet
251. [XHSC (HDSC) HC32F460JCTA](https://www.lcsc.com/product-image/C784662.html) — vendor product page or datasheet
252. [XHSC (HDSC) HC32L110C6UA-SFN20TR](https://www.lcsc.com/product-image/C493490.html) — vendor product page or datasheet
