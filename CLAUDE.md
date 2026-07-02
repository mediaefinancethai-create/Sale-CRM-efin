# CLAUDE.md — efin CRM

> ไฟล์นี้ถูกอ่านโดย Claude (claude.ai / Claude Code / API) เวลาทำงานใน repo นี้ — เสริมจาก [AGENTS.md](./AGENTS.md) (อ่านไฟล์นั้นก่อน)

## Claude's Role in This Project

**Claude Code เป็นเครื่องมือหลักในการพัฒนา/ดูแล codebase นี้** โปรเจกต์เป็น single-file HTML app (`efin-crm.html`) ไม่มีการเรียก Anthropic API ในตัวแอป ดังนั้นบทบาทของ Claude คือ "developer" ที่ช่วยแก้/เพิ่มฟีเจอร์ ไม่ใช่ component ที่รันอยู่ในแอป

## วิธีทำงานกับไฟล์เดียวขนาดใหญ่ (สำคัญ)

ไฟล์มี ~11,000 บรรทัด — อย่าพยายามเปิด/เขียนทับทั้งไฟล์ ให้ทำแบบนี้:
1. `grep`/ค้นหา anchor (string ที่ unique) เพื่อระบุตำแหน่งจริงก่อน
2. แก้แบบ **surgical**: แทนที่เฉพาะ block ที่ต้องการ (ยืนยันว่า match เพียง 1 ครั้งก่อนแทนที่)
3. หลังแก้ `<script>` ทุกครั้ง: ดึง JS ออกมา `node --check` ให้ผ่าน
4. คัดลอกไฟล์ผลลัพธ์ไปยังปลายทางที่ผู้ใช้เห็น แล้วค่อยสรุป

รูปแบบ patch ที่แนะนำ (Python, ป้องกันแก้ผิดจุด):
```python
import io
s = io.open("efin-crm.html", encoding="utf-8").read()
old = "<anchor ที่ unique>"
assert s.count(old) == 1, s.count(old)   # ต้องเจอครั้งเดียว
s = s.replace(old, "<ใหม่>")
io.open("efin-crm.html","w",encoding="utf-8").write(s)
```

## Formatting / Coding style

- JS: ES2019+, ใช้ `const`/`let` (ห้าม `var`), template literals, arrow functions ตามสไตล์เดิมในไฟล์
- **รักษาสไตล์เดิมของโค้ดรอบ ๆ จุดที่แก้** อย่า refactor ส่วนที่ไม่เกี่ยวกับงาน
- CSS: ใช้ตัวแปรธีมเท่านั้น (`--bg,--surface,--line,--ink,--muted,--blue,--navy,--soft-blue`) อย่า hardcode สี
- ข้อความ UI เป็นภาษาไทย (ผู้ใช้เป็นทีมไทย) — คงโทนภาษาไทยไว้

## When editing existing code

- แก้เท่าที่จำเป็นกับงาน ถ้าเจอบั๊กที่ไม่เกี่ยวข้อง ให้แจ้ง/ใส่ TODO แทนการไปแก้เอง
- ปุ่ม/ลิงก์ที่ต้องผูก event ให้ใช้ inline `onclick="someFn()"` + expose `window.someFn` (โปรเจกต์นี้เลือกวิธีนี้เพื่อเลี่ยงปัญหา event delegation หลัง re-render)
- อย่าลืมว่า `renderAll()` จะ re-render ทุกโมดูล — event ที่ผูกกับ element ที่ถูกสร้างใหม่ต้องผูกซ้ำ หรือใช้ delegation/inline onclick

## Common Mistakes to Avoid

- ❌ อย่าใช้ `localStorage` แบบคิดว่าเป็น artifact ในแชท — ไฟล์นี้รันในเบราว์เซอร์จริงจึงใช้ได้ แต่ถ้าถูกนำไปวางเป็น Claude artifact จะพัง
- ❌ อย่าลืม `saveData()` หลังแก้ `data` (ข้อมูลจะไม่ถูกบันทึก)
- ❌ อย่าลืม `renderAll()` หลังแก้ข้อมูล (หน้าจอจะไม่อัปเดต)
- ❌ อย่าเปลี่ยน `APP_KEY` เว้นแต่ตั้งใจล้างข้อมูลผู้ใช้
- ❌ อย่าแต่งตัวเลขการเงิน — โดยเฉพาะส่วนต่าง 300,000 ระหว่างยอดจริง 3,050,228.97 กับเป้า 3,350,228.97 (ต้องรอการยืนยัน)
- ❌ อย่าทำให้ยอด Closed Won ต่อ subset เพี้ยนจากเอกสาร (better trade 1,030,000 / efinancethai 863,500 / crypto 300,000 / esg 856,728.97)

## Asking for Clarification

ถามผู้ใช้ก่อนลงมือ เมื่อ:
- งานกระทบ **ตัวเลขการเงิน** หรือยอดรวมต่อหมวด
- งานกระทบ **RBAC** (ใครเห็นข้อมูลใคร) หรือ roster
- มีหลายวิธีที่ trade-off ต่างกันอย่างมีนัยสำคัญ (เช่น จะทำ chart เป็น actual หรือ target)
