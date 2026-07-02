# KB 05 — Package Library

**module id:** `packagelib` · **section:** `#packagelib` · **render:** `renderPackageLibrary()`

## หน้านี้ทำอะไร
ช่วย AE จัดแพ็กเกจให้ลูกค้าได้เร็วขึ้น แบ่งเป็น 3 ส่วน: **Budget Finder**, **Package Catalog**, และ **Idea Packages** สำหรับลูกค้าใหม่ (เพิ่ม/ลบได้)

## องค์ประกอบหลัก
### 1) Budget Finder
- input `#pkgBudget` + ปุ่ม `onclick="runPkgBudget()"` → ผลลัพธ์ใน `#pkgBudgetResult`
- `runPkgBudget()` แสดง 2 อย่าง:
  - **แพ็กเกจที่เข้างบ**: จาก `data.packages` ที่ `listPrice ≤ งบ × 1.1`
  - **ลูกค้างบใกล้เคียงส่วนใหญ่ซื้ออะไร**: จาก `data.opportunities` ที่ `stage = Closed Won` และ `amount ∈ [งบ×0.6, งบ×1.4]` จัดกลุ่มตาม `product` แล้วจัดอันดับตามจำนวนดีล + มูลค่ารวม (ตอบโจทย์ "งบเท่านี้ นิยมซื้อแบบไหน" จากข้อมูลจริง)

### 2) Package Catalog (`#pkgCatalog`)
- การ์ดจาก `data.packages` (11 รายการ) จัดกลุ่มตาม subset — แสดงราคา, สิ่งที่รวม, เหมาะกับใคร, tier

### 3) Idea Packages (`#ideaList`)
- ไอเดียแพ็กเกจสำหรับลูกค้าใหม่ จาก `data.ideaPackages` (3 รายการตั้งต้น)
- ฟอร์มเพิ่ม: `#ideaName`, `#ideaPrice`, `#ideaComponents`, `#ideaBestFor` + ปุ่ม `onclick="addIdeaPackage()"`
- `addIdeaPackage()` → push เข้า `data.ideaPackages` → `saveData()` → `renderPackageLibrary()`
- ลบ: ปุ่มบนการ์ด `onclick="deleteIdeaPackage('<id>')"`

## ฟังก์ชันที่เกี่ยวข้อง (expose ผ่าน window)
`runPkgBudget`, `addIdeaPackage`, `deleteIdeaPackage` + helper ภายใน `pkgCardHtml()`, `pkgSubsetClass()`

## ใช้ข้อมูลอะไร
`data.packages` (catalog), `data.ideaPackages` (ไอเดีย), `data.opportunities` (คำนวณความนิยมตามงบ = Closed Won)

## ผู้ใช้ใช้งานอย่างไร
พิมพ์งบ (เช่น 50,000 / 100,000 / 500,000) → เห็นแพ็กเกจที่เข้างบ + สิ่งที่ลูกค้างบใกล้กันนิยมซื้อ; เปิด Catalog ดูตัวเลือกมาตรฐาน; เพิ่มไอเดียใหม่สำหรับลูกค้าเฉพาะราย

## วิธีต่อยอด / แก้ไข
- ให้ Budget Finder จัด **ชุดแพ็กเกจผสม** ให้พอดีงบอัตโนมัติ → เพิ่ม logic รวมหลาย package ใน `runPkgBudget()`
- กดจากแพ็กเกจ → **สร้างดีลใหม่** ใน Opportunities → เพิ่มปุ่มที่สร้าง opportunity จาก package แล้ว `saveData()`
- เพิ่มฟิลด์ในฟอร์ม idea (source/owner) → แก้ฟอร์ม + `addIdeaPackage()`
- ดึงข้อมูล idea ให้ persist ถาวรหลัง Reset → เพิ่ม `ideaPackages: []` ใน `emptyData()` (ปัจจุบัน guard ด้วย `data.ideaPackages || []`)
