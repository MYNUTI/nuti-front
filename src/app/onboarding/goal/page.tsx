import type { Metadata } from "next";
import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";

export const metadata: Metadata = {
  title: "목표 설정",
};

const GOALS = [
  { name: "체중 감량", description: "같은 제품도 당류·열량을 더 크게 봐요" },
  { name: "근육 증가", description: "단백질을 더 크게, 열량은 덜 깎아요" },
  { name: "일반", description: "표준 기준으로 봐요" },
];

export default function GoalPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <h1 className="text-2xl leading-snug font-bold">
          어떤 목표로
          <br />
          보고 계신가요?
        </h1>

        <ul className="mt-7 flex flex-col gap-2.5">
          {GOALS.map(({ name, description }) => (
            <li key={name}>
              <Link
                href="/onboarding/recalc"
                className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4"
              >
                <span className="text-[15px] font-bold">{name}</span>
                <span className="text-[13px] text-muted-foreground">
                  {description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-10">
          <CtaButton asChild tone="secondary">
            <Link href="/home">건너뛰기 — 일반 기준으로</Link>
          </CtaButton>
        </div>
      </div>
    </main>
  );
}
