import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { toCameraErrorKind } from "@/lib/scan/errors";

describe("toCameraErrorKind", () => {
  it.each([
    ["NotAllowedError", "permission-denied"],
    ["PermissionDeniedError", "permission-denied"],
    ["SecurityError", "permission-denied"],
    ["NotFoundError", "no-camera"],
    ["DevicesNotFoundError", "no-camera"],
    ["OverconstrainedError", "overconstrained"],
    ["ConstraintNotSatisfiedError", "overconstrained"],
    ["NotReadableError", "in-use"],
    ["TrackStartError", "in-use"],
  ])("DOMException %s → %s", (name, kind) => {
    expect(toCameraErrorKind(new DOMException("", name))).toBe(kind);
  });

  it("모르는 DOMException은 unknown이다 — 사진 폴백으로 떨어진다", () => {
    expect(toCameraErrorKind(new DOMException("", "AbortError"))).toBe(
      "unknown",
    );
  });

  it("보안 컨텍스트 에러는 일반 Error로 오므로 메시지로 가려낸다", () => {
    const error = new Error(
      "Camera access requires a secure context. Use HTTPS or localhost — " +
        "http://192.168.x.x is blocked by the browser.",
    );
    expect(toCameraErrorKind(error)).toBe("insecure-context");
  });

  it("미지원 브라우저 메시지는 카메라 없음으로 본다", () => {
    expect(
      toCameraErrorKind(
        new Error("Camera access is not supported in this browser."),
      ),
    ).toBe("no-camera");
  });

  it("DOMException 파생이 아니어도 name만 맞으면 분류한다", () => {
    // OverconstrainedError를 DOMException 파생으로 노출하지 않는 엔진이 있으면
    // facingMode 재시도라는 유일한 안전망이 사라진다. 형에 기대지 않는다.
    const legacy = Object.assign(new Error("constraint failed"), {
      name: "OverconstrainedError",
      constraint: "deviceId",
    });
    expect(toCameraErrorKind(legacy)).toBe("overconstrained");
  });

  it("메시지 어딘가의 not supported를 카메라 없음으로 오분류하지 않는다", () => {
    // WASM 실패가 no-camera로 새면 사진 폴백도 같은 WASM을 쓰므로 막다른 길이 된다.
    expect(
      toCameraErrorKind(new Error("WebAssembly is not supported here")),
    ).toBe("unknown");
  });

  it("Error가 아닌 값도 삼킨다", () => {
    expect(toCameraErrorKind("nope")).toBe("unknown");
    expect(toCameraErrorKind(undefined)).toBe("unknown");
    expect(toCameraErrorKind(null)).toBe("unknown");
  });
});

/**
 * 메시지 분류는 라이브러리 문자열에 묶여 있다. 우리가 지어낸 문자열로만 테스트하면
 * 라이브러리가 문구를 바꿔도 테스트는 계속 통과하고 프로덕션만 조용히 깨진다.
 * 실제 소스에서 문구를 읽어 대조한다.
 */
describe("react-zxing가 던지는 실제 문구", () => {
  const require_ = createRequire(import.meta.url);
  const source = readFileSync(
    require_.resolve("react-zxing/lib/esm/mediaDevices.js"),
    "utf8",
  );
  const thrown = [...source.matchAll(/new Error\(\s*"((?:[^"\\]|\\.)*)"/g)].map(
    (m) => m[1].replace(/\\"/g, '"'),
  );

  it("두 개를 던진다 — 늘어났다면 분류를 다시 봐야 한다", () => {
    expect(thrown).toHaveLength(2);
  });

  it.each([
    ["secure context", "insecure-context"],
    ["not supported", "no-camera"],
  ])("%s 메시지가 %s로 분류된다", (needle, kind) => {
    const message = thrown.find((t) => t.includes(needle));
    expect(message).toBeDefined();
    expect(toCameraErrorKind(new Error(message as string))).toBe(kind);
  });
});
