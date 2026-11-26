import { describe, expect, it } from "vitest";

import { dayLabel, groupByDay, seoulDay } from "./history-days";

describe("seoulDay", () => {
  it("한국 날짜로 바꾼다(UTC 15시 = 다음 날 0시)", () => {
    expect(seoulDay("2026-11-25T14:59:00Z")).toBe("2026-11-25");
    expect(seoulDay("2026-11-25T15:00:00Z")).toBe("2026-11-26");
  });
});

describe("dayLabel", () => {
  it("오늘 · 어제 · 그 전은 월 일", () => {
    expect(dayLabel("2026-11-26", "2026-11-26")).toBe("오늘");
    expect(dayLabel("2026-11-25", "2026-11-26")).toBe("어제");
    expect(dayLabel("2026-11-03", "2026-11-26")).toBe("11월 3일");
  });

  it("지난해 날짜는 연도를 붙인다 · 미래 날짜는 월 일", () => {
    expect(dayLabel("2025-12-03", "2026-11-26")).toBe("2025년 12월 3일");
    expect(dayLabel("2026-11-27", "2026-11-26")).toBe("11월 27일");
  });

  it("달 · 해가 바뀌는 어제", () => {
    expect(dayLabel("2026-11-30", "2026-12-01")).toBe("어제");
    expect(dayLabel("2026-12-31", "2027-01-01")).toBe("어제");
  });
});

describe("groupByDay", () => {
  it("한국 자정 바로 뒤의 now는 그날이 오늘", () => {
    // 한국 11-26 00:00:30 = UTC 11-25 15:00:30
    const groups = groupByDay(
      [
        { viewedAt: "2026-11-25T15:00:10Z" },
        { viewedAt: "2026-11-25T14:59:50Z" },
      ],
      new Date("2026-11-25T15:00:30Z"),
    );
    expect(groups.map((g) => g.label)).toEqual(["오늘", "어제"]);
  });

  it("같은 날이 떨어져 와도 한 묶음으로", () => {
    const groups = groupByDay(
      [
        { id: "a", viewedAt: "2026-11-26T01:00:00Z" },
        { id: "b", viewedAt: "2026-11-24T01:00:00Z" },
        { id: "c", viewedAt: "2026-11-26T00:00:00Z" },
      ],
      new Date("2026-11-26T03:00:00Z"),
    );
    expect(
      groups.map((g) => [g.label, g.items.map((i) => i.id).join("")]),
    ).toEqual([
      ["오늘", "ac"],
      ["11월 24일", "b"],
    ]);
  });

  it("최근 순서를 지키며 같은 날끼리 묶는다", () => {
    const now = new Date("2026-11-26T03:00:00Z");
    const groups = groupByDay(
      [
        { id: "a", viewedAt: "2026-11-26T01:00:00Z" },
        { id: "b", viewedAt: "2026-11-25T20:00:00Z" },
        { id: "c", viewedAt: "2026-11-25T10:00:00Z" },
        { id: "d", viewedAt: "2026-11-20T10:00:00Z" },
      ],
      now,
    );
    expect(
      groups.map((g) => [g.label, g.items.map((i) => i.id).join("")]),
    ).toEqual([
      ["오늘", "ab"],
      ["어제", "c"],
      ["11월 20일", "d"],
    ]);
  });
});
