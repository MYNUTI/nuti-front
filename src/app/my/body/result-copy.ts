import type { KcalBand } from "./body-kcal";

/*
 * 5-7b 구간별 문장(【최종】 그림은 2,500kcal 한 장, 2,000 · 1,500은 메모 「같은 틀에 글자만 다름」).
 * 메모의 2,000kcal 「제목 · 본문」은 「바뀌는 것」 자리의 제목 · 본문으로 읽었다(UI 플랜 남은 질문 86)
 */

export type ResultSection = { heading: string; body: string };

const KEEP: ResultSection = {
  heading: "그대로인 것",
  body: "근육 증가 점수와 단백질, 당류, 나트륨 계산은\n바뀌지 않아요.",
};

const kcal = (value: number) => `${value.toLocaleString("ko-KR")}kcal`;

export function resultCopy(band: KcalBand): {
  sections: ResultSection[];
  button: string;
} {
  if (band === 2000)
    return {
      sections: [
        {
          heading: "점수는 그대로예요",
          body: "가장 가까운 기준이 표준과 같은 2,000kcal라 다이어트 점수는 지금과 같아요. 단백질, 당류, 나트륨 계산도 그대로예요.",
        },
      ],
      button: "확인했어요",
    };
  if (band === 1500)
    return {
      sections: [
        {
          heading: "바뀌는 것",
          body: "다이어트 점수는 1,500, 2,000, 2,500, 3,000kcal 네 단계로 나뉘어요. 가장 가까운 1,500kcal로 다시 계산해요. 칼로리가 높은 제품의 점수가 낮아질 수 있어요.",
        },
        KEEP,
      ],
      button: `${kcal(band)} 기준으로 보기`,
    };
  return {
    sections: [
      {
        heading: "바뀌는 것",
        body: `다이어트 점수를 가장 가까운\n${kcal(band)} 기준으로 다시 계산해요.\n하루 칼로리 기준은 1,500, 2,000, 2,500, 3,000kcal 네 단계예요.`,
      },
      KEEP,
    ],
    button: `${kcal(band)} 기준으로 보기`,
  };
}
