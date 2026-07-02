# Sale-CRM-efin

ระบบ CRM สำหรับทีมขาย **Media & Event** ของ efin (Online Asset Co., Ltd. / สำนักข่าวอีไฟแนนซ์ไทย) — เวอร์ชัน production หลายผู้ใช้ พัฒนาต่อยอดจาก prototype ไฟล์เดียว (`efin-crm.html`)

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS (ธีม efin green)
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **RBAC:** 2 บทบาท — `admin` (สิทธิ์เต็ม) และ `staff` (อ่านทุกอย่าง แก้/ลบเฉพาะที่ตนสร้าง)
- ภาษา UI = ไทย · โค้ด/commit = อังกฤษ

## หน้าจอ (6 โมดูล)

| Route | หน้าที่ |
|-------|---------|
| `/login` | เข้าสู่ระบบด้วยอีเมล + รหัสผ่าน (ไม่มีสมัครเอง — admin เชิญเท่านั้น) |
| `/dashboard` | KPI, งานที่ต้องตามวันนี้, team overview, Revenue Source/Subset Split (เป้าหมายตาม `REVENUE_PLAN`) |
| `/opportunities` | Kanban ลากเปลี่ยน stage (บันทึกลง DB), ตาราง, stage filter chips, ตัวกรอง, CRUD |
| `/accounts` + `/accounts/[id]` | ฐานลูกค้า + หน้า Detail (ผู้ติดต่อ, ประวัติซื้อจาก Closed Won, Daily AE Notes) |
| `/leads` | คะแนนคุณภาพ lead (leadScore เต็ม 100) + Convert เป็น opportunity |
| `/packages` | Budget Finder, Package Catalog, Idea Packages (เพิ่ม/ลบ) |
| `/admin/users` | (admin) เชิญผู้ใช้ใหม่ + ตั้ง role |

## การตั้งค่า (Setup)

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. สร้างโปรเจกต์ Supabase + ใส่ค่า env

คัดลอก `.env.example` เป็น `.env.local` แล้วเติมค่าจริงจาก Supabase Dashboard → Project Settings → API:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, ห้าม commit
```

> `.env.local` อยู่ใน `.gitignore` แล้ว — **ห้าม commit ค่าจริง** ไฟล์ที่ commit ได้มีแค่ `.env.example` (placeholder)

### 3. Deploy database (ผ่าน Supabase CLI)

ตั้ง access token ใน **shell เท่านั้น** (อย่าใส่ในไฟล์):

```bash
export SUPABASE_ACCESS_TOKEN="sbp_..."      # macOS/Linux
# Windows PowerShell:  $env:SUPABASE_ACCESS_TOKEN="sbp_..."

supabase link --project-ref <project-ref>
supabase db push        # apply migrations ใน supabase/migrations/
```

Seed ข้อมูลจริงปี 2026 (83 accounts / 83 opportunities / 11 packages / 3 idea packages):

```bash
# รันไฟล์ supabase/seed.sql ผ่าน SQL Editor ใน Dashboard
# หรือ: psql "<connection string>" -f supabase/seed.sql
```

### 4. ตั้งค่า Auth ใน Supabase Dashboard (สำคัญ)

- **Authentication → Providers → Email:** เปิด "Confirm email"
- **Authentication → Sign In / Providers:** ปิด "Allow new users to sign up" (กันสมัครเองผ่าน anon key)
- ผู้ใช้ใหม่เกิดจาก admin เชิญที่หน้า `/admin/users` เท่านั้น

### 5. สร้าง admin คนแรก

Trigger จะตั้ง role เริ่มต้นเป็น `staff` ให้ทุกคน — ยกระดับคนแรกเป็น admin ด้วย SQL:

```sql
update public.profiles set role = 'admin' where email = 'you@efinancethai.com';
```

### 6. รัน dev server

```bash
npm run dev        # http://localhost:3000
```

## RBAC / RLS

บังคับที่ชั้นฐานข้อมูล (RLS) เป็นหลัก — UI ซ่อนปุ่มเป็นชั้นเสริม:

| การกระทำ | admin | staff |
|----------|-------|-------|
| อ่าน (SELECT) | ทุก record | ทุก record |
| สร้าง (INSERT) | ✅ (`created_by = ตนเอง`) | ✅ (`created_by = ตนเอง`) |
| แก้/ลบ (UPDATE/DELETE) | ทุก record | เฉพาะที่ `created_by = ตนเอง` |
| จัดการผู้ใช้ + role | ✅ | ❌ |

> ข้อมูล seed มี `created_by = null` → **มีเพียง admin เท่านั้นที่แก้/ลบได้** (staff แก้/ลบข้อมูล seed ไม่ได้)

## ตัวเลขการเงิน (verified)

Closed Won รวม **3,050,228.97 บาท** — ตรวจด้วยสคริปต์ตอน generate `seed.sql`:

| subset | Closed Won | source |
|--------|-----------:|--------|
| better trade | 1,030,000.00 | Event |
| efinancethai | 863,500.00 | Media |
| crypto | 300,000.00 | Media |
| esg | 856,728.97 | Event |

> ส่วนต่าง 300,000 (เป้า 3,350,228.97) ยังไม่ยืนยันที่มา — **ไม่ถูกเติมในระบบ**

## โครงสร้างโปรเจกต์

```
app/
  (auth)/login/            หน้า login
  (app)/                   กลุ่มหน้าที่ต้องล็อกอิน (guard ด้วย middleware + requireProfile)
    layout.tsx             sidebar + sign out
    dashboard/ opportunities/ accounts/ accounts/[id]/ leads/ packages/
    admin/users/           admin เท่านั้น (server actions + service role)
components/                UI + view components (client)
lib/
  supabase/{client,server,admin}.ts
  auth.ts rbac.ts constants.ts types.ts lead-score.ts
supabase/
  migrations/*.sql         schema + RLS (source of truth)
  seed.sql                 ข้อมูลจริง 2026
middleware.ts              session refresh + redirect guard
```

เอกสารเดิมของ prototype: `ARCHITECTURE.md`, `DATA-MODEL.md`, `AGENTS.md`, `kb/`, และ `docs/understanding.md` (สรุป Phase 0)
