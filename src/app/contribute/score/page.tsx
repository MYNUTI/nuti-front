import type { Metadata } from "next";

import { FIXTURE_NO_SCORE, fixtureMyScore } from "../_fixtures";
import { passThrough } from "../pass-through";
import { ScoreScreen } from "./score-screen";

export const metadata: Metadata = { title: "점수 확인" };

/*
 * 3-9 점수 확인. 오는 곳: 3-8 「이 값으로 점수 보기」(3-7이 넘긴 값을 그대로 받는다), 4-3 내 기록(분석 요청)의
 * 「확인 중」 줄(09단계). 미리 보기 주소 값은 `fixtureMyScore` 참고
 */
export default async function ScorePage({
  searchParams,
}: PageProps<"/contribute/score">) {
  const query = await searchParams;
  const state = typeof query.state === "string" ? query.state : undefined;
  const { query: backQuery } = passThrough(query);
  const product =
    typeof query.product === "string" ? FIXTURE_NO_SCORE[query.product] : null;

  return (
    <ScoreScreen
      key={state}
      result={fixtureMyScore(state)}
      product={
        product
          ? { brand: product.brand, name: product.name, image: product.image }
          : null
      }
      // 3-8 이름 칸과 같게 브랜드 · 이름을 합친다
      fallbackName={[query.brand, query.name]
        .map((v) => (typeof v === "string" ? v.trim() : ""))
        .filter(Boolean)
        .join(" ")}
      checkHref={`/contribute/check${backQuery ? `?${backQuery}` : ""}`}
    />
  );
}
