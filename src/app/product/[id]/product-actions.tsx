"use client";

import Link from "next/link";
import { createContext, use, useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { Toast } from "@/components/common/toast";
import { IconCompare, IconHeart, IconHeartFill } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 3-2 ♡ 저장 · 비교함 담기. 둘은 따로 켜지고 꺼진다(디자인 「담고 저장했을 때」·「비교함에 담았을 때」·「즐겨찾기했을 때」).
 * ♡는 점수 줄에, 담기는 아래 고정 줄에 있어 같은 상태를 나눠 쓰려고 context로 묶는다.
 * 서버 저장·비교함 목록 유지는 API 연결·05단계(비교) 때 붙인다. 지금은 이 화면 안 상태다.
 */

type ToastState = {
  key: number;
  message: string;
  action?: { label: string; onClick: () => void };
};

type Actions = {
  /** 되돌리기 뒤 포커스를 돌려놓을 ♡ 버튼 */
  saveRef: React.RefObject<HTMLButtonElement | null>;
  saved: boolean;
  added: boolean;
  toggleSave: () => void;
  toggleAdd: () => void;
  toast: ToastState | null;
  showToast: (t: Omit<ToastState, "key">) => void;
};

const ActionsContext = createContext<Actions | null>(null);

function useActions() {
  const value = use(ActionsContext);
  if (!value) throw new Error("ProductActions 안에서 써야 한다");
  return value;
}

export function ProductActions({
  previewing,
  children,
}: {
  /** 다른 목표로 미리 보는 중이면 담기 알림이 「내 목표 기준으로 담았어요」(디자인 메모 11-03) */
  previewing: boolean;
  children: React.ReactNode;
}) {
  const saveRef = useRef<HTMLButtonElement>(null);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (t: Omit<ToastState, "key">) =>
    setToast((prev) => ({ ...t, key: (prev?.key ?? 0) + 1 }));

  const toggleSave = () => {
    if (saved) {
      setSaved(false);
      // 디자인 메모: ♥를 풀면 「저장을 풀었어요」 + [되돌리기]
      showToast({
        message: "저장을 풀었어요",
        action: {
          label: "되돌리기",
          onClick: () => {
            setSaved(true);
            // 알림 띠가 누른 버튼째 사라지니 포커스를 ♡로 돌려놓는다
            saveRef.current?.focus();
            setToast(null);
          },
        },
      });
    } else {
      setSaved(true);
      showToast({ message: "즐겨찾기에 넣었어요. 내 기록에서 볼 수 있어요." });
    }
  };

  const toggleAdd = () => {
    if (added) {
      setAdded(false);
      return;
    }
    setAdded(true);
    showToast({
      message: previewing ? "내 목표 기준으로 담았어요" : "비교함에 담았어요",
    });
  };

  return (
    <ActionsContext
      value={{ saveRef, saved, added, toggleSave, toggleAdd, toast, showToast }}
    >
      {children}
    </ActionsContext>
  );
}

/** 점수 줄의 ♡. 켜면 분홍으로 채운다 */
export function SaveButton() {
  const { saveRef, saved, toggleSave } = useActions();
  return (
    <button
      ref={saveRef}
      type="button"
      aria-label="저장"
      aria-pressed={saved}
      className={cn("[&_svg]:size-7", saved && "text-accent-pink")}
      onClick={toggleSave}
    >
      {saved ? <IconHeartFill /> : <IconHeart />}
    </button>
  );
}

/** 아래 고정 줄 [비교함 담기][쿠팡에서 보기] + 담으면 그 위 비교함 바 + 알림 띠 */
export function ProductBottomBar({
  coupangUrl,
  thumbnail,
}: {
  coupangUrl: string | null;
  /** 비교함 바에 보일 이 제품 사진 */
  thumbnail: string | null;
}) {
  const { added, toggleAdd, toast, showToast } = useActions();
  // 지금은 이 화면에서 담은 제품만 센다(비교함 목록 유지는 05단계)
  const count = added ? 1 : 0;

  return (
    <>
      {/* 담은 만큼 아래 여백을 늘려 맨 아래 내용이 비교함 바에 가리지 않게 한다 */}
      {count > 0 && <div aria-hidden className="h-[61px]" />}
      {count > 0 && (
        // 아래 고정 줄(위 선 1 + 위 여백 12 + 버튼 52 + 아래 여백) 바로 위에 붙인다. 바 높이 61 = 선 1 + 12 + 버튼 44 + 4
        <div className="fixed-app bottom-[calc(65px+max(var(--safe-bottom),12px))] z-30 flex items-center gap-2 border-t border-line-default bg-bg-page px-5 pt-3 pb-1">
          <span className="size-8 shrink-0 overflow-hidden rounded-sm bg-bg-tint">
            {thumbnail && (
              // 서버 사진 주소라 next/image 허용 도메인을 정하기 전까지 img로 둔다
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt=""
                className="size-full object-contain"
              />
            )}
          </span>
          <p className="flex-1 text-body1-bold text-text-strong">
            비교함 {count}
          </p>
          {count < 2 ? (
            // 디자인 메모: 1개만 담고 비교하기 → 「비교하려면 하나 더 담아 주세요」
            <Button
              type="button"
              size="M"
              onClick={() =>
                showToast({ message: "비교하려면 하나 더 담아 주세요" })
              }
            >
              비교하기
            </Button>
          ) : (
            <Button size="M" asChild>
              <Link href="/compare">비교하기</Link>
            </Button>
          )}
        </div>
      )}

      {/* 디자인 메모(11-04): 아래 고정 줄은 [비교함 담기] [쿠팡에서 보기]만, 위에 얇은 선 */}
      <BottomCta className="fixed-app bottom-0 z-30 border-t border-line-default">
        <Button
          type="button"
          kind="tertiary"
          // 읽히는 이름은 늘 「비교함 담기」, 담겼는지는 눌림 상태로만 알린다
          aria-label="비교함 담기"
          aria-pressed={added}
          // 디자인(쿠팡 상품이 없을 때): 「비교함 담기」만 가로 가득
          className={coupangUrl ? undefined : "flex-1"}
          onClick={toggleAdd}
        >
          <IconCompare />
          {added ? (
            <>
              담김 <span aria-hidden>✓</span>
            </>
          ) : (
            "비교함 담기"
          )}
        </Button>
        {coupangUrl && (
          <Button className="flex-1" asChild>
            <a href={coupangUrl} target="_blank" rel="noopener noreferrer">
              쿠팡에서 보기
            </a>
          </Button>
        )}
      </BottomCta>

      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          action={toast.action}
          className={
            count > 0
              ? "bottom-[calc(65px+max(var(--safe-bottom),12px)+69px)]"
              : "bottom-[calc(65px+max(var(--safe-bottom),12px)+8px)]"
          }
        />
      )}
    </>
  );
}
