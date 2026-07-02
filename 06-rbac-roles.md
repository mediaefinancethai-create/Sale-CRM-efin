# KB 06 — RBAC & Roles (cross-cutting)

ไม่ใช่หน้าเดียว แต่เป็นกลไกที่คุมทุกหน้า: ใครเห็นดีล/ข้อมูลของใคร ผ่านดรอปดาวน์ **Role View** (`#roleFilter`)

## Roster (ค่าคงที่)
```js
owners         = ["yok","nueng","fung","chom","lucky","joy","rung"]  // AE
supportOwners  = ["earn","fon"]                                       // Sales Support
campaignOwners = ["tak"]                                              // Marketing
SEE_ALL_ROLES  = ["yok","tak","earn","fon"]                           // เห็นทั้งหมด
FREELANCE_ROLES= ["joy","rung"]                                       // เห็นเฉพาะของตัวเอง + ห้าม export
```

## บทบาทและสิทธิ์
| Role | ประเภท | เห็นอะไร | หมายเหตุ |
|------|--------|----------|----------|
| yok | Admin/Manager | ทุกดีล + รายงาน | |
| tak | Marketing | ทุกดีล + leads/report | campaignOwner |
| nueng | Senior AE | ดีลของตัวเอง | ดูแลดีลก้อนใหญ่ (crypto/KTB/TQM/EGCO) |
| fung, chom | AE | ดีลของตัวเอง | |
| lucky | AE + Sales Support | ดีลตัวเอง + ที่ซัพพอร์ต joy & rung | dual role: `lucky → [joy, rung]` |
| earn, fon | Sales Support | (ชั่วคราว) เห็นทั้งหมด | ขอบเขต AE ที่ดูแลยังเป็น decision ค้าง (D-2) |
| joy, rung | Freelance AE | เฉพาะดีลของตัวเอง | **ห้าม export** (PDPA) |

## ฟังก์ชันที่เกี่ยวข้อง
- `roleScope(role)` — คืนขอบเขตเจ้าของที่ role นั้นเห็น
- `roleSees(role, owner, supportOwner, campaignOwner)` — เช็คว่า role เห็น record นี้ไหม (ใช้ใน `filteredOpportunities()`, `oppsForStageChips()`, ฯลฯ)
- `applyRolePolicy()` — ปิดปุ่ม Export JSON/CSV สำหรับ `FREELANCE_ROLES`
- `commissionScopeOwners()` — ขอบเขตสำหรับหน้า commission (legacy)

## กติกาสำหรับ agent
- การกรอง opportunity/lead **ต้อง** ผ่าน `roleSees(...)` — อย่าดึง `data.opportunities` ตรง ๆ มาแสดงโดยไม่กรอง
- freelance (`joy`, `rung`) ต้อง **ห้าม export** เสมอ (มาตรการ PDPA)
- เปลี่ยน roster/สิทธิ์ = กระทบทั้งทีม → ยืนยันกับผู้ใช้ก่อน

## Decisions ที่ยังค้าง (จาก BA intake)
- **D-2**: ขอบเขตของ earn/fon ว่าดูแล AE คนไหน (ปัจจุบันตั้งชั่วคราวให้เห็นทั้งหมด)
- **D-4**: tak เป็น read-only หรือแก้ไข leads ได้
- **D-5**: การเก็บ audit log เพิ่มสำหรับ freelance
