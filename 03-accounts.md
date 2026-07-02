# KB 03 — Accounts (+ Account Detail)

**module id:** `accounts` · **section:** `#accounts` · **render:** `renderAccounts()` + `renderAccountDetail()`

## หน้านี้ทำอะไร
ฐานลูกค้า/สปอนเซอร์แบบตาราง คลิกชื่อบริษัทเพื่อเข้า **หน้า Detail** ที่แสดง: ผู้ติดต่อประสานงานทั้งหมด, ประวัติการซื้อ, และบันทึก (log) ล่าสุดของ AE

## องค์ประกอบหลัก
- **ตารางบัญชี** — id, ชื่อ (คลิกได้), segment, owner ฯลฯ; ชื่อบริษัทและปุ่ม Detail ใช้ `onclick="openAccountDetail('<id>')"`
- **Account Detail panel** (`#accountDetailPanel`)
  - **Contacts** — จาก `data.accountContacts` (ชื่อ/ตำแหน่ง/เบอร์/อีเมล/Line/Primary) + ปุ่ม Add Contact
  - **Product & Service History** — ดึงจาก opportunities ที่ `stage = Closed Won` ของบัญชีนั้น (วันปิด/สินค้า/มูลค่า/สถานะบิล)
  - **Daily AE Notes** — จาก `data.accountNotes` เรียงล่าสุดก่อน + ปุ่ม Add Note

## จุดสำคัญเชิงเทคนิค (อย่าทำพัง)
markup ของ `#accountDetailPanel` **ฝังอยู่ใน `#opportunities`** (เหตุผลเชิงประวัติ) เมื่ออยู่หน้า Accounts ตัว `#opportunities` ถูกซ่อน panel จึงถูกซ่อนตาม → `openAccountDetail(id)` จึง **ย้าย panel เข้า `#accounts` ก่อนแสดง** แล้ว `scrollIntoView`
```js
if (panel && accountsSection && panel.parentElement !== accountsSection) accountsSection.appendChild(panel);
```
ห้ามลบ/ย้าย logic นี้ ไม่งั้นคลิกชื่อบริษัทจะ "ไม่พาไปหน้า detail"

## ใช้ข้อมูลอะไร
`data.accounts`, `data.accountContacts`, `data.accountNotes`, และ `data.opportunities` (สำหรับประวัติซื้อ = Closed Won ของบัญชีนั้น)

## ผู้ใช้ใช้งานอย่างไร
คลิกชื่อบริษัท → เลื่อนไปหน้า Detail → ดูผู้ติดต่อ/ประวัติซื้อ/โน้ต; เพิ่มผู้ติดต่อและโน้ตจริงผ่านปุ่ม Add

## วิธีต่อยอด / แก้ไข
- เพิ่มฟิลด์ผู้ติดต่อ → แก้ schema `accountContacts` + template ใน `renderAccountDetail()` + ฟอร์ม Add Contact
- ให้ประวัติซื้อรวมดีลที่ไม่ใช่ Closed Won → แก้เงื่อนไขการดึงประวัติใน `renderAccountDetail()`
- Seed ตัวอย่างผู้ติดต่อ/โน้ต: มีฟังก์ชัน `seedSampleAccountCRM()` (เติมเฉพาะตอนว่าง) — ปัจจุบัน **ปิดการเรียกใช้** เพื่อให้ระบบเริ่มสะอาด
