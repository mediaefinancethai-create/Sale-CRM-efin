# DATA-MODEL.md — efin CRM

โปรเจกต์นี้ไม่มี database server — "ฐานข้อมูล" คือ JavaScript object ชื่อ `data` ที่ persist ลง `localStorage` เอกสารนี้อธิบายโครงสร้าง collection, ฟิลด์สำคัญ, และค่าคงที่ที่ใช้ทั่วระบบ

## Storage

- **Key:** `localStorage["efin-crm-efin-real2026-v5"]` (ค่าคงที่ `APP_KEY`)
- **รูปแบบ:** JSON ของ object `data` ทั้งก้อน
- **โหมด:** `data.__mode === "real"` (ข้อมูลจริง) — normalizeData จะทำ `{ ...emptyData(), ...input }` เพื่อคง field ที่ไม่รู้จักไว้
- **ค่าเริ่มต้น (ไม่มีข้อมูลบันทึก):** `efinReal2026Data()` = `Object.assign(emptyData(), <ข้อมูลจริงฝังในไฟล์>)`
- **Reset:** `emptyData()` (ทุก collection เป็น array ว่าง)

## Collections หลัก

### accounts — ลูกค้า/สปอนเซอร์
| field | ชนิด | คำอธิบาย |
|-------|------|----------|
| `id` | string | เช่น `A-001` (PK) |
| `name` | string | ชื่อบริษัท |
| `symbol` | string | ชื่อย่อหุ้น (ถ้ามี) เช่น `PTT` |
| `segment` | string | กลุ่มธุรกิจ (ธนาคาร, ประกัน, หลักทรัพย์, Digital Asset ฯลฯ) |
| `tier` | string | ระดับลูกค้า (ว่างได้) |
| `status` | string | เช่น `Active` |
| `owner` | string | รหัส AE เจ้าของ (ดู owners) |
| `notes` | string | หมายเหตุ |

### opportunities — ดีล (หัวใจของระบบ)
| field | ชนิด | คำอธิบาย |
|-------|------|----------|
| `id` | string | `O-001` (PK) |
| `dealNo` | number | ลำดับ |
| `account` | string | ชื่อบริษัท (แสดงผล) |
| `accountId` | string | FK → accounts.id |
| `owner` | string | รหัส AE เจ้าของดีล |
| `segment` | string | กลุ่มธุรกิจ |
| `product` | string | ผลิตภัณฑ์ เช่น `BT-Media`, `Media Package`, `IPO Package`, `Banner Footer`, `ESG` |
| `source` | enum | **`Event`** หรือ **`Media`** (ใช้ทำ Revenue Source Split) |
| `subset` | enum | **`better trade`** / **`efinancethai`** / **`crypto`** / **`esg`** |
| `stage` | enum | ดู stages ด้านล่าง |
| `amount` | number | มูลค่าดีล (บาท) |
| `probability` | number | % โอกาสปิด |
| `forecast` | string | `Closed Won` / `Commit` / `Best Case` / `Pipeline` / `Closed Lost` |
| `month` / `week` | string | เช่น `Mar-2026` |
| `closeDate` | string | `YYYY-MM-DD` (วันปิด/คาดว่าปิด) |
| `nextActionDate` / `nextAction` | string | งาน/หมายเหตุถัดไป (เก็บสถานะการวางบิลด้วย) |
| `qtNo` / `soNo` | string | เลขใบเสนอราคา / เลข Sales Order |
| `supportOwner` | string | รหัส Sales Support ที่ดูแล (ถ้ามี) |
| `campaignOwner` | string | รหัสฝ่ายการตลาด (ถ้ามี) |
| `invoiceStatus` / `invoiceNo` / `invoiceDate` | string | ข้อมูลการวางบิล |
| `paymentStatus` / `paidDate` | string | ข้อมูลการชำระเงิน |
| `accountingOwner` / `accountingNote` | string | ฝ่ายบัญชี |
| `notes` | string | หมายเหตุ |

**mapping สำคัญ (source ↔ subset):** `better trade` และ `esg` → `source = "Event"`; `efinancethai` และ `crypto` → `source = "Media"` (Better Trade คืองาน expo จึงนับเป็น Event)

### accountContacts — ผู้ติดต่อประสานงาน (แสดงในหน้า Account Detail)
`{ id, accountId, name, role, phone, email, line, isPrimary("Yes"/"No"), note }`

### accountNotes — บันทึก/log ของ AE (แสดงในหน้า Account Detail, เรียงล่าสุดก่อน)
`{ id, accountId, date, owner, type("Call"/"Meeting"/"Line"/"Email"), note, nextFollowUp }`

### packages — แพ็กเกจ catalog (Package Library)
`{ id, name, source, subset, listPrice, components, bestFor, tier, owner, status }`

### ideaPackages — ไอเดียแพ็กเกจสำหรับลูกค้าใหม่ (เพิ่ม/ลบได้จาก UI)
`{ id, name, price, components, bestFor, owner }`

### leads — lead สำหรับให้คะแนนคุณภาพ (Lead Quality)
โครงสร้างขึ้นกับ render ของ Lead Quality (company, market/segment, สถานะลูกค้า, ระดับความสัมพันธ์ ฯลฯ)

### Legacy collections (ยังมีในโค้ด แต่ไม่อยู่ในเมนู)
`quso`, `tasks`, `activities`, `campaigns`, `delivery`, `support`, `mediaRevenueHistory`, `historical`
— ฟังก์ชัน render ของกลุ่มนี้ยังถูกเรียกใน `renderAll()` แต่ section ถูกซ่อน (ไม่อยู่ใน `modules[]`)

## ค่าคงที่ (Constants)

```js
stages = ["Prospecting","Qualified","Needs Analysis","Proposal",
          "Negotiation","Verbal Win","Closed Won","Closed Lost"]
// Kanban ใช้เลน: Qualified → Proposal → Negotiation → Verbal Win → Closed Won

owners         = ["yok","nueng","fung","chom","lucky","joy","rung"]   // AE
supportOwners  = ["earn","fon"]                                        // Sales Support
campaignOwners = ["tak"]                                               // Marketing

REVENUE_PLAN = {
  source: { Event: 60, Media: 40 },                       // % อ้างอิงปีก่อน
  subset: { "better trade":10000000, media:5000000,       // เป้าหมายปีนี้ (บาท)
            crypto:3000000, esg:1500000 }
}
```

## ชุดข้อมูลจริงปี 2026 (ฝังในฟังก์ชัน `efinReal2026Data()`)

- **83 accounts, 83 opportunities, 11 packages, 3 idea packages**
- **Closed Won รวม = 3,050,228.97 บาท** แยกตามหมวด (ตรงกับยอด Order/Turn Over ในเอกสารต้นทางทุกหมวด):

| subset | Closed Won (บาท) | source |
|--------|------------------|--------|
| better trade | 1,030,000.00 | Event |
| efinancethai | 863,500.00 | Media |
| crypto | 300,000.00 | Media |
| esg | 856,728.97 | Event |
| **รวม** | **3,050,228.97** | |

> ⚠️ **หมายเหตุการเงินที่ยังค้าง:** เป้าที่ผู้ใช้แจ้งไว้คือ **3,350,228.97** ซึ่งมากกว่ายอดรวมจาก 4 ไฟล์ (BT/Media/Crypto/ESG) อยู่ **300,000 พอดี** ส่วนต่างนี้ยังไม่ยืนยันที่มา — **ห้ามแต่งตัวเลข 300,000 ขึ้นเอง** ต้องรอเอกสาร/การยืนยันเพิ่มเติมก่อนเติม

## กติกาเรื่องข้อมูลการเงิน (สำคัญมาก)

1. ยอด Closed Won ต่อ subset ต้อง reconcile กับช่อง "Order/Turn Over" ในไฟล์ต้นทางเสมอ
2. ดีลที่ยังไม่มี SO / ยังไม่อนุมัติ = **ไม่ใช่** Closed Won (จัดเป็น Proposal/Negotiation)
3. เศษ .97 มาจาก SME D Bank (46,728.97) ในหมวด ESG — เป็นตัวช่วยตรวจว่ายอด ESG ถูกต้อง
4. เวลาแก้ dataset ให้ตรวจยอดรวมต่อหมวดด้วยสคริปต์ทุกครั้งก่อน commit
