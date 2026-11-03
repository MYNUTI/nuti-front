import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  deleteHealthConsent,
  fetchBootstrap,
  fetchHealthConsent,
  fetchSamples,
  postHealthConsent,
  postOnboardingComplete,
  postPrivacyConsent,
} from "@/lib/onboarding/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

const body = (data: unknown) => JSON.parse(data as string);

describe("온보딩 API", () => {
  it("bootstrap을 조회한다", async () => {
    const { http, requests } = client({ goal: "GENERAL" });
    await expect(fetchBootstrap(http)).resolves.toMatchObject({
      currentPolicyVersion: null,
    });
    expect(requests[0]).toMatchObject({ method: "get", url: "/app/bootstrap" });
  });

  it("개인정보 동의는 정책 버전과 항목을 보낸다", async () => {
    const { http, requests } = client({ anonymousId: "anon-1", agreedAt: "t" });
    await postPrivacyConsent(http, {
      policyVersion: "v1",
      agreedItems: ["PERSONAL_INFO"],
    });
    expect(requests[0]).toMatchObject({
      method: "post",
      url: "/onboarding/consent",
    });
    expect(body(requests[0].data)).toEqual({
      policyVersion: "v1",
      agreedItems: ["PERSONAL_INFO"],
    });
  });

  it("건강정보 동의·조회·철회는 같은 경로를 쓴다", async () => {
    const { http, requests } = client({ healthConsented: false });
    await postHealthConsent(http, { policyVersion: "h1" });
    await fetchHealthConsent(http);
    await deleteHealthConsent(http);
    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ["post", "/me/health-consent"],
      ["get", "/me/health-consent"],
      ["delete", "/me/health-consent"],
    ]);
  });

  it("샘플은 size를 줄 때만 query로 보낸다", async () => {
    const { http, requests } = client({ items: [] });
    await fetchSamples(http);
    await fetchSamples(http, 12);
    expect(http.getUri(requests[0])).toBe("/onboarding/samples");
    expect(http.getUri(requests[1])).toBe("/onboarding/samples?size=12");
  });

  it("온보딩 완료는 본문 없이도 빈 객체를 보낸다", async () => {
    const { http, requests } = client({
      onboardingCompleted: true,
      completedAt: "t",
      persisted: true,
    });
    await postOnboardingComplete(http);
    expect(requests[0].url).toBe("/onboarding/complete");
    expect(body(requests[0].data)).toEqual({});
  });
});
