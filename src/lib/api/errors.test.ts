import axios, { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import {
  ApiError,
  isConsentRequired,
  toApiError,
  toErrorMessage,
} from "@/lib/api/errors";
import { failure, mockAdapter, type Reply } from "@/test/http";

async function errorFrom(reply: Reply | (() => never)) {
  const { adapter } = mockAdapter(
    typeof reply === "function" ? reply : () => reply,
  );
  const error = await axios.get("/", { adapter }).then(
    () => null,
    (e: unknown) => e,
  );
  return toApiError(error);
}

describe("toApiError", () => {
  it("axios 오류가 아니면 그대로 돌려준다", () => {
    const error = new TypeError("bug");
    expect(toApiError(error)).toBe(error);
  });

  it("서버 코드와 4xx 문구를 그대로 쓰고 원래 오류를 cause로 남긴다", async () => {
    const error = await errorFrom(
      failure(404, "PRODUCT_NOT_FOUND", "등록되지 않은 제품입니다."),
    );
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      code: "PRODUCT_NOT_FOUND",
      message: "등록되지 않은 제품입니다.",
    });
    expect((error as ApiError).cause).toBeInstanceOf(AxiosError);
  });

  it("message가 null이면 코드 기본 문구로 대신한다", async () => {
    const error = await errorFrom(failure(409, "SAVE_LIMIT_EXCEEDED"));
    expect(error).toMatchObject({
      message: "저장 가능한 제품 수(200개)를 초과했습니다.",
    });
  });

  it("5xx와 내부 문구를 싣는 코드는 서버 문구를 내보내지 않는다", async () => {
    await expect(
      errorFrom(failure(500, "INTERNAL_SERVER_ERROR", "NullPointerException")),
    ).resolves.toMatchObject({ message: "서버 내부 오류가 발생했습니다." });
    await expect(
      errorFrom(failure(401, "LOGIN_FAILED", "invalid_grant")),
    ).resolves.toMatchObject({
      message: "로그인에 실패했어요. 다시 시도해 주세요.",
    });
  });

  it("모르는 코드는 UNKNOWN이다. 프로토타입 키도 코드로 보지 않는다", async () => {
    await expect(
      errorFrom(failure(400, "NEW_CODE", "새 문구")),
    ).resolves.toMatchObject({ code: "UNKNOWN", message: "새 문구" });
    await expect(errorFrom(failure(400, "toString"))).resolves.toMatchObject({
      code: "UNKNOWN",
      message: "알 수 없는 오류가 발생했습니다.",
    });
  });

  it("검증 실패의 details를 넘긴다", async () => {
    const details = [{ field: "goal", value: "", reason: "필수" }];
    const reply = failure(400, "VALIDATION_FAILED");
    (reply.data as { data: { details: unknown } }).data.details = details;
    await expect(errorFrom(reply)).resolves.toMatchObject({ details });
  });

  it("공통 모양이 아닌 응답은 상태 코드만 남긴 UNKNOWN이다", async () => {
    await expect(
      errorFrom({ status: 502, data: "<html>Bad Gateway</html>" }),
    ).resolves.toMatchObject({ status: 502, code: "UNKNOWN" });
  });

  it("응답이 없으면 타임아웃·취소·네트워크 오류로 나눈다", async () => {
    const throwing = (code: string) => () => {
      throw new AxiosError("no response", code);
    };
    await expect(
      errorFrom(throwing(AxiosError.ETIMEDOUT)),
    ).resolves.toMatchObject({ status: null, code: "TIMEOUT" });
    await expect(
      errorFrom(throwing(AxiosError.ERR_CANCELED)),
    ).resolves.toMatchObject({ status: null, code: "CANCELED" });
    await expect(
      errorFrom(throwing(AxiosError.ERR_NETWORK)),
    ).resolves.toMatchObject({ status: null, code: "NETWORK_ERROR" });
  });
});

describe("toErrorMessage", () => {
  it("ApiError는 이미 고른 문구를, 그 밖의 오류는 기본 문구를 쓴다", () => {
    expect(
      toErrorMessage(
        new ApiError({ status: 409, code: "STATE_CONFLICT", message: "충돌" }),
      ),
    ).toBe("충돌");
    expect(toErrorMessage(new TypeError("internal"))).toBe(
      "알 수 없는 오류가 발생했습니다.",
    );
  });
});

describe("isConsentRequired", () => {
  it("개인정보·건강정보 동의 필요만 참이다", () => {
    const of = (
      code: "CONSENT_REQUIRED" | "HEALTH_CONSENT_REQUIRED" | "FORBIDDEN",
    ) => isConsentRequired(new ApiError({ status: 403, code, message: "" }));
    expect(of("CONSENT_REQUIRED")).toBe(true);
    expect(of("HEALTH_CONSENT_REQUIRED")).toBe(true);
    expect(of("FORBIDDEN")).toBe(false);
    expect(isConsentRequired(new Error("CONSENT_REQUIRED"))).toBe(false);
  });
});
