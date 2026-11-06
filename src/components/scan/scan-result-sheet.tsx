import Link from "next/link";
import { Button } from "@/components/common/button";
import { ScoreRing, type ScoreBand } from "@/components/common/score-ring";
import { Thumb } from "@/components/common/thumb";
import { cn } from "@/lib/utils";

/**
 * 조회 실패·미등록 안내용(예전 모양). 뷰파인더 하단에 겹쳐 띄우며 호출자는 `relative` 컨테이너 안에 둬야 한다.
 * 3-2 결과는 ScanResultSheet가 맡는다. 해당 화면(3-6 등)을 만들 때 바꾼다.
 */
function SheetFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="absolute inset-x-3 bottom-3 animate-in rounded-2xl border border-border bg-card p-3.5 shadow-lg slide-in-from-bottom-4"
    >
      {children}
    </div>
  );
}

/** 3-2 결과 시트가 쓰는 모양. 서버 필드 이름이 아니라 화면이 쓰는 값이다(UI 플랜 「데이터」) */
export type ScanSheetProduct = {
  /** 내부 상품 ID. 상세 경로 /product/[id]에 쓴다 */
  id: string;
  brand: string | null;
  name: string;
  imageUrl: string | null;
  /** 0~100 */
  score: number;
  band: ScoreBand;
  /** 같은 종류 안 순위. API에 없어 없을 수 있다 */
  rank: { position: number; total: number } | null;
  /** 「다이어트 목표」처럼 점수를 매긴 기준 */
  goalLabel: string;
  /** 한 줄 설명(감점이 큰 이유). 없을 수 있다 */
  summary: string | null;
};

/**
 * 3-2 제품 결과(스캔 직후). 카메라 위에 붙는 시트로, 카메라는 계속 켜져 있어 다음 바코드를 비추면 내용만 바뀐다.
 * 디자인 메모: 제품 줄·자세히 보기 → 3-2 제품 결과. 사용자가 닫는 시트가 아니라 모달로 띄우지 않는다.
 */
export function ScanResultSheet({
  product,
  placement = "bottom",
  added,
  onAdd,
}: {
  product: ScanSheetProduct;
  /** bottom: 화면 아래에 붙음(디자인) · inline: 카메라 자리 안 아래(아래 버튼 줄을 살릴 때) */
  placement?: "bottom" | "inline";
  /** 비교함에 담았는지 */
  added: boolean;
  onAdd: () => void;
}) {
  const href = `/product/${product.id}`;
  const meta = [
    product.rank && `${product.rank.total}개 중 ${product.rank.position}위`,
    product.goalLabel,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      aria-label="스캔 결과"
      className={cn(
        "flex flex-col gap-4 bg-bg-page px-5 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.16)]",
        placement === "bottom"
          ? "fixed-app bottom-0 z-40 rounded-t-sheet pb-[calc(16px+max(var(--safe-bottom),34px))]"
          : "absolute inset-x-0 bottom-0 rounded-t-sheet pb-5",
      )}
    >
      <div aria-hidden className="flex justify-center">
        <span className="h-1 w-9 rounded-[2px] bg-line-strong" />
      </div>
      <Link href={href} className="flex items-center gap-3.5">
        <Thumb className="size-18">
          {product.imageUrl && (
            // 서버 사진 주소라 next/image 허용 도메인을 정하기 전까지 img로 둔다
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" />
          )}
        </Thumb>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {product.brand && (
            <span className="text-body2 text-text-sub">{product.brand}</span>
          )}
          <span className="text-body1-bold text-text-strong">
            {product.name}
          </span>
          <span className="flex items-center gap-1.5 pt-1">
            <ScoreRing score={product.score} band={product.band} size="S" />
            <span className="text-body2 text-text-sub">{meta}</span>
          </span>
        </span>
      </Link>
      {product.summary && (
        <p className="text-body1 text-text-body">{product.summary}</p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          kind="secondary"
          size="M"
          className="flex-1"
          onClick={onAdd}
        >
          {added ? "담김 ✓" : "비교함 담기"}
        </Button>
        <Button size="M" className="flex-1" asChild>
          <Link href={href}>자세히 보기</Link>
        </Button>
      </div>
    </section>
  );
}

/** 결과 대신 조회 상태를 알린다. 결과 시트와 같은 자리를 써서 결과가 오면 그대로 교체된다. */
export function ScanMessageSheet({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <SheetFrame>
      <p className="text-[15px] font-bold">{title}</p>
      {description && (
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </SheetFrame>
  );
}
