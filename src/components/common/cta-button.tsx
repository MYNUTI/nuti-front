import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ComponentProps } from "react";

/** 화면 하단에 고정되는 주요 액션 버튼. asChild로 링크로도 쓴다. */
export function CtaButton({
  variant = "default",
  className,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant={variant}
      className={cn(
        "h-14 w-full rounded-2xl text-base font-bold",
        variant === "outline" && "bg-card",
        className,
      )}
      {...props}
    />
  );
}
