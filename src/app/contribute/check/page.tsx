import type { Metadata } from "next";

import { FIXTURE_NO_SCORE, fixtureReading } from "../_fixtures";
import { passThrough } from "../pass-through";
import { CheckForm } from "./check-form";

export const metadata: Metadata = { title: "읽은 값 확인" };

/*
 * 3-8 읽은 값 확인. 3-7에서 찍거나 고른 사진(앱 안 메모리)과 3-7이 이어 넘긴 값(`name` · `brand` · `gtin` · `product`)을 받는다.
 * 제품 이름 칸은 3-6 제품 요청하기에서 적은 브랜드 · 이름, 3-6 전체 화면에서 왔으면 그 제품 이름으로 채운다(메모).
 * 미리 보기 주소 값은 `fixtureReading` 참고
 */
export default async function CheckPage({
  searchParams,
}: PageProps<"/contribute/check">) {
  const query = await searchParams;
  const text = (key: string) => {
    const value = query[key];
    return typeof value === "string" ? value.trim() : "";
  };

  const product = FIXTURE_NO_SCORE[text("product")];
  const initialName = product
    ? [product.brand, product.name].filter(Boolean).join(" ")
    : [text("brand"), text("name")].filter(Boolean).join(" ");
  // 3-7로 돌아갈 때 · 3-9로 갈 때 같은 값을 넘긴다
  const { query: nextQuery, gtin, labelHref } = passThrough(query);

  return (
    <CheckForm
      // 미리 보기 값만 바꿔 옮겨도 읽은 값부터 다시 채운다
      key={text("state")}
      reading={fixtureReading(text("state") || undefined)}
      initialName={initialName}
      gtin={gtin}
      labelHref={labelHref}
      nextQuery={nextQuery}
      failPreview={text("state") === "failed"}
    />
  );
}
