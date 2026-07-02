# KB 02 — Opportunities

**module id:** `opportunities` · **section:** `#opportunities` · **render:** `renderOpportunities()`

## หน้านี้ทำอะไร
จัดการดีลทั้งหมด: ดู pipeline แบบ **Kanban** (ลากย้าย stage ได้) + **ตาราง**, กรองด้วยตัวกรอง global, และมี **แถบชิป stage** สำหรับดูว่าแต่ละ stage มีอะไรบ้าง

## องค์ประกอบหลัก
- **Stage filter chips** (`#stageChips`) — ปุ่มชิปต่อ stage พร้อมจำนวนดีล คลิกเพื่อกรอง (ซิงค์กับดรอปดาวน์ `#stageFilter`)
  - render: `renderStageChips()`; นับจาก `oppsForStageChips()` (กรองทุกอย่างยกเว้น stage)
  - แสดงเฉพาะ stage ที่มีดีล + ชิป "ทั้งหมด"; ชิปที่เลือกไฮไลต์สีเขียว
- **Kanban** (`#kanban`) — เลน: Qualified → Proposal → Negotiation → Verbal Win → Closed Won
  - การ์ดลากได้ (`draggable`), เลนรับ drop; ปล่อยแล้วเรียก `moveOppStage(id, stage)` → อัปเดต stage (ถ้า Closed Won ตั้ง prob=100/forecast="Closed Won") → `saveData()` + `renderAll()`
  - render: `renderKanban(list)`
- **ตารางดีล** — รายละเอียดครบ (owner, product, amount, stage, next action ฯลฯ)

## ใช้ข้อมูลอะไร
- `data.opportunities` ผ่าน `filteredOpportunities()` ซึ่งบังคับ RBAC ด้วย `roleSees(...)` + ตัวกรอง global (`roleFilter, monthFilter, weekFilter, ownerFilter, sourceFilter, subsetFilter, stageFilter, searchFilter`)

## ผู้ใช้ใช้งานอย่างไร
- ดูงานตาม stage: คลิกชิป stage → เห็นเฉพาะ stage นั้นทั้ง Kanban และตาราง
- ขยับดีล: ลากการ์ดข้ามเลนเพื่อเปลี่ยน stage
- โฟกัสของตัวเอง: เลือก Role View เป็นชื่อตัวเอง (AE เห็นเฉพาะดีลของตน)

## วิธีต่อยอด / แก้ไข
- แสดง stage ที่ยังว่างเป็นชิปจาง ๆ → แก้ `renderStageChips()` ให้ render stage ที่ count=0 ด้วย (ใส่คลาส disabled)
- ให้ชิปโชว์ "มูลค่ารวม" แทนจำนวน → เปลี่ยนตัวนับใน `renderStageChips()` เป็นผลรวม `amount`
- เพิ่มเลน Kanban → แก้ลิสต์เลนใน `renderKanban()` (อ้างอิง `stages`)
- เพิ่มฟิลด์ในการ์ด/ตาราง → แก้ template ใน `renderOpportunities()`/`renderKanban()`
