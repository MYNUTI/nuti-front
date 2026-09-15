import { describe, expect, it } from "vitest";
import {
  initialState,
  reduce,
  type CameraUnavailableReason,
  type ScanEvent,
  type ScanState,
} from "@/lib/scan/machine";
import type { LensChoice } from "@/lib/scan/types";

const LENS: LensChoice = {
  deviceId: "back-main",
  label: "camera2 0, facing back",
  reason: "lowest-index",
  candidates: [],
};

const run = (events: ScanEvent[], from: ScanState = initialState) =>
  events.reduce(reduce, from);

const CAMERA = run([{ type: "LENS_RESOLVED", lens: LENS }]);

const TO_PHOTO: CameraUnavailableReason[] = [
  "permission-denied",
  "no-camera",
  "overconstrained",
  "insecure-context",
  "unknown",
];

describe("렌즈 확정", () => {
  it("probing에서 시작한다 — 렌즈가 정해지기 전에는 카메라를 열지 않는다", () => {
    expect(initialState).toEqual({ stage: "probing", retryable: null });
  });

  it("렌즈가 정해지면 카메라로 넘어간다", () => {
    expect(CAMERA).toEqual({
      stage: "camera",
      lens: LENS,
      stuck: false,
      retryable: null,
    });
  });

  it("이미 카메라 단계면 렌즈 재확정을 무시한다", () => {
    expect(run([{ type: "LENS_RESOLVED", lens: LENS }], CAMERA)).toBe(CAMERA);
  });
});

describe("카메라를 열지 못함 — 유일한 자동 전환", () => {
  it.each(TO_PHOTO)("%s는 원인을 담아 photo로 전환한다", (kind) => {
    expect(run([{ type: "CAMERA_ERROR", kind }], CAMERA)).toEqual({
      stage: "photo",
      reason: kind,
    });
  });

  it("렌즈 프로브 중 실패해도 전환한다 — 프로브도 getUserMedia를 쓴다", () => {
    expect(run([{ type: "CAMERA_ERROR", kind: "permission-denied" }])).toEqual({
      stage: "photo",
      reason: "permission-denied",
    });
  });

  it("WASM 실패는 사진을 건너뛰고 manual로 간다 — 사진도 같은 WASM을 쓴다", () => {
    expect(
      run([{ type: "CAMERA_ERROR", kind: "wasm-failed" }], CAMERA),
    ).toEqual({ stage: "manual" });
  });
});

describe("점유 에러 — 폴백하지 않고 재시도", () => {
  it("카메라 단계에서 재시도를 안내한다", () => {
    expect(run([{ type: "CAMERA_ERROR", kind: "in-use" }], CAMERA)).toEqual({
      stage: "camera",
      lens: LENS,
      stuck: false,
      retryable: "in-use",
    });
  });

  it("재시도하면 안내와 stuck이 함께 걷힌다", () => {
    const state = run(
      [
        { type: "STUCK_TIMEOUT" },
        { type: "CAMERA_ERROR", kind: "in-use" },
        { type: "RETRY_CAMERA" },
      ],
      CAMERA,
    );
    expect(state).toEqual(CAMERA);
  });

  it("프로브 중이어도 사진으로 보내지 않는다 — 카메라를 놓아주면 이어갈 수 있다", () => {
    expect(run([{ type: "CAMERA_ERROR", kind: "in-use" }])).toEqual({
      stage: "probing",
      retryable: "in-use",
    });
  });

  it("프로브 중 점유에서 재시도하면 렌즈 확정을 이어간다", () => {
    const state = run([
      { type: "CAMERA_ERROR", kind: "in-use" },
      { type: "RETRY_CAMERA" },
      { type: "LENS_RESOLVED", lens: LENS },
    ]);
    expect(state.stage).toBe("camera");
  });
});

describe("열렸는데 못 읽음", () => {
  it("15초가 지나도 전환하지 않고 안내 플래그만 세운다", () => {
    expect(run([{ type: "STUCK_TIMEOUT" }], CAMERA)).toEqual({
      ...CAMERA,
      stuck: true,
    });
  });
});

describe("늦게 도착한 이벤트", () => {
  const PHOTO = run([{ type: "CAMERA_ERROR", kind: "no-camera" }], CAMERA);
  const MANUAL = run([{ type: "CAMERA_ERROR", kind: "wasm-failed" }], CAMERA);

  it.each([
    ["photo", PHOTO],
    ["manual", MANUAL],
  ])("%s 단계는 늦은 이벤트로 되돌아가지 않는다", (_, from) => {
    for (const event of [
      { type: "STUCK_TIMEOUT" },
      { type: "RETRY_CAMERA" },
      { type: "LENS_RESOLVED", lens: LENS },
      { type: "CAMERA_ERROR", kind: "permission-denied" },
    ] satisfies ScanEvent[]) {
      expect(reduce(from, event)).toBe(from);
    }
  });
});
