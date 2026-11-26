"use client";

import { skipToken, useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoBack } from "@/components/common/back-button";
import { Button } from "@/components/common/button";
import { Skeleton } from "@/components/common/skeleton";
import { Toast } from "@/components/common/toast";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose, IconHash, IconImage, IconSearch } from "@/components/icons";
import { BarcodeScan } from "@/components/scan/barcode-scan";
import { useImageBarcode } from "@/components/scan/scan-image-input";
import { ScanManualSheet } from "@/components/scan/scan-manual-sheet";
import {
  PhotoMissSheet,
  ScanMissSheet,
} from "@/components/scan/scan-miss-sheet";
import { ScanMessageSheet } from "@/components/scan/scan-result-sheet";
import { ScanNoScoreSheet } from "@/components/scan/scan-no-score-sheet";
import {
  FIXTURE_NAMED_BARCODES,
  FIXTURE_REQUESTED,
} from "@/components/scan/_fixtures";
import { ReportSheet } from "@/components/product/report-sheet";
import { isRequestedHere } from "@/components/scan/requested-gtins";
import {
  clearPendingGtin,
  readPendingGtin,
  writePendingGtin,
} from "@/components/scan/pending-gtin";
import { isValidGtinChecksum } from "@/lib/scan/gtin";
import { lookupProduct } from "@/lib/scan/lookup";
import type { Gtin, ScanSource } from "@/lib/scan/types";
import { cn } from "@/lib/utils";

/*
 * 못 읽을 때의 시간 규칙(디자인 메모). 스캐너(lib/scan)의 15초 안내 대신 화면이 직접 센다.
 *   10초 못 읽음(메모 8~10초) = 실패 1번 → 틀 아래 문장만 바뀜, 인식은 계속
 *   20초 = 실패 2번 → 「바코드를 못 읽었을 때」 시트(메모 「2번 실패하거나 20초」가 같은 시점이 된다)
 */
const SLOW_AFTER_MS = 10_000;
const CHECKSUM_NOTICE = "바코드 숫자가 완전하지 않아요. 한 번 더 비춰 주세요.";
const MISS_AFTER_MS = 20_000;

/**
 * 3-1 스캔. 화면 전체가 카메라이고 아래에 버튼 3개(사진 올리기·바코드 번호 입력·이름으로 찾기).
 *
 * 카메라·앨범·직접 입력이 모두 같은 `handleGtin`으로 모인다. 상세는 내부 상품 ID로
 * 라우팅하므로 GTIN은 반드시 조회를 거친다.
 * 【최종】 3-1 메모(SCAN_010): 조회 결과에 따라 3-2 제품 결과(시트가 아닌 전체 화면)로 바로 가거나, 카메라 위 시트
 * (3-6 아직 점수가 없는 제품 · 이 제품인가요? · 바코드에 제품이 여러 개일 때)를 띄운다.
 * 체크 디지트가 틀리면 조회하지 않고 알림, 조회 중 연결이 끊기면 바코드를 기기에 저장해 두고 알림 → 연결이 돌아오면 조회.
 */
export function ScanStage({
  initialGtin = null,
  initialFromUrl = false,
  initialManualOpen = false,
  cameraOff = false,
  onPermissionDenied,
}: {
  /** 0-3x에서 사진으로 읽은 바코드. 들어오자마자 조회한다 */
  initialGtin?: Gtin | null;
  /**
   * initialGtin이 주소(`/scan?gtin=`)로 넘어왔다. 찾으면 3-2로 바꿔 간다(replace) — 주소를 남기면 뒤로 가기마다
   * 같은 조회로 다시 3-2에 온다
   */
  initialFromUrl?: boolean;
  /** 0-3x 「바코드 번호 입력」으로 들어오면 입력 칸을 연 채로 시작한다 */
  initialManualOpen?: boolean;
  /** 카메라를 열지 않는다(PC·앱 안 브라우저에서 사진·번호로 찾을 때) */
  cameraOff?: boolean;
  /** 카메라 권한이 거부되면 부른다(0-3x로 보내기) */
  onPermissionDenied?: () => void;
} = {}) {
  const router = useRouter();
  // 사진으로 읽어 넘어온 바코드도 체크 디지트가 틀리면 조회하지 않는다
  const initialInvalid =
    initialGtin !== null && !isValidGtinChecksum(initialGtin);
  const [picked, setGtin] = useState<Gtin | null>(
    initialGtin !== null && !initialInvalid ? initialGtin : null,
  );
  // 연결이 끊겨 조회하지 못한 바코드가 기기에 있으면 그것부터 조회한다(【최종】 3-1 메모).
  // 저장소는 브라우저에만 있어 서버 그림과 같은 첫 그림 뒤에 읽는다
  const pending = usePendingGtin();
  // 「나중에 할게요」로 결과를 치웠으면 저장해 둔 바코드도 다시 쓰지 않는다
  const [pendingDismissed, setPendingDismissed] = useState(false);
  const gtin = picked ?? (pendingDismissed ? null : pending);
  // 3-6 이름을 아는 바코드의 「정보 수정 요청」 시트. 떠 있는 동안 3-6 시트를 내리고(시트 위에 시트를 띄우지 않는다),
  // 닫히면 다시 붙는 3-6 시트가 「정보 수정 요청」 버튼으로 포커스를 돌려받는다
  const [reportOpen, setReportOpen] = useState(false);
  const [backFromReport, setBackFromReport] = useState(false);
  const manualButton = useRef<HTMLButtonElement>(null);
  // 연결이 끊겨 있는 동안 뜬 알림이면 그 바코드를 적어 둔다(아래 알림 자리를 하나로 쓴다)
  const [notice, setNotice] = useState<{
    id: number;
    text: string;
    whileOffline: Gtin | null;
  } | null>(() =>
    initialInvalid
      ? { id: 1, text: CHECKSUM_NOTICE, whileOffline: null }
      : null,
  );
  // 「바코드를 읽었어요」는 카메라·사진으로 읽었을 때만 맞다. 0-3x·홈 시트에서 넘어온 바코드는 사진으로 읽은 것이다
  const [source, setSource] = useState<ScanSource>("photo");
  const [photoMissOpen, setPhotoMissOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(initialManualOpen);
  const goBack = useGoBack("/home");
  const [slow, setSlow] = useState(false);
  const [missOpen, setMissOpen] = useState(false);
  // 시트를 닫고 다시 비출 때마다 올려 시간을 처음부터 다시 센다
  const [readRound, setReadRound] = useState(0);

  const restartReading = () => {
    setSlow(false);
    setReadRound((n) => n + 1);
  };

  const lookup = useQuery({
    queryKey: ["product", gtin],
    queryFn: gtin ? ({ signal }) => lookupProduct(gtin, signal) : skipToken,
  });

  const handleGtin = (value: Gtin, source: ScanSource) => {
    // 정보가 틀렸어요 시트를 쓰는 동안 카메라가 다른 바코드를 잡아 대상이 바뀌거나 3-2로 떠나지 않게 한다
    if (reportOpen && source === "camera") return;
    // 【최종】 3-1 메모: 체크 디지트가 틀리면 조회하지 않는다. 직접 입력은 입력 칸에서 이미 거른다
    if (source !== "manual" && !isValidGtinChecksum(value)) {
      showNotice(CHECKSUM_NOTICE);
      return;
    }
    setGtin(value);
    setSource(source);
    setBackFromReport(false);
    setPhotoMissOpen(false);
    setSlow(false);
    // 못 읽음 시트 뒤에서도 카메라는 돈다. 읽었으면 실패 안내는 거짓이 된다
    setMissOpen(false);
    // 카메라는 직접 입력 중에도 계속 돈다. 카메라가 다른 바코드를 잡았다고 쓰던 폼을
    // 닫으면 입력이 날아간다.
    if (source === "manual") setManualOpen(false);
  };

  // 연결이 끊기면 조회가 멈춰 있다가(TanStack Query `paused`) 연결이 돌아오면 이어서 조회한다
  const offline = gtin !== null && lookup.fetchStatus === "paused";
  // 3-1(읽힌 뒤 찾는 중). 디자인 메모: 결과가 오면 바로 3-2. 짧은 진동은 스캐너가 읽은 순간 낸다(use-scanner)
  const finding = gtin !== null && lookup.isPending && !offline;
  const foundId =
    lookup.data?.status === "found" ? lookup.data.result.id : null;

  const showNotice = (text: string) =>
    setNotice((prev) => ({
      id: (prev?.id ?? 0) + 1,
      text,
      whileOffline: offline ? gtin : null,
    }));

  // 조회가 멈추면 바코드를 기기에 남긴다(알림은 아래에서 멈춘 동안 그린다).
  // 연결이 돌아와 응답을 받았으면(찾음 · 없음 · 오류) 지운다. 오류의 다시 시도는 시트의 「다시 시도」로
  useEffect(() => {
    if (offline && gtin !== null) writePendingGtin(gtin);
  }, [offline, gtin]);
  useEffect(() => {
    if (lookup.data || lookup.isError) clearPendingGtin();
  }, [lookup.data, lookup.isError]);

  // 【최종】 3-1 메모: 찾으면 시트가 아닌 3-2 제품 결과 전체 화면으로 바로 간다. 기기 뒤로 가기는 다시 3-1.
  // 주소(`?gtin=`)로 넘어온 바코드는 바꿔 가서 뒤로 가기가 들어오기 전 화면으로 간다
  const replaceOnFound = initialFromUrl && gtin === initialGtin;
  useEffect(() => {
    if (!foundId) return;
    const href = `/product/${encodeURIComponent(foundId)}`;
    if (replaceOnFound) router.replace(href);
    else router.push(href);
  }, [foundId, replaceOnFound, router]);

  const renderSheet = () => {
    // 찾는 중 시트는 화면 아래에 따로 그린다(ScanFindingSheet)
    if (gtin === null || lookup.isPending) return null;
    if (lookup.isError) {
      return (
        <ScanMessageSheet
          title="상품 정보를 불러오지 못했어요"
          action={
            <Button
              kind="secondary"
              className="w-full"
              onClick={() => lookup.refetch()}
            >
              다시 시도
            </Button>
          }
        />
      );
    }
    // 미등록(3-6)은 화면 아래에 따로 그린다(ScanNoScoreSheet). 찾았으면 3-2로 옮기는 중이다
    return null;
  };

  // 3-6 아직 점수가 없는 제품
  const noScore = lookup.data?.status === "not-found" ? lookup.data.gtin : null;
  const named = noScore ? (FIXTURE_NAMED_BARCODES[noScore] ?? null) : null;
  // 알림 자리: 아래 버튼 줄(186) 위 12. 3-6 시트가 버튼 줄을 덮고 있으면 시트를 가리지 않게 화면 위(닫기 줄 아래)
  const toastPlace = noScore
    ? "top-[calc(var(--safe-top)+64px)] bottom-auto"
    : "bottom-[calc(186px+12px+var(--safe-bottom))]";
  // 「나중에 할게요」 → 3-1 스캔(결과를 치우고 다시 비춘다)
  const later = () => {
    setGtin(null);
    setPendingDismissed(true);
    restartReading();
    // 누른 버튼이 사라지므로 다시 보이는 아래 버튼 줄의 첫 버튼으로 포커스를 옮긴다(그려진 뒤)
    requestAnimationFrame(() => manualButton.current?.focus());
  };

  const photo = useImageBarcode({
    onGtin: (value) => handleGtin(value, "photo"),
    onMiss: () => {
      // 고르는 사이 20초 못 읽음 시트가 떴을 수 있다. 시트 위에 시트를 띄우지 않는다
      setMissOpen(false);
      setPhotoMissOpen(true);
    },
  });

  return (
    <div className="flex h-dvh flex-col bg-bg-dark pt-safe">
      <BarcodeScan
        className="flex-1"
        cameraOff={cameraOff}
        onGtin={handleGtin}
        overlay={(state) => (
          <>
            {onPermissionDenied &&
              state.stage === "photo" &&
              state.reason === "permission-denied" && (
                <OnMount run={onPermissionDenied} />
              )}
            {/* 【최종】 메모: ✕ → 카메라를 열기 전 화면 */}
            <TopBar
              tone="dark"
              className="absolute inset-x-0 top-0"
              right={
                <TopBarButton aria-label="닫기" onClick={goBack}>
                  <IconClose />
                </TopBarButton>
              }
            />
            {state.stage === "camera" && (
              // 조준 틀(세로 160) 아래 20
              <p
                aria-live="polite"
                className="absolute inset-x-0 top-[calc(50%+100px)] px-6 text-center text-body1 text-white"
              >
                {/* 다른 앱이 카메라를 쓰는 중이면 원인이 비추는 방법이 아니라서 바꾸지 않는다 */}
                {(finding || foundId) && source !== "manual"
                  ? "바코드를 읽었어요"
                  : noScore
                    ? // 【최종】 3-6 그림: 이름을 아는 바코드 시트만 이 문장이 있고 기본 시트는 비어 있다
                      named
                      ? "다른 바코드를 찍으면 결과가 바로 바뀌어요"
                      : ""
                    : slow && state.retryable === null
                      ? "빛 반사가 심한 것 같아요. 조금 기울여서 다시 비춰 볼까요?"
                      : "바코드를 틀 안에 맞춰 주세요"}
              </p>
            )}
            {state.stage === "camera" &&
              state.retryable === null &&
              gtin === null &&
              !manualOpen &&
              !missOpen &&
              !photoMissOpen && (
                <ReadTimer
                  key={readRound}
                  onSlow={() => setSlow(true)}
                  onMiss={() => setMissOpen(true)}
                />
              )}
            {renderSheet()}
          </>
        )}
      >
        {(state) => (
          <nav
            aria-label="다른 방법으로 찾기"
            // 디자인 186은 홈 인디케이터(34)를 뺀 높이라 기기 safe area를 더한다
            // 찾는 중 시트가 떠 있으면 디자인처럼 버튼 줄을 비워 두고 그 위에 시트를 올린다(자리는 남긴다).
            // 3-2로 옮기는 사이에도 시트를 둔다
            className={cn(
              "flex h-[calc(186px+var(--safe-bottom))] shrink-0 items-start justify-between px-10 pt-[46px] pb-safe",
              (finding || foundId || noScore) && "invisible",
            )}
          >
            {photo.input}
            {/* 【최종】 메모: 어느 화면에서나 「바코드 번호 입력 → 바코드 사진 올리기 → 이름으로 찾기」 */}
            <ScanAction
              ref={manualButton}
              icon={<IconHash />}
              onClick={() => setManualOpen(true)}
            >
              바코드 번호 입력
            </ScanAction>
            <ScanAction
              icon={<IconImage />}
              // WASM이 죽었으면 사진도 읽을 수 없다.
              disabled={state.stage === "manual" || photo.reading}
              onClick={photo.open}
            >
              {photo.reading ? "읽는 중…" : "바코드 사진 올리기"}
            </ScanAction>
            {/* 디자인 메모: 이름으로 찾기 → 2-3 검색 */}
            <ScanAction icon={<IconSearch />} href="/search">
              이름으로 찾기
            </ScanAction>
          </nav>
        )}
      </BarcodeScan>

      {(finding || foundId) && <ScanFindingSheet />}
      {/* 결과 자리는 모달이 아니라 결과만 읽어 준다(영역은 늘 두고 안쪽만 바꾼다) */}
      <p aria-live="polite" className="sr-only">
        {noScore && !finding ? "아직 점수가 없는 제품이에요" : ""}
      </p>
      {noScore && !finding && !reportOpen && (
        <ScanNoScoreSheet
          // 다른 바코드로 바뀌면 새 시트로 읽히게 한다
          key={noScore}
          gtin={noScore}
          named={named}
          // 둘 다면 「내가 요청함」이 더 맞다
          requested={
            isRequestedHere(noScore)
              ? "mine"
              : (FIXTURE_REQUESTED[noScore] ?? null)
          }
          // 정보가 틀렸어요에서 돌아오면 그 버튼으로. 번호 · 사진으로 찾았으면 누른 버튼이 가려져 제목으로.
          // 카메라로 찾았으면 폰을 든 채라 포커스를 옮기지 않고 위 영역으로 알리기만 한다
          focusOnMount={
            backFromReport ? "report" : source !== "camera" ? "title" : null
          }
          onLater={later}
          onReport={() => setReportOpen(true)}
        />
      )}
      <ReportSheet
        // 보낸 내용 기억(같은 내용 다시 보내기)은 바코드마다 따로
        // 형제인 3-6 시트의 key(바코드)와 겹치지 않게 앞말을 붙인다
        key={`report-${noScore ?? "none"}`}
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) setBackFromReport(true);
        }}
        onSent={showNotice}
      />

      {/* 알림 자리는 하나다. 연결이 끊긴 뒤에 다른 알림(체크 디지트)이 뜨지 않았으면 연결 끊김 알림 */}
      {offline && notice?.whileOffline !== gtin ? (
        <Toast
          // 바코드마다 한 번
          key={`offline-${gtin}`}
          message="연결이 불안정해요. 바코드는 저장해 뒀어요."
          className={toastPlace}
        />
      ) : (
        notice && (
          <Toast key={notice.id} message={notice.text} className={toastPlace} />
        )
      )}

      <ScanMissSheet
        open={missOpen}
        onOpenChange={(open) => {
          setMissOpen(open);
          if (!open) restartReading();
        }}
        onManual={() => {
          setMissOpen(false);
          setManualOpen(true);
        }}
      />

      {/* 3-1(숫자로 입력). 디자인 메모: ✕ → 3-1 스캔 */}
      <ScanManualSheet
        open={manualOpen}
        onOpenChange={(open) => {
          setManualOpen(open);
          if (!open) restartReading();
        }}
        onSubmit={(value) => handleGtin(value, "manual")}
      />

      <PhotoMissSheet
        open={photoMissOpen}
        onOpenChange={(open) => {
          setPhotoMissOpen(open);
          if (!open) restartReading();
        }}
        onManual={() => {
          setPhotoMissOpen(false);
          setManualOpen(true);
        }}
        onPickAgain={() => {
          setPhotoMissOpen(false);
          restartReading();
          photo.open();
        }}
      />
    </div>
  );
}

/** 아래 둥근 버튼. href가 있으면 링크, 없으면 버튼 */
function ScanAction({
  ref,
  icon,
  href,
  onClick,
  disabled,
  children,
}: {
  ref?: React.Ref<HTMLButtonElement>;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const content = (
    <>
      <span className="flex size-14 items-center justify-center rounded-full bg-text-body text-white [&_svg]:size-6">
        {icon}
      </span>
      <span className="text-caption whitespace-nowrap text-white">
        {children}
      </span>
    </>
  );
  const className = "flex w-22 flex-col items-center gap-2 disabled:opacity-40";

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

/** 렌더 중에 부모 상태를 바꾸지 않도록, 그려진 뒤에 한 번 부른다 */
function OnMount({ run }: { run: () => void }) {
  useEffect(() => {
    run();
  }, [run]);
  return null;
}

/** 카메라로 읽는 동안만 그려 시간을 센다. 그려지지 않으면(결과·시트가 떠 있으면) 멈춘다 */
function ReadTimer({
  onSlow,
  onMiss,
}: {
  onSlow: () => void;
  onMiss: () => void;
}) {
  // 콜백이 그릴 때마다 새로 만들어져도 시간을 다시 세지 않게 한다
  const slowEvent = useEffectEvent(onSlow);
  const missEvent = useEffectEvent(onMiss);

  useEffect(() => {
    const slow = setTimeout(() => slowEvent(), SLOW_AFTER_MS);
    const miss = setTimeout(() => missEvent(), MISS_AFTER_MS);
    return () => {
      clearTimeout(slow);
      clearTimeout(miss);
    };
  }, []);
  return null;
}

/**
 * 3-1 스캔(읽힌 뒤 찾는 중). 아래 버튼 줄을 덮는 흰 시트에 제목과 회색 틀 두 줄.
 * 사용자가 닫는 시트가 아니라 결과가 오면 바뀌는 자리라 모달로 띄우지 않는다.
 */
function ScanFindingSheet() {
  return (
    <div
      role="status"
      className="fixed-app bottom-0 z-40 flex flex-col gap-3 rounded-t-sheet bg-bg-page px-5 pt-6 pb-[calc(26px+max(var(--safe-bottom),34px))]"
    >
      <p className="text-body1-bold text-text-strong">제품을 찾고 있어요</p>
      <Skeleton className="h-3.5 w-full rounded-[7px]" />
      <Skeleton className="h-3.5 w-60 rounded-[7px]" />
    </div>
  );
}

// 3-1이 붙어 있는 동안은 처음 읽은 값을 그대로 쓴다(조회가 끝나 저장값을 지워도 화면의 바코드는 바뀌지 않게)
let pendingSnapshot: Gtin | null | undefined;
const noSubscribe = () => () => {};

function usePendingGtin(): Gtin | null {
  const value = useSyncExternalStore(
    noSubscribe,
    () => {
      if (pendingSnapshot === undefined) pendingSnapshot = readPendingGtin();
      return pendingSnapshot;
    },
    () => null,
  );
  // 3-1을 떠나면 다음에 다시 읽는다
  useEffect(
    () => () => {
      pendingSnapshot = undefined;
    },
    [],
  );
  return value;
}
