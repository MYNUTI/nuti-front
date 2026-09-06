import type { Metadata } from "next";
import { CtaButton } from "@/components/common/cta-button";
import { GradeBadge, GradeBar, type Grade } from "@/components/common/grade";

export const metadata: Metadata = {
  title: "다시 계산한 결과",
};

const COLUMNS: { caption: string; grade: Grade; verdict: string }[] = [
  { caption: "바꾸기 전", grade: "C", verdict: "주의" },
  { caption: "지금 기준", grade: "D", verdict: "잘 안 맞아요" },
];

export default function RecalcPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <h1 className="text-2xl leading-snug font-bold">
          체중 감량 기준으로
          <br />
          다시 계산했어요
        </h1>

        <div className="mt-7 rounded-2xl border border-border bg-card p-4">
          <p className="text-[15px] font-bold">더단백 라떼 350ml</p>

          <div className="mt-4 grid grid-cols-2 gap-4">
            {COLUMNS.map(({ caption, grade, verdict }) => (
              <div key={caption}>
                <p className="text-[13px] text-muted-foreground">{caption}</p>
                <div className="mt-2 flex items-center gap-2">
                  <GradeBadge grade={grade} />
                  <span className="text-[15px] font-bold">{verdict}</span>
                </div>
                <GradeBar grade={grade} className="mt-3" />
              </div>
            ))}
          </div>

          <p className="mt-4 text-[13px] text-muted-foreground">
            감량 목표에선 당류를 더 크게 봅니다
          </p>
        </div>

        <div className="mt-auto pt-10">
          <CtaButton>홈으로</CtaButton>
        </div>
      </div>
    </main>
  );
}
