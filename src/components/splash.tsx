"use client";

import { useEffect, useState } from "react";

const GRADES = [
  { letter: "A", color: "bg-grade-a" },
  { letter: "B", color: "bg-grade-b" },
  { letter: "C", color: "bg-grade-c" },
  { letter: "D", color: "bg-grade-d" },
  { letter: "E", color: "bg-grade-e" },
];

const SPLASH_MS = 3000;
const FADE_MS = 400;

export function Splash() {
  const [fading, setFading] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), SPLASH_MS);
    const goneTimer = setTimeout(() => setGone(true), SPLASH_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      style={{ transitionDuration: `${FADE_MS}ms` }}
      className={`fixed-app inset-y-0 z-50 flex flex-col items-center justify-center bg-background px-6 pt-safe pb-safe transition-opacity motion-reduce:transition-none ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex gap-2" aria-hidden>
        {GRADES.map(({ letter, color }) => (
          <span
            key={letter}
            className={`${color} flex h-10 w-8 items-center justify-center rounded-[10px] text-base font-bold text-white`}
          >
            {letter}
          </span>
        ))}
      </div>

      <h1 className="mt-8 text-[34px] font-bold">마이뉴티</h1>
      <p className="mt-3 text-base font-medium text-muted">
        찍으면 나오는, 내 목표 기준 영양 등급
      </p>
    </div>
  );
}
