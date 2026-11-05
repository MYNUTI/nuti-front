import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/*
 * globals.css의 글자 스타일 토큰(text-body1 등)을 글자 크기로, rounded-sheet를 모서리로 알려 준다.
 * 알려 주지 않으면 tailwind-merge가 글자 스타일을 글자 색으로 보고 같이 쓴 text-brand-link 같은 색을 지우고,
 * rounded-sheet는 다른 rounded-*와 겹쳐도 둘 다 남긴다.
 * globals.css에 글자 스타일이나 모서리 토큰을 더하거나 빼면 여기도 맞춘다.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["sheet"],
      text: [
        "display",
        "title1",
        "title2",
        "section",
        "body1",
        "body1-medium",
        "body1-bold",
        "body2",
        "body2-medium",
        "body2-bold",
        "caption",
        "caption-bold",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
