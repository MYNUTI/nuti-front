"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { CtaButton } from "@/components/common/cta-button";
import { cn } from "@/lib/utils";

const NEXT_ROUTE = "/onboarding/goal";

const STEPS = [
  {
    image: "/onboarding/barcode-scan.png",
    title: ["바코드를 찍으면", "등급이 나옵니다"],
    description: ["내 목표를 기준으로", "제품이 적합한지 바로 알려드려요."],
  },
  {
    image: "/onboarding/goal-grade.png",
    title: ["목표가 바뀌면", "등급도 바뀝니다"],
    description: ["같은 제품도 목표에 따라", "다른 등급이 나와요."],
  },
];

function Lines({ lines }: { lines: string[] }) {
  return lines.map((line, i) => (
    <span key={line} className="block">
      {line}
      {i < lines.length - 1 && " "}
    </span>
  ));
}

export function OnboardingIntro() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === STEPS.length - 1;

  const goTo = (step: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: step * track.clientWidth, behavior: "smooth" });
  };

  return (
    <>
      <header className="flex h-13.5 shrink-0 items-center justify-end px-6">
        {!isLast && (
          <Link
            href={NEXT_ROUTE}
            className="text-[13px] leading-normal tracking-[0.02em] text-text-secondary underline"
          >
            건너뛰기
          </Link>
        )}
      </header>

      <div
        ref={trackRef}
        onScroll={(e) => {
          const { scrollLeft, clientWidth } = e.currentTarget;
          const position = scrollLeft / clientWidth;
          // 넘어가는 도중에 바꾸면 "다음"을 연달아 누를 때 두 번째 탭이 "시작하기"로 들어가므로, 멈췄을 때만 바꾼다
          if (Math.abs(position - Math.round(position)) < 0.01) {
            setIndex(Math.round(position));
          }
        }}
        aria-roledescription="carousel"
        aria-live="polite"
        className="mt-6 flex snap-x snap-mandatory scrollbar-none overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {STEPS.map((step, i) => (
          <section
            key={step.image}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${STEPS.length}`}
            aria-hidden={i !== index}
            className="flex w-full shrink-0 snap-center flex-col items-center gap-8"
          >
            {/* 낮은 화면에서는 그림만 줄여 한 화면에 담되 200px 밑으로는 줄이지 않는다.
                406px는 그림을 뺀 나머지 요소 높이의 합이다 */}
            <div className="relative size-[clamp(200px,calc(100dvh-406px-var(--safe-top)-var(--safe-bottom)),300px)] shrink-0 overflow-hidden rounded-[13.56px]">
              <Image
                src={step.image}
                alt=""
                fill
                sizes="300px"
                loading="eager"
                fetchPriority={i === 0 ? "high" : undefined}
              />
            </div>
            <div className="flex flex-col items-center gap-4 text-center text-text-default">
              <h1 className="text-[32px] leading-[1.3] font-bold tracking-[-0.02em]">
                <Lines lines={step.title} />
              </h1>
              <p className="text-[16px] leading-normal">
                <Lines lines={step.description} />
              </p>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 flex justify-center gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.image}
            type="button"
            aria-label={`${i + 1}번째 소개 보기`}
            aria-current={i === index}
            onClick={() => goTo(i)}
            className={cn(
              "h-3 rounded-full transition-[width,background-color]",
              i === index ? "w-10 bg-deep-green-700" : "w-3 bg-grayscale-300",
            )}
          />
        ))}
      </div>

      <div className="mt-auto px-4 pt-6 pb-2">
        {isLast ? (
          <CtaButton
            asChild
            className="rounded-[10px] text-[18px] font-semibold"
          >
            <Link href={NEXT_ROUTE}>시작하기</Link>
          </CtaButton>
        ) : (
          <CtaButton
            onClick={() => goTo(index + 1)}
            className="rounded-[10px] text-[18px] font-semibold"
          >
            다음
          </CtaButton>
        )}
      </div>
    </>
  );
}
