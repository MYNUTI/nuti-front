import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tone = "primary" | "secondary" | "outline";

const VARIANTS = {
  primary: "default",
  secondary: "secondary",
  outline: "outline",
} as const;

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
      variant={VARIANTS[tone]}
      className={cn(
        "h-14 w-full rounded-2xl text-base font-bold",
        tone === "outline" && "bg-card",
        className,
      )}
      {...props}
    />
  );
}
