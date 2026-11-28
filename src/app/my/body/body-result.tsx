import { ACTIVITIES, GENDERS } from "./body-form";
import type { BodyProfile } from "./body-input";
import { ageOf } from "./body-kcal";
import type { ResultSection } from "./result-copy";

/*
 * 5-7b 내 몸에 맞추기(계산 결과)의 본문. 아래 고정 버튼은 쓰는 화면(BodyScreen)이 둔다.
 * 칼로리 · 몸 정보 줄 · 구간별 문장은 화면 녹화에서 글자를 가린다(ph-mask, 【최종】 5-11 메모 「키, 몸무게는 가림」)
 */
export function BodyResult({
  profile,
  kcal,
  sections,
  headingRef,
}: {
  profile: BodyProfile;
  kcal: number;
  sections: ResultSection[];
  headingRef: React.Ref<HTMLHeadingElement>;
}) {
  const summary = [
    GENDERS.find((g) => g.value === profile.gender)?.label,
    `${ageOf(profile)}세`,
    `${profile.heightCm}cm`,
    `${profile.weightKg}kg`,
    ACTIVITIES.find((a) => a.value === profile.activity)?.title,
  ].join(", ");

  return (
    <>
      <div className="flex flex-col gap-2 px-5 pt-2 pb-6">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-title1 text-text-strong outline-none"
        >
          하루 필요 칼로리
        </h2>
        <p className="text-body1 text-text-sub">입력한 몸 정보로 계산했어요.</p>
        <p className="ph-mask text-[40px] leading-[1.3] font-bold text-text-strong">
          약 {kcal.toLocaleString("ko-KR")}kcal
        </p>
        <p className="ph-mask text-[14px] leading-[1.5] text-text-sub">
          {summary}
        </p>
      </div>
      <div aria-hidden className="h-2 bg-bg-band" />
      {/* 구간마다 문장이 달라 숫자를 가려도 문장으로 구간이 드러난다. 영역째 가린다 */}
      <div className="ph-mask flex flex-col gap-4 px-5 pt-5 pb-2">
        {sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-1">
            <h3 className="text-body1-bold text-text-strong">
              {section.heading}
            </h3>
            <p className="text-body1 break-keep whitespace-pre-line text-text-body">
              {section.body}
            </p>
          </section>
        ))}
      </div>
      <p className="px-5 pt-4 text-body2 text-text-sub">
        입력한 몸 정보는 이 기기와 계정에 저장돼요.
      </p>
    </>
  );
}
