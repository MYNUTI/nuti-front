import { describe, expect, it } from "vitest";

import {
  isChosungOnly,
  matchRange,
  particleRo,
  particleWa,
  toChosung,
} from "./hangul";

describe("toChosung", () => {
  it("한글 음절은 초성으로, 다른 글자는 그대로 둔다", () => {
    expect(toChosung("더단백 라떼 350ml")).toBe("ㄷㄷㅂ ㄹㄸ 350ml");
  });

  it("음절 범위 양끝(가 · 힣)과 쌍자음 초성, 범위 밖 자모", () => {
    expect(toChosung("가힣까")).toBe("ㄱㅎㄲ");
    expect(toChosung("ㅏ")).toBe("ㅏ");
  });
});

describe("isChosungOnly", () => {
  it("초성만 있을 때만 참", () => {
    expect(isChosungOnly("ㄷㄷㅂ")).toBe(true);
    expect(isChosungOnly("ㄷ단")).toBe(false);
    expect(isChosungOnly("")).toBe(false);
  });
});

describe("matchRange", () => {
  it("그대로 포함되면 그 자리를 돌려준다(영문 대소문자 무시)", () => {
    expect(matchRange("커클랜드 프로틴바 초콜릿", "프로틴바")).toEqual([5, 9]);
    expect(matchRange("PROTEIN BAR", "bar")).toEqual([8, 11]);
  });

  it("초성만 넣으면 초성이 같은 자리를 돌려준다(빈칸은 가리지 않는다)", () => {
    expect(matchRange("더단백 라떼", "ㄷㄷㅂ")).toEqual([0, 3]);
    expect(matchRange("더단백 라떼", "ㄷㄷㅂㄹ")).toEqual([0, 5]);
    expect(matchRange("더단백 라떼", "ㄷㄷㅂ ㄹ")).toEqual([0, 5]);
    expect(matchRange("꼬깔콘", "ㄲㄲ")).toEqual([0, 2]);
  });

  it("자모가 나뉘어 들어온 글자(NFD)도 합쳐서 맞춘다", () => {
    expect(matchRange("두유", "두유".normalize("NFD"))).toEqual([0, 2]);
  });

  it("없거나 빈 말이면 null", () => {
    expect(matchRange("두유", "콜라")).toBeNull();
    expect(matchRange("두유", "  ")).toBeNull();
    // 초성과 음절이 섞이면 초성 맞추기를 하지 않는다
    expect(matchRange("더단백 라떼", "ㄷ단")).toBeNull();
  });
});

describe("particleRo", () => {
  it("받침이 없거나 ㄹ 받침이면 「로」, 다른 받침이면 「으로」", () => {
    expect(particleRo("두유")).toBe("로");
    expect(particleRo("두부면 ")).toBe("으로");
    expect(particleRo("곤약 젤리")).toBe("로");
    expect(particleRo("콜")).toBe("로");
  });

  it("한글 음절로 끝나지 않으면 「(으)로」", () => {
    expect(particleRo("BAR")).toBe("(으)로");
    expect(particleRo("350")).toBe("(으)로");
    expect(particleRo("ㄷㄷㅂ")).toBe("(으)로");
  });
});

describe("particleWa", () => {
  it("받침이 없으면 「와」, 있으면 「과」, 한글로 끝나지 않으면 「(와)과」", () => {
    expect(particleWa("단백질 웨하스")).toBe("와");
    expect(particleWa("닭가슴살")).toBe("과");
    expect(particleWa("BAR")).toBe("(와)과");
  });

  it("ㄹ 받침은 「로」와 달리 「과」, 초성만이면 「(와)과」, 나뉜 글자(NFD)도 받침을 본다", () => {
    expect(particleWa("단백질")).toBe("과");
    expect(particleWa("ㄷㄷㅂ")).toBe("(와)과");
    expect(particleWa("닭가슴살".normalize("NFD"))).toBe("과");
  });
});
