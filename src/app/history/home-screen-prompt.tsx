"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { ConfirmSheet } from "@/components/common/sheet";
import { StepList } from "@/components/common/step-list";
import { IconShare } from "@/components/icons";
import {
  getInstallPrompt,
  showInstallPrompt,
  subscribeInstallPrompt,
} from "@/components/pwa/install-prompt";

import {
  afterClose,
  detectHomeScreenPlatform,
  EMPTY_RECORD,
  type HomeScreenPlatform,
  parseRecord,
  type PromptRecord,
  shouldShowPrompt,
} from "./home-screen-prompt-rules";

const KEY = "nuti_home_screen_prompt_v1";

function readRecord(): PromptRecord {
  try {
    return parseRecord(localStorage.getItem(KEY));
  } catch {
    return EMPTY_RECORD;
  }
}

function writeRecord(record: PromptRecord) {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // 저장이 막혔으면 이 화면에서만 닫힌다(다음에 또 뜰 수 있음)
  }
}

/** 삼성 인터넷 맨 아래 메뉴 버튼(세 줄) 모양 — 그림의 20px 아이콘 */
function MenuMark() {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" aria-hidden>
      {[4, 9, 14].map((y) => (
        <rect key={y} x={2} y={y} width={16} height={2} rx={1} fill="#2b3036" />
      ))}
    </svg>
  );
}

const STEPS: Record<"ios" | "samsung", React.ReactNode[]> = {
  ios: [
    <span key="share" className="inline-flex items-center gap-2">
      공유 버튼을 눌러요
      <IconShare aria-hidden className="size-5" />
    </span>,
    "홈 화면에 추가를 골라요",
  ],
  samsung: [
    <span key="menu" className="inline-flex items-center gap-2">
      브라우저 맨 아래 메뉴 버튼을 눌러요
      <MenuMark />
    </span>,
    "현재 페이지 추가를 골라요",
    "홈 화면을 고르고 추가를 눌러요",
  ],
};

/*
 * 4-1 「홈 화면에 추가」 시트(【최종】 ⑧ 안드로이드 9306:22512 · 아이폰 22558 · 삼성 인터넷 9846:19311).
 * 기록 탭 위 바텀시트, 제목 「홈 화면에 마이뉴티를 추가할까요?」.
 * - 안드로이드(설치 창 신호가 있을 때): 「나중에」 · 「추가하기」(→ 브라우저 설치 창)
 * - 아이폰 사파리: 「Safari에서 두 단계면 돼요.」 + 2단계(공유 아이콘) · 「알겠어요」
 * - 삼성 인터넷: 「삼성 인터넷에서 세 단계면 돼요.」 + 3단계(메뉴 아이콘) · 「알겠어요」
 * 띄울지는 `home-screen-prompt-rules.ts`. 닫으면(덮개 포함) 기기에 남겨 14일 동안 · 3번째 뒤로는 띄우지 않는다.
 * 미리 보기 `?prompt=android · ios · samsung`은 조건 · 기록과 상관없이 띄운다(닫아도 기록하지 않음).
 */
export function HomeScreenPrompt({
  hasItems,
  preview,
}: {
  /** 즐겨찾기나 본 제품이 1개 이상 */
  hasItems: boolean;
  preview: HomeScreenPlatform | null;
}) {
  const [platform, setPlatform] = useState<HomeScreenPlatform | null>(preview);
  const [open, setOpen] = useState(preview !== null);
  // 설치 창 신호가 늦게 와도(주소로 바로 들어온 경우 등) 다시 판단한다
  const canPrompt = useSyncExternalStore(
    subscribeInstallPrompt,
    () => getInstallPrompt() !== null,
    () => false,
  );

  // 기기 · 브라우저 · 기록은 브라우저에서만 알 수 있어 그린 뒤에 정한다
  useEffect(() => {
    if (preview || !hasItems || platform) return;
    // 다른 시트(점수별로 보기 등)가 떠 있으면 그 위에 띄우지 않는다(다음에 기록 탭을 열 때)
    if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
    const detected = detectHomeScreenPlatform({
      userAgent: navigator.userAgent,
      standalone:
        matchMedia("(display-mode: standalone)").matches ||
        ("standalone" in navigator && navigator.standalone === true),
      canPrompt,
    });
    if (!detected || !shouldShowPrompt(readRecord(), Date.now())) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저에서만 알 수 있는 값으로 한 번 정한다
    setPlatform(detected);
    setOpen(true);
  }, [hasItems, preview, platform, canPrompt]);

  if (!platform) return null;

  const close = () => {
    setOpen(false);
    if (!preview) writeRecord(afterClose(readRecord(), Date.now()));
  };

  const common = {
    open,
    onOpenChange: (next: boolean) => {
      if (!next) close();
    },
    title: "홈 화면에 마이뉴티를 추가할까요?",
    dismissible: true,
  };

  if (platform === "android")
    return (
      <ConfirmSheet
        {...common}
        description="다음부터 아이콘을 눌러 바로 열 수 있어요."
        cancelLabel="나중에"
        confirmLabel="추가하기"
        onConfirm={() => {
          // 누르면 시트가 닫히며(onOpenChange) 「나중에」처럼 한 번 센다. 설치 창은 이 누름 안에서 바로 띄워야 열린다.
          // 설치했으면 다시 띄우지 않게 남기고, 취소했으면 센 것 그대로(메모: 설치 창 취소도 14일)
          void showInstallPrompt().then(
            (outcome) => {
              if (outcome === "accepted" && !preview)
                writeRecord({ ...readRecord(), installed: true });
            },
            // 설치 창을 못 띄우면(브라우저가 막음) 「나중에」와 같다 — 이미 센 뒤라 할 일이 없다
            () => {},
          );
        }}
      />
    );

  return (
    <ConfirmSheet
      {...common}
      description={
        platform === "ios"
          ? "Safari에서 두 단계면 돼요."
          : "삼성 인터넷에서 세 단계면 돼요."
      }
      cancelLabel="알겠어요"
      cancelKind="primary"
    >
      <div className="-mx-5">
        <StepList steps={STEPS[platform]} />
      </div>
    </ConfirmSheet>
  );
}
