import type { CaptureResult, CapturedNetworkRequest } from "posthog-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getPosthogKey,
  isSensitivePath,
  maskAttribute,
  maskNetworkRequest,
  maskSensitiveText,
  posthogConfig,
  sanitizeEvent,
  stripQuery,
} from "@/lib/analytics/posthog";

afterEach(() => {
  vi.unstubAllEnvs();
});

function event(
  name: string,
  properties: Record<string, unknown>,
  extra: Partial<CaptureResult> = {},
): CaptureResult {
  return { uuid: "u", event: name, properties, ...extra } as CaptureResult;
}

describe("getPosthogKey", () => {
  it("비어 있으면 null", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    expect(getPosthogKey()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    expect(getPosthogKey()).toBe("phc_test");
  });
});

describe("stripQuery", () => {
  it("절대 · 상대 주소 모두 「?」 · 「#」 뒤를 뺀다", () => {
    expect(stripQuery("https://nutriuniv.co.kr/home?goal=diet#a")).toBe(
      "https://nutriuniv.co.kr/home",
    );
    expect(stripQuery("/product/3?goal=muscle&next=%2Fhome")).toBe(
      "/product/3",
    );
    expect(stripQuery("/history")).toBe("/history");
  });
});

describe("maskSensitiveText", () => {
  it("목표 이름 · 몸 정보 낱말만 늘 세 글자로 가린다", () => {
    expect(maskSensitiveText("다이어트 목표로 보고 있어요")).toBe(
      "*** 목표로 보고 있어요",
    );
    expect(maskSensitiveText("근육 증가로 보기")).toBe("***로 보기");
    expect(maskSensitiveText("체중 감량 기준으로")).toBe("*** 기준으로");
    expect(maskSensitiveText("키 172cm · 몸무게 64.5kg")).toBe(
      "키 *** · 몸무게 ***",
    );
    expect(maskSensitiveText("2,500kcal 기준으로 보기")).toBe("***으로 보기");
    expect(maskSensitiveText("1998년생")).toBe("***");
  });

  it("다른 글자는 그대로 둔다(제품 열량 포함)", () => {
    expect(maskSensitiveText("두유 190ml · 100g당 120kcal")).toBe(
      "두유 190ml · 100g당 120kcal",
    );
  });

  it("ph-mask 안의 글자는 통째로 가린다", () => {
    const element = {
      closest: (selector: string) => (selector === ".ph-mask" ? {} : null),
    } as unknown as HTMLElement;
    expect(maskSensitiveText("아무 글자", element)).toBe("***");
  });
});

describe("maskAttribute", () => {
  it("링크 · 양식 주소의 「?」 뒤를 뺀다", () => {
    expect(maskAttribute("href", "/home?goal=diet&guide=1")).toBe("/home");
    expect(maskAttribute("action", "/search?goal=muscle")).toBe("/search");
  });

  it("목표 그림 주소만 지우고 다른 그림 · 속성은 그대로", () => {
    expect(
      maskAttribute("src", "/_next/image?url=%2Fintro%2Fgoal-diet.png&w=80"),
    ).toBe("");
    expect(maskAttribute("srcset", "/intro/goal-muscle.png 2x")).toBe("");
    expect(maskAttribute("src", "/products/12.png")).toBe("/products/12.png");
    expect(maskAttribute("class", "flex goal")).toBe("flex goal");
  });
});

describe("maskNetworkRequest", () => {
  it("요청 · 화면 주소의 「?」 뒤를 뺀다", () => {
    const masked = maskNetworkRequest({
      name: "https://nutriuniv.co.kr/api/search?q=두유&goal=WEIGHT_LOSS",
    } as CapturedNetworkRequest);
    expect(masked.name).toBe("https://nutriuniv.co.kr/api/search");
  });
});

describe("sanitizeEvent", () => {
  it("주소 칸 전부(속성 · $set · $set_once)의 「?」 뒤를 뺀다", () => {
    const result = sanitizeEvent(
      event(
        "$pageview",
        {
          $current_url: "https://nutriuniv.co.kr/home?goal=diet",
          $referrer: "https://nutriuniv.co.kr/intro/goal?next=%2Fhome",
          $session_entry_url: "https://nutriuniv.co.kr/product/3?goal=muscle",
          $pathname: "/home",
          title: "홈?",
        },
        {
          $set: { $current_url: "https://nutriuniv.co.kr/a?goal=diet" },
          $set_once: { $initial_referrer: "https://x.com/?q=goal" },
        },
      ),
    );
    expect(result?.properties.$current_url).toBe(
      "https://nutriuniv.co.kr/home",
    );
    expect(result?.properties.$referrer).toBe(
      "https://nutriuniv.co.kr/intro/goal",
    );
    expect(result?.properties.$session_entry_url).toBe(
      "https://nutriuniv.co.kr/product/3",
    );
    // 주소 칸이 아니면 건드리지 않는다
    expect(result?.properties.title).toBe("홈?");
    expect(result?.$set?.$current_url).toBe("https://nutriuniv.co.kr/a");
    expect(result?.$set_once?.$initial_referrer).toBe("https://x.com/");
    expect(JSON.stringify(result)).not.toMatch(/goal=|WEIGHT_LOSS/);
  });

  it("녹화 묶음의 입력 기록 값을 가린다(고르기 칸 값 포함)", () => {
    const result = sanitizeEvent(
      event("$snapshot", {
        $snapshot_data: [
          {
            type: 3,
            data: { source: 5, text: "diet", isChecked: true, id: -1 },
          },
          { type: 3, data: { source: 2, x: 10, y: 20 } },
          { type: 2, data: "압축된 전체 화면" },
        ],
      }),
    );
    const records = result?.properties.$snapshot_data as {
      data: Record<string, unknown>;
    }[];
    expect(records[0].data.text).toBe("***");
    expect(records[0].data.isChecked).toBe(true);
    expect(records[1].data).toEqual({ source: 2, x: 10, y: 20 });
    expect(records[2].data).toBe("압축된 전체 화면");
  });

  it("목표를 고르는 화면의 클릭 · 히트맵은 버리고 화면 조회는 남긴다", () => {
    for (const name of [
      "$autocapture",
      "$rageclick",
      "$dead_click",
      "$$heatmap",
    ])
      expect(
        sanitizeEvent(event(name, { $pathname: "/intro/goal" })),
      ).toBeNull();
    expect(
      sanitizeEvent(event("$pageview", { $pathname: "/intro/goal" })),
    ).not.toBeNull();
    expect(
      sanitizeEvent(event("$autocapture", { $pathname: "/home" })),
    ).not.toBeNull();
  });
});

describe("isSensitivePath", () => {
  it("목표 화면과 그 아래만", () => {
    expect(isSensitivePath("/intro/goal")).toBe(true);
    expect(isSensitivePath("/my/goal/edit")).toBe(true);
    expect(isSensitivePath("/intro/goalkeeper")).toBe(false);
    expect(isSensitivePath("/home")).toBe(false);
  });
});

describe("posthogConfig", () => {
  it("EU 서버 · 입력 가림 · 콘솔 · 네트워크 기록 끔 · 클릭 글자와 속성 안 보냄", () => {
    const config = posthogConfig();
    expect(config.api_host).toBe("https://eu.i.posthog.com");
    expect(config.mask_all_text).toBe(true);
    expect(config.mask_all_element_attributes).toBe(true);
    expect(config.enable_recording_console_log).toBe(false);
    expect(config.capture_performance).toBe(false);
    expect(config.session_recording?.maskAllInputs).toBe(true);
    expect(config.session_recording?.recordBody).toBe(false);
    expect(config.before_send).toBe(sanitizeEvent);
  });
});
