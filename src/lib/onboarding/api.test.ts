import axios from "axios";
import { describe, expect, it } from "vitest";
import { fetchBootstrap } from "@/lib/onboarding/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

describe("bootstrap API", () => {
  it("bootstrap을 조회한다", async () => {
    const { http, requests } = client({
      isLoggedIn: false,
      goalAccountConsented: false,
      bodyProfileConsented: false,
      marketingConsented: false,
      goal: "WEIGHT_LOSS",
    });
    await expect(fetchBootstrap(http)).resolves.toMatchObject({
      currentPolicyVersion: null,
    });
    expect(requests[0]).toMatchObject({ method: "get", url: "/app/bootstrap" });
  });
});
