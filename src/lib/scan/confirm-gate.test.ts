import { describe, expect, it } from "vitest";
import { createConfirmGate } from "@/lib/scan/confirm-gate";

const THRESHOLD = 3;
const RELEASE_MS = 1000;
/** 실기기 한 사이클(detect 소요 + 휴식 100ms)에 가까운 간격. */
const FRAME_MS = 200;

/** `values`를 FRAME_MS 간격으로 넣고 확정된 값만 모은다. */
function feed(
  gate: ReturnType<typeof createConfirmGate>,
  values: string[],
  start: number,
) {
  const confirmed: string[] = [];
  values.forEach((value, i) => {
    const hit = gate.push(value, start + i * FRAME_MS);
    if (hit) confirmed.push(hit);
  });
  return { confirmed, end: start + (values.length - 1) * FRAME_MS };
}

const gate = () =>
  createConfirmGate({ threshold: THRESHOLD, releaseMs: RELEASE_MS });

describe("연속 확정", () => {
  it("같은 값이 threshold번 연속으로 와야 확정한다", () => {
    const g = gate();
    expect(g.push("A", 0)).toBeNull();
    expect(g.push("A", 200)).toBeNull();
    expect(g.push("A", 400)).toBe("A");
  });

  it("중간에 다른 값이 끼면 처음부터 다시 센다", () => {
    expect(feed(gate(), ["A", "A", "X", "A", "A"], 0).confirmed).toEqual([]);
  });
});

describe("재발화 억제", () => {
  it("같은 상품을 계속 비추는 동안에는 한 번만 방출한다", () => {
    const frames = Array.from({ length: 50 }, () => "A");
    expect(feed(gate(), frames, 0).confirmed).toEqual(["A"]);
  });

  it("다른 상품은 간격 없이 바로 확정한다", () => {
    expect(feed(gate(), ["A", "A", "A", "B", "B", "B"], 0).confirmed).toEqual([
      "A",
      "B",
    ]);
  });

  it("A → B → A를 연달아 비추면 A를 다시 확정한다", () => {
    const { confirmed } = feed(
      gate(),
      ["A", "A", "A", "B", "B", "B", "A", "A", "A"],
      0,
    );
    expect(confirmed).toEqual(["A", "B", "A"]);
  });
});

describe("다시 비추면 풀림", () => {
  it("리뷰 재현 — A 확정 → 다른 입력으로 시간이 흐름 → 다시 A를 비추면 확정한다", () => {
    const g = gate();
    const first = feed(g, ["A", "A", "A"], 0);
    // 직접 입력하는 몇 초 동안 카메라에는 아무것도 잡히지 않았다.
    const again = feed(g, ["A", "A", "A"], first.end + 5000);
    expect([...first.confirmed, ...again.confirmed]).toEqual(["A", "A"]);
  });

  it("다른 값만 잡히는 동안에도 확정값의 부재 시간은 흐른다", () => {
    const g = gate();
    const first = feed(g, ["A", "A", "A"], 0);
    // 직접 입력하는 약 5초 동안 카메라에는 다른 바코드와 잘못 읽은 값만 번갈아 잡혔다.
    // 둘이 번갈아 와서 어느 쪽도 확정되지 않는다.
    const others = feed(
      g,
      Array.from({ length: 25 }, (_, i) => (i % 2 ? "X" : "Y")),
      first.end + FRAME_MS,
    );
    expect(others.confirmed).toEqual([]);

    const again = feed(g, ["A", "A", "A"], others.end + FRAME_MS);
    expect(again.confirmed).toEqual(["A"]);
  });

  it("풀린 뒤에도 바로 방출하지 않고 threshold번을 다시 채운다", () => {
    const g = gate();
    const { end } = feed(g, ["A", "A", "A"], 0);
    expect(g.push("A", end + RELEASE_MS)).toBeNull();
    expect(g.push("A", end + RELEASE_MS + FRAME_MS)).toBeNull();
    expect(g.push("A", end + RELEASE_MS + FRAME_MS * 2)).toBe("A");
  });

  it("releaseMs보다 짧게 끊겼다면 같은 상품을 계속 든 것으로 본다", () => {
    const g = gate();
    const { end } = feed(g, ["A", "A", "A"], 0);
    const resumed = feed(g, ["A", "A", "A"], end + RELEASE_MS - 1);
    expect(resumed.confirmed).toEqual([]);
  });

  it("계속 비추는 동안에는 누적 시간이 길어도 풀리지 않는다", () => {
    const frames = Array.from({ length: 100 }, () => "A"); // 약 20초
    expect(feed(gate(), frames, 0).confirmed).toEqual(["A"]);
  });
});
