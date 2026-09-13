import { describe, expect, it } from "vitest";
import {
  initialState,
  reduce,
  type ScanEvent,
  type ScanState,
} from "@/lib/scan/machine";
import type { CameraErrorKind, LensChoice } from "@/lib/scan/types";

const LENS: LensChoice = {
  deviceId: "back-main",
  label: "camera2 0, facing back",
  reason: "lowest-index",
  candidates: [],
};

const run = (events: ScanEvent[], from: ScanState = initialState) =>
  events.reduce(reduce, from);

const CAMERA = run([{ type: "LENS_RESOLVED", lens: LENS }]);

/** 카메라를 열지 못한 원인 중 사진 폴백으로 보내야 하는 것들. */
const TO_PHOTO: CameraErrorKind[] = [
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

describe("카메라 실패 — 자동 전환", () => {
  it.each(TO_PHOTO)("%s는 사진 폴백으로 자동 전환한다", (kind) => {
    expect(run([{ type: "CAMERA_ERROR", kind }], CAMERA)).toEqual({
      stage: "photo",
      reason: "camera-failed",
      failed: false,
    });
  });

  it("WASM 실패는 사진을 건너뛰고 수동 입력으로 간다 — 사진도 같은 WASM을 쓴다", () => {
    expect(
      run([{ type: "CAMERA_ERROR", kind: "wasm-failed" }], CAMERA),
    ).toEqual({ stage: "manual", reason: "wasm-failed" });
  });

  it("점유 중은 폴백하지 않고 재시도를 안내한다", () => {
    expect(run([{ type: "CAMERA_ERROR", kind: "in-use" }], CAMERA)).toEqual({
      stage: "camera",
      lens: LENS,
      stuck: false,
      retryable: "in-use",
    });
  });

  it("재시도하면 안내가 걷힌다", () => {
    const stuck = run(
      [
        { type: "STUCK_TIMEOUT" },
        { type: "CAMERA_ERROR", kind: "in-use" },
        { type: "RETRY_CAMERA" },
      ],
      CAMERA,
    );
    expect(stuck).toEqual({
      stage: "camera",
      lens: LENS,
      stuck: false,
      retryable: null,
    });
  });

  it("렌즈 프로브 중 실패해도 폴백한다 — 프로브도 getUserMedia를 쓴다", () => {
    expect(
      run([{ type: "CAMERA_ERROR", kind: "permission-denied" }]).stage,
    ).toBe("photo");
  });

  it("프로브 중 점유 에러도 사진으로 보내지 않는다 — 카메라를 놓아주면 이어갈 수 있다", () => {
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

describe("카메라는 열렸는데 못 읽음", () => {
  it("15초가 지나도 자동 전환하지 않고 버튼만 노출한다", () => {
    const state = run([{ type: "STUCK_TIMEOUT" }], CAMERA);
    expect(state).toEqual({
      stage: "camera",
      lens: LENS,
      stuck: true,
      retryable: null,
    });
  });

  it("사용자가 버튼을 눌러야 사진으로 넘어간다", () => {
    const state = run(
      [{ type: "STUCK_TIMEOUT" }, { type: "GO_PHOTO" }],
      CAMERA,
    );
    expect(state).toEqual({
      stage: "photo",
      reason: "user-chose",
      failed: false,
    });
  });

  it("타임아웃이 늦게 도착해도 이미 떠난 단계를 되돌리지 않는다", () => {
    const photo = run([{ type: "GO_PHOTO" }], CAMERA);
    expect(run([{ type: "STUCK_TIMEOUT" }], photo)).toBe(photo);
  });
});

describe("사진 · 수동 입력", () => {
  const PHOTO = run([{ type: "GO_PHOTO" }], CAMERA);

  it("사진에서 못 찾아도 단계를 유지한다 — 다시 찍을 수 있어야 한다", () => {
    expect(run([{ type: "PHOTO_FAILED" }], PHOTO)).toEqual({
      stage: "photo",
      reason: "user-chose",
      failed: true,
    });
  });

  it("다시 찍으면 실패 표시가 걷힌다", () => {
    const state = run(
      [{ type: "PHOTO_FAILED" }, { type: "RETRY_PHOTO" }],
      PHOTO,
    );
    expect(state).toEqual({
      stage: "photo",
      reason: "user-chose",
      failed: false,
    });
  });

  it("사진을 포기해야 수동 입력으로 넘어간다", () => {
    expect(
      run([{ type: "PHOTO_FAILED" }, { type: "GO_MANUAL" }], PHOTO),
    ).toEqual({ stage: "manual", reason: "photo-failed" });
  });

  it("찍어보지 않고 건너뛴 것과 못 찾아서 넘어온 것을 구분한다", () => {
    expect(run([{ type: "GO_MANUAL" }], PHOTO).stage).toBe("manual");
    expect(run([{ type: "GO_MANUAL" }], PHOTO)).toEqual({
      stage: "manual",
      reason: "user-chose",
    });
  });

  it("카메라 단계에서도 곧바로 수동 입력으로 갈 수 있다", () => {
    expect(run([{ type: "GO_MANUAL" }], CAMERA)).toEqual({
      stage: "manual",
      reason: "user-chose",
    });
  });

  it("수동 입력 단계에서는 전환 이유를 덮어쓰지 않는다", () => {
    const manual = run(
      [{ type: "PHOTO_FAILED" }, { type: "GO_MANUAL" }],
      PHOTO,
    );
    expect(run([{ type: "GO_MANUAL" }], manual)).toBe(manual);
  });

  it("수동 입력에 도달한 뒤에는 늦은 카메라 에러가 되돌리지 않는다", () => {
    const manual = run([{ type: "GO_MANUAL" }], CAMERA);
    expect(run([{ type: "CAMERA_ERROR", kind: "no-camera" }], manual)).toBe(
      manual,
    );
  });

  it("늦게 도착한 사진 실패가 수동 입력을 되돌리지 않는다", () => {
    const manual = run([{ type: "GO_MANUAL" }], PHOTO);
    expect(run([{ type: "PHOTO_FAILED" }], manual)).toBe(manual);
  });
});
