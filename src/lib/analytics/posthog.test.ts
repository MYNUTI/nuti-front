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
    expect(maskSensitiveText("계정 user.name+1@gmail.com 로그인")).toBe(
      "계정 *** 로그인",
    );
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

  it("클릭 기록은 버튼 글자를 남기고 목표 · 몸 정보 · 이메일 낱말만 가린다", () => {
    const result = sanitizeEvent(
      event("$autocapture", {
        $pathname: "/my",
        $el_text: "다이어트로 보기",
        $elements_chain:
          'button:text="키 172cm 몸무게 64kg"nth-child="1";a:text="user@mail.com"nth-child="2";div:text="다음"',
        $elements: [
          { tag_name: "button", $el_text: "근육 증가", text: "1998년생" },
          { tag_name: "a", $el_text: "다음" },
          null,
        ],
      }),
    );
    expect(result?.properties.$el_text).toBe("***로 보기");
    expect(result?.properties.$elements_chain).toBe(
      'button:text="키 *** 몸무게 ***"nth-child="1";a:text="***"nth-child="2";div:text="다음"',
    );
    const elements = result?.properties.$elements as Record<string, unknown>[];
    expect(elements[0]).toEqual({
      tag_name: "button",
      $el_text: "***",
      text: "***",
    });
    expect(elements[1].$el_text).toBe("다음");
  });

  it("255자에서 잘린 클릭 글자는 가린 뒤 끝 세 조각을 버린다(띄어 쓴 몸 정보 · 낱말 · 이메일)", () => {
    // SDK 처럼 빈칸 하나로 이어진 글자를 255자에서 자른다
    const head = "가나다 ".repeat(62); // 248자
    const cut = (tail: string) => (head + tail).slice(0, 255);
    const leaks: [string, RegExp][] = [
      [cut("키 172 cm"), /172/],
      [cut("2000 kcal 기준"), /2000|kcal/],
      [cut("목표 다이어트"), /다이/],
      [cut("o'connor@example.com"), /connor|@/],
    ];
    for (const [text, leak] of leaks) {
      expect(text.length).toBe(255);
      const result = sanitizeEvent(
        event("$autocapture", {
          $pathname: "/product/3",
          $el_text: text,
          $elements_chain: `p:text="${text}"nth-child="1"`,
        }),
      );
      expect(result?.properties.$el_text).not.toMatch(leak);
      expect(result?.properties.$el_text).toMatch(/^가나다/);
      expect(result?.properties.$elements_chain).not.toMatch(leak);
    }
  });

  it("작은따옴표가 든 이메일도 통째로 가린다", () => {
    expect(maskSensitiveText("o'connor@example.com 로그인")).toBe("*** 로그인");
  });

  it("버튼 이름 같은 보통 글자는 그대로 보낸다", () => {
    const result = sanitizeEvent(
      event("$rageclick", {
        $pathname: "/product/3",
        $el_text: "쿠팡에서 보기",
        $elements_chain: 'button:text="쿠팡에서 보기"nth-child="1"',
      }),
    );
    expect(result?.properties.$el_text).toBe("쿠팡에서 보기");
    expect(result?.properties.$elements_chain).toBe(
      'button:text="쿠팡에서 보기"nth-child="1"',
    );
  });
});

describe("isSensitivePath", () => {
  it("목표 · 몸 정보 화면과 그 아래만", () => {
    expect(isSensitivePath("/intro/goal")).toBe(true);
    expect(isSensitivePath("/my/goal/edit")).toBe(true);
    expect(isSensitivePath("/login/goal")).toBe(true);
    expect(isSensitivePath("/my/body")).toBe(true);
    expect(isSensitivePath("/my/bodyguard")).toBe(false);
    expect(isSensitivePath("/intro/goalkeeper")).toBe(false);
    expect(isSensitivePath("/home")).toBe(false);
  });
});

describe("posthogConfig", () => {
  it("EU 서버 · 입력 가림 · 콘솔 · 네트워크 기록 끔 · 클릭 글자는 보내고 속성은 안 보냄", () => {
    const config = posthogConfig();
    expect(config.api_host).toBe("https://eu.i.posthog.com");
    // 클릭 글자는 before_send(sanitizeEvent)에서 낱말을 가린 뒤 보낸다
    expect(config.mask_all_text).toBe(false);
    expect(config.mask_all_element_attributes).toBe(true);
    expect(config.enable_recording_console_log).toBe(false);
    expect(config.capture_performance).toBe(false);
    expect(config.session_recording?.maskAllInputs).toBe(true);
    expect(config.session_recording?.recordBody).toBe(false);
    expect(config.before_send).toBe(sanitizeEvent);
  });
});
