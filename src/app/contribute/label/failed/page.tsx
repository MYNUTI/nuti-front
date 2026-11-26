import type { Metadata } from "next";

import { fixtureUnreadReasons } from "../../_fixtures";
import { passThrough } from "../../pass-through";
import { UnreadScreen } from "./unread-screen";

export const metadata: Metadata = { title: "영양성분표를 다 읽지 못했어요" };

/*
 * 3-7x 영양성분표를 못 읽었을 때. 3-7에서 찍은 사진을 읽지 못하면 3-8 대신 온다. 3-7이 넘긴 값(`name` · `brand` ·
 * `gtin` · `product`)을 「다시 찍기」 때 그대로 돌려준다. 미리 보기 주소 값은 `fixtureUnreadReasons` 참고
 */
export default async function UnreadPage({
  searchParams,
}: PageProps<"/contribute/label/failed">) {
  const query = await searchParams;
  const text = (key: string) => {
    const value = query[key];
    return typeof value === "string" ? value.trim() : "";
  };
  const { gtin, labelHref } = passThrough(query);

  return (
    <UnreadScreen
      key={text("state")}
      reasons={fixtureUnreadReasons(text("state") || undefined)}
      gtin={gtin}
      labelHref={labelHref}
      failPreview={text("state") === "failed"}
    />
  );
}
