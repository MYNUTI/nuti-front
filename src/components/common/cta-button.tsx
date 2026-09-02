import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "primary" | "neutral" | "outline";

const TONES: Record<Tone, string> = {
  primary: "",
  neutral: "bg-neutral text-neutral-foreground hover:bg-neutral/85",
  outline: "bg-card",
};

/** 화면 하단에 놓이는 주요 액션 버튼. asChild로 링크로도 쓴다. */
export function CtaButton({
  tone = "primary",
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "variant" | "size"> & {
  tone?: Tone;
}) {
  return (
    <Button
      variant={tone === "outline" ? "outline" : "default"}
      className={cn(
        "h-14 w-full rounded-2xl text-base font-bold",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}
