"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/** 체크 상태 그림. group/checkbox 조상의 data-state를 따른다 */
function CheckboxMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6 shrink-0", className)}
    >
      <rect
        x="3.11111"
        y="3.11111"
        width="17.7778"
        height="17.7778"
        rx="3.33333"
        strokeWidth="2.22222"
        className="stroke-grayscale-300 group-data-[state=checked]/checkbox:hidden"
      />
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="4.44444"
        className="hidden fill-deep-green-700 group-data-[state=checked]/checkbox:inline"
      />
      <path
        d="M16 9.3333L10.6666 14.6667L7.99992 12"
        strokeWidth="2.66669"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-grayscale-300 group-data-[state=checked]/checkbox:stroke-white"
      />
    </svg>
  );
}

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group/checkbox shrink-0 rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxMark />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, CheckboxMark };
