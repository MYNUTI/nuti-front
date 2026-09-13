import { describe, expect, it } from "vitest";
import {
  lensIndex,
  rankBackLenses,
  type VideoInputLike,
} from "@/lib/scan/lens";

function video(label: string, deviceId = label): VideoInputLike {
  return { deviceId, kind: "videoinput", label };
}

/**
 * 실기기 라벨 픽스처.
 *
 * GALAXY_S24만 실측이고 나머지는 관례에 기반한 추정이다. 새 기종에서 인식이 안 되면
 * 그 기기의 `candidates`를 여기에 추가해 회귀로 고정한다.
 */
const GALAXY_S24 = [
  video("camera2 0, facing back", "back-main"),
  video("camera2 1, facing front", "front"),
  video("camera2 2, facing back", "back-ultrawide"),
  video("camera2 3, facing back", "back-tele"),
];

const IPHONE = [
  video("Front Camera", "front"),
  video("Back Camera", "back-main"),
  video("Back Dual Wide Camera", "back-dual"),
  video("Back Ultra Wide Camera", "back-ultrawide"),
];

describe("lensIndex", () => {
  it("camera2의 세대 표기를 건너뛰고 렌즈 번호를 집는다", () => {
    expect(lensIndex("camera2 0, facing back")).toBe(0);
    expect(lensIndex("camera2 3, facing back")).toBe(3);
  });

  it("camera 접두사가 없으면 독립된 숫자를 집는다", () => {
    expect(lensIndex("후면 카메라 2")).toBe(2);
  });

  it("번호가 없으면 최하위로 민다", () => {
    expect(lensIndex("Back Camera")).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("rankBackLenses", () => {
  it("갤럭시 S24에서 camera2 0을 고른다 — 실기기에서 유일하게 동작한 렌즈다", () => {
    const choice = rankBackLenses(GALAXY_S24);
    expect(choice.deviceId).toBe("back-main");
    expect(choice.reason).toBe("lowest-index");
  });

  it("전면 카메라를 후보에서 제외한다", () => {
    const choice = rankBackLenses(GALAXY_S24);
    expect(choice.candidates).toHaveLength(3);
    expect(choice.candidates.map((c) => c.deviceId)).not.toContain("front");
  });

  it("iPhone에서 수식어 없는 Back Camera를 고른다", () => {
    const choice = rankBackLenses(IPHONE);
    expect(choice.deviceId).toBe("back-main");
    expect(choice.reason).toBe("exact-back-camera");
  });

  it("열거 순서가 렌즈 번호와 어긋나도 라벨을 따른다", () => {
    const shuffled = [GALAXY_S24[3], GALAXY_S24[2], GALAXY_S24[0]];
    expect(rankBackLenses(shuffled).deviceId).toBe("back-main");
  });

  it("번호 없는 후면이 여럿이면 고르되 ambiguous-back으로 알린다", () => {
    // "Back Camera" 정확일치가 없는 iPhone 조합. 둘 다 번호가 없어 라벨로는 못 가른다.
    const choice = rankBackLenses([
      video("Back Dual Wide Camera", "back-dual"),
      video("Back Ultra Wide Camera", "back-ultrawide"),
    ]);
    expect(choice.reason).toBe("ambiguous-back");
    expect(choice.deviceId).not.toBeNull();
  });

  it("최솟값을 공유하는 후보가 둘 이상이어도 ambiguous-back이다", () => {
    const choice = rankBackLenses([
      video("camera2 0, facing back", "a"),
      video("camera2 0, facing back", "b"),
      video("camera2 2, facing back", "c"),
    ]);
    expect(choice.reason).toBe("ambiguous-back");
  });

  it("최솟값이 유일하면 lowest-index로 확정한다", () => {
    expect(rankBackLenses(GALAXY_S24).reason).toBe("lowest-index");
  });

  it("후면이 하나뿐이면 그것을 쓰고 single-back으로 알린다", () => {
    const choice = rankBackLenses([
      video("후면 카메라", "back"),
      video("전면 카메라", "front"),
    ]);
    expect(choice.deviceId).toBe("back");
    expect(choice.reason).toBe("single-back");
  });

  it("후면을 못 찾으면 deviceId를 비워 facingMode에 맡긴다", () => {
    const choice = rankBackLenses([video("Integrated Webcam", "webcam")]);
    expect(choice.deviceId).toBeNull();
    expect(choice.reason).toBe("fallback-facing-mode");
  });

  it("후면을 못 찾았을 때도 열거된 장치를 후보로 남긴다 — 원인 파악 수단이다", () => {
    const choice = rankBackLenses([video("Integrated Webcam", "webcam")]);
    expect(choice.candidates.map((c) => c.deviceId)).toEqual(["webcam"]);
  });

  it("권한 전이라 라벨이 비어 있으면 폴백한다", () => {
    const choice = rankBackLenses([video("", "a"), video("", "b")]);
    expect(choice.deviceId).toBeNull();
    expect(choice.candidates).toHaveLength(2);
  });

  it("videoinput이 아닌 장치를 무시한다", () => {
    const mic = {
      deviceId: "mic",
      kind: "audioinput",
      label: "back mic",
    } as const;
    expect(rankBackLenses([mic, ...GALAXY_S24]).candidates).toHaveLength(3);
  });

  it("장치가 없으면 폴백한다", () => {
    expect(rankBackLenses([]).reason).toBe("fallback-facing-mode");
  });
});
