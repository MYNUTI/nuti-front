import type { Metadata } from "next";

import { toGtin14 } from "@/lib/scan/gtin";

import { RequestForm } from "./request-form";
import { NAME_MAX_LENGTH } from "./request-input";

export const metadata: Metadata = { title: "제품 요청하기" };

/*
 * 3-6 제품 요청하기(【최종】 ⑦ 9306:21612). 오는 곳: 3-6 카메라 위 시트(`?gtin=`), 2-1 홈 · 2-4 · 2-4b의 「제품 요청하기」
 * (2-4 · 2-4b는 검색어를 `?name=`으로 넘겨 이름 칸을 채우고, 요청에 「어디서 왔는지 검색어」로도 싣는다).
 * 미리 보기 주소 값: ?state=failed — 「보내지 못했어요…」
 */
export default async function RequestPage({
  searchParams,
}: PageProps<"/contribute/request">) {
  const { name, gtin, state } = await searchParams;
  const keyword = typeof name === "string" ? name.trim() : "";
  return (
    <RequestForm
      // 주소를 손으로 고쳐 길게 넣으면 서버가 거절해 이름 칸 길이로 자른다(검색어는 30자라 보통은 그대로)
      initialName={keyword.slice(0, NAME_MAX_LENGTH)}
      originKeyword={keyword || null}
      gtin={
        typeof gtin === "string" && /^\d{8,14}$/.test(gtin)
          ? toGtin14(gtin)
          : null
      }
      failPreview={state === "failed"}
    />
  );
}
