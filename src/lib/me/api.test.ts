import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  deleteUser,
  fetchMeSettings,
  fetchMeSummary,
  fetchPolicies,
  fetchUser,
} from "@/lib/me/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

const settings = {
  goal: { code: "WEIGHT_LOSS", label: "체중 감량" },
  policies: {},
  appVersion: "2.0.0-web",
};

describe("마이·설정 API", () => {
  it("조회 경로", async () => {
    const summary = client({
      isLoggedIn: false,
      goal: { code: "WEIGHT_LOSS", label: "체중 감량" },
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

  it("탈퇴는 사유 없이 DELETE로 보낸다", async () => {
    const { http, requests } = client(undefined);
    await deleteUser(http);
    expect(requests[0].method).toBe("delete");
    expect(http.getUri(requests[0])).toBe("/users/me");
  });
});
