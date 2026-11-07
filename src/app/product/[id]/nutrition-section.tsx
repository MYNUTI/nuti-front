"use client";

import { useId, useState } from "react";

import { Chip } from "@/components/common/chip";
import { SectionHeader } from "@/components/common/section-header";
import { IconChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

import type { NutrientValue, ProductResult } from "./_fixtures";

/*
 * 3-2 영양성분. 처음에는 주요 성분만, 「다른 영양성분 n개 더 보기」로 펼친다(3-2 영양성분 펼침).
 * 펼치면 기준 전환 칩 [100g당] [1회 제공량]이 보이고 표의 숫자·평가 말·막대가 그 기준으로 바뀐다.
 * 디자인 메모: 기본은 늘 100g당, 접으면 100g당으로 돌아온다. 위 이유 칩·점수는 전환과 상관없이 100g 기준.
 */

// 1일 기준치 %가 5 이하면 적은 편, 20 이상이면 많은 편. 디자인 3-2의 값(3%·13%·18%·21%·69%)과 맞는 기준이다
function level(percent: number) {
  if (percent <= 5) return "적은 편";
  if (percent >= 20) return "많은 편";
  return "보통";
}

function format(value: number, unit: NutrientValue["unit"]) {
  // kcal·mg은 정수, g은 소수 첫째 자리(0이면 뗀다)
  const rounded =
    unit === "g" ? Math.round(value * 10) / 10 : Math.round(value);
  return `${rounded}${unit}`;
}

type Basis = "per100" | "serving";

export function NutritionSection({
  nutrition,
  bodyFitKcal,
}: {
  nutrition: ProductResult["nutrition"];
  /** 등급을 내 몸에 맞춘 칼로리로 계산했으면 그 하루 칼로리. 기준 설명만 바뀌고 %는 식품 표시 기준 그대로다 */
  bodyFitKcal: number | null;
}) {
  const moreId = useId();
  const [open, setOpen] = useState(false);
  const [basis, setBasis] = useState<Basis>("per100");
  const { unit, serving } = nutrition;
  const per100Label = `100${unit}당`;

  // 1회 제공량 기준이면 100g당 값에 제공량/100을 곱한다
  const factor = basis === "serving" && serving ? serving.amount / 100 : 1;
  const calories = [...nutrition.main, ...nutrition.more].find(
    (n) => n.key === "calories",
  )?.per100;
  const servingNote =
    serving && calories != null
      ? `${serving.label}(${serving.amount}${unit})는 ${format((calories * serving.amount) / 100, "kcal")}`
      : null;

  return (
    <section>
      <SectionHeader
        title="영양성분"
        description={[per100Label, servingNote].filter(Boolean).join(" · ")}
      />
      {open && serving && (
        <div
          role="group"
          aria-label="영양성분 기준"
          className="flex gap-2 px-5 pt-1 pb-2"
        >
          <Chip
            selected={basis === "per100"}
            onClick={() => setBasis("per100")}
          >
            {per100Label}
          </Chip>
          <Chip
            selected={basis === "serving"}
            onClick={() => setBasis("serving")}
          >
            1회 제공량({serving.amount}
            {unit})
          </Chip>
        </div>
      )}
      {nutrition.main.map((n) => (
        <Nutrient key={n.key} nutrient={n} factor={factor} />
      ))}
      <div id={moreId}>
        {open && (
          <>
            {nutrition.more.map((n) => (
              <Nutrient key={n.key} nutrient={n} factor={factor} />
            ))}
            {/* 디자인 메모(11-04): 기준치 설명은 펼친 영양성분 안에만 */}
            <p className="px-5 pt-1 pb-4 text-caption break-keep text-text-sub">
              {bodyFitKcal
                ? `등급은 내 몸에 맞춘 칼로리(하루 약 ${bodyFitKcal.toLocaleString("ko-KR")}kcal)로 계산했어요. 표의 %는 식품 표시 기준(2,000kcal)이에요.`
                : "1일 영양성분 기준치(성인 2,000kcal)와 비교했어요"}
            </p>
          </>
        )}
      </div>
      {nutrition.more.length > 0 && (
        // 펼치기·접기는 같은 버튼이라 눌러도 포커스가 그 자리에 남는다
        <button
          type="button"
          aria-expanded={open}
          aria-controls={moreId}
          className={cn(
            "flex items-center gap-1 px-5 py-3 text-body2-medium",
            open ? "text-text-body" : "text-accent-blue-text",
          )}
          onClick={() => {
            // 디자인 메모: 접으면 100g당으로 돌아온다
            if (open) setBasis("per100");
            setOpen(!open);
          }}
        >
          {open ? "접기" : `다른 영양성분 ${nutrition.more.length}개 더 보기`}
          <IconChevronDown className={cn("size-4", open && "rotate-180")} />
        </button>
      )}
    </section>
  );
}

function Nutrient({
  nutrient,
  factor,
}: {
  nutrient: NutrientValue;
  factor: number;
}) {
  const { key, label, unit, per100, dailyValue } = nutrient;
  const value = per100 === null ? null : per100 * factor;
  const percent =
    value === null || dailyValue === null
      ? null
      : Math.round((value / dailyValue) * 100);

  const note =
    value === null
      ? // 표시가 없으면 0으로 계산하는 성분은 식이섬유뿐이다. 다른 성분의 문구는 디자인에 없어 임시(UI 플랜 「남은 질문」 9)
        key === "dietaryFiber"
        ? "표시가 없어 0으로 계산했어요"
        : "표시가 없는 성분이에요"
      : percent === null
        ? "1일 기준치가 없는 성분이에요"
        : `${level(percent)} (1일 기준치의 ${percent}%)`;

  return (
    <div className="flex flex-col gap-1.5 px-5 py-2">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-body1-medium text-text-strong">{label}</p>
          <p className="text-body2 text-text-sub">{note}</p>
        </div>
        <p className="text-body1-medium text-text-strong">
          {value === null ? "표시 없음" : format(value, unit)}
        </p>
      </div>
      {percent !== null && (
        // 디자인 메모: 막대는 한 색. 좋음·걸림은 이유 칩으로만 보인다
        <div
          aria-hidden
          className="h-1.5 overflow-hidden rounded-[3px] bg-bg-band"
        >
          <div
            className="h-full rounded-[3px] bg-text-sub"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
