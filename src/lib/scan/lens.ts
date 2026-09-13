import type { LensCandidate, LensChoice } from "@/lib/scan/types";

/** `rankBackLenses`가 필요로 하는 최소 형태. `MediaDeviceInfo[]`를 그대로 넘길 수 있다. */
export type VideoInputLike = Pick<
  MediaDeviceInfo,
  "deviceId" | "kind" | "label"
>;

const BACK_LABEL = /back|rear|후면/i;
/** iOS에서 메인 렌즈의 라벨. 초광각·망원은 "Back Ultra Wide Camera"처럼 수식어가 붙는다. */
const IOS_MAIN_LABEL = /^back camera$/i;

/**
 * "camera2 0, facing back" → 0.
 *
 * "camera2"의 2는 Camera2 API 세대 표기이므로 건너뛴다. 첫 패턴이 빗나가면
 * 라벨 안의 독립된 숫자를 집는다.
 */
export function lensIndex(label: string): number {
  const match = label.match(/camera\d*\s+(\d+)/i) ?? label.match(/\s(\d+)\b/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function toCandidate(device: VideoInputLike): LensCandidate {
  return {
    deviceId: device.deviceId,
    label: device.label,
    score: lensIndex(device.label),
  };
}

/**
 * 후면 렌즈 중 메인으로 보이는 것을 고른다.
 *
 * `facingMode: "environment"`는 "후면 아무거나"라는 뜻이라 브라우저가 초광각을
 * 고를 수 있고, 초광각은 고정 초점이라 근거리 바코드에 초점이 맞지 않는다.
 * 갤럭시 S24에서 이 차이가 인식 여부를 갈랐다.
 *
 * 순수 함수다 — 브라우저 없이 라벨 픽스처만으로 기종별 동작을 검증할 수 있다.
 * 라벨은 카메라 권한이 있어야 채워지므로 호출 전에 권한을 확보해야 한다.
 *
 * 휴리스틱이 빗나가도 증상은 "그냥 안 읽힘"이다. 어느 기종에서 무엇을 왜 골랐는지
 * 볼 수 있도록 `reason`과 `candidates`를 함께 반환한다.
 */
export function rankBackLenses(devices: readonly VideoInputLike[]): LensChoice {
  const videoInputs = devices.filter((d) => d.kind === "videoinput");
  const backs = videoInputs.filter((d) => BACK_LABEL.test(d.label));

  if (backs.length === 0) {
    // 후면을 못 찾은 이유를 보려면 무엇이 열거됐는지가 필요하다.
    // 라벨이 전부 비어 있다면 권한을 얻기 전에 호출한 것이다.
    return {
      deviceId: null,
      label: "",
      reason: "fallback-facing-mode",
      candidates: videoInputs.map(toCandidate),
    };
  }

  const candidates = backs.map(toCandidate);
  const pick = (found: LensCandidate, reason: LensChoice["reason"]) => ({
    deviceId: found.deviceId,
    label: found.label,
    reason,
    candidates,
  });

  if (candidates.length === 1) return pick(candidates[0], "single-back");

  const iosMain = candidates.find((c) => IOS_MAIN_LABEL.test(c.label.trim()));
  if (iosMain) return pick(iosMain, "exact-back-camera");

  const lowest = candidates.reduce((a, b) => (b.score < a.score ? b : a));
  // 최솟값을 공유하는 후보가 둘 이상이면 무엇을 집든 열거 순서에 기댄 것이다.
  // 고르기는 하되 "골랐다"고 보고하지 않는다 — 진단 신호를 오염시키면 안 된다.
  const tied = candidates.filter((c) => c.score === lowest.score).length > 1;
  return pick(lowest, tied ? "ambiguous-back" : "lowest-index");
}
