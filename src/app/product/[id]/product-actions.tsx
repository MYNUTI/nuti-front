"use client";

import { createContext, use, useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { Toast } from "@/components/common/toast";
import {
  IconCompare,
  IconHeart,
  IconHeartFill,
  IconShare,
} from "@/components/icons";
import { CompareBar } from "@/components/compare/compare-bar";
import { CompareFullSheet } from "@/components/compare/compare-full-sheet";
import {
  addToCompare,
  removeFromCompare,
  useCompare,
  type CompareItem,
} from "@/components/compare/compare-store";
import { cn } from "@/lib/utils";

/*
 * 3-2 ♡ 저장 · 비교함 담기. 둘은 따로 켜지고 꺼진다(디자인 「담고 저장했을 때」·「비교함에 담았을 때」·「즐겨찾기했을 때」).
 * ♡는 점수 줄에, 담기는 아래 고정 줄에 있어 같은 상태를 나눠 쓰려고 context로 묶는다.
 * 비교함은 화면 사이에 유지되는 공통 저장소(components/compare)를 쓴다. ♡ 서버 저장은 API 연결 때 붙인다(지금은 이 화면 안 상태).
 */

type ToastState = {
  key: number;
  message: string;
  action?: { label: string; onClick: () => void };
};

type Actions = {
  previewing: boolean;
  /** 되돌리기 뒤 포커스를 돌려놓을 ♡ 버튼 */
  saveRef: React.RefObject<HTMLButtonElement | null>;
  saved: boolean;
  /** 비교함에 담긴 제품들(이 제품 포함 여부는 added) */
  compare: readonly CompareItem[];
  added: boolean;
  toggleSave: () => void;
  toggleAdd: () => void;
  toast: ToastState | null;
  showToast: (t: Omit<ToastState, "key">) => void;
};

const ActionsContext = createContext<Actions | null>(null);

/** 담기·공유와 같은 알림 띠를 이 화면의 다른 동작(정보가 틀렸어요)도 쓴다 */
export function useProductToast() {
  return useActions().showToast;
}

function useActions() {
  const value = use(ActionsContext);
  if (!value) throw new Error("ProductActions 안에서 써야 한다");
  return value;
}

export function ProductActions({
  product,
  previewing,
  children,
}: {
  /** 비교함에 담을 이 제품 */
  product: CompareItem;
  /** 다른 목표로 미리 보는 중이면 담기 알림이 「내 목표 기준으로 담았어요」(디자인 메모 11-03) */
  previewing: boolean;
  children: React.ReactNode;
}) {
  const saveRef = useRef<HTMLButtonElement>(null);
  const [saved, setSaved] = useState(false);
  const compare = useCompare();
  const added = compare.some((item) => item.id === product.id);
  const [toast, setToast] = useState<ToastState | null>(null);
  // 꽉 찼을 때 담으려던 이 제품(3-4 비교함이 다 찼을 때 시트)
  const [pending, setPending] = useState<CompareItem | null>(null);

  const showToast = (t: Omit<ToastState, "key">) =>
    setToast((prev) => ({ ...t, key: (prev?.key ?? 0) + 1 }));

  const toggleSave = () => {
    if (saved) {
      setSaved(false);
      // 【최종】: ♥를 풀면 「즐겨찾기에서 뺐어요」 + [되돌리기]
      showToast({
        message: "즐겨찾기에서 뺐어요",
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
      showToast({
        message: "즐겨찾기에 넣었어요. 기록 탭에서 볼 수 있어요.",
      });
    }
  };

  const toggleAdd = () => {
    if (added) {
      removeFromCompare(product.id);
      return;
    }
    if (addToCompare(product) === "full") {
      setPending(product);
      return;
    }
    showAdded();
  };

  // 【최종】: 비교함 바 글이 담은 걸 알려 주니 알림은 미리 보는 중(다른 목표로 보는데 내 목표 기준으로 담김)에만
  const showAdded = () => {
    if (previewing) showToast({ message: "내 목표 기준으로 담았어요" });
  };

  return (
    <ActionsContext
      value={{
        previewing,
        saveRef,
        saved,
        compare,
        added,
        toggleSave,
        toggleAdd,
        toast,
        showToast,
      }}
    >
      {children}
      <CompareFullSheet
        key={pending?.id}
        pending={pending}
        onClose={() => setPending(null)}
        // 빼고 담은 것도 담은 것이라 담기와 같은 알림
        onReplaced={showAdded}
      />
    </ActionsContext>
  );
}

/**
 * 점수 줄의 공유(3-2 공유 주소 복사). 디자인 메모: 기기 공유 창을 띄울 수 있는 브라우저면 공유 창,
 * 안 되면 주소 복사 + 알림.
 * 미리 보기 중이어도 주소에는 미리 보기를 빼고 보낸다. 받는 사람은 자기 목표 기준으로 본다(디자인 메모 11-03).
 */
export function ShareButton({ path, title }: { path: string; title: string }) {
  const { previewing, showToast } = useActions();

  const share = async () => {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        if (previewing)
          showToast({ message: "받는 사람의 목표 기준으로 보여요" });
        return;
      } catch (error) {
        // 공유 창을 닫았거나 이미 열려 있으면 그대로 둔다. 권한 정책·앱 안 브라우저의 거절은 주소 복사로 넘어간다
        if (
          error instanceof DOMException &&
          (error.name === "AbortError" || error.name === "InvalidStateError")
        )
          return;
      }
    }
    try {
      // https가 아니면 navigator.clipboard 자체가 없다(타입은 늘 있다고 본다)
      await navigator.clipboard.writeText(url);
    } catch {
      // 실패 문구는 디자인에 없어 임시(UI 플랜 「남은 질문」 10)
      showToast({ message: "주소를 복사하지 못했어요" });
      return;
    }
    showToast({
      message: previewing
        ? "주소를 복사했어요. 받는 사람의 목표 기준으로 보여요"
        : "링크를 복사했어요",
    });
  };

  return (
    <button
      type="button"
      aria-label="공유"
      className="[&_svg]:size-[26px]"
      onClick={() => void share()}
    >
      <IconShare />
    </button>
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

/** 아래 고정 줄 [비교함 담기][쿠팡에서 보기] + 비교함에 담은 제품이 있으면 그 위 비교함 바 + 알림 띠 */
export function ProductBottomBar({
  coupangUrl,
}: {
  coupangUrl: string | null;
}) {
  const { compare, added, toggleAdd, toast, showToast } = useActions();
  // 다른 화면에서 담은 제품도 센다(비교함은 화면 사이에 유지된다)
  const count = compare.length;

  return (
    <>
      {/* 담은 만큼 아래 여백을 늘려 맨 아래 내용이 비교함 바에 가리지 않게 한다 */}
      {count > 0 && <div aria-hidden className="h-[61px]" />}
      {count > 0 && (
        // 아래 고정 줄(위 선 1 + 위 여백 12 + 버튼 52 + 아래 여백) 바로 위에 붙인다. 바 높이 61 = 선 1 + 12 + 버튼 44 + 4
        <CompareBar
          items={compare}
          onTooFew={() =>
            showToast({ message: "비교하려면 하나 더 담아 주세요" })
          }
          className="bottom-[calc(65px+max(var(--safe-bottom),12px))] pb-1"
        />
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
