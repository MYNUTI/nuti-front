"use client";

import { Checkbox as CheckboxPrimitive, RadioGroup } from "radix-ui";
import { CheckboxMark } from "@/components/ui/checkbox";
import { RadioMark } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

// 테두리 굵기가 1→2px로 바뀌어도 크기가 밀리지 않도록 inset-ring으로 그린다
const CARD =
  "flex w-full min-w-0 items-center gap-2 rounded-[12px] bg-bg-surface px-5 py-4 text-left inset-ring inset-ring-border-default outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[color-mix(in_srgb,var(--deep-green-700)_10%,white)] data-[state=checked]:inset-ring-2 data-[state=checked]:inset-ring-deep-green-700";

type CardText = { title: string; description: string };

function CardBody({ title, description }: CardText) {
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[18px] leading-[1.4] font-semibold text-text-default">
        {title}
      </span>
      <span className="truncate text-[15px] leading-normal tracking-[0.01em] text-text-secondary">
        {description}
      </span>
    </span>
  );
}

/** RadioGroup 안에서 쓴다 */
export function CardRadio({
  title,
  description,
  className,
  ...props
}: React.ComponentProps<typeof RadioGroup.Item> & CardText) {
  return (
    <RadioGroup.Item className={cn("group/radio", CARD, className)} {...props}>
      <CardBody title={title} description={description} />
      <RadioMark />
    </RadioGroup.Item>
  );
}

export function CardCheckbox({
  title,
  description,
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & CardText) {
  return (
    <CheckboxPrimitive.Root
      className={cn("group/checkbox", CARD, className)}
      {...props}
    >
      <CardBody title={title} description={description} />
      <CheckboxMark />
    </CheckboxPrimitive.Root>
  );
}
