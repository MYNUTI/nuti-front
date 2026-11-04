"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IconBarcode,
  IconHome,
  IconMy,
  IconRanking,
  IconRecord,
} from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 피그마 v2/TabBar — 탭 4곳 + 가운데 돌출 스캔 버튼(탭은 이동, 찍기는 동작이라 따로 튀어나온다).
 * 선택 탭만 tab/active 색 + 굵게. 피그마의 홈 인디케이터 34px 자리는 기기 safe area로 대신한다.
 */
const TABS = [
  { href: "/home", label: "홈", Icon: IconHome },
  { href: "/ranking", label: "랭킹", Icon: IconRanking },
  { href: "/scan", label: "스캔", Icon: IconBarcode },
  { href: "/history", label: "기록", Icon: IconRecord },
  { href: "/my", label: "내 정보", Icon: IconMy },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed-app bottom-0 border-t border-line-default bg-bg-page pb-safe">
      <ul className="flex h-14">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          if (href === "/scan") {
            return (
              <li key={href} className="relative flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="flex h-full flex-col items-center justify-end pb-2 text-caption text-text-sub"
                >
                  <span
                    data-guide="scan"
                    className="absolute -top-6 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-primary text-brand-on-lime shadow-[0_4px_12px_0_rgba(31,122,99,0.28)]"
                  >
                    <Icon className="size-7" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          }

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5",
                  active
                    ? "text-caption-bold text-tab-active"
                    : "text-caption text-text-sub",
                )}
              >
                <Icon />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
