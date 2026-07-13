import type { Role } from "@/lib/types";

// Display labels + descriptions for the 3-tier role model
export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};

export const ROLE_DESC: Record<Role, string> = {
  admin: "สิทธิ์สูงสุด — ทำได้ทุกอย่าง รวมถึงจัดการผู้ใช้",
  manager: "แก้ไขข้อมูลได้ทุกหัวข้อ ยกเว้นจัดการผู้ใช้",
  staff: "เพิ่ม/แก้ข้อมูลได้ แต่เห็นเฉพาะดีลของตัวเองในหน้า Opportunities",
};

export const ROLE_OPTIONS: Role[] = ["admin", "manager", "staff"];

export function roleLabel(role: Role | null | undefined): string {
  return role ? (ROLE_LABELS[role] ?? role) : "—";
}
