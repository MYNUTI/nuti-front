"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CtaButton } from "@/components/common/cta-button";
import { Checkbox } from "@/components/ui/checkbox";

const ITEMS = [
  {
    id: "usage",
    label: "[필수] 익명 사용 기록",
    description: "찍은 제품·본 화면, 누구인지 저장하지 않아요",
  },
  {
    id: "photo",
    label: "[필수] 성분표 사진",
    description: "직접 찍어 올릴 때만",
  },
];

export function ConsentForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const allAgreed = ITEMS.every((item) => agreed[item.id]);

  return (
    <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
      <h1 className="text-2xl leading-snug font-bold">
        서비스를 쓰기 전에
        <br />
        확인해 주세요
      </h1>
      <p className="mt-3 text-[15px] text-muted-foreground">
        찍기·저장을 하려면 아래 항목이 필요해요.
      </p>

      <ul className="mt-7 flex flex-col gap-2.5">
        {ITEMS.map(({ id, label, description }) => (
          <li key={id}>
            <label className="flex cursor-pointer items-start gap-3.5 rounded-2xl border border-border bg-card p-4">
              <Checkbox
                checked={agreed[id] ?? false}
                onCheckedChange={(value) =>
                  setAgreed((prev) => ({ ...prev, [id]: value === true }))
                }
                className="mt-0.5 size-5 rounded-full"
              />
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-bold">{label}</span>
                <span className="text-[13px] text-muted-foreground">
                  {description}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-10">
        <button
          type="button"
          className="mb-4 block text-[13px] text-muted-foreground"
        >
          개인정보 처리방침 전문 보기
        </button>
        <CtaButton
          disabled={!allAgreed}
          onClick={() => router.push("/onboarding/health")}
        >
          확인하고 시작하기
        </CtaButton>
      </div>
    </div>
  );
}
