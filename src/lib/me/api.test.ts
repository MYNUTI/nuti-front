import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  deleteUser,
  fetchMeSettings,
  fetchMeSummary,
  fetchPolicies,
  fetchUser,
  patchMeSettings,
} from "@/lib/me/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

const settings = {
  clipboardLinkDetection: false,
  goal: { code: "GENERAL", label: "일반" },
  policies: {},
  appVersion: "2.0.0-web",
};

describe("마이·설정 API", () => {
  it("조회 경로", async () => {
    const summary = client({
      isLoggedIn: false,
      goal: { code: "GENERAL", label: "일반" },
      recordCount: 0,
      contribution: { requestCount: 0, publishedCount: 0 },
    });
    await fetchMeSummary(summary.http);
    const user = client({
      id: 1,
      email: null,
      nickname: "n",
      provider: "GOOGLE",
      role: "USER",
      createdAt: "t",
    });
    await fetchUser(user.http);
    const meSettings = client(settings);
    await fetchMeSettings(meSettings.http);
    const policies = client({});
    await fetchPolicies(policies.http);
    expect(
      [summary, user, meSettings, policies].map(
        ({ requests }) => requests[0].url,
      ),
    ).toEqual(["/me/summary", "/users/me", "/me/settings", "/meta/policies"]);
  });

  it("설정 변경은 바꿀 항목만 PATCH로 보낸다", async () => {
    const { http, requests } = client(settings);
    await patchMeSettings(http, { clipboardLinkDetection: false });
    expect(requests[0]).toMatchObject({ method: "patch", url: "/me/settings" });
    expect(JSON.parse(requests[0].data as string)).toEqual({
      clipboardLinkDetection: false,
    });
  });

  it("탈퇴 사유는 query로 보낸다", async () => {
    const { http, requests } = client(undefined);
    await deleteUser(http, "안 써요");
    await deleteUser(http);
    expect(requests[0].method).toBe("delete");
    expect(http.getUri(requests[0])).toBe(
      "/users/me?reason=%EC%95%88+%EC%8D%A8%EC%9A%94",
    );
    expect(http.getUri(requests[1])).toBe("/users/me");
  });
});
