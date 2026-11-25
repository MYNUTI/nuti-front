"use client";

import { useId } from "react";

import { SelectCard } from "@/components/common/select-card";
import { TextField } from "@/components/common/text-field";

import type {
  ActivityLevel,
  BodyErrors,
  BodyField,
  BodyInput,
  Gender,
} from "./body-input";

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "MALE", label: "남성" },
  { value: "FEMALE", label: "여성" },
];

// 네 문장이 산식의 활동 등급(PA)과 맞는지는 안 정함(【최종】 메모 · ACCT_010)
export const ACTIVITIES: {
  value: ActivityLevel;
  title: string;
  description: string;
}[] = [
  {
    value: "SEDENTARY",
    title: "거의 움직이지 않아요",
    description: "하루 대부분 앉아서 지내요",
  },
  {
    value: "LOW_ACTIVE",
    title: "조금 움직여요",
    description: "걷기, 집안일 정도예요",
  },
  {
    value: "ACTIVE",
    title: "자주 움직여요",
    description: "주 3번에서 5번 운동해요",
  },
  {
    value: "VERY_ACTIVE",
    title: "아주 많이 움직여요",
    description: "매일 운동하거나 몸을 쓰는 일을 해요",
  },
];

const NUMBER_FIELDS: {
  field: Exclude<BodyField, "gender">;
  label: string;
  unit: string;
  placeholder: string;
  inputMode: "numeric" | "decimal";
}[] = [
  {
    field: "birthYear",
    label: "출생 연도",
    unit: "년",
    placeholder: "예: 1998",
    inputMode: "numeric",
  },
  {
    field: "heightCm",
    label: "키",
    unit: "cm",
    placeholder: "예: 170",
    inputMode: "decimal",
  },
  {
    field: "weightKg",
    label: "체중",
    unit: "kg",
    placeholder: "예: 65",
    inputMode: "decimal",
  },
];

/** 입력 칸 이름. 오류가 나면 이 이름으로 첫 칸을 찾아 초점을 준다 */
export const fieldName = (field: BodyField) => `body-${field}`;

/*
 * 5-7 입력 칸(성별 · 출생 연도 · 키 · 체중 · 평소 활동량). 값은 쓰는 화면이 들고 있다.
 * 고른 성별 · 활동량은 화면 녹화에서 가린다(ph-no-capture). 숫자 칸 값은 PostHog가 기본으로 가린다
 */
export function BodyForm({
  value,
  errors,
  onChange,
}: {
  value: BodyInput;
  errors: BodyErrors;
  onChange: (patch: Partial<BodyInput>) => void;
}) {
  const genderErrorId = useId();

  return (
    <div className="ph-no-capture flex flex-col">
      <fieldset
        className="flex flex-col gap-2 px-5 pb-4"
        aria-describedby={errors.gender ? genderErrorId : undefined}
      >
        <legend className="pb-2 text-body2 text-text-body">성별</legend>
        <div className="flex gap-2">
          {GENDERS.map((gender) => (
            <SelectCard
              key={gender.value}
              name={fieldName("gender")}
              value={gender.value}
              title={gender.label}
              checked={value.gender === gender.value}
              onChange={() => onChange({ gender: gender.value })}
              className="h-14 flex-1 py-3"
            />
          ))}
        </div>
        {errors.gender && (
          <p id={genderErrorId} className="text-body2 text-text-danger">
            {errors.gender}
          </p>
        )}
      </fieldset>

      <div className="flex gap-3 px-5 pb-4">
        {NUMBER_FIELDS.map((item) => (
          <div key={item.field} className="flex min-w-0 flex-1 gap-2">
            <TextField
              // 칸이 좁아 오류 문장이 여러 줄이 된다. 낱말 중간에서 끊기지 않게 한다
              className="min-w-0 flex-1 [&_p]:break-keep"
              label={item.label}
              name={fieldName(item.field)}
              inputMode={item.inputMode}
              autoComplete="off"
              placeholder={item.placeholder}
              value={value[item.field]}
              onChange={(event) =>
                onChange({ [item.field]: event.target.value })
              }
              status={errors[item.field] ? "error" : undefined}
              message={errors[item.field]}
            />
            {/* 단위는 칸 가운데 높이에 둔다(이름 20 + 간격 8 + 칸 52의 가운데) */}
            <span
              aria-hidden
              className="mt-[42px] shrink-0 text-body1-medium text-text-body"
            >
              {item.unit}
            </span>
          </div>
        ))}
      </div>

      <fieldset className="flex flex-col gap-2 px-5 pb-4">
        <legend className="pb-2 text-body2 text-text-body">평소 활동량</legend>
        {ACTIVITIES.map((activity) => (
          <SelectCard
            key={activity.value}
            name="body-activity"
            value={activity.value}
            title={<span className="text-[15px]">{activity.title}</span>}
            description={activity.description}
            checked={value.activity === activity.value}
            onChange={() => onChange({ activity: activity.value })}
            // 【최종】 활동량 카드는 64로 목표 카드보다 낮다: 위아래 10, 제목 · 설명 사이 간격 없음(글 칸은 SelectCard의 마지막 span)
            className="py-2.5 [&>span:last-child]:gap-0"
          />
        ))}
      </fieldset>
    </div>
  );
}
