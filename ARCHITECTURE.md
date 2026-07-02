# ARCHITECTURE.md — efin CRM

เอกสารนี้อธิบาย "แบบจำลองความคิด" (mental model) ของ codebase เพื่อให้คน (และ AI agent) เข้าใจหลักการออกแบบก่อนจะแก้ไข

## System Overview

efin CRM เป็น **client-side single-page app ในไฟล์ HTML ไฟล์เดียว** ไม่มี server/API/database เป็นของตัวเอง ทุกอย่างรันในเบราว์เซอร์ ข้อมูลอยู่ในตัวแปร JavaScript object ชื่อ `data` และ persist ลง `localStorage`

```
[Browser]
   │  เปิด efin-crm.html
   ▼
[init()] ──► [loadData()] ──► localStorage["efin-crm-efin-real2026-v5"]
   │                              │ (ถ้าไม่มี) fallback
   │                              ▼
   │                         [efinReal2026Data()]  = ข้อมูลจริงปี 2026
   ▼
[normalizeData()] ──► ตัวแปร global `data`
   │
   ▼
[renderAll()] ──► renderNav + render<Module>() ทุกตัว ──► DOM
   ▲                                                        │
   └──────────── saveData() ◄── ผู้ใช้แก้ข้อมูล/ลาก stage ◄─┘
```

หัวใจคือ pattern เดียว: **mutate `data` → `saveData()` → `renderAll()`** ทุกการเปลี่ยนแปลงข้อมูลต้องจบด้วย 2 ขั้นนี้เสมอ

## Key Design Decisions

### 1. ทำไมเป็นไฟล์ HTML เดียว (single-file)
เพื่อให้เป็น pilot ที่ส่งมอบ/เปิดใช้ได้ทันทีโดยไม่ต้องมี infra, build, หรือ deploy ทีมขายเปิดไฟล์เดียวก็ใช้ได้ แลกกับข้อเสียคือไฟล์ใหญ่ (~11k บรรทัด) — เวลาแก้ต้องใช้การค้นหา (grep) หา anchor แล้วแก้แบบ surgical

### 2. ทำไมเก็บข้อมูลใน localStorage ไม่ใช้ database
เป็น prototype ระยะแรก ยังไม่เชื่อมต่อระบบใด ๆ (standalone) `localStorage` พอสำหรับ pilot รายเครื่อง ข้อจำกัดคือข้อมูลผูกกับเบราว์เซอร์/เครื่องนั้น ไม่ sync ข้ามเครื่อง และมีเรื่อง PDPA ที่ต้องระวัง (ดู DATA-MODEL.md และ AGENTS.md)

### 3. ทำไมไม่มีระบบ login จริง แต่ใช้ "Role View"
ในขั้น pilot จำลองสิทธิ์ด้วยดรอปดาวน์ `roleFilter` (Role View) แทนการ authenticate จริง เพื่อทดสอบ logic RBAC (ใครเห็นดีลของใคร) ได้ก่อน โดยยังไม่ต้องมี backend auth

### 4. ทำไมโหลดข้อมูลจริงเป็นค่า default
เพื่อให้เปิดมาเห็นภาพจริงทันทีสำหรับ demo/ใช้งาน ค่า default มาจาก `efinReal2026Data()` (Object.assign(emptyData(), <ข้อมูลจริง>)) ส่วนปุ่ม Reset จะกลับเป็น `emptyData()` (ว่าง)

## In-file Structure (โครงภายในไฟล์เดียว)

```
efin-crm.html
  <style> ...................... ธีม efin green (CSS variables) + ทุกสไตล์
  <body>
    aside.sidebar .............. เมนู (renderNav สร้างจาก modules[])
    header.topbar .............. ตัวกรอง global + ปุ่ม import/export/reset
    main
      section#dashboard ........ Home
      section#opportunities .... Kanban + ตาราง + stage chips
      section#accountDetailPanel  (⚠️ markup ฝังอยู่ใน #opportunities — ถูกย้ายเข้า #accounts ด้วย JS ตอนเปิด)
      section#accounts ......... ฐานลูกค้า
      section#packagelib ....... Package Library
      section#leads ............ Lead Quality
      section#tasks/#quso/#support/#delivery/#marketing/#forecast/#revenue/#commission
                                  (legacy — ยังมี markup + render แต่ "ไม่อยู่ในเมนู")
  <script>
    ค่าคงที่:   modules, stages, owners, supportOwners, campaignOwners,
               SEE_ALL_ROLES, FREELANCE_ROLES, subsets, REVENUE_PLAN
    data layer: seed, emptyData, efinReal2026Data, normalizeData
    persist:    loadData, saveData
    helpers:    escapeHtml, baht, pct, deepClone, byId, opp,
               roleScope, roleSees, applyRolePolicy, groupSum, renderBars
    render:     renderAll → renderNav, renderDashboard, renderOpportunities,
               renderAccounts, renderAccountDetail, renderLeads,
               renderPackageLibrary, (+ legacy renders), renderModuleFiles
    features:   moveOppStage (kanban DnD), renderStageChips/oppsForStageChips,
               renderSourcePlan/renderSubsetPlan,
               runPkgBudget/addIdeaPackage/deleteIdeaPackage,
               openAccountDetail, editRecord/deleteRecord, convertLead
    boot:       bindGlobalEvents, init()
```

## Data Flow (เส้นทางข้อมูล)

1. **Boot** → `init()` เรียก `renderNav()`, `renderFilters()`, `bindGlobalEvents()`, `renderAll()`
2. **Load** → `loadData()` อ่าน `localStorage[APP_KEY]`; ถ้าไม่มี/ผิดพลาด → `efinReal2026Data()`; แล้วส่งผ่าน `normalizeData()`
3. **Normalize** → โหมด real: `next = { ...emptyData(), ...input }` (คีย์ที่ไม่รู้จักจะถูกเก็บไว้), เติม default ให้ field ที่ขาด, `data.__mode === "real"`
4. **Render** → `renderAll()` toggle `.section.active` ตาม `activeModule` แล้วเรียก render ของทุกโมดูล (โมดูลที่ไม่อยู่ในเมนูจะ render ลง section ที่ถูกซ่อน)
5. **Filter** → ตัวกรอง global (`#roleFilter`, `#monthFilter`, `#weekFilter`, `#ownerFilter`, `#sourceFilter`, `#subsetFilter`, `#stageFilter`, `#searchFilter`) เปลี่ยน → `renderAll()`
6. **Mutate** → แก้ข้อมูล (เพิ่ม/แก้/ลบ record, ลากการ์ด Kanban) → แก้ `data` → `saveData()` → `renderAll()`

## Boundaries & Rules (กฎที่ห้ามละเมิด)

- **แก้ที่ `data` เท่านั้นแล้วต้อง `saveData()` + `renderAll()`** — อย่าแก้ DOM ตรง ๆ โดยไม่ผ่าน render pipeline
- **ทุกการกรอง opportunity ต้องผ่าน RBAC** ผ่าน `roleSees(role, owner, supportOwner, campaignOwner)` — อย่า bypass
- **ค่าคงที่ (stages, owners, subsets) เป็น single source of truth** — ถ้าเพิ่ม stage/owner ให้แก้ที่ array เดียว แล้วส่วนอื่นจะตามเอง
- **อย่าแต่งตัวเลขการเงิน** — ยอด Closed Won ต่อหมวดต้องตรงกับเอกสารต้นทาง (ดู DATA-MODEL.md)
- **`localStorage`/`sessionStorage` ใช้ได้ในไฟล์นี้** (เพราะรันนอก sandbox ของ Claude artifacts) — แต่ถ้าย้ายไปเป็น artifact ในแชท จะใช้ไม่ได้
- **การเพิ่มโมดูลใหม่**: เพิ่ม entry ใน `modules[]` + เพิ่ม `<section id="...">` + เขียน `renderXxx()` + เรียกใน `renderAll()` (ดู AGENTS.md → Common Tasks)

## External Dependencies

ไม่มี runtime dependency ภายนอกเลย (ไม่โหลด CDN, ไม่มี npm package ใน production) เครื่องมือที่ใช้ "ตอนพัฒนา/ตรวจสอบ" เท่านั้น:

| เครื่องมือ | ใช้ทำอะไร |
|-----------|-----------|
| Node.js (`node --check`) | ตรวจ syntax ของ JS ที่แยกออกมาจาก `<script>` ก่อน commit |
| Python + pandoc | ใช้ตอน generate เอกสาร (ไม่เกี่ยวกับ runtime ของแอป) |

## What NOT to Change Without Discussion

- **`APP_KEY`** — เปลี่ยนแล้วผู้ใช้ทุกคนจะถูกล้างข้อมูลใน localStorage (ควรทำเฉพาะตอนเปลี่ยน schema)
- **ยอด Closed Won / ตัวเลขการเงินในชุดข้อมูลจริง** — ต้อง reconcile กับเอกสารก่อน
- **RBAC roster** (`owners`, `SEE_ALL_ROLES`, `FREELANCE_ROLES`) — กระทบสิทธิ์การเห็นข้อมูลของทั้งทีม
- **ตำแหน่ง `#accountDetailPanel`** — มันถูกย้ายด้วย JS อย่าแก้จนตรรกะการย้ายพัง
