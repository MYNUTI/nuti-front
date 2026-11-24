import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  fetchConsentItems,
  fetchMyConsents,
  putConsent,
} from "@/lib/consent/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

const marketing = {
  item: "MARKETING",
  label: "광고성 정보 수신",
  required: false,
  agreed: true,
  changedAt: "2026-11-24T10:00:00",
  termsVersion: "2026-11",
  privacyVersion: "2026-11",
  documentVersion: null,
};

describe("동의 API", () => {
  it("가입 동의 항목과 내 동의를 조회한다", async () => {
    const items = client({
      termsVersion: "2026-11",
      privacyVersion: "2026-11",
      items: [{ item: "AGE_14", label: "만 14세 이상", required: true }],
    });
    await expect(fetchConsentItems(items.http)).resolves.toMatchObject({
      termsVersion: "2026-11",
    });
    const mine = client({ items: [marketing] });
    await expect(fetchMyConsents(mine.http)).resolves.toEqual([marketing]);
    expect([items, mine].map(({ requests }) => requests[0].url)).toEqual([
      "/meta/consent-items",
      "/me/consents",
    ]);
  });

  it("선택 동의 변경은 항목을 경로에 넣고 바꿀 값을 PUT으로 보낸다", async () => {
    const { http, requests } = client({ items: [marketing] });
    await expect(
      putConsent(http, "MARKETING", { agreed: true }),
    ).resolves.toEqual([marketing]);
    expect(requests[0]).toMatchObject({
      method: "put",
      url: "/me/consents/MARKETING",
    });
    expect(JSON.parse(requests[0].data as string)).toEqual({ agreed: true });
  });
});
