import { IconCheck } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * v2/Checkbox · v2/Radio의 겉모양. 상태는 바로 앞 형제 <input class="peer">의 :checked를 따른다.
 * 그래서 반드시 peer input 바로 뒤(같은 부모 안)에 둔다.
 */

export function CheckboxMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center",
        "*:flex *:size-[22px] *:items-center *:justify-center *:rounded-[6px] *:border-[1.5px] *:border-line-strong *:bg-bg-page *:text-transparent",
        "peer-checked:*:border-transparent peer-checked:*:bg-brand-primary peer-checked:*:text-brand-on-lime",
        className,
      )}
    >
      <span>
        <IconCheck className="size-[18px]" />
      </span>
    </span>
  );
}

/** soft: 11-04 회의 반영 화면(1-5)의 모양. 고르면 초록 대신 라임 동그라미 */
export function RadioMark({
  tone = "default",
  className,
}: {
  tone?: "default" | "soft";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center",
        "*:flex *:size-[22px] *:items-center *:justify-center *:rounded-full *:border-[1.5px] *:border-line-strong *:bg-bg-page",
        tone === "soft"
          ? "peer-checked:*:border-brand-primary peer-checked:*:bg-brand-primary"
          : "peer-checked:*:border-brand-link peer-checked:*:bg-brand-link",
        className,
      )}
    >
      <span>
        <span className="size-2 rounded-full bg-bg-page" />
      </span>
    </span>
  );
}
