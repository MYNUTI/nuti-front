import type { Metadata } from "next";

import { passThrough } from "../pass-through";
import { LabelCamera } from "./label-camera";

export const metadata: Metadata = { title: "영양성분표 찍기" };

/*
 * 3-7 영양성분표 찍기. 오는 곳: 3-6 「영양성분표 찍고 점수 보기」(`?gtin=` · `?product=`), 3-6 제품 요청하기
 * 「사진 추가」(`?name=` · `?brand=` · `?gtin=`), 3-1 바코드를 못 읽었을 때, 2-4b. 받은 값은 3-8로 이어 넘긴다.
 * 미리 보기 `?state=unreadable` — 사진을 읽지 못해 3-8 대신 3-7x로 간다
 */
export default async function LabelPage({
  searchParams,
}: PageProps<"/contribute/label">) {
  const query = await searchParams;
  return (
    <LabelCamera
      nextQuery={passThrough(query).query}
      readFails={query.state === "unreadable"}
    />
  );
}
