import type { Metadata } from "next";
import Link from "next/link";
import { CtaButton } from "@/components/common/cta-button";
import { IconCamera, IconDocument } from "@/components/icons";

export const metadata: Metadata = {
  title: "처리방침 동의",
};

const ITEMS = [
  {
    Icon: IconDocument,
    title: "익명 사용 기록",
    description: "스캔·검색 이용 기록 — 이름·연락처 없이",
  },
  {
    Icon: IconCamera,
    title: "성분표 사진",
    description: "분석 요청 시 직접 찍어 보내는 사진만",
  },
];

export default function ConsentPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <h1 className="text-2xl leading-snug font-bold">
          시작 전에
          <br />
          하나만 확인할게요
        </h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          서비스 이용을 위해 아래 정보를 수집해요
        </p>

        <ul className="mt-7 flex flex-col gap-2.5">
          {ITEMS.map(({ Icon, title, description }) => (
            <li
              key={title}
              className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className="size-5.5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{title}</span>
                <span className="text-[13px] text-muted-foreground">
                  {description}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="mt-5 self-start text-sm underline underline-offset-4"
        >
          개인정보 처리방침 전문 보기
        </button>

        <div className="mt-auto pt-10">
          <p className="text-center text-[13px] text-muted-foreground">
            동의 후에도 설정에서 언제든 바꿀 수 있어요
          </p>
          <CtaButton asChild className="mt-3">
            <Link href="/onboarding/camera">확인하고 시작하기</Link>
          </CtaButton>
        </div>
      </div>
    </main>
  );
}
