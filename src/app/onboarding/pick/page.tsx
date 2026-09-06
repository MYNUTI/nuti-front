import type { Metadata } from "next";
import Link from "next/link";
import { GradeBadge, type Grade } from "@/components/common/grade";

export const metadata: Metadata = {
  title: "샘플 제품 선택",
};

const SAMPLES: { name: string; source: string; grade: Grade }[] = [
  { name: "더단백 라떼 350ml", source: "100ml당 · 식약처 공공DB", grade: "A" },
  { name: "그릭요거트 플레인", source: "100ml당 · 식약처 공공DB", grade: "B" },
  { name: "프로틴바 카카오", source: "100ml당 · 식약처 공공DB", grade: "C" },
  { name: "제로 스파클링", source: "100ml당 · 식약처 공공DB", grade: "D" },
  { name: "초코 웨이퍼", source: "100ml당 · 식약처 공공DB", grade: "E" },
];

export default function SamplePickerPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <h1 className="text-2xl leading-snug font-bold">
          평소 먹는 제품을
          <br />
          하나만 골라주세요
        </h1>

        <ul className="mt-7 flex flex-col gap-2.5">
          {SAMPLES.map(({ name, source, grade }) => (
            <li key={name}>
              <Link
                href="/onboarding/result"
                className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5"
              >
                <span className="size-14 shrink-0 rounded-xl bg-muted" />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-bold">{name}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {source}
                  </span>
                </span>
                <GradeBadge grade={grade} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
