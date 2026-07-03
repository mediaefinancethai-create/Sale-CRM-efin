"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// menu mirrors modules[] in the prototype
const MENU = [
  { href: "/dashboard", key: "H", label: "Home", desc: "รายได้ · pipeline · งานวันนี้" },
  { href: "/opportunities", key: "O", label: "Opportunities", desc: "Pipeline · stage · forecast" },
  { href: "/accounts", key: "A", label: "Accounts", desc: "ฐานลูกค้า/สปอนเซอร์" },
  { href: "/leads", key: "L", label: "Lead Quality", desc: "คะแนนคุณภาพ lead" },
  { href: "/packages", key: "P", label: "Package Library", desc: "ช่วย AE จัดแพ็กเกจ" },
];

export function SidebarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const account = {
    href: "/account",
    key: "S",
    label: "ตั้งค่าบัญชี",
    desc: "เปลี่ยนรหัสผ่านของฉัน",
  };
  const items = isAdmin
    ? [
        ...MENU,
        { href: "/admin/users", key: "U", label: "Users", desc: "จัดการผู้ใช้ (admin)" },
        account,
      ]
    : [...MENU, account];

  return (
    <nav className="flex-1 space-y-1 px-3">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              active
                ? "bg-brand font-semibold text-white"
                : "text-white/75 hover:bg-white/10"
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                active ? "bg-white/20" : "bg-white/10"
              }`}
            >
              {item.key}
            </span>
            <span className="min-w-0">
              <span className="block leading-tight">{item.label}</span>
              <span className="block truncate text-[10px] font-normal text-white/50">
                {item.desc}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
