"use client";

import { ClipboardList, House, ScanBarcode, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/home", label: "홈", Icon: House },
  { href: "/scan", label: "스캔", Icon: ScanBarcode },
  { href: "/history", label: "내 기록", Icon: ClipboardList },
  { href: "/settings", label: "마이", Icon: User },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed-app bottom-0 px-5 pb-safe">
      <ul className="mb-6 flex rounded-2xl border border-border bg-card">
        {TABS.map(({ href, label, Icon }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3.5",
                pathname === href ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-6" />
              <span className="text-[11px] font-bold">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
