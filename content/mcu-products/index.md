---
title: "MCU Product Catalog"
created: 2026-11-07
updated: 2026-11-09
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

A searchable catalog of **308 microcontrollers from 52 vendors**, 225 of them with a distributor price. Open the interactive version at [`/mcu-products/`](../../site/mcu-products/index.html) to filter by category, architecture, vendor, radio, memory, clock, price and interfaces.

## What this catalog covers

This catalog lists real microcontroller parts you can buy. It has about 300 rows from more than 50 vendors. The site's concept pages explain how an MCU works. This page is about which parts exist, what they cost and what each one is good at.

It covers three kinds of part:

- **Classic MCUs**, from 8-bit OTP chips that cost a few cents up to 300 MHz Cortex-M7 parts.
- **Crossover MCUs**: very fast parts (400 MHz to 1 GHz) that still run from on-chip SRAM or flash, such as the i.MX RT line, STM32H7 and RA8.
- **Wireless SoCs that people use as the main MCU**, such as ESP32, nRF52/nRF54, CC23xx and CH59x.

It leaves out Linux-class application processors that need an MMU and external DRAM (i.MX 8, STM32MP2, Allwinner).

### How to read an entry

Each row is one part number. It shows the vendor and family, a category, the CPU core and clock, flash and SRAM, any radio and USB, a price, the launch year and status, and short highlights.

- **Prices are in USD and always come with a quantity.** "$0.29@5" and "$0.30@1000" are not the same kind of number, so compare the quantity first.
- **Each price has a confidence label:** *verified* means read from the JLCPCB/LCSC parts API for the exact part number, in stock, at 100 pieces; *listed* means a price read from a named distributor or vendor store for the exact part, often at another quantity or with no stock (the source note says which); *est* means a rough figure (stale, conflicting, or for a different quantity or variant); *none* means no price found. 155 parts have a *verified* JLC price. Treat the other prices as pointers to go and check, not as quotes.
- **A blank or "?" means unknown, not zero.** "0 KB flash" means the chip has no on-chip flash and runs code from an external flash chip. Examples are ESP32-D0WD-V3, RP2040, RP2350A, HPM6750IVM2 and STM32N647Z0.
- **Some rows describe a family, not one part.** Their names say "variant not verified" or "orderable part to confirm", for example RA8E1, nRF54LM20A, i.MX RT700 and STM32V8 (13 rows are left). Their specs belong to the family, not to one orderable part.
- **Some Espressif rows are modules, not bare chips.** These are ESP8684-MINI-1-H4X, ESP32-C5-WROOM-1-N16R8, ESP32-C6-WROOM-1-N4 and ESP32-H2-MINI-1-N2. Their flash figure is the module's flash.
- **236 of the earlier parts have specs confirmed against their datasheet, and the 52 parts added in round 3 carry a quote for each field.** The rest were checked only for plausibility.
- **Status** is one of active, new, sampling, announced, NRND or EOL; the card shows a tag when it is not plain active. Blank means not verified. Each entry's checked note says what was actually confirmed and where.

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
- **Automotive safety:** Infineon AURIX and Traveo, NXP S32K3 and ST SPC58 so far.

## Price tiers

| Tier | Parts in stock at JLCPCB (price @ 100 pcs) | Count |
|---|---|---|
| **Under $0.25** | PMS150C-S08 $0.03, PMS171B-S08 $0.05, PFS154-S08 $0.07, PY32F002AL15S6TU $0.15, PY32F003L16S6TU $0.18, HK32F030MJ4M6 $0.20, STC8G1K08A-36I-SOP8 $0.22, CH572D $0.23, CH32V003F4P6 $0.24 | 9 |
| **$0.25 to $0.50** | N32G003F5S7 $0.26, HK32L010F8P6 $0.26, MSPM0C1104SDSGR $0.28, STM8S003F3P6 $0.29, CH552G $0.31, CH32X035G8U6 $0.31, APM32F003F6P6 $0.32, MM32F0010A1T $0.38, PY32MD310K18U7TR $0.39, CH32V203G6U6 $0.45, STC8H8K64U-45I-QFN48 $0.46, PIC10F200T-I/OT $0.46 and 2 more | 14 |
| **$0.50 to $1** | CH592F $0.51, MM32SPIN05PT $0.51, STM32F030F4P6 $0.52, CH32L103C8T6 $0.55, AT32F421G8U7 $0.56, CH554E $0.60, CH583M $0.68, BK7238QH321 $0.70, N32L406CBL7 $0.71, CH582F $0.75, AT32F415CBT7 $0.77, ATtiny202-SSFR $0.78 and 13 more | 25 |
| **$1 to $2** | STC89C52RC-40I-LQFP44 $1.00, ESP8266EX $1.06, GD32F303RCT6 $1.07, EFM8BB52F32G-C-QFN32 $1.10, STM32F103C8T6 $1.12, STM32G030C8T6 $1.13, RP2350B $1.13, MSPM0G3507SPTR $1.13, RP2350A $1.13, GD32F103C8T6 $1.14, PIC12F1840-I/SN $1.15, CH32V205CCT6 $1.21 and 19 more | 31 |
| **$2 to $5** | ESP32-D0WD-V3 $2.11, ESP32-S3R8 $2.28, CH32V307VCT6 $2.39, BK7258QN8868 $2.39, AVR64DD32-I/PT $2.41, nRF52810-QCAA-R $2.42, NRF54L05-QFAA-R $2.45, DA14531-00000OG2 $2.50, NRF52805-CAAA-R $2.59, MSP430G2553IPW20R $2.62, ATMEGA4809-AFR $2.66, MM32F5277E8PV $2.76 and 30 more | 42 |
| **Over $5** | nRF52833-QIAA-R $5.27, G32R501DPYT7 $5.28, STM32WL33CCV6 $5.50, NRF52840-QIAA-R $5.88, ATSAMD51J19A-AU $6.17, F280039CSPN $6.34, MCXW727AMFTBT $6.56, NRF5340-QKAA-R $6.64, MSP430FR5994IPNR $6.82, MIMXRT1062CVL5B $7.20, STM32L432KCU6 $7.22, HPM5E3YIGN1 $7.34 and 22 more | 34 |

Only the 155 parts with a verified JLC price are in this table, all at 100 pieces, so they compare directly. The catalog page shows the rest with their distributor prices and quantities.

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
- **Thread, Zigbee or Matter:** nRF54L15-QFAA-R, ESP32-H2-MINI-1-N2, ESP32-C6-WROOM-1-N4, EFR32MG24, CC2652R7RGZR and MCXW716AMFTAT.
- **Wi-Fi:** ESP32-C3 or ESP8684 (ESP32-C2) for low cost. ESP32-C6 or CC3501E for Wi-Fi 6. ESP32-C5 for dual-band 2.4/5 GHz.
- **Cellular:** nRF9151-LACA-R (LTE-M, NB-IoT, GNSS).

### Motor control

- **Low cost:** MM32SPIN05PT ($0.51), XMC1302 ($0.88), LKS32MC071CBT8 ($1.36, four op-amps and two simultaneous-sampling 12-bit ADCs) and dsPIC33CK64MC105 ($2.85).
- **Bigger drives:** TMS320F280039C (16 ePWM channels, three 4 MSPS ADCs), TMS320F28P650DK6PZP, dsPIC33AK128MC106, Renesas RX26T and Infineon PSoC Control C3.
- **EtherCAT motion control:** HPM6E80IVM1.

### Camera and vision

- **Parallel camera port (DVP or DCMI):** STM32F407VGT6, STM32H743VIT6, CH32V307VCT6, CH32H417QEU6, AT32F435RGT7, HPM6750IVM2 (two DVP ports), ESP32-S2, ESP32-S31 and MIMXRT1062CVL5B.
- **MIPI CSI:** ESP32-P4NRW32 (with an ISP and H.264 encoder, $4.74), MIMXRT1171DVMAA, HPM6880IBD1, STM32N647Z0 and Realtek RTL8735B.
- **For study:** this site's CH32V003 parallel image-processing page shows that even the cheapest part can do simple vision work.

### ML at the edge

- **Biggest NPU:** STM32N647Z0, with a 600 GOPS NPU and 4.2 MB SRAM.
- **Ethos-U55 NPU parts:** Alif AE302F80F55D5LE-Y, Renesas RA8P1, PSoC Edge E84, Nuvoton M55M1H2LJAE and Himax HX6538.
- **Smaller NPUs:** NXP MCXN947VDFT, MCXN546VDFT and MCX N24 (eIQ Neutron NPU), MSPM0G5187 (2.56 GOPS) and TMS320F28P550SJ6PZR.
- **CNN accelerators:** MAX78000 and MAX78002GXE.
- **Older or niche:** K210 (KPU accelerator), plus ESP32-S3R8, which has vector instructions for neural networks.

### Boards assembled at JLCPCB

- **Use the *In stock at JLCPCB* filter.** 155 parts are in stock there under their exact part number. Each card shows the LCSC code and stock on 2026-11-09.
- **Expect the Extended-part fee.** None of the 222 MCUs found at JLCPCB is a Basic part.
- **67 parts are listed but out of stock**, so check stock again before you lay out a board.
- **Drop-in swaps:** GD32F103C8T6 ($1.14) or APM32F103C8T6 ($0.95) can replace STM32F103C8T6 ($1.12). They are listed as pin-compatible.
- **Programmers are not listed yet.** Check what each part needs before you commit to it.

## Categories at a glance

| Category | Summary | Standouts |
|---|---|---|
| Ultra-low-cost | Parts under $0.50. At the bottom are 8-bit chips from Padauk, Nyquest, Holtek and FMD. Above them, starting around $0.12, are 32-bit Cortex-M0/M0+ parts from Puya, HK, MindMotion and TI, and WCH's RISC-V CH32V00x. Most of the 32-bit parts here now have a verified JLC price; the 8-bit prices below $0.10 are still estimates at large quantities. | NY8A051H, PMS150C-S08, PFS154-S08, PY32F003L16S6TU, HK32F030MJ4M6, CH32V003F4P6, CH32V006F8U6, MSPM0C1104SDSGR, R7FA0E3034ZSD#VA0, STM8S003F3P6 |
| General purpose | The largest group: mainstream 32-bit parts below 400 MHz, from Cortex-M0+ up to 300 MHz Cortex-M7, plus RISC-V and a few 16-bit and 32-bit 8051-derived parts. It includes the STM32F103 and its pin-compatible clones, and the PIO-equipped RP2040 and RP2350. CH32V307VCT6 and AT32F435RGT7 add DVP camera ports at low cost. | STM32F103C8T6, GD32F103C8T6, RP2040, RP2350A, CH32V307VCT6, MSPM0G3507SPTR, AT32F435RGT7, STM32G431CBT6, ATSAME70Q21B-CN, CH32X035G8U6 |
| Low power | Parts designed around battery life: STM32 L0/L4/U0/U3/U5, MSP430FR, RL78/G22, RA0E1/RA0E2, RX140, Ambiq Apollo510, MAX32670, PSoC 6 and HC32L110. The best documented figures are MSP430FR2433 at 16 nA in LPM4.5 and RL78/G22 at 37.5 uA/MHz with 200 nA STOP. Most other rows still lack sleep-current numbers. | MSP430FR2433IRGE, R7F102G8C3CLA#HC0, STM32U3B5CIT6, STM32L051C8T6, STM32U575RIT6, AP510NLA-CBR, MAX32670GTL+T |
| Wireless | Integrated BLE, 802.15.4, Wi-Fi, sub-GHz or cellular. Nordic, Espressif, Silicon Labs, TI and WCH lead. Cheap BLE now starts at $0.23 (CH572D) and $0.51 (CH592F) at JLCPCB. Wi-Fi 6 is common on ESP32-C6, ESP32-C5, CC3501E, BL616 and SiWG917. Many Asian wireless rows still have no core, memory or price. | nRF54L15-QFAA-R, NRF52840-QIAA-R, ESP32-C3, ESP32-C6-WROOM-1-N4, ESP32-C5-WROOM-1-N16R8, CH592F, CH572D, CC2340R5RGER, nRF9151-LACA-R, STM32WLE5CCU6 |
| High performance | Parts at 400 MHz or more: i.MX RT, STM32H7 and H7R/S, RA8M1/RA8D1/RA8M2, GD32H759, HPMicro, ESP32-P4, CH32H417 and STM32V8. RISC-V offers the best value here: HPM5361IEG1 runs at 480 MHz with on-chip flash for $3.75, and ESP32-P4NRW32 adds MIPI-CSI with an ISP for $4.74. Round 3 added the 1 GHz RA8D2, RA8E2 and GD32H789. | HPM5361IEG1, ESP32-P4NRW32, STM32H743VIT6, MIMXRT1062CVL5B, MIMXRT1064DVL6A, CH32H417QEU6, HPM6750IVM2, GD32H759IMT6 |
| AI / NPU | Parts with an NPU or a dedicated ML accelerator, from the 600 GOPS STM32N6 down to TinyEngine NPUs on Cortex-M0+ and C28x parts. Most are Cortex-M55 with an Ethos-U55. Many rows are family-level, and only a few have even an est price. | STM32N647Z0, AE302F80F55D5LE-Y, R7KA8P1KFLCAB, MCXN947VDFT, MSPM0G5187, MAX78000, HX6538-A04TLDG, RTL8735B |
| Motor control | DSCs and MCUs with motor-control timers and fast ADCs: TI C2000, Microchip dsPIC33, Infineon XMC1300 and PSoC Control C3, Renesas RX26T, Toshiba TXZ+, MindMotion MM32SPIN, Linko LKS32MC, Geehy G32R501 and Renesas RA8T1/RX66T. Prices run from $0.51 (MM32SPIN05PT) to $14.69 (F28P650). HPMicro's EtherCAT parts cover industrial motion control. | dsPIC33CK64MC105-I/PT, F280039CSPN, LKS32MC071CBT8, G32R501DPYT7, XMC1302-T038X0032AB, MM32SPIN05PT, R5F526TFDGFP#30, PSC3M5FDS2AFQ1XQSA1, HPM6E80IVM1 |
| Automotive / safety | Five rows: Infineon Traveo T2G and AURIX TC3xx (up to 6 TriCore cores), NXP S32K344 (lockstep Cortex-M7, $17.39 at JLC) and ST SPC582B60 (Power Architecture, $9.89 at JLC). Renesas RH850 and ST Stellar are still missing. | S32K344EHT1MPBST, SPC582B60E1CD00X, TC375TP96F300WAAKXUMA1, TC397XP-256F300S BD, CYT2B74CAB |
| Mixed-signal | Analog-rich parts: PSoC 4 and PSoC 5LP with CapSense and programmable analog, MSP430FR2355 with smart analog, PIC16F17146 with an op-amp and 12-bit differential ADC, CMS32H6157 and HPMicro's HPM6P41. | MSP430FR2355TPTR, PIC16F17146-I/6N, CMS32H6157, CY8C5888LTI-LP097, CY8C4147AZI-S465, HPM6P41IPB1 |
| Classic 8-bit | Classic 8-bit families still sold above $0.50: AVR (megaAVR, tinyAVR and the new DD/DB/EB/DU), PIC (10F, 12F, 18-Q), 8051 (WCH CH55x, STC8H, EFM8) and STM8. CH552G and CH554E give USB on an 8051 for under about $1.10, and AVR64DU32 adds USB to AVR. | ATMEGA328P-AU, ATtiny1616-MNR, CH552G, CH554E, STC8H8K64U-45I-QFN48, AVR64DU32-I/PT, PIC18F47Q84-I/PT |

## Known gaps

- CH32H417QEU6: the datasheet ISA string (RV32IMAFBC-X) should be added to its core name once confirmed in the text.
- The cores rule (application cores only) is applied unevenly: STM32WB55 still has cores 2 although its M0+ is the radio core; MCX W72 counts its radio M33; nRF5340 counts the network core; MAX32655 and the nRF54L rows do not count their RISC-V coprocessors; MAX78000/78002, nRF54H20, GAP9, XMC7200 and RTL8720DN (now named KM4 + KM0) have cores null.
- The 223 values the checkers rejected stay blank or unconfirmed, so the null-field list in index.md is only partly reduced.
- Family-level rows could not take part-specific datasheet values: MSPM0G5187 keeps family GPIO (59) and the full package list because the row has no order code (the PT variant would be 43 GPIO); the same applies to GAP9 and the 13 rows still named as family-level. Round 3 resolved ESP32-C61, CH32V205/407, CH583, nRF54L05/L10, RA8M1 and 15 more to real order codes (their notes say so).
- The usb field has no vocabulary. The pass's 'FS device'/'FS OTG' shorthand was wrong for RP2040/RP2350/RP2354 (host or device, not OTG) and ESP32-C3 (fixed Serial/JTAG only), and roles were added without evidence for HT32F52352 and nRF52840. Define speed + role + PHY + fixed-function values.
- Wireless labels are mixed ('Bluetooth LE 5.x', 'BLE 5.x', 'Bluetooth 5 LE') and mix radios (802.15.4) with protocols (Thread, Zigbee, Matter). The 'BLE 5.4' kept on nRF52832/nRF52840 is web-round only; their datasheets state Bluetooth 5 without a point version.
- Package size convention is undefined: STC lists LQFP by lead-tip span (9x9 for a 7x7 body) and the TM4C row had 12x12 for a 10x10 body. Record body size, then check rows that carry a size.
- Single-quote package claims to confirm: HC32L110C6UA-SFN20TR (is SFN20 a distinct outline or the QFN20 3x3?), CY8C4147AZI-S465 (64-pin taken from a weak quote), BL702S (4x4 kept from the web round).
- Clock and supply semantics need a schema note: dsPIC33CH now shows 240 MHz (slave Fosc, 120 MIPS; master 200 MHz); XMC1100/1302 keep 32 MHz rated, not the 33.2 MHz tolerance ceiling; DA14531 vMax is now the 3.3 V recommended maximum; ESP rows count HP SRAM only, so LP SRAM (16-32 KB) is not recorded anywhere.
- NPU claims on TMS320F28P550SJ and MSPM0G5187 ('TinyEngine NPU') and the ESP32-S31 MMU/SIMD detail were kept from the web round. The datasheet quotes neither confirm nor contradict them.
- Four Espressif rows are still modules. GPIO now uses module counts (C5 22, C6 23), but flash/PSRAM and price are module values and there are no bare-chip rows.
- Camera input type is now a field (40 parts have one confirmed from the datasheet), but pixel clock, JPEG/ISP hardware and PSRAM interface still have no fields, so a full image-processing comparison is not possible yet.
- Prices: 83 rows still have no price (most from Renesas, Microchip, TI, Infineon and NXP), and JLC Basic vs Extended library status is filled only where an exact JLC match exists. DigiKey, Mouser, Farnell, RS and TME blocked automated reads in round 3, so most *listed* prices come from LCSC and some are at 1-30 pieces or for parts with no stock.
- Round 3 sleep currents use the lowest documented mode that keeps any RAM. Some parts' lowest such mode draws milliamps (GD32F405/G553/H759, dsPIC33, C2000, CH32H417), so compare sleepUA only within similar parts.
- Round 3 left blank: values that rest only on a family "up to" figure, GPIO counts that a datasheet implies but does not state, and parts whose datasheet could not be fetched (EM9305, Epson S1C31W65, Himax HX6538, Toshiba TMPM4K4, i.MX RT1062 industrial, MCX N24, ESP32-H21).

## Next research ideas

Done so far: (1) prices and stock checked against the JLC/LCSC parts API; (2) a datasheet pass that filled blank specs and confirmed existing ones on 169 parts; (3) round 3 (2026-11-09): status normalised, 67 prices and 22 real part numbers found, 1,338 blank specs filled, and 52 parts from 9 new vendors and the thin categories added. Ideas 1, 3 and 11 below are partly done by round 3.

1. **Price the module rows and family-level rows as real LCSC SKUs on the JLC parts API** — The datasheet pass could not apply part-specific values to rows without an order code, and four Espressif rows are modules. Real SKUs with JLC stock fix specs and price together. Starter queries: `ESP32-C6FH4 LCSC`; `ESP32-C5HF4 LCSC price`; `ESP8684H4 LCSC stock`; `MSPM0G5187SPTR LCSC`
2. **Camera-capable MCUs: interface type, max pixel clock, SRAM/PSRAM and JPEG hardware from reference manuals** — The owner cares about image processing; DVP/DCMI/CSI data now lives only in free-text highlights. Reference manuals state the pixel clock and data width directly. Starter queries: `AT32F435 DVP maximum pixel clock reference manual`; `GD32F450 DCI camera interface pixel clock`; `CH32V307 DVP pixel clock datasheet`; `STM32H750 DCMI pixel clock 80 MHz`
3. **Cheap image-processing parts missing from the catalog, checked for JLC/LCSC stock** — Several low-cost camera parts are absent; adding them with verified JLC stock serves both owner priorities. Starter queries: `BL618 DVP camera LCSC price`; `AT32F437ZMT7 LCSC price`; `GD32H759IMK6 LCSC`; `ESP32-S3FH4R2 LCSC stock`
4. **On-chip image pipelines: ISP, JPEG/H.264 encoders, 2D/pixel accelerators and PSRAM bandwidth** — Whether a part can really process images depends on its pipeline and memory bandwidth, not only the camera port. Needed for new schema fields. Starter queries: `ESP32-P4 ISP H.264 JPEG encoder resolution fps`; `STM32N6 ISP MIPI CSI-2 resolution`; `i.MX RT1170 PXP JPEG camera`; `ESP32-S3 camera JPEG frame rate PSRAM octal`
5. **Person-detection / visual-wake-word benchmarks to compare image-capable MCUs** — A comparable latency or inference figure per part makes the image-processing shortlist meaningful; the catalog has no NPU GOPS or benchmark field. Starter queries: `MLPerf Tiny visual wake words results MAX78000 STM32N6`; `ESP32-S3 ESP-DL person detection latency`; `K210 KPU person detection fps`; `Alif Ensemble E3 MobileNet inference time`
6. **JLC Basic-library MCUs (no loading fee) and their current stock** — For JLCPCB assembly a Basic part avoids the per-part loading fee; this decides the cheapest real option for the owner. Starter queries: `JLCPCB basic parts microcontroller list`; `JLCPCB basic library STM32G030F6P6`; `JLCPCB basic CH32V003F4P6`; `JLCPCB basic ESP32-C3`
7. **Package outlines per order code from the JLC/EasyEDA footprint for each LCSC part** — Resolves the open package questions (SFN20, 64-pin S465, body vs lead-tip size) from the footprint that JLC will actually place. Starter queries: `HC32L110C6UA-SFN20TR footprint LCSC`; `CY8C4147AZI-S465 TQFP-64 LCSC`; `STC32G12K128 LQFP-48 7x7 footprint`; `BL702S QFN32 4x4 LCSC`
8. **Retry the 223 rejected values with layout-preserving text extraction of ordering tables** — Ordering tables lose their columns in plain text extraction; pdftotext -layout and a per-table read may recover some of the rejected values. Starter queries: `STM32F722RET6 datasheet ordering information table`; `GD32F303RCT6 datasheet pdf`; `EFR32BG22C224F512GM32 datasheet pdf`; `AT32F421G8U7 datasheet flash SRAM`
9. **Settle Bluetooth versions from Bluetooth SIG qualification listings** — Datasheets state an older version than vendor pages (nRF52805 5.2 vs 5.4; nRF52832/52840 only 'Bluetooth 5'); the qualified version on Launch Studio is the authoritative figure. Starter queries: `Bluetooth Launch Studio nRF52832 qualification`; `nRF52840 QDID Bluetooth 5.4`; `EFR32BG22 Bluetooth 5.4 qualification`; `CH582 Bluetooth qualification QDID`
10. **Apply the cores rule from reference manuals for multi-core and radio-core parts** — Core counts are inconsistent across rows with radio or coprocessor cores; a reference manual says which cores run user code. Starter queries: `STM32WB55 Cortex-M0+ radio core user code`; `MCX W72 radio core Cortex-M33 user programmable`; `MAX32655 RISC-V core user application BLE controller`; `XMC7200 single dual Cortex-M7 ordering code D`
11. **Price the remaining no-price rows through LCSC/JLC first, then DigiKey/Mouser** — 98 rows still have no price, mostly Microchip 32-bit, Silicon Labs, Infineon and Asian wireless parts; the owner buys through JLC/LCSC. Starter queries: `ATSAME54P20A LCSC price`; `EFR32MG24B310F1536IM48-B LCSC stock`; `XMC1302-T038X0032AB LCSC`; `DA16200-00000F22 LCSC price`

## How this was researched

Opus planned the search lanes. One Haiku agent searched each lane, then a Sonnet moderator checked that lane's parts against vendor pages and datasheets, fixed or removed bad entries, and noted what it verified (shown as *Checked* on each card). Opus merged the lanes, dropped duplicates and out-of-scope parts, found gaps and ran a second round to fill them. Values that could not be confirmed for the exact part are left blank rather than copied from a sibling part.

After the two web-search rounds, a datasheet pass checked the catalog against the vendors' own datasheets. Haiku agents read the datasheets and quoted the line that supports each value. Sonnet fact-checkers then searched the datasheet file for every quote: 1786 values passed and 223 were rejected because the quote could not be confirmed in the file. The accepted values filled 885 fields that had been blank and confirmed 698 existing ones. In the other 203 cases the datasheet disagreed with the earlier web value, and Opus reviewed each one by hand. A datasheet value was used only when it applied to the exact part number, not to a family maximum, a sibling part or a module. 130 of those took the datasheet value, 73 kept the earlier value. Kept values were usually more specific, such as a core name that says dual-core or a package with its size. Values that still cannot be tied to the exact part are left blank.

Round 3 (2026-11-09) ran in OpenCode. Opus split the gaps into work packets; parallel agents priced parts, read datasheets for blank fields, and searched nine vendor/category lanes for missing parts, each value with its source URL and a verbatim quote. Opus then re-downloaded a random sample of 63 cited sources and found the quote in 55 (the other 8 were pages that only render in a browser, plus one quote rebuilt from a table row, which was dropped), rejected four outlier prices, removed duplicates, and filled only fields that were blank.

Prices marked *verified* come from the [JLCPCB parts library](https://jlcpcb.com/parts) (the same stock as LCSC), looked up by exact part number on 2026-11-09, in stock, at 100 pieces. Out-of-stock listings show placeholder prices there, so they are not used.

## References

Every part's product page or datasheet (`url`), spec source and price source are stored per entry in `content/mcu-products/catalog.json`. Product pages:

1. [ABOV A31G213CL2N](https://www.lcsc.com/product-detail/C3041481.html) — vendor product page or datasheet
2. [Alif Semiconductor AB1C1F4M51820PH0](https://alifsemi.com/support/datasheets/) — vendor product page or datasheet
3. [Alif Semiconductor AE1C1F4051920PH0](https://alifsemi.com/ensemble-e1c/) — vendor product page or datasheet
4. [Alif Semiconductor AE302F80F55D5LE-Y](https://www.arrow.com/en/products/ae302f80f55d5le-y/alif-semiconductor) — vendor product page or datasheet
5. [Ambiq AMA3B2KK-KBR (Apollo3 Blue Plus)](https://www.digikey.sg/en/products/detail/ambiq-micro-inc/AMA3B2KK-KBR/20380332) — vendor product page or datasheet
6. [Ambiq AMA4B2KP-KBR (Apollo4 Blue Plus)](https://www.futureelectronics.com/p/semiconductors--microprocessors--embedded-processors/ama4b2kp-kbr-ambiq-7162807) — vendor product page or datasheet
7. [Ambiq AP510BFA-CBR (Apollo510B)](https://ambiq.com/apollo510b/) — vendor product page or datasheet
8. [Ambiq AP510NLA-CBR (Apollo510 Lite)](https://www.futureelectronics.com/p/semiconductors--microprocessors--embedded-processors/ap510nla-cbr-ambiq-4219874) — vendor product page or datasheet
9. [Analog Devices MAX32655GXG+](https://www.digikey.com.au/en/product-highlight/a/analog-devices/max32655-arm-cortex-m4-processor) — vendor product page or datasheet
10. [Analog Devices MAX32660GTG+](https://www.lcsc.com/product-detail/C1338308.html) — vendor product page or datasheet
11. [Analog Devices MAX32670GTL+T](https://www.digikey.co.uk/en/products/detail/analog-devices-inc-maxim-integrated/MAX32670GTL/12178454) — vendor product page or datasheet
12. [Analog Devices MAX32690GTK+](https://www.digikey.co.th/en/product-highlight/a/analog-devices/max32690-microcontroller) — vendor product page or datasheet
13. [Analog Devices MAX78000EXG+](https://www.analog.com/en/products/max78000) — vendor product page or datasheet
14. [Analog Devices MAX78002GXE+](https://www.analog.com/en/products/max78002) — vendor product page or datasheet
15. [Artery AT32F403ACGT7](https://www.arterychip.com/en/product/AT32F403A.jsp) — vendor product page or datasheet
16. [Artery AT32F415CBT7](https://www.arterychip.com/en/product/AT32F415.jsp) — vendor product page or datasheet
17. [Artery AT32F421G8U7](https://www.arterychip.com/en/product/AT32F421.jsp) — vendor product page or datasheet
18. [Artery AT32F435RGT7](https://www.arterychip.com/en/product/AT32F435.jsp) — vendor product page or datasheet
19. [ASR Microelectronics ASR6601SER](https://www.asrmicro.com/en/goods/proinfo/23.html) — vendor product page or datasheet
20. [Beken BK7231N](https://www.sierraic.com/BK7) — vendor product page or datasheet
21. [Beken BK7238QH321](https://www.lcsc.com/product-detail/C53282000.html) — vendor product page or datasheet
22. [Beken BK7258QN8868](https://www.lcsc.com/product-detail/C53049811.html) — vendor product page or datasheet
23. [Bouffalo Lab BL602C-20-Q2I](https://www.lcsc.com/product-detail/C5187545.html) — vendor product page or datasheet
24. [Bouffalo Lab BL616 (QFN-40)](https://docs.ai-thinker.com/_media/bl616_bl618_ds_en_2.5_open_.pdf) — vendor product page or datasheet
25. [Bouffalo Lab BL702S-A0-Q2I](https://www.lcsc.com/product-detail/C2874059.html) — vendor product page or datasheet
26. [Canaan (Kendryte) K210 (LCSC C913414)](https://www.lcsc.com/product-detail/C913414.html) — vendor product page or datasheet
27. [Chipsea CS32F030C8T6](https://www.lcsc.com/product-detail/C915006.html) — vendor product page or datasheet
28. [Cmsemicon (CMS) CMS32H6157](https://www.mcu.com.cn/Products/327/pids/2) — vendor product page or datasheet
29. [EM Microelectronic EM9305BH209CS23B](https://www.digikey.co.uk/en/products/detail/em-microelectronic/EM9305BH209CS23B/26794125) — vendor product page or datasheet
30. [Epson S1C31W65 (Epson)](https://global.epson.com/products_and_drivers/semicon/offer/mcu.html) — vendor product page or datasheet
31. [Espressif ESP32-C3](https://www.espressif.com/en/products/socs/esp32-c3) — vendor product page or datasheet
32. [Espressif ESP32-C5-WROOM-1-N16R8](https://www.espressif.com/en/products/socs/esp32-c5) — vendor product page or datasheet
33. [Espressif ESP32-C6-WROOM-1-N4](https://www.espressif.com/en/products/socs/esp32-c6) — vendor product page or datasheet
34. [Espressif ESP32-C61HR2](https://www.espressif.com/en/products/socs/esp32-c61) — vendor product page or datasheet
35. [Espressif ESP32-D0WD-V3](https://www.espressif.com/en/products/socs/esp32) — vendor product page or datasheet
36. [Espressif ESP32-H2-MINI-1-N2](https://www.espressif.com/en/products/socs/esp32-h2) — vendor product page or datasheet
37. [Espressif ESP32-H21](https://www.espressif.com/en/products/socs/esp32-h21) — vendor product page or datasheet
38. [Espressif ESP32-H4](https://www.espressif.com/en/products/socs/esp32-h4) — vendor product page or datasheet
39. [Espressif ESP32-P4NRW32](https://www.espressif.com/en/products/socs/esp32-p4) — vendor product page or datasheet
40. [Espressif ESP32-S2](https://www.espressif.com/en/products/socs/esp32-s2) — vendor product page or datasheet
41. [Espressif ESP32-S31](https://www.espressif.com/en/products/socs/esp32-s31) — vendor product page or datasheet
42. [Espressif ESP32-S3R8](https://www.espressif.com/en/products/socs/esp32-s3) — vendor product page or datasheet
43. [Espressif ESP8266EX](https://www.espressif.com/en/products/socs/esp8266) — vendor product page or datasheet
44. [Espressif ESP8684-MINI-1-H4X (ESP32-C2 family)](https://www.espressif.com/en/products/socs/esp8684) — vendor product page or datasheet
45. [FMD (Fremont Micro Devices) FT60F011A-RB (SOP-8)](https://www.lcsc.com/product-detail/C708769.html) — vendor product page or datasheet
46. [FMD (Fremont Micro Devices) FT61F02F-MRB (MSOP-10)](https://www.lcsc.com/product-detail/C708777.html) — vendor product page or datasheet
47. [Fudan Micro (FMSH) FM33LG025A](https://www.lcsc.com/product-detail/C7497282.html) — vendor product page or datasheet
48. [Geehy APM32F003F6P6](https://datasheet.lcsc.com/lcsc/2202161430_Geehy-APM32F003F6P6_C2975251.pdf) — vendor product page or datasheet
49. [Geehy APM32F103C8T6](https://www.lcsc.com/product-detail/C393540.html) — vendor product page or datasheet
50. [Geehy APM32F402CBT6](https://global.geehy.com/product/fifth/APM32F402) — vendor product page or datasheet
51. [Geehy G32R501DPYT7](https://global.geehy.com/product/fifth/G32R501) — vendor product page or datasheet
52. [GigaDevice GD32E230F8P6TR](https://www.gigadevice.com/product/mcu/entry-level-mcus/gd32e23x-series/gd32e230) — vendor product page or datasheet
53. [GigaDevice GD32F103C8T6](https://www.lcsc.com/product-image/C77994.html) — vendor product page or datasheet
54. [GigaDevice GD32F303RCT6](https://www.gigadevice.com/product/mcu/main-stream-mcus/gd32f30x-series/gd32f303) — vendor product page or datasheet
55. [GigaDevice GD32F405RGT6](https://www.gigadevice.com/product/mcu/high-performance-mcus/gd32f4xx-series/gd32f405) — vendor product page or datasheet
56. [GigaDevice GD32G553RET7](https://www.gigadevice.com/product/mcu/mcus-product-selector/gd32g553ret7) — vendor product page or datasheet
57. [GigaDevice GD32H759IMT6](https://www.gigadevice.com/product/mcu/mcus-product-selector/gd32h759imt6) — vendor product page or datasheet
58. [GigaDevice GD32H789IIT7](https://www.gigadevice.com/product/mcu/mcus-product-selector/gd32h789iit7) — vendor product page or datasheet
59. [GigaDevice GD32VF103CBT6](https://gigadevice.com/product/mcu/main-stream-mcus/gd32vf103-series/gd32vf103) — vendor product page or datasheet
60. [GigaDevice GD32VW553KIQ6](https://www.gigadevice.com/product/mcu/mcus-product-selector/gd32vw553kiq6) — vendor product page or datasheet
61. [GreenWaves Technologies GAP9 (ordering code to confirm)](https://greenwaves-technologies.com/gap9_processor/) — vendor product page or datasheet
62. [Himax HX6538-A04TLDG](https://www.digikey.jp/en/products/detail/himax/HX6538-A04TLDG/22492693) — vendor product page or datasheet
63. [HiSilicon WS63 (Hi3863V100)](https://www.lcsc.com/product-detail/C48031351.html) — vendor product page or datasheet
64. [HK (Hangshun) HK32F030MJ4M6](https://www.lcsc.com/product-detail/C907709.html) — vendor product page or datasheet
65. [HK (Hangshun) HK32L010F8P6](https://www.lcsc.com/product-detail/C54529069.html) — vendor product page or datasheet
66. [Holtek HT32F52352-LQFP64 (C97188)](https://www.lcsc.com/product-detail/C97188.html) — vendor product page or datasheet
67. [Holtek HT66F002 (SOP-8)](https://www.lcsc.com/product-detail/C91298.html) — vendor product page or datasheet
68. [HPMicro HPM5361IEG1](https://www.lcsc.com/product-detail/C49451871.html) — vendor product page or datasheet
69. [HPMicro HPM5E3YIGN1](https://www.lcsc.com/product-image/C53262625.html) — vendor product page or datasheet
70. [HPMicro HPM6750IVM2](https://www.lcsc.com/product-detail/C49374601.html) — vendor product page or datasheet
71. [HPMicro HPM6880IBD1](https://www.hpmicro.com/en/product-center/microcontroller/hpm6800) — vendor product page or datasheet
72. [HPMicro HPM6E80IVM1](https://www.lcsc.com/product-detail/C49374603.html) — vendor product page or datasheet
73. [HPMicro HPM6P41IPB1](https://www.elexess.com/part/1608148/hpmicro/hpm6p41ipb1) — vendor product page or datasheet
74. [Infineon CY8C4014LQI-421](https://ie.rs-online.com/web/p/microcontrollers/2733111) — vendor product page or datasheet
75. [Infineon CY8C4024AXI-S402](https://www.digikey.de/en/products/detail/infineon-technologies/CY8C4024AXI-S402/11486333) — vendor product page or datasheet
76. [Infineon CY8C4147AZI-S465](https://www.lcsc.com/product-detail/C22951364.html) — vendor product page or datasheet
77. [Infineon CY8C5888LTI-LP097](https://www.lcsc.com/product-detail/C2951243.html) — vendor product page or datasheet
78. [Infineon CY8C6247FDI-D32T](https://www.lcsc.com/product-detail/C2952480.html) — vendor product page or datasheet
79. [Infineon CYT2B74CAB](https://www.infineon.com/cms/en/product/microcontroller/32-bit-traveo-t2g-arm-cortex-microcontroller/traveo-t2g-cyt2b7-series/) — vendor product page or datasheet
80. [Infineon CYW20819A1KFBG](https://www.infineon.com/part/CYW20819) — vendor product page or datasheet
81. [Infineon CYW20829B0LKMLXQLA1](https://www.digikey.lv/en/products/detail/infineon-technologies/CYW20829B0LKMLXQLA1/21675694) — vendor product page or datasheet
82. [Infineon PSC3M5FDS2AFQ1XQSA1](https://infineon.com/psoccontrol) — vendor product page or datasheet
83. [Infineon PSOC Edge E84 (ordering code to confirm)](https://www.infineon.com/products/microcontroller/32-bit-psoc-arm-cortex/32-bit-psoc-edge-arm) — vendor product page or datasheet
84. [Infineon TC375TP96F300WAAKXUMA1](https://my.element14.com/infineon/tc375tp96f300waakxuma1/mcu-32bit-300mhz-lqfp-176/dp/3625285RL) — vendor product page or datasheet
85. [Infineon TC397XP-256F300S BD](https://my.element14.com/infineon/tc397xx256f300sbdkxuma2/mcu-32bit-300mhz-lfbga-292/dp/4588993RL) — vendor product page or datasheet
86. [Infineon XMC1100-Q024X0016AB](https://www.lcsc.com/product-image/C540479.html) — vendor product page or datasheet
87. [Infineon XMC1302-T038X0032AB](https://lcsc.com/product-detail/Infineon_Infineon-Technologies_C540553.html) — vendor product page or datasheet
88. [Infineon XMC4700-F100K2048 AA](https://no.rs-online.com/web/p/microcontrollers/1658225) — vendor product page or datasheet
89. [Infineon XMC7200-F176K8384AA](https://infineon.com/cms/en/product/microcontroller/32-bit-industrial-microcontroller-based-on-arm-cortex-m/32-bit-xmc7000-industrial-microcontroller-arm-cortex-m7/xmc7200-f176k8384aa) — vendor product page or datasheet
90. [Lapis (ROHM group) ML62Q1200A](https://au.rs-online.com/web/p/microcontrollers/1808490) — vendor product page or datasheet
91. [Lapis (ROHM group) ML62Q1600](https://befr.rs-online.com/web/p/microcontrollers/1808472) — vendor product page or datasheet
92. [Linko (LKS) LKS32MC071CBT8](https://www.lcsc.com/product-detail/C5439801.html) — vendor product page or datasheet
93. [Megawin MG32F103RBT6](https://www.lcsc.com/product-detail/C2976661.html) — vendor product page or datasheet
94. [Microchip ATmega328P-AU](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-ATMEGA328P-AU_C14877.html) — vendor product page or datasheet
95. [Microchip ATMEGA4809-AFR](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-ATMEGA4809-AFR_C189475.html) — vendor product page or datasheet
96. [Microchip ATSAMC21J18A-AUT](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-ATSAMC21J18A-AUT_C2052757.html) — vendor product page or datasheet
97. [Microchip ATSAMD21E18A-AU](https://www.lcsc.com/product-image/C618771.html) — vendor product page or datasheet
98. [Microchip ATSAMD51J19A-AU](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-ATSAMD51J19A-AU_C619214.html) — vendor product page or datasheet
99. [Microchip ATSAME70Q21B-CN](https://www.lcsc.com/product-image/C1339771.html) — vendor product page or datasheet
100. [Microchip ATtiny1616-MNR](https://www.lcsc.com/product-image/C507118.html) — vendor product page or datasheet
101. [Microchip ATtiny202-SSFR](https://www.lcsc.com/product-detail/C616039.html) — vendor product page or datasheet
102. [Microchip ATtiny3226-MU](https://www.lcsc.com/product-detail/Microcontroller-Units-MCUs-MPUs-SOCs_Microchip-Tech-ATTINY3226-MU_C5227682.html) — vendor product page or datasheet
103. [Microchip AVR16EB14-E/SL](https://futureelectronics.com/p/semiconductors--microcontrollers--8-bit/avr16eb14-e-sl-microchip-2186967) — vendor product page or datasheet
104. [Microchip AVR64DB32-I/RXB](https://nz.element14.com/microchip/avr64db32-i-rxb/mcu-8bit-24mhz-vqfn-32/dp/3625506) — vendor product page or datasheet
105. [Microchip AVR64DD32-I/PT](https://se.rs-online.com/web/p/microcontrollers/2516960) — vendor product page or datasheet
106. [Microchip AVR64DU32-I/PT](https://www.digikey.de/en/products/detail/microchip-technology/AVR64DU32-I-PT/22611709) — vendor product page or datasheet
107. [Microchip dsPIC33AK128MC106-I/PT](https://microchip.com/en-us/product/dsPIC33AK128MC106) — vendor product page or datasheet
108. [Microchip dsPIC33CH512MP508-I/PT](https://www.microchip.com/en-us/product/dspic33ch512mp508) — vendor product page or datasheet
109. [Microchip dsPIC33CK64MC105-I/PT](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Microchip-Tech-dsPIC33CK64MC105-I-PT_C5162259.html) — vendor product page or datasheet
110. [Microchip PIC10F200T-I/OT](https://www.lcsc.com/product-detail/C8224.html) — vendor product page or datasheet
111. [Microchip PIC10F320-I/P](https://lcsc.com/product-detail/image/PIC10F320-I-P_C640475.html) — vendor product page or datasheet
112. [Microchip PIC12F1840-I/SN](https://www.lcsc.com/product-image/C39594.html) — vendor product page or datasheet
113. [Microchip PIC16F15213-I/SN](https://www.lcsc.com/product-detail/C1019985.html) — vendor product page or datasheet
114. [Microchip PIC16F17146-I/6N](https://www.lcsc.com/product-detail/C5239671.html) — vendor product page or datasheet
115. [Microchip PIC18F47Q84-I/PT](https://lcsc.com/datasheet/lcsc_datasheet_2204251600_Microchip-Tech-PIC18F47Q84-I-PT_C2987161.pdf) — vendor product page or datasheet
116. [Microchip PIC24FJ64GA002-I/SS](https://www.lcsc.com/product-image/C629050.html) — vendor product page or datasheet
117. [Microchip PIC32CK2051SG01100](https://microchip.com/en-us/product/pic32ck2051sg01100) — vendor product page or datasheet
118. [Microchip PIC32CM PL10 (orderable part number not verified)](https://www.microchip.com/en-us/product/pic32cm-pl10) — vendor product page or datasheet
119. [Microchip PIC32CM3204JH00064-I/5LX](https://uk.rs-online.com/web/p/microcontrollers/0930926) — vendor product page or datasheet
120. [Microchip PIC32CM5164JH00048-I/U5B](https://uk.rs-online.com/web/p/microcontrollers/0930928) — vendor product page or datasheet
121. [Microchip PIC32CX1012BZ25048-I/MYX](https://www.digikey.co.uk/en/products/detail/microchip-technology/PIC32CX1012BZ25048-E-MYX/16709283) — vendor product page or datasheet
122. [Microchip PIC32CZ1038CA70100-I/XEB](https://uk.rs-online.com/web/p/microcontrollers/0930938) — vendor product page or datasheet
123. [Microchip PIC32CZ4010CA80144-I/LUX](https://uk.rs-online.com/web/p/microcontrollers/0930945) — vendor product page or datasheet
124. [Microchip PIC32CZ8110CA90208](https://microchip.com/en-us/product/PIC32CZ8110CA90208) — vendor product page or datasheet
125. [Microchip PIC32MX170F256B-I/ML](https://www.lcsc.com/product-detail/C219870.html) — vendor product page or datasheet
126. [MindMotion MM32F0010A1T](https://www.lcsc.com/product-detail/C2686112.html) — vendor product page or datasheet
127. [MindMotion MM32F5277E8PV](https://www.lcsc.com/product-detail/C5182242.html) — vendor product page or datasheet
128. [MindMotion MM32SPIN05PT](https://www.lcsc.com/product-detail/C5182254.html) — vendor product page or datasheet
129. [Nations Technologies N32G003F5S7](https://www.lcsc.com/product-detail/C7431135.html) — vendor product page or datasheet
130. [Nations Technologies N32G430C8L7](https://www.lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_Nations-Technologies-Inc-N32G430C8L7_C3032170.html) — vendor product page or datasheet
131. [Nations Technologies N32G455REL7](https://www.lcsc.com/product-detail/C841392.html) — vendor product page or datasheet
132. [Nations Technologies N32L406CBL7](https://www.lcsc.com/product-detail/C2981444.html) — vendor product page or datasheet
133. [Nordic Semiconductor NRF52805-CAAA-R](https://www.nordicsemi.com/Products/nRF52805) — vendor product page or datasheet
134. [Nordic Semiconductor nRF52810-QCAA-R](https://www.nordicsemi.com/Products/nRF52810) — vendor product page or datasheet
135. [Nordic Semiconductor NRF52811-QFAA-R](https://www.nordicsemi.com/Products/nRF52811) — vendor product page or datasheet
136. [Nordic Semiconductor NRF52820-QDAA-R](https://www.nordicsemi.com/Products/nRF52820) — vendor product page or datasheet
137. [Nordic Semiconductor NRF52832-QFAA-R](https://www.nordicsemi.com/Products/nRF52832) — vendor product page or datasheet
138. [Nordic Semiconductor nRF52833-QIAA-R](https://www.nordicsemi.com/Products/nRF52833) — vendor product page or datasheet
139. [Nordic Semiconductor NRF52840-QIAA-R](https://www.nordicsemi.com/Products/nRF52840) — vendor product page or datasheet
140. [Nordic Semiconductor NRF5340-QKAA-R](https://www.nordicsemi.com/Products/nRF5340) — vendor product page or datasheet
141. [Nordic Semiconductor nRF54H20-CKAA-R7](https://www.nordicsemi.com/Products/nRF54H20) — vendor product page or datasheet
142. [Nordic Semiconductor NRF54L05-QFAA-R](https://www.nordicsemi.com/Products/nRF54L05) — vendor product page or datasheet
143. [Nordic Semiconductor NRF54L10-QFAA-R](https://www.nordicsemi.com/Products/nRF54L10) — vendor product page or datasheet
144. [Nordic Semiconductor nRF54L15-QFAA-R](https://www.nordicsemi.com/Products/nRF54L15) — vendor product page or datasheet
145. [Nordic Semiconductor nRF54LM20A (CSP98 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF54LM20A) — vendor product page or datasheet
146. [Nordic Semiconductor nRF54LM20B (CSP98 package)](https://www.nordicsemi.com/Products/nRF54LM20B) — vendor product page or datasheet
147. [Nordic Semiconductor nRF54LV10A (QFN48 variant, order code not verified)](https://www.nordicsemi.com/Products/nRF54LV10A) — vendor product page or datasheet
148. [Nordic Semiconductor nRF9151-LACA-R](https://www.nordicsemi.com/Products/nRF9151) — vendor product page or datasheet
149. [Nuvoton M2351ZIAAE (QFN-33)](https://jlcpcb.com/partdetail/NUVOTON-M2351ZIAAE/C5150973/C5150973) — vendor product page or datasheet
150. [Nuvoton M55M1H2LJAE](https://www.nuvoton.com/products/microcontrollers/arm-cortex-m55-mcus/) — vendor product page or datasheet
151. [Nuvoton MS51XB9AE (QFN-20)](https://www.lcsc.com/product-detail/C2917204.html) — vendor product page or datasheet
152. [NXP i.MX RT1180 (289 MAPBGA 14x14)](https://www.nxp.com/products/processors-and-microcontrollers/arm-microcontrollers/i-mx-rt-crossover-mcus/i-mx-rt1180-dual-core-crossover-mcu-with-time-sensitive-networking-switch-and-integrated-edgelock-secure-enclave:i.MX-RT1180) — vendor product page or datasheet
153. [NXP i.MX RT700 (orderable part to confirm)](https://www.nxp.com/docs/en/data-sheet/IMXRT700EC.pdf) — vendor product page or datasheet
154. [NXP KW45Z41053AFTBT](https://www.nxp.com/part/KW45Z41053AFTBT) — vendor product page or datasheet
155. [NXP KW47Z420B3AFTB](https://www.nxp.com/part/KW47Z420B3AFTB) — vendor product page or datasheet
156. [NXP LPC5536JHI48](https://keil.arm.com/devices/nxp-lpc5536jhi48) — vendor product page or datasheet
157. [NXP LPC55S69JBD64K](https://www.digikey.sg/en/products/detail/nxp-usa-inc/LPC55S69JBD64K/10649974) — vendor product page or datasheet
158. [NXP LPC804M101JHI33Y](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_NXP-Semicon-LPC804M101JHI33Y_C2056847.html) — vendor product page or datasheet
159. [NXP LPC845M301JBD64E](https://www.lcsc.com/product-detail/C116150.html) — vendor product page or datasheet
160. [NXP MCX N24 (orderable part number not verified)](https://community.element14.com/products/manufacturers/nxp/b/blog/posts/new-product-release---mcx-n53-n52-n24-high-performance-cortex-m33-mcus-with-on-chip-accelerators-and-advanced-security) — vendor product page or datasheet
161. [NXP MCXA153VLH](https://www.futureelectronics.com/p/semiconductors--microcontrollers--32-bit/mcxa153vlh-nxp-1182400) — vendor product page or datasheet
162. [NXP MCXA154VLL](https://cn.element14.com/nxp/mcxa154vll/mcu-32bit-96mhz-lqfp-100/dp/4538853) — vendor product page or datasheet
163. [NXP MCXC444VLH](https://www.nxp.com/docs/en/data-sheet/MCXC44XP64M48SF6.pdf) — vendor product page or datasheet
164. [NXP MCXN546VDFT](https://www.nxp.com/docs/en/fact-sheet/MCXNFS.pdf) — vendor product page or datasheet
165. [NXP MCXW716AMFTAT](https://www.nxp.com/products/MCX-W71) — vendor product page or datasheet
166. [NXP MCXW727AMFTBT](https://www.digikey.com.br/pt/product-highlight/n/nxp-semi/mcx-w72-multiprotocol-wireless-mcus) — vendor product page or datasheet
167. [NXP MIMXRT1011DAE5A](https://www.lcsc.com/product-detail/C1575810.html) — vendor product page or datasheet
168. [NXP MIMXRT1062CVL5B](https://www.lcsc.com/product-detail/C2990557.html) — vendor product page or datasheet
169. [NXP MIMXRT1064DVL6A](https://www.nxp.com/products/i.MX-RT1064) — vendor product page or datasheet
170. [NXP MIMXRT1171DVMAA](https://www.nxp.com/products/processors-and-microcontrollers/arm-microcontrollers/i-mx-rt-crossover-mcus/i-mx-rt1170-crossover-mcu-family:i.MX-RT1170) — vendor product page or datasheet
171. [NXP S32K344EHT1MPBST](https://www.lcsc.com/product-detail/C5201242.html) — vendor product page or datasheet
172. [Nyquest NY8A051H (SOP-8)](https://www.lcsc.com/product-detail/C5143390.html) — vendor product page or datasheet
173. [Padauk PFS154-S08](https://lcsc.com/product-detail/Others_PADAUK-Tech-PFS154-S08_C317611.html) — vendor product page or datasheet
174. [Padauk PMS150C-S08](https://www.lcsc.com/product-detail/C129127.html) — vendor product page or datasheet
175. [Padauk PMS171B-S08](https://www.lcsc.com/product-detail/C337967.html) — vendor product page or datasheet
176. [Puya PY32F002AL15S6TU](https://www.lcsc.com/product-detail/Microcontroller-Units-MCUs-MPUs-SOCs_PUYA-PY32F002AL15S6TU_C5292060.html) — vendor product page or datasheet
177. [Puya PY32F003L16S6TU](https://www.lcsc.com/product-detail/C5128435.html) — vendor product page or datasheet
178. [Puya PY32F072C1BT6](https://www.lcsc.com/product-detail/C22439087.html) — vendor product page or datasheet
179. [Puya PY32L020 (orderable suffix not confirmed)](https://openpuya-website.pages.dev/en/mcu/PY32L020xx) — vendor product page or datasheet
180. [Puya PY32MD310K18U7TR](https://www.lcsc.com/product-detail/C42376917.html) — vendor product page or datasheet
181. [Qorvo QPG6200L](https://www.qorvo.com/products/p/QPG6200L) — vendor product page or datasheet
182. [Raspberry Pi RP2040](https://www.raspberrypi.com/products/rp2040/) — vendor product page or datasheet
183. [Raspberry Pi RP2350A](https://www.raspberrypi.com/products/rp2350/) — vendor product page or datasheet
184. [Realtek RTL8720DN](https://www.fpgacenter.com/product/realtek/RTL8720DN) — vendor product page or datasheet
185. [Realtek RTL8735B](https://www.amebaiot.com/zh/amebapro2) — vendor product page or datasheet
186. [Renesas DA14531-00000OG2](https://www.renesas.com/en/products/da14531) — vendor product page or datasheet
187. [Renesas DA14592-010006F2](https://www.renesas.com/en/products/da14592) — vendor product page or datasheet
188. [Renesas DA14695-00000HQ2](https://www.renesas.com/en/products/da14695) — vendor product page or datasheet
189. [Renesas DA16200-00000F22](https://www.renesas.com/en/products/da16200/part-details/da16200-00000f22) — vendor product page or datasheet
190. [Renesas R5F12008ASN#50](https://www.renesas.com/en/products/rl78-g15) — vendor product page or datasheet
191. [Renesas R5F51403ADFM#30](https://www.renesas.com/en/products/rx140) — vendor product page or datasheet
192. [Renesas R5F52618ADFM#10](https://www.renesas.com/en/products/rx261) — vendor product page or datasheet
193. [Renesas R5F526TFDGFP#30](https://www.renesas.com/en/products/rx26t) — vendor product page or datasheet
194. [Renesas R5F566TFCDFP#10](https://www.renesas.com/en/products/rx66t) — vendor product page or datasheet
195. [Renesas R5F572NNHDFC#30](https://www.digikey.co.uk/en/products/detail/renesas-electronics-corporation/R5F572NNHDFC-30/12750889) — vendor product page or datasheet
196. [Renesas R7F100GGL3CFB#AA0](https://www.renesas.com/en/products/rl78-g23) — vendor product page or datasheet
197. [Renesas R7F101GLG2DFA#BA1](https://www.renesas.cn/zh/products/rl78-g24/part-details/r7f101glg2dfa-ba1) — vendor product page or datasheet
198. [Renesas R7F102G8C3CLA#HC0](https://www.renesas.cn/document/dst/rl78g22-datasheet) — vendor product page or datasheet
199. [Renesas R7FA0E1073CFJ](https://www.renesas.com/en/products/ra0e1) — vendor product page or datasheet
200. [Renesas R7FA0E2094CFM#UA0](https://www.renesas.com/en/products/ra0e2) — vendor product page or datasheet
201. [Renesas R7FA0E3034ZSD#VA0 (RA0E3)](https://www.renesas.com/en/products/ra0e3) — vendor product page or datasheet
202. [Renesas R7FA2E1A92DFM#AA0](https://www.renesas.com/en/products/ra2e1) — vendor product page or datasheet
203. [Renesas R7FA4M1AB3CFM#AA0](https://www.renesas.com/en/products/ra4m1) — vendor product page or datasheet
204. [Renesas R7FA6M5BH3CFC#BA0](https://www.renesas.com/en/products/ra6m5) — vendor product page or datasheet
205. [Renesas R7FA8E2AFDCBD#BC0](https://www.renesas.com/en/products/ra8e2/part-details/r7fa8e2afdcbd-bc0) — vendor product page or datasheet
206. [Renesas R7FA8M1AHECFB#AA0](https://www.digikey.com/en/product-highlight/r/renesas/ra8m1-arm-cortex-m85) — vendor product page or datasheet
207. [Renesas R7FA8T1AHECFB#BA0](https://www.renesas.com/en/products/ra8t1/part-details/r7fa8t1ahecfb-ba0) — vendor product page or datasheet
208. [Renesas R7KA8D2KFLCAB#BC1](https://www.renesas.com/en/products/ra8d2/part-details/r7ka8d2kflcab-bc1) — vendor product page or datasheet
209. [Renesas R7KA8M2JFLCAB#UC0](https://www.renesas.com/en/products/ra8m2) — vendor product page or datasheet
210. [Renesas R7KA8P1KFLCAB](https://www.renesas.com/en/products/ra8p1) — vendor product page or datasheet
211. [Renesas RA8D1 480 MHz variant (P/N not confirmed)](https://www.digikey.com/en/product-highlight/r/renesas/ra8d1-480-mhz-arm-cortex-m85-mcu) — vendor product page or datasheet
212. [Renesas RA8E1 (family level, P/N not confirmed)](https://www.renesas.com/en/products/ra8e1) — vendor product page or datasheet
213. [Silicon Labs EFM32PG22C200F512IM32-C](https://www.lcsc.com/product-detail/C3225388.html) — vendor product page or datasheet
214. [Silicon Labs EFM8BB10F2G-A-QFN20](https://it.rs-online.com/web/p/microcontroller/1690180) — vendor product page or datasheet
215. [Silicon Labs EFM8BB52F32G-C-QFN32](https://www.lcsc.com/product-detail/C6033318.html) — vendor product page or datasheet
216. [Silicon Labs EFM8LB12F64E-C-QFN32](https://www.lcsc.com/product-detail/C1340074.html) — vendor product page or datasheet
217. [Silicon Labs EFR32BG22C224F512GM32-CR](https://www.lcsc.com/product-image/C1015253.html) — vendor product page or datasheet
218. [Silicon Labs EFR32BG24A020F1024IM40-B](https://jp.farnell.com/en-JP/silicon-labs/efr32bg24a020f1024im40-b/rf-soc-arm-cortex-m33-78mhz-qfn/dp/3958441) — vendor product page or datasheet
219. [Silicon Labs EFR32BG27C320F768GJ39-BR](https://www.lcsc.com/product-detail/C28044320.html) — vendor product page or datasheet
220. [Silicon Labs EFR32MG24B310F1536IM48-B](https://ie.farnell.com/silicon-labs/efr32mg24b310f1536im48-b/rf-soc-arm-cortex-m33-78mhz-qfn/dp/3958454) — vendor product page or datasheet
221. [Silicon Labs SIWG917M100MGTBA](https://www.digikey.co.uk/en/products/detail/silicon-labs/SIWG917M100MGTBA/24710281) — vendor product page or datasheet
222. [Sinowealth SH79F1612AM (SOP-20)](https://www.lcsc.com/product-detail/C181997.html) — vendor product page or datasheet
223. [STC Micro STC32G12K128-35I-LQFP48](https://www.lcsc.com/product-detail/C5210760.html) — vendor product page or datasheet
224. [STC Micro STC89C52RC-40I-LQFP44](https://www.lcsc.com/product-detail/C8707.html) — vendor product page or datasheet
225. [STC Micro STC8G1K08A-36I-SOP8](https://lcsc.com/product-detail/STC_STC-Micro-STC8G1K08A-36I-SOP8_C915663.html) — vendor product page or datasheet
226. [STC Micro STC8H8K64U-45I-QFN48](https://www.lcsc.com/product-detail/C5339175.html) — vendor product page or datasheet
227. [STMicroelectronics SPC582B60E1CD00X](https://www.lcsc.com/product-detail/C2970122.html) — vendor product page or datasheet
228. [STMicroelectronics STM32C011F6P6](https://www.st.com/en/microcontrollers-microprocessors/stm32c011f6.html) — vendor product page or datasheet
229. [STMicroelectronics STM32C5 series (orderable part number not verified)](https://www.st.com/en/microcontrollers-microprocessors/stm32c5-series.html) — vendor product page or datasheet
230. [STMicroelectronics STM32F030F4P6](https://www.lcsc.com/product-image/C32908.html) — vendor product page or datasheet
231. [STMicroelectronics STM32F103C8T6](https://www.lcsc.com/product-image/C8734.html) — vendor product page or datasheet
232. [STMicroelectronics STM32F407VGT6](https://www.st.com/en/microcontrollers-microprocessors/stm32f407vg.html) — vendor product page or datasheet
233. [STMicroelectronics STM32F722RET6](https://lcsc.com/product-detail/image/STM32F722RET6_C118207.html) — vendor product page or datasheet
234. [STMicroelectronics STM32G030C8T6](https://www.lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_STMicroelectronics-STM32G030C8T6_C529329.html) — vendor product page or datasheet
235. [STMicroelectronics STM32G431CBT6](https://www.lcsc.com/datasheet/lcsc_datasheet_2304140030_STMicroelectronics-STM32G431CBT6_C529355.pdf) — vendor product page or datasheet
236. [STMicroelectronics STM32H503CBT6](https://lcsc.com/product-detail/Microcontrollers-MCU-MPU-SOC_STMicroelectronics-STM32H503CBT6_C17700273.html) — vendor product page or datasheet
237. [STMicroelectronics STM32H743VIT6](https://www.lcsc.com/product-image/C114409.html) — vendor product page or datasheet
238. [STMicroelectronics STM32H7R7I8T6](https://www.st.com/en/microcontrollers-microprocessors/stm32h7r7-7s7/products.html) — vendor product page or datasheet
239. [STMicroelectronics STM32L051C8T6](https://www.lcsc.com/product-detail/C110878.html) — vendor product page or datasheet
240. [STMicroelectronics STM32L432KCU6](https://www.st.com/en/product/stm32l432kc) — vendor product page or datasheet
241. [STMicroelectronics STM32N647Z0H3Q](https://www.st.com/en/microcontrollers-microprocessors/stm32n6-series/products.html) — vendor product page or datasheet
242. [STMicroelectronics STM32U031C8T6](https://www.st.com/en/microcontrollers-microprocessors/stm32u031c8.html) — vendor product page or datasheet
243. [STMicroelectronics STM32U3B5CIT6](https://www.digikey.at/en/products/detail/stmicroelectronics/STM32U3B5CIT6/29199139) — vendor product page or datasheet
244. [STMicroelectronics STM32U575RIT6](https://estore.st.com/en/products/microcontrollers-microprocessors/stm32-32-bit-arm-cortex-mcus/stm32-ultra-low-power-mcus/stm32u5-series/stm32u575-585/stm32u575ri.html) — vendor product page or datasheet
245. [STMicroelectronics STM32V8 series (orderable part number not verified)](https://www.st.com/en/microcontrollers-microprocessors/stm32v8-series.html) — vendor product page or datasheet
246. [STMicroelectronics STM32WB09KEV6TR](https://www.lcsc.com/product-detail/C25350124.html) — vendor product page or datasheet
247. [STMicroelectronics STM32WB55RGV6](https://www.lcsc.com/product-image/C401505.html) — vendor product page or datasheet
248. [STMicroelectronics STM32WBA55CGU7](https://befr.rs-online.com/web/p/microcontrollers/0215157P) — vendor product page or datasheet
249. [STMicroelectronics STM32WBA65RIV6](https://www.lcsc.com/product-detail/C45338552.html) — vendor product page or datasheet
250. [STMicroelectronics STM32WL33CCV6](https://www.lcsc.com/product-detail/C22808559.html) — vendor product page or datasheet
251. [STMicroelectronics STM32WLE5CCU6](https://www.lcsc.com/product-image/C2888218.html) — vendor product page or datasheet
252. [STMicroelectronics STM8S003F3P6](https://www.lcsc.com/product-image/C18615.html) — vendor product page or datasheet
253. [STMicroelectronics STM8S103F3P3](https://www.lcsc.com/product-image/C2053135.html) — vendor product page or datasheet
254. [Telink TLSR8208BER](https://wiki.telink-semi.cn/wiki/chip-series/TLSR8208-Series/) — vendor product page or datasheet
255. [Telink TLSR8258F512ET32](https://lcsc.com/product-detail/RF-Transceiver-ICs_Telink-TLSR8258F512ET32_C2836053.html) — vendor product page or datasheet
256. [Telink TLSR9218AER](https://findchips.com/detail/tlsr9218aer/Telink-Semiconductor) — vendor product page or datasheet
257. [Telink TLSR9527CER](https://wiki.telink-semi.cn/wiki/chip-series/TLSR952x-Series/) — vendor product page or datasheet
258. [Texas Instruments AM13E23019](https://www.ti.com/product/AM13E23019) — vendor product page or datasheet
259. [Texas Instruments CC2340R5RGER](https://www.ti.com/product/CC2340R5) — vendor product page or datasheet
260. [Texas Instruments CC2652R7RGZR](https://www.ti.com/product/CC2652R7) — vendor product page or datasheet
261. [Texas Instruments CC2745R10-Q1](https://www.ti.com/product/CC2745R10-Q1) — vendor product page or datasheet
262. [Texas Instruments CC3501E](https://www.ti.com/product/CC3501E) — vendor product page or datasheet
263. [Texas Instruments F280039CSPN](https://www.ti.com/product/TMS320F280039C) — vendor product page or datasheet
264. [Texas Instruments F28P650DK6PZP](https://www.ti.com/product/TMS320F28P650DK) — vendor product page or datasheet
265. [Texas Instruments MSP430FR2355TPTR](https://www.lcsc.com/product-detail/C2053541.html) — vendor product page or datasheet
266. [Texas Instruments MSP430FR2433IRGE](https://www.ti.com/product/MSP430FR2433) — vendor product page or datasheet
267. [Texas Instruments MSP430FR5994IPNR](https://www.lcsc.com/product-detail/C2052740.html) — vendor product page or datasheet
268. [Texas Instruments MSP430FR6989IPZR](https://www.lcsc.com/product-detail/C882817.html) — vendor product page or datasheet
269. [Texas Instruments MSP430G2553IPW20R](https://www.ti.com/product/MSP430G2553) — vendor product page or datasheet
270. [Texas Instruments MSPM0C1104SDSGR](https://www.ti.com/product/MSPM0C1104) — vendor product page or datasheet
271. [Texas Instruments MSPM0G3507SPTR](https://www.ti.com/product/MSPM0G3507) — vendor product page or datasheet
272. [Texas Instruments MSPM0G5187](https://www.ti.com/product/MSPM0G5187) — vendor product page or datasheet
273. [Texas Instruments MSPM0H3216PTR](https://www.ti.com/product/MSPM0H3216) — vendor product page or datasheet
274. [Texas Instruments MSPM0L1306TRHBR](https://www.ti.com/product/MSPM0L1306) — vendor product page or datasheet
275. [Texas Instruments MSPM0L2228SPN](https://www.ti.com/product/MSPM0L2228) — vendor product page or datasheet
276. [Texas Instruments TM4C123GH6PM](https://www.ti.com/product/TM4C123GH6PM) — vendor product page or datasheet
277. [Texas Instruments TMS320F28P550SJ6PZR](https://www.ti.com/product/TMS320F28P550SJ) — vendor product page or datasheet
278. [Toshiba TMPM4K4FYBUG](https://toshiba.semicon-storage.com/eu/company/exhibition/campaign/txzplus-family-advanced-class-new-products.html) — vendor product page or datasheet
279. [WCH CH32F203RCT6](https://www.lcsc.com/datasheet/lcsc_datasheet_2403131353_WCH-Jiangsu-Qin-Heng-CH32F203RCT6_C5137038.pdf) — vendor product page or datasheet
280. [WCH CH32H417QEU6](https://ch32-riscv-ug.github.io/CH32H417/datasheet_en/CH32H417DS0.PDF) — vendor product page or datasheet
281. [WCH CH32L103C8T6](https://www.lcsc.com/product-detail/C22398291.html) — vendor product page or datasheet
282. [WCH CH32V003F4P6](https://www.lcsc.com/product-detail/C5187096.html) — vendor product page or datasheet
283. [WCH CH32V004 (orderable suffix not verified)](https://www.wch-ic.com/products/CH32V004.html) — vendor product page or datasheet
284. [WCH CH32V006F8U6](https://www.lcsc.com/product-detail/C42431288.html) — vendor product page or datasheet
285. [WCH CH32V203G6U6](https://www.lcsc.com/product-detail/C5142280.html) — vendor product page or datasheet
286. [WCH CH32V205CCT6](https://www.cnx-software.com/2026/04/14/192-mhz-wch-ch32v205-risc-v-mcu-offers-a-480-mbps-usb-2-0-interface/) — vendor product page or datasheet
287. [WCH CH32V208RBT6](https://www.lcsc.com/datasheet/lcsc_datasheet_2403131349_WCH-Jiangsu-Qin-Heng-CH32V208RBT6_C5448615.pdf) — vendor product page or datasheet
288. [WCH CH32V303RCT6](https://www.lcsc.com/product-image/C5456849.html) — vendor product page or datasheet
289. [WCH CH32V307VCT6](https://www.lcsc.com/product-detail/C2943979.html) — vendor product page or datasheet
290. [WCH CH32V407VET6](https://www.cnx-software.com/2026/08/13/wch-ch32v407-467-risc-v-mcu-integrates-fast-ethernet-mac-phy-480-mbps-usb-2-0-phy-up-to-8-mb-on-chip-psram/) — vendor product page or datasheet
291. [WCH CH32X035G8U6](https://www.lcsc.com/product-detail/C7437027.html) — vendor product page or datasheet
292. [WCH CH552G](https://www.lcsc.com/product-detail/WCH_WCH-Jiangsu-Qin-Heng-CH552G_C111292.html) — vendor product page or datasheet
293. [WCH CH554E](https://lcsc.com/product-detail/USB_CH554E_C111293.html) — vendor product page or datasheet
294. [WCH CH572D](https://www.lcsc.com/product-detail/C46597863.html) — vendor product page or datasheet
295. [WCH CH582F](https://www.lcsc.com/product-detail/C3001175.html) — vendor product page or datasheet
296. [WCH CH583M](https://github.com/openwch/ch583) — vendor product page or datasheet
297. [WCH CH585F](https://www.lcsc.com/product-detail/C42381475.html) — vendor product page or datasheet
298. [WCH CH592F](https://www.lcsc.com/product-detail/C39831287.html) — vendor product page or datasheet
299. [WinnerMicro W801](https://www.cnx-software.com/2021/11/30/hlk-w801-board-features-alibaba-xuantie-xt804-based-mcu-with-wifi-4-bluetooth-le-4-2/) — vendor product page or datasheet
300. [WinnerMicro W806](https://www.lcsc.com/product-detail/C2929889.html) — vendor product page or datasheet
301. [XHSC (HDSC) HC32F460JCTA](https://www.lcsc.com/product-image/C784662.html) — vendor product page or datasheet
302. [XHSC (HDSC) HC32L110C6UA-SFN20TR](https://www.lcsc.com/product-image/C493490.html) — vendor product page or datasheet
303. [Zilog Z8F042ASB020EG](https://www.lcsc.com/product-detail/C2640026.html) — vendor product page or datasheet
