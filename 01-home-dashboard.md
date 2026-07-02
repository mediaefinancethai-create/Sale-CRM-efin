# KB 01 — Home (Dashboard)

**module id:** `dashboard` · **section:** `#dashboard` · **render:** `renderDashboard()`

## หน้านี้ทำอะไร
หน้าสรุปสำหรับผู้บริหาร/ผู้จัดการ: ภาพรวมรายได้และ pipeline, งานที่ต้องติดตามวันนี้, ทีม, และสัดส่วนรายได้ (Revenue Split)

## องค์ประกอบหลัก
- **KPI cards** — เช่น มูลค่า pipeline, ยอด Closed Won, Win Rate, จำนวนดีล (แสดงใน `#kpiGrid`)
- **Urgent / งานที่ต้องตามวันนี้** — `renderUrgentRows()`
- **Team overview** — `renderTeamRows()`
- **Revenue Source Split** (`#sourceBars`) — สัดส่วน Event/Media
- **Revenue Subset Split** (`#subsetBars`) — เป้าหมายต่อ subset
- **Revenue comparison chart** — `renderRevenueComparisonChart()`

## ใช้ข้อมูลอะไร
- `data.opportunities` (กรองตาม Role View + ตัวกรอง global) เป็นฐานคำนวณ KPI/pipeline
- ค่าคงที่ `REVENUE_PLAN` สำหรับสองชาร์ต Split

## Revenue Split (สำคัญ — เพิ่งปรับ)
สองชาร์ตนี้ **แสดงค่าตาม `REVENUE_PLAN` (ค่าอ้างอิง/เป้าหมาย)** ไม่ได้คำนวณจากยอดจริง:
- **Source Split** = Event 60% / Media 40% (อ้างอิงสัดส่วนปีก่อน) — render โดย `renderSourcePlan()`, pill = "เป้าหมาย (อ้างอิงปีก่อน)"
- **Subset Split** = better trade 10,000,000 · media 5,000,000 · crypto 3,000,000 · esg 1,500,000 (เป้าปีนี้) — render โดย `renderSubsetPlan()`, pill = "เป้าหมายปีนี้"

> เหตุผล: ทีมต้องการให้ชาร์ตสะท้อนสัดส่วน/เป้าที่วางไว้ นอกจากนี้ยังแก้การจัดหมวด `source` ให้ถูกด้วย (Better Trade & ESG = Event, efinancethai & crypto = Media) ทำให้ยอดจริงออกมา ~Event 62% / Media 38% ใกล้ 60/40

## ผู้ใช้ใช้งานอย่างไร
เปิดมาดูภาพรวมทันที; ผู้จัดการ/ผู้บริหาร (Role View = yok/tak) เห็นทุกดีล; AE เห็นเฉพาะของตัวเอง (ตัวเลข KPI จะปรับตาม Role View)

## วิธีต่อยอด / แก้ไข
- อยากให้ Split แสดง **ยอดจริง** แทนเป้า → เปลี่ยน `renderSourcePlan()/renderSubsetPlan()` กลับไปใช้ `groupSum(list,"source"/"subset")` + `renderBars(...)`
- อยากได้ **actual vs target** คู่กัน → เพิ่ม bar ที่สองต่อรายการ (จริง/เป้า)
- แก้เป้า → แก้ค่าใน `REVENUE_PLAN`
