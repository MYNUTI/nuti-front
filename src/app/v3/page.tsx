import type { Metadata } from "next";
import Link from "next/link";

import { ApiStatus } from "./_components/api-status";

export const metadata: Metadata = { title: "v3 검토용" };

// 예시 자료의 「프로틴바·간식」 칩(지어낸 코드)과 백엔드 분류 시드의 「단백질 파우더」 칩
const SAMPLE_CHIP = "/v3/rankings/01S4";
const LIVE_CHIP = "/v3/rankings/0101";

const SCREENS = [
  {
    name: "2-2 점수 순위(종류를 고르지 않았을 때)",
    samplePath: "/v3/rankings",
    livePath: "/v3/rankings",
    api: "GET /rankings/categories, GET /rankings/overview(열린 칩이 있는 대분류마다 한 번)",
  },
  {
    name: "2-2 점수 순위",
    samplePath: SAMPLE_CHIP,
    livePath: LIVE_CHIP,
    api: "GET /rankings/categories, GET /rankings(12개씩 이어 받기)",
    note: "실제 서버 주소 끝의 0101은 「단백질 파우더」 칩 코드예요. 다른 칩은 분류 응답의 코드로 바꿔 넣어요.",
  },
  {
    name: "2-2 점수 순위(정렬 고르기)",
    samplePath: SAMPLE_CHIP,
    livePath: LIVE_CHIP,
    api: "GET /rankings에 sort를 붙여 다시 받기",
    note: "위 화면에서 정렬 버튼(「점수 높은 순」)을 누르면 열려요.",
  },
];

/*
 * 검토용 목록(화면 그림에는 없는 페이지). 피그마 v3 【최종】 화면과 백엔드 v3 API를 기존 코드를 고치지 않고
 * `/v3` 아래 새 파일로만 붙여 본 것을 여기서 연다.
 */
export default function V3ReviewPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 bg-bg-page px-5 pt-[calc(var(--safe-top)+20px)] pb-10 break-keep">
      <div className="flex flex-col gap-2">
        <h1 className="text-title1 text-text-strong">v3 검토용 화면</h1>
        <p className="text-body2 text-text-sub">
          피그마 v3 【최종】 화면에 백엔드 v3 API를 붙여 본 묶음이에요. 기존
          화면과 파일은 그대로이고, 이 주소(/v3) 아래에만 있어요.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-section text-text-strong">화면</h2>
        <ul className="flex flex-col gap-3">
          {SCREENS.map((screen) => (
            <li
              key={screen.name}
              className="flex flex-col gap-2 rounded-md border border-line-default p-4"
            >
              <p className="text-body1-bold text-text-strong">{screen.name}</p>
              <p className="text-caption text-text-sub">{screen.api}</p>
              {screen.note && (
                <p className="text-caption text-text-sub">{screen.note}</p>
              )}
              <div className="flex gap-4 text-body2-medium text-brand-link">
                <Link href={`${screen.samplePath}?sample=1`}>
                  예시 자료로 열기 ›
                </Link>
                <Link href={screen.livePath}>실제 서버로 열기 ›</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-section text-text-strong">실제 서버 응답</h2>
        <p className="text-body2 text-text-sub">
          이 페이지를 열 때 실제 서버를 한 번씩 불러 본 결과예요. 200이 아니면
          「실제 서버로 열기」에서 「순위를 불러오지 못했어요」가 보여요.
        </p>
        <ApiStatus />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-section text-text-strong">예시 자료</h2>
        <p className="text-body2 text-text-sub">
          「예시 자료로 열기」는 서버 응답과 같은 모양의 예시 값을 같은 API
          함수와 mapper에 태워 그려요. 제품 이름과 점수는 화면 그림의 예시
          값이고 실제 제품 값이 아니에요.
        </p>
      </section>
    </main>
  );
}
