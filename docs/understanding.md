# docs/understanding.md — สรุปความเข้าใจก่อนเริ่ม Phase 1

> ผลจาก Phase 0: อ่านเอกสารทั้งหมด (`README.md`, `ARCHITECTURE.md`, `DATA-MODEL.md`, `AGENTS.md`, `CLAUDE.md`, KB 00–06) และตรวจ prototype `efin-crm.html` (11,917 บรรทัด) รวมถึง **ตรวจยอดการเงินในชุดข้อมูลจริงด้วยสคริปต์แล้ว** — เอกสารนี้รอผู้ใช้ confirm ก่อนเริ่มเขียนโค้ด

## 1. ภาพรวมระบบที่จะสร้าง

แปลง prototype single-file (`efin-crm.html`, localStorage, Role View จำลอง) เป็นเว็บแอป production หลายผู้ใช้:

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS** (ธีม efin green ตาม prototype)
- **Supabase**: PostgreSQL + Auth (email/password, เปิด email confirmation, ปิด public signup) + RLS
- **RBAC 2 บทบาท**: `admin` / `staff` — staff อ่านได้ทั้งหมด แต่แก้/ลบได้เฉพาะที่ตนสร้าง (`created_by`)
- ภาษา UI = ไทย · โค้ด/identifier/commit = อังกฤษ

## 2. โมดูล/หน้า (6 หน้า + login)

| Route | อ้างอิง prototype | สาระสำคัญ |
|---|---|---|
| `/login` | — (ใหม่) | email+password, ไม่มีหน้า register สาธารณะ |
| `/dashboard` | `renderDashboard()` KB 01 | KPI cards, งานเร่งด่วน (`renderUrgentRows`), team overview, **Revenue Source Split = เป้า Event 60/Media 40**, **Subset Split = เป้า BT 10M / media 5M / crypto 3M / esg 1.5M** (ตาม `REVENUE_PLAN` — เป็นค่าเป้าหมาย ไม่ใช่ยอดจริง) |
| `/opportunities` | `renderOpportunities()` KB 02 | **Stage chips** (นับจำนวน, เฉพาะ stage ที่มีดีล + ชิป "ทั้งหมด", ไฮไลต์เขียว), **Kanban 5 เลน** (Qualified → Proposal → Negotiation → Verbal Win → Closed Won) ลากแล้วบันทึก stage ลง DB (Closed Won → prob=100, forecast="Closed Won"), ตารางดีลครบฟิลด์, ตัวกรอง global |
| `/accounts` | `renderAccounts()` KB 03 | ตารางบัญชี คลิกชื่อ → detail |
| `/accounts/[id]` | `renderAccountDetail()` KB 03 | Contacts (เพิ่ม/แก้/ลบ), Product & Service History (จาก opportunities **Closed Won** ของบัญชี), Daily AE Notes (ล่าสุดก่อน) — ใน Next.js เป็น route แยก ไม่ต้องเลียนแบบ trick ย้าย `#accountDetailPanel` |
| `/leads` | `renderLeads()` KB 04 | ตาราง lead + **leadScore (เต็ม 100)** + KPI (Qualified/Watchlist/Avg Score/Sale Action) + ปุ่ม Convert → opportunity |
| `/packages` | `renderPackageLibrary()` KB 05 | **Budget Finder**: แพ็กเกจที่ `listPrice ≤ งบ×1.1` + "ลูกค้างบใกล้เคียงซื้ออะไร" จาก Closed Won ที่ `amount ∈ [งบ×0.6, งบ×1.4]` จัดกลุ่มตาม product เรียงตามจำนวนดีล+มูลค่า · **Catalog** (จัดกลุ่มตาม subset) · **Idea Packages** (เพิ่ม/ลบ) |
| `/admin/users` | — (ใหม่) | admin เท่านั้น: เชิญผู้ใช้ (`inviteUserByEmail` ผ่าน service role ฝั่ง server), ดูรายชื่อ, ตั้ง role |

**Legacy modules** (`tasks`, `quso`, `support`, `delivery`, `marketing`, `forecast`, `revenue`, `commission`) — มีในโค้ด prototype แต่ไม่อยู่ในเมนู → **ไม่ทำ** ในเวอร์ชันนี้

## 3. Data model & ค่าคงที่ (ตรวจกับ prototype แล้ว)

### Enums
```
role_enum:   admin | staff
source_enum: Event | Media
subset_enum: better trade | efinancethai | crypto | esg
stage_enum:  Prospecting | Qualified | Needs Analysis | Proposal |
             Negotiation | Verbal Win | Closed Won | Closed Lost
```
✅ ตรวจแล้ว: opportunities จริงทั้ง 83 รายการใช้เฉพาะ 4 subset นี้ (BT 38 / efinancethai 29 / esg 15 / crypto 1)

### ตาราง (ตาม §5.2 ของแผน + DATA-MODEL.md)
`profiles`, `accounts`, `opportunities`, `account_contacts`, `account_notes`, `packages`, `idea_packages`, `leads` — ฟิลด์ตามแผน โดย opportunities มีฟิลด์ครบ: dealNo, product, source, subset, stage, amount, probability, forecast, month/week, closeDate, nextAction(Date), qtNo/soNo, supportOwner/campaignOwner, invoice*/payment*, accounting*, notes

### Mapping สำคัญ
`better trade` + `esg` → source **Event** · `efinancethai` + `crypto` → source **Media**

### REVENUE_PLAN (hardcode เป็น constant ฝั่งแอป)
source: Event 60% / Media 40% · subset target: BT 10,000,000 / media 5,000,000 / crypto 3,000,000 / esg 1,500,000

## 4. ตัวเลขการเงิน (ตรวจด้วยสคริปต์จากชุดข้อมูลจริงแล้ว ✅)

| subset | Closed Won (บาท) | source |
|---|---|---|
| better trade | 1,030,000.00 | Event |
| efinancethai | 863,500.00 | Media |
| crypto | 300,000.00 | Media |
| esg | 856,728.97 | Event |
| **รวม** | **3,050,228.97** | |

- ตรงกับ DATA-MODEL.md ทุกหมวด (เศษ .97 จาก SME D Bank 46,728.97 ใน ESG)
- ⚠️ ส่วนต่าง 300,000 (เป้า 3,350,228.97) **ยังไม่ยืนยัน — จะไม่เติมเอง**
- ชุดข้อมูลจริง: 83 accounts / 83 opportunities / 11 packages / 3 idea packages

## 5. RBAC ระบบใหม่ (ตามที่ confirm แล้วในแผน §8)

- ไม่มี self-signup — admin เชิญเท่านั้น (email confirmation เปิด)
- **admin**: อ่าน/สร้าง/แก้/ลบทุก record + จัดการผู้ใช้/role
- **staff**: **อ่านทั้งหมด (read all)**, สร้างได้, แก้/ลบเฉพาะ `created_by = ตนเอง` — บังคับที่ RLS เป็นหลัก UI ซ่อนปุ่มเป็นชั้นเสริม
- `profiles`: ทุกคนอ่านได้, เปลี่ยน role ได้เฉพาะ admin (กัน self-promote ด้วย policy/trigger)
- trigger `on_auth_user_created` → insert profile role เริ่มต้น `staff`

> หมายเหตุ: RBAC แบบ roster ของ prototype (SEE_ALL_ROLES, lucky dual-role, freelance ห้าม export) **ถูกแทนที่** ด้วยโมเดล admin/staff ตามที่แผนยืนยันแล้ว — ชื่อ AE เดิม (yok, nueng, fung, chom, lucky, joy, rung + earn/fon/tak) จะกลายเป็นข้อมูล `owner` ในระดับ record ไม่ใช่สิทธิ์ล็อกอิน

## 6. ธีม / UI

- สีจาก prototype: `--blue #75BC1E` (brand), `--navy #1E3A07`, `--soft-blue #EAF3DE`, `--bg #f4f7fb`, `--surface #fff`, `--line #d8e0ea`, `--ink #142033`, `--muted #64748b` → แปลงเป็น Tailwind theme tokens
- Layout: sidebar 5 เมนู + topbar ตัวกรอง (month, week, owner, source, subset, stage, search — ตัด roleFilter ออกเพราะมี auth จริงแล้ว)
- คง card/table/pill/kanban ให้ใกล้ prototype, เน้น desktop

## 7. ประเด็นที่พบระหว่าง Phase 0 (ต้องการคำตอบ/ยืนยัน)

1. **เครื่องนี้ยังไม่มี Node.js/Python** — ต้องติดตั้ง Node.js LTS ก่อน (มี winget ให้ใช้: `winget install OpenJS.NodeJS.LTS`) → ขออนุญาตติดตั้ง
2. **Lead scoring ต้องมีฟิลด์มากกว่าแผน §5.2** — สูตร `leadScore()` จริงใช้: `listedActive`, `ipoBondPipeline`, `profitable` (0/1 อย่างละ 20 คะแนน), `clientStatus` (5–20), `relationshipLevel` (0–20) + ฟิลด์ `researchSource/trigger`, `saleAction`, `market`, `fit` → เสนอเพิ่มคอลัมน์เหล่านี้ในตาราง `leads` เพื่อให้คะแนน/Sale Action ทำงานเหมือน prototype
3. **subset ของ packages ใช้ค่า `media`** (ไม่ใช่ `efinancethai`) — 11 แพ็กเกจจริงแบ่งเป็น better trade 4 / media 4 / esg 2 / crypto 1 และ `REVENUE_PLAN.subset` ก็ใช้ key `media` → เสนอเพิ่มค่า `media` ใน `subset_enum` (หรือใช้ text สำหรับ packages) — ขอเลือกแนวทาง
4. **Seed ข้อมูลจริง 2026 ลง Supabase ไหม?** (83 accounts / 83 opps / 11 packages / 3 ideas) — แนะนำ seed เพื่อให้เปิดมาใช้งานได้ทันทีเหมือน prototype; มี 14 opportunities ที่ `owner` ว่าง จะคง null ไว้ตามข้อมูลจริง
5. **leads ในชุดข้อมูลจริง = 0 รายการ** (lead ตัวอย่างอยู่ใน dataset สำรอง `realLeadDashboardData()` เท่านั้น) → เสนอเริ่มหน้า Lead Quality ด้วยตารางว่าง (ไม่ seed lead)
6. **Project ref ของ Supabase** — ต้องได้จากผู้ใช้ตอนจะ `supabase link` + ค่า `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` / `SERVICE_ROLE_KEY` ใส่ `.env.local` เอง

## 8. ลำดับงานที่จะทำ (Phase 1 เป็นต้นไป — หลัง confirm)

1. Scaffold Next.js 14 + TS + Tailwind (ธีม efin) + โครงโฟลเดอร์ตามแผน §4
2. Supabase migrations: enums + ตาราง + `is_admin()` + RLS ทุกตาราง + trigger profile
3. Auth: login page, middleware guard, `@supabase/ssr`
4. หน้าใช้งานทั้ง 6 + admin/users (server actions)
5. Seed (ถ้า confirm) + ตรวจยอด Closed Won ด้วยสคริปต์
6. `.env.example`, `.gitignore`, README, ทดสอบ RLS (staff ลบของคนอื่นไม่ได้) แล้ว push ขึ้น GitHub
