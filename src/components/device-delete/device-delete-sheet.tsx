"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/common/button";
import { ListRow } from "@/components/common/list-row";
import { ConfirmSheet } from "@/components/common/sheet";
import { Toast } from "@/components/common/toast";

/*
 * 5-10b 이 기기의 기록 삭제 요청(【최종】). 5-10 처리방침 맨 아래 · 5-5 설정(로그인 전)의 줄을 누르면 그 화면 위에 뜬다.
 * 5-5 로그아웃 시트와 같은 틀에 버튼은 「닫기」 하나. 닫기 · 바깥 → 시트를 연 화면.
 */
function DeviceDeleteSheet({
  open,
  onOpenChange,
  deviceId,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  email: string;
}) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );

  async function copy() {
    let message = "기기 번호를 복사했어요";
    try {
      // https가 아니면 navigator.clipboard 자체가 없다(타입은 늘 있다고 본다)
      await navigator.clipboard.writeText(deviceId);
    } catch {
      // 【최종】 메모: 브라우저가 복사를 막으면 번호를 길게 눌러 고르게 한다(번호는 select-all)
      message = "복사하지 못했어요. 길게 눌러 복사해 주세요.";
    }
    setToast((prev) => ({ id: (prev?.id ?? 0) + 1, message }));
  }

  return (
    <ConfirmSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setToast(null);
        onOpenChange(next);
      }}
      dismissible
      title="이 기기의 기록 삭제 요청"
      description="로그인하지 않고 쓴 기록은 이 기기 번호로 찾아 지워요."
      cancelLabel="닫기"
    >
      <ol className="text-body2 break-keep text-text-body">
        {/* 줄 나눔은 【최종】 그대로 */}
        <li>1. 아래 기기 번호를 복사해요.</li>
        <li>
          2. 복사한 번호를 개인정보 보호책임자 이메일로
          <br />
          보내 주시면 서버의 기록을 지워요.
        </li>
        <li>
          3. 그다음 브라우저의 「사이트 데이터 삭제」로
          <br />이 기기에 저장된 기록을 지워요.
        </li>
      </ol>
      <div className="flex items-center gap-3 rounded-[10px] bg-bg-tint py-3 pr-3 pl-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body2 text-text-sub">기기 번호</span>
          <span className="ph-mask text-body1-medium break-all text-text-strong select-all">
            {deviceId}
          </span>
        </div>
        <Button
          kind="secondary"
          size="S"
          className="shrink-0"
          onClick={() => void copy()}
        >
          복사
        </Button>
      </div>
      <p className="text-body2 break-all text-text-sub">보낼 곳: {email}</p>
      {/*
       * 알림 띠는 시트 위(【최종】 시트 윗변에서 16 위)에 뜬다. 시트 안에 두어야 화면 읽기 프로그램이 읽는데(시트 밖은 aria-hidden),
       * 알림 띠는 화면 기준 fixed라 translate로 이 칸을 기준 상자로 만들어 시트 윗변에 붙인다
       */}
      <div className="pointer-events-none absolute inset-x-0 bottom-full mb-4 translate-x-0">
        {toast && (
          <Toast key={toast.id} message={toast.message} className="bottom-0" />
        )}
      </div>
    </ConfirmSheet>
  );
}

/**
 * 시트를 여는 줄 + 시트. `initialOpen`은 주소 값(`?sheet=device-delete`)으로 바로 열어 보는 미리보기다.
 * 주소로 열었으면 닫을 때 그 주소 값을 지운다(새로 고침에 다시 뜨지 않게). 이동 주소는 지금 화면 경로로만 정한다
 */
export function DeviceDeleteRow({
  title,
  className,
  initialOpen,
  deviceId,
  email,
}: {
  title: string;
  className?: string;
  initialOpen: boolean;
  deviceId: string;
  email: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(initialOpen);

  return (
    <>
      <ListRow
        title={title}
        className={className}
        onClick={() => setOpen(true)}
      />
      <DeviceDeleteSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next && initialOpen) router.replace(pathname, { scroll: false });
        }}
        deviceId={deviceId}
        email={email}
      />
    </>
  );
}
