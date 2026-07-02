# AGENTS.md — efin CRM

> AI agent (Claude Code, Cursor, Codex, Copilot) **ต้องอ่านไฟล์นี้ก่อนแก้โค้ดทุกครั้ง** นี่คือสัญญา ไม่ใช่แค่คำอธิบาย

## Project Snapshot

efin CRM คือ web app แบบ **single-file HTML** (`efin-crm.html`, ~11k บรรทัด) เขียนด้วย vanilla HTML/CSS/JS ไม่มี backend/build งานหลักคือติดตาม pipeline การขาย Media & Event ของ efin

**กฎสำคัญที่สุดสำหรับ agent:** ทุกอย่างอยู่ในไฟล์เดียว และข้อมูลเก็บใน `localStorage` — เวลาแก้ให้ทำแบบ **surgical edit** (ค้นหา anchor เฉพาะจุดแล้วแทนที่) **ห้าม reformat/pretty-print ทั้งไฟล์** และ **ทุกการเปลี่ยนข้อมูลต้องจบด้วย `saveData()` + `renderAll()`**

## Codebase Map

```
efin-crm.html
  <style>            # ธีม efin green (CSS vars) + สไตล์ทุก component
  <body>             # sidebar (nav) + topbar (filters) + section ต่อโมดูล
  <script>
    modules[]        # นิยามเมนู 5 โมดูล + routing (dashboard/opportunities/accounts/leads/packagelib)
    constants        # stages, owners, supportOwners, campaignOwners, SEE_ALL_ROLES, FREELANCE_ROLES, subsets, REVENUE_PLAN
    data layer       # seed, emptyData, efinReal2026Data, normalizeData
    persistence      # loadData, saveData  (localStorage[APP_KEY])
    helpers          # escapeHtml, baht, pct, deepClone, byId, opp, roleSees, roleScope, applyRolePolicy, groupSum, renderBars
    render*()        # 1 ฟังก์ชันต่อโมดูล — orchestrate โดย renderAll()
    features         # moveOppStage, renderStageChips, runPkgBudget, addIdeaPackage, openAccountDetail, editRecord, deleteRecord, convertLead
    bindGlobalEvents / init()
```

ไฟล์เอกสารประกอบ: `README.md`, `ARCHITECTURE.md`, `DATA-MODEL.md`, `CLAUDE.md`, `kb/*.md`

## Key Conventions

**การแก้ไฟล์:**
- แก้แบบ targeted: หา string ที่ unique (anchor) แล้วแทนที่ทีละจุด อย่าเขียนทับทั้งไฟล์
- หลังแก้ `<script>` **ต้อง** ดึงโค้ด JS ออกมา `node --check` ให้ผ่านก่อนเสมอ
- CSS ใช้ตัวแปรธีม: `--bg, --surface, --line, --ink, --muted, --blue(#75BC1E), --navy(#1E3A07), --soft-blue(#EAF3DE)` — อย่า hardcode สีใหม่ ให้ใช้ vars

**Data:**
- อ่าน/เขียนผ่าน object `data` เท่านั้น; เพิ่ม/แก้/ลบ record แล้วเรียก `saveData()` → `renderAll()`
- คีย์ collection ใหม่ให้ทำงานได้กับ `normalizeData` (โหมด real ทำ spread `{ ...emptyData(), ...input }`) — ถ้าต้องมีค่า default ให้เพิ่มใน `emptyData()`
- ถ้าเปลี่ยน schema แล้วอยากบังคับโหลดใหม่ ให้ bump `APP_KEY`

**RBAC:**
- การกรองดีลต้องผ่าน `roleSees(role, owner, supportOwner, campaignOwner)` เสมอ
- `SEE_ALL_ROLES = [yok, tak, earn, fon]` เห็นทั้งหมด; `FREELANCE_ROLES = [joy, rung]` เห็นเฉพาะของตัวเองและ **ห้าม export** (`applyRolePolicy()` ปิดปุ่ม export)

**DO NOT:**
- ❌ อย่าแต่งตัวเลขการเงิน (โดยเฉพาะยอด Closed Won) — ต้อง reconcile กับเอกสารต้นทาง
- ❌ อย่าใช้ chart library / CDN ภายนอก — โปรเจกต์ตั้งใจ zero-dependency
- ❌ อย่าย้าย/ลบ logic ที่ย้าย `#accountDetailPanel` เข้า `#accounts` (คลิกชื่อบริษัทจะพัง)
- ❌ อย่าเปลี่ยน `APP_KEY` โดยไม่จำเป็น (ผู้ใช้จะเสียข้อมูลใน localStorage)

## How to Run

```bash
# รัน (เลือกอย่างใดอย่างหนึ่ง)
open efin-crm.html
python3 -m http.server 8000   # แล้วเปิด http://localhost:8000/efin-crm.html

# ตรวจ syntax JS หลังแก้ (บังคับ)
python3 - << 'EOF'
import re,io
s=io.open("efin-crm.html",encoding="utf-8").read()
js="\n;\n".join(re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>', s, re.S))
io.open("app.js","w",encoding="utf-8").write(js)
EOF
node --check app.js
```

## Common Tasks

**เพิ่มโมดูลใหม่:**
1. เพิ่ม entry ใน `const modules = [...]` เช่น `["reports","R","Reports","คำอธิบาย"]`
2. เพิ่ม `<section id="reports" class="section">...</section>` ใน `<body>`
3. เขียนฟังก์ชัน `renderReports()`
4. เรียก `renderReports()` ใน `renderAll()`
5. `node --check` ให้ผ่าน

**เพิ่ม/แก้ฟิลด์ของ opportunity:**
1. เพิ่มฟิลด์ในชุดข้อมูล (และ default ใน `normalizeData` ถ้าจำเป็น)
2. แก้ template ที่ render (Kanban card / ตาราง / modal แก้ไข)
3. ถ้าเป็นฟิลด์ที่ใช้กรอง ให้เพิ่มใน filter + `filteredOpportunities()`

**เพิ่มแพ็กเกจใน catalog:**
- เพิ่ม object ใน collection `packages` (`{id,name,source,subset,listPrice,components,bestFor,tier,owner,status}`) แล้ว `renderPackageLibrary()` จะแสดงเอง

**แก้ข้อมูลการขายจริง:**
1. แก้ค่าใน `efinReal2026Data()` (const `real`)
2. ตรวจยอด Closed Won ต่อ subset ให้ตรงเอกสาร (ดู DATA-MODEL.md)
3. bump `APP_KEY` ถ้าต้องการให้ผู้ใช้เห็นชุดใหม่ทันที

## Dependencies That Need Special Attention

| สิ่งที่ต้องระวัง | เหตุผล |
|-----------------|--------|
| `APP_KEY` | เปลี่ยน = ล้าง localStorage ผู้ใช้ทุกคน |
| `roleSees` / RBAC arrays | คุมสิทธิ์การเห็นข้อมูลทั้งทีม |
| `#accountDetailPanel` relocation | markup ฝังใน `#opportunities` ต้องถูกย้ายเข้า `#accounts` ตอนเปิด |
| inline `onclick` | ปุ่ม/ลิงก์หลายจุดใช้ `onclick` ที่เรียก `window.*` (เลี่ยงปัญหา event delegation) — ต้อง expose ฟังก์ชันผ่าน `window.` |

## Out of Scope for Agents

- อย่าเพิ่ม build system / framework / bundler โดยไม่ได้รับคำสั่งชัดเจน
- อย่าแก้ตัวเลขการเงินหรือ RBAC roster โดยไม่ยืนยันกับผู้ใช้
- อย่าเปลี่ยนพฤติกรรม default-load / Reset โดยพลการ
