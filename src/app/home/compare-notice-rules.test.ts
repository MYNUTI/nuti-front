import { describe, expect, it } from "vitest";

import {
  addedLabel,
  compareNotice,
  NOTICE_AFTER_MS,
} from "./compare-notice-rules";

// 2026-11-24 12:00 한국 시간
const NOW = Date.UTC(2026, 10, 24, 3);
const HOUR = 60 * 60 * 1000;

describe("compareNotice", () => {
  it("비교함이 비었거나 담은 지 24시간이 안 됐으면 띄우지 않는다", () => {
    expect(compareNotice([], NOW, null)).toBeNull();
    expect(
      compareNotice([{ addedAt: NOW - NOTICE_AFTER_MS + 1 }], NOW, null),
    ).toBeNull();
  });

  it("가장 먼저 담은 제품이 24시간을 넘으면 개수와 함께 띄운다", () => {
    expect(
      compareNotice(
        [{ addedAt: NOW - HOUR }, { addedAt: NOW - 30 * HOUR }],
        NOW,
        null,
      ),
    ).toEqual({ addedLabel: "어제", count: 2 });
  });

  it("정확히 24시간이면 띄운다", () => {
    expect(
      compareNotice([{ addedAt: NOW - NOTICE_AFTER_MS }], NOW, null),
    ).not.toBeNull();
  });

  it("띄운 뒤에는 그때 있던 제품이 남아 있는 한 다시 띄우지 않는다", () => {
    const seenAt = NOW - 2 * HOUR;
    expect(
      compareNotice([{ addedAt: NOW - 30 * HOUR }], NOW, seenAt),
    ).toBeNull();
    // 가장 먼저 담은 제품을 빼도 같은 묶음이다
    expect(
      compareNotice([{ addedAt: NOW - 28 * HOUR }], NOW, seenAt),
    ).toBeNull();
    // 띄운 뒤에 더 담아도 같은 묶음이다
    expect(
      compareNotice(
        [{ addedAt: NOW - 28 * HOUR }, { addedAt: NOW - HOUR }],
        NOW,
        seenAt,
      ),
    ).toBeNull();
  });

  it("비우고 새로 담은 묶음은 24시간 뒤 다시 띄운다", () => {
    expect(
      compareNotice([{ addedAt: NOW - 25 * HOUR }], NOW, NOW - 30 * HOUR),
    ).not.toBeNull();
  });
});

describe("addedLabel", () => {
  it("한국 날짜로 하루 전이면 「어제」, 그 전이면 「N일 전에」", () => {
    expect(addedLabel(NOW - 25 * HOUR, NOW)).toBe("어제");
    expect(addedLabel(NOW - 3 * 24 * HOUR, NOW)).toBe("3일 전에");
  });

  it("한국 자정을 넘긴 시각을 날짜 경계로 센다(UTC 날짜가 같아도)", () => {
    // 한국 11-23 08:00(UTC 11-22 23:00)에 담고 한국 11-24 09:30(UTC 11-24 00:30)에 연다
    const at = Date.UTC(2026, 10, 22, 23);
    const now = Date.UTC(2026, 10, 24, 0, 30);
    expect(addedLabel(at, now)).toBe("어제");
  });
});
