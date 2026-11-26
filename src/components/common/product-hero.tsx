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
        {/* ⑩ 공통 규칙: 결과 머리 이름은 3줄까지, 단어 가운데서 줄을 바꾸지 않는다 */}
        <h1 className="line-clamp-3 text-title1 break-keep text-text-strong">
          {name}
        </h1>
        {basis && <p className="text-body2 text-text-sub">{basis}</p>}
      </div>
    </div>
  );
}
