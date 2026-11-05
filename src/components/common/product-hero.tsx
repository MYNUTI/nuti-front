import { cn } from "@/lib/utils";

/*
 * v2/ProductHero — 결과 계열 화면의 제품 머리.
 * 흰 바탕 큰 사진(256) + 브랜드·종류 / 이름(22) / 기준량.
 */
export function ProductHero({
  meta,
  name,
  basis,
  image,
  className,
}: {
  /** 「브랜드 · 종류」 한 줄 */
  meta?: React.ReactNode;
  name: React.ReactNode;
  /** 「30g 기준 124kcal」 같은 기준량 한 줄 */
  basis?: React.ReactNode;
  /** 사진 자리에 넣을 사진 */
  image?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col bg-bg-page", className)}>
      <div className="flex h-68 items-center justify-center py-2">
        <div className="size-64 *:size-full *:object-contain">{image}</div>
      </div>
      <div className="flex flex-col gap-1 px-5 pt-2 pb-1">
        {meta && <p className="text-body2 text-text-sub">{meta}</p>}
        <h1 className="text-title1 text-text-strong">{name}</h1>
        {basis && <p className="text-body2 text-text-sub">{basis}</p>}
      </div>
    </div>
  );
}
