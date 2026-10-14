import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CardTutorial({
  step,
  total,
  title,
  description,
  onPrev,
  onNext,
  onSkip,
  className,
}: {
  step: number;
  total: number;
  title: string;
  description: string;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-[12px] border border-border-default bg-bg-surface p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 rounded-full bg-bg-info px-3 py-1 text-[13px] leading-normal font-semibold tracking-[0.02em] text-text-info">
              {step}/{total}
            </span>
            <h2 className="truncate text-[20px] leading-[1.4] font-bold text-text-default">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 text-[13px] leading-normal tracking-[0.02em] text-text-secondary"
          >
            건너뛰기
          </button>
        </div>
        <p className="text-[14px] leading-normal font-medium tracking-[0.02em] text-text-secondary">
          {description}
        </p>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onPrev}
          className="h-12 flex-1 rounded-[10px] border-grayscale-100 bg-bg-default px-4 text-base font-semibold text-grayscale-800"
        >
          이전
        </Button>
        <Button
          onClick={onNext}
          className="h-12 flex-1 rounded-[10px] px-4 text-base font-semibold"
        >
          다음
        </Button>
      </div>
    </div>
  );
}
