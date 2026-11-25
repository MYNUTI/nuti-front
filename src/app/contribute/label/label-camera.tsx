"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useGoBack } from "@/components/common/back-button";
import { Button } from "@/components/common/button";
import { CameraFrame } from "@/components/common/camera-frame";
import { CameraOffGuide } from "@/components/common/camera-off-guide";
import { LoadingState } from "@/components/common/loading-state";
import { BottomSheet } from "@/components/common/sheet";
import { Skeleton } from "@/components/common/skeleton";
import { Toast } from "@/components/common/toast";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose, IconHelp, IconImage } from "@/components/icons";
import {
  type CameraPlace,
  detectCameraPlace,
} from "@/components/scan/camera-place";
import { useCameraPlace } from "@/components/scan/use-camera-place";

import { setLabelPhoto } from "../label-photo";
import { fitLongEdge, PHOTO_BYTES_MAX, PHOTO_TYPES } from "./photo-size";

// 사진을 읽는 서버(OCR)가 없어 fixture로 기다리는 시간. 공통 불러오는 중이 1초 뒤에 보이게 그보다 길게 둔다(API 연결 때 지운다)
const FIXTURE_READ_MS = 1_500;
const PHOTO_ERROR =
  "사진을 올리지 못했어요. JPG · PNG 사진으로 다시 골라 주세요.";

/** denied: 권한 거절(→ 카메라가 꺼져 있을 때) · unavailable: 앱 안 브라우저 · PC · 카메라 없음(→ 카메라를 못 여는 곳) */
type Camera = "starting" | "live" | "denied" | "unavailable";

/*
 * 3-7 영양성분표 찍기(【최종】 ⑦ 9306:21630 · 잘 찍는 법 21833) — 화면 전체가 카메라. 성분표 조준 틀(320×420),
 * 「영양성분표가 틀 안에 다 들어오게 찍어 주세요」, 「잘 찍는 법」(→ 아래 시트), 「앨범에서」 · 셔터.
 * 셔터 · 앨범 → 읽는 중(공통 불러오는 중 + 「영양성분표 숫자를 읽고 있어요」) → 3-8 읽은 값 확인. ✕ → 들어온 화면.
 * 사진은 긴 변 2,400px로 줄여 JPG로 만들고, JPG · PNG가 아니거나 줄여도 10MB를 넘으면 막는다(메모).
 * 카메라 상태(【최종】 카메라가 꺼져 있을 때 21807 · 아직 꺼져 있음 9311:30623 · 카메라를 못 여는 곳 21780):
 * - 권한을 거절했으면 「카메라가 꺼져 있어요」(0-3x와 같은 `CameraOffGuide`, 검정 주 버튼). 다시 켰는데 아직 거절이면 빨간 문장
 * - 앱 안 브라우저는 카메라를 먼저 열어 보고(메모), 열리지 않으면 「이 앱 안에서는…」 + 다른 브라우저로 열기
 * - PC는 카메라를 열지 않고 「PC에서는 카메라를 쓰기 어려워요」 + 앨범만(메모)
 * 세 화면 모두 아래 「카메라 없이 올리기 · 앨범에서 고르기」.
 */
export function LabelCamera({ nextQuery }: { nextQuery: string }) {
  const router = useRouter();
  const goBack = useGoBack("/home");
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const stopCamera = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState<Camera>("starting");
  // 「카메라 다시 켜기」를 누를 때마다 올려 카메라를 다시 연다
  const [round, setRound] = useState(0);
  const [stillOff, setStillOff] = useState(false);
  const place = useCameraPlace();
  const [helpOpen, setHelpOpen] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState(0);

  // 뒤 카메라를 연다. 화면을 떠나면 끈다
  useEffect(() => {
    let cancelled = false;
    // PC는 열지 않는다(메모). 카메라를 쓸 수 없는 브라우저(http · 오래된 브라우저)도 못 여는 곳으로
    const pc = detectCameraPlace().kind === "pc";
    const open =
      !pc && navigator.mediaDevices?.getUserMedia
        ? navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 2560 },
              height: { ideal: 1920 },
            },
            audio: false,
          })
        : Promise.reject(new Error("카메라 없음"));
    open
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = s;
        // 카메라 화면에서 다시 열 때(돌아왔을 때)는 <video>가 이미 있다. 안내 화면에서 열면 아래 effect가 붙인다
        if (video.current) video.current.srcObject = s;
        setStillOff(false);
        setCamera("live");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // 앱 안 브라우저는 거절이어도 「다른 브라우저로 열기」가 맞다(설정을 바꿀 곳이 없는 경우가 많다)
        const denied =
          error instanceof DOMException &&
          error.name === "NotAllowedError" &&
          detectCameraPlace().kind === "ok";
        setCamera(denied ? "denied" : "unavailable");
        // 다시 켜기를 눌렀는데 또 거절이면 「아직 꺼져 있어요」
        setStillOff(denied && round > 0);
      });
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [round]);

  // 안내 화면을 그대로 둔 채 다시 연다(고른 칩 · 포커스 · 알림 영역을 지킨다)
  const retry = () => setRound((n) => n + 1);

  // 안내 화면에서 다시 켜면 <video>는 live로 바뀐 뒤에 생기므로 그때 붙인다
  useEffect(() => {
    if (camera === "live" && video.current && stream.current)
      video.current.srcObject = stream.current;
  }, [camera]);

  // 다른 앱으로 갔다 오면 브라우저가 카메라를 끊기도 한다(트랙 ended → 검은 화면이 찍힘). 돌아오면 다시 연다
  useEffect(() => {
    const resume = () => {
      if (document.visibilityState !== "visible") return;
      const track = stream.current?.getVideoTracks()[0];
      if (track?.readyState === "ended") setRound((n) => n + 1);
    };
    document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, []);

  // 읽는 중 → 3-8. API 연결 때 사진을 보내고 읽은 값을 받아 넘긴다
  useEffect(() => {
    if (!reading) return;
    const timer = setTimeout(
      () => router.push(`/contribute/check${nextQuery ? `?${nextQuery}` : ""}`),
      FIXTURE_READ_MS,
    );
    return () => clearTimeout(timer);
  }, [reading, nextQuery, router]);

  const finish = async (source: CanvasImageSource, w: number, h: number) => {
    const size = fitLongEdge(w, h);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (context) {
      // JPG는 투명을 못 담아 검게 바뀐다. 투명 PNG의 검은 글자가 묻히지 않게 흰 바탕을 깐다
      context.fillStyle = "#fff";
      context.fillRect(0, 0, size.width, size.height);
      context.drawImage(source, 0, 0, size.width, size.height);
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob || blob.size > PHOTO_BYTES_MAX) {
      setError((n) => n + 1);
      return;
    }
    setLabelPhoto(blob);
    // 읽는 중에는 영상이 필요 없다. 화면을 떠날 때까지 기다리지 않고 바로 끈다(크기 오류로 다시 찍을 때는 위에서 돌아가 켜진 채)
    stopCamera();
    setReading(true);
  };

  const shoot = () => {
    const v = video.current;
    if (!v || camera !== "live" || !v.videoWidth) return;
    void finish(v, v.videoWidth, v.videoHeight);
  };

  const pick = async (file: File) => {
    if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) {
      setError((n) => n + 1);
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      await finish(bitmap, bitmap.width, bitmap.height);
      bitmap.close();
    } catch {
      setError((n) => n + 1);
    }
  };

  if (reading)
    return (
      <main className="flex min-h-dvh flex-col bg-bg-page pt-safe">
        <LoadingState
          slowMessage="영양성분표 숫자를 읽고 있어요"
          skeleton={
            <div className="flex flex-col gap-3 px-5 pt-20">
              <Skeleton className="h-7 w-2/3 rounded-md" />
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-5/6 rounded-md" />
            </div>
          }
        />
      </main>
    );

  // 앨범 입력 · 오류 알림은 어느 화면에서든 쓴다
  const shared = (
    <>
      <input
        ref={fileInput}
        type="file"
        // HEIC 등 다른 형식도 고를 수는 있게 두고, 고른 뒤 형식 오류로 알린다(메모)
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void pick(file);
        }}
      />
      {error > 0 && (
        <Toast
          key={error}
          message={PHOTO_ERROR}
          // 카메라 화면은 아래 줄(잘 찍는 법 · 셔터 · 문장) 위, 안내 화면은 기본 자리
          className={
            camera === "live" || camera === "starting"
              ? "bottom-[calc(200px+max(var(--safe-bottom),12px))]"
              : undefined
          }
        />
      )}
    </>
  );

  if (camera === "denied" || camera === "unavailable")
    return (
      <main className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-[max(var(--safe-bottom),12px)]">
        <TopBar
          right={
            <TopBarButton aria-label="닫기" onClick={goBack}>
              <IconClose />
            </TopBarButton>
          }
        />
        {camera === "denied" ? (
          <CameraOffGuide
            retryKind="primary"
            stillOff={stillOff}
            onRetry={retry}
          />
        ) : (
          <CannotOpen place={place} />
        )}
        <div aria-hidden className="h-2 bg-bg-band" />
        <section className="flex flex-col gap-3 px-5 py-6">
          <h2 className="text-body1-bold text-text-strong">
            카메라 없이 올리기
          </h2>
          <Button
            type="button"
            kind="secondary"
            onClick={() => fileInput.current?.click()}
          >
            앨범에서 고르기
          </Button>
          <p className="text-body2 text-text-sub">
            사진은 성분 숫자를 읽는 데만 써요.
          </p>
        </section>
        {shared}
      </main>
    );

  return (
    <main className="flex h-dvh flex-col bg-bg-dark pt-safe">
      <div className="relative flex-1 overflow-hidden bg-[#2b3034]">
        {/* 카메라 영상. 사진은 성분 숫자를 읽는 데만 쓴다(아래 문장) */}
        <video
          ref={video}
          autoPlay
          playsInline
          muted
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
        <CameraFrame
          shape="label"
          live={camera === "live"}
          className="absolute inset-0"
        />
        <TopBar
          tone="dark"
          className="absolute inset-x-0 top-0"
          right={
            <TopBarButton aria-label="닫기" onClick={goBack}>
              <IconClose />
            </TopBarButton>
          }
        />
        <p className="absolute inset-x-0 bottom-[30px] px-6 text-center text-body1 text-white">
          영양성분표가 틀 안에
          <br />다 들어오게 찍어 주세요
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-center pt-[15px] pb-[max(var(--safe-bottom),12px)]">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => setHelpOpen(true)}
          className="flex h-11 items-center gap-1.5 rounded-[20px] border border-white pr-4 pl-3.5 text-body2-medium text-white [&_svg]:size-[18px]"
        >
          <IconHelp />잘 찍는 법
        </button>
        <div className="relative mt-[11px] flex h-24 w-full justify-center">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="absolute top-2 left-10 flex flex-col items-center gap-2 text-caption text-white"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-text-body [&_svg]:size-6">
              <IconImage />
            </span>
            앨범에서
          </button>
          <button
            type="button"
            aria-label="찍기"
            disabled={camera !== "live"}
            onClick={shoot}
            className="size-18 disabled:opacity-40"
          >
            {/* v2/ShutterButton 72 */}
            <svg
              width={72}
              height={72}
              viewBox="0 0 72 72"
              fill="none"
              aria-hidden
            >
              <circle cx="36" cy="36" r="34" strokeWidth="4" stroke="white" />
              <circle cx="36" cy="36" r="28" fill="white" />
            </svg>
          </button>
        </div>
        <p className="text-caption text-white">
          사진은 성분 숫자를 읽는 데만 써요.
        </p>
      </div>

      <BottomSheet
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="영양성분표 잘 찍는 법"
      >
        <ol className="flex flex-col gap-3 pt-2 pb-6">
          {TIPS.map((tip, i) => (
            <li key={tip.title} className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-band text-caption-bold text-text-strong">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 pt-[3px]">
                <span className="text-[15px] leading-[18px] font-bold text-text-strong">
                  {tip.title}
                </span>
                <span className="text-[14px] leading-[17px] text-text-sub">
                  {tip.description}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </BottomSheet>

      {shared}
    </main>
  );
}

const TIPS = [
  {
    title: "표 전체가 들어오게",
    description: "포장의 영양성분표를 위아래 끝까지 틀 안에 넣어 주세요.",
  },
  {
    title: "빛 반사 없이",
    description: "비닐 포장은 조금 비스듬히 기울이면 번쩍임이 줄어요.",
  },
  {
    title: "글자가 또렷하게",
    description: "흐리면 조금 더 가까이 가서 찍어 주세요.",
  },
  {
    title: "몇 g당인지도 같이",
    description: "1회 제공량, 100g당 같은 글자도 함께 보이게 찍어 주세요.",
  },
];

/*
 * 3-7 영양성분표 찍기(카메라를 못 여는 곳, 【최종】 21780). 앱 안 브라우저: 앱 이름 없이 같은 문장 + 다른 브라우저로 열기
 * (바깥으로 열 방법이 없는 앱은 버튼을 뺀다). PC: 「PC에서는 카메라를 쓰기 어려워요」만(메모).
 * 그 밖에 카메라가 없거나 다른 앱이 쓰는 중이라 못 연 경우는 그림이 없어 PC와 같은 틀에 임시 제목(남은 질문 45)
 */
function CannotOpen({ place }: { place: CameraPlace | null }) {
  if (place?.kind === "in-app") {
    const { openExternal } = place;
    return (
      <div className="flex flex-col px-5 pt-2 pb-6">
        <h1 className="text-title1 text-text-strong">
          이 앱 안에서는
          <br />
          카메라가 열리지 않을 수 있어요
        </h1>
        <p className="pt-2 text-body2 text-text-sub">
          다른 브라우저에서 열면 바로 찍을 수 있어요.
        </p>
        {openExternal && (
          <Button
            type="button"
            className="mt-6"
            onClick={() => {
              window.location.href = openExternal(window.location.href);
            }}
          >
            다른 브라우저로 열기
          </Button>
        )}
      </div>
    );
  }
  return (
    <h1 className="px-5 pt-2 pb-6 text-title1 text-text-strong">
      {place?.kind === "pc"
        ? "PC에서는 카메라를 쓰기 어려워요"
        : "이 기기에서는 카메라를 열 수 없어요"}
    </h1>
  );
}
