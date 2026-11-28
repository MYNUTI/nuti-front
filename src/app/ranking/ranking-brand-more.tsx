"use client";

import { Dialog } from "radix-ui";
import { useEffect, useRef, useState } from "react";

import { BottomCta } from "@/components/common/bottom-cta";
import { Button } from "@/components/common/button";
import { SearchField } from "@/components/common/search-field";
import { IconBack } from "@/components/icons";

import { matchRange } from "../search/hangul";
import { groupBrandsByLetter } from "./format";
import { CheckLine } from "./ranking-frame";

/*
 * 2-5e 필터(브랜드 더 보기, 【최종】 ⑥ 9306:17841 · 찾는 브랜드가 없을 때 19089) — 필터 시트 안에서 넘어가는 화면.
 * 위 ‹ 「브랜드 더 보기」, 「브랜드 찾기」 칸, 「○○ 브랜드, 가나다순」 줄, 가나다 머리로 묶은 전체 브랜드(「제조 ○○」 포함) 체크,
 * 아래 「브랜드 n개 적용」. 체크는 시트에서 고르는 값을 바로 바꾸고, 적용 · ‹ 둘 다 고른 채 2-5 브랜드 탭으로 돌아간다
 * (고른 것을 지우는 길은 시트의 「초기화」).
 * 찾기 칸에 글자를 넣으면 목록을 그 글자(초성 포함)로 좁히고 머리는 숨긴다. 고른 브랜드는 목록에서 빠져도 고른 채다.
 */
export function BrandMore({
  categoryName,
  brands,
  selected,
  onToggle,
  onBack,
}: {
  /** 지금 순위의 종류 이름(중분류, 「전체」면 대분류) */
  categoryName: string;
  brands: { name: string; count: number }[];
  selected: string[];
  onToggle: (brand: string) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  // 화면이 바뀐 것을 알리도록 제목으로 포커스를 옮긴다(찾기 칸에 주면 휴대폰 키보드가 바로 올라온다)
  useEffect(() => title.current?.focus(), []);

  const q = query.trim();
  const found = q ? brands.filter((b) => matchRange(b.name, q)) : brands;

  return (
    <>
      <div className="relative flex h-13 shrink-0 items-center justify-center">
        <button
          type="button"
          aria-label="뒤로"
          onClick={onBack}
          className="absolute left-1 flex size-12 items-center justify-center text-icon-default"
        >
          <IconBack />
        </button>
        <Dialog.Title
          ref={title}
          tabIndex={-1}
          className="text-body1-bold text-text-strong outline-none"
        >
          브랜드 더 보기
        </Dialog.Title>
      </div>

      <div className="shrink-0 px-4 pt-1.5 pb-2.5">
        <SearchField
          ref={input}
          aria-label="브랜드 찾기"
          placeholder="브랜드 찾기"
          enterKeyHint="done"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => {
            setQuery("");
            input.current?.focus();
          }}
          className="h-11"
        />
      </div>

      {/* 영역이 먼저 있어야 읽으므로 늘 두고 글자만 바꾼다(2-3 자동완성과 같은 방식) */}
      <p role="status" className="sr-only">
        {q
          ? found.length > 0
            ? `브랜드 ${found.length}개`
            : "찾는 브랜드가 없어요"
          : ""}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {found.length === 0 ? (
          <div className="flex flex-col items-center gap-1 px-5 pt-12 text-center">
            <p className="text-body1-bold text-text-strong">
              {categoryName}에는 {q} 브랜드 제품이 없어요
            </p>
            <p className="text-body2 text-text-sub">
              이름을 줄이거나 띄어쓰기를 바꿔 찾아보세요.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                input.current?.focus();
              }}
              className="mt-1 h-11 px-3 text-body2-bold text-brand-link"
            >
              지우기
            </button>
          </div>
        ) : q ? (
          <ul className="py-1">
            {found.map(({ name, count }) => (
              <CheckLine
                key={name}
                label={name}
                count={count}
                checked={selected.includes(name)}
                onChange={() => onToggle(name)}
              />
            ))}
          </ul>
        ) : (
          <div className="py-1">
            <p className="py-1 pl-5 text-[13px] leading-4 text-text-sub">
              {categoryName} 브랜드, 가나다순
            </p>
            {groupBrandsByLetter(found).map(({ letter, brands: group }) => (
              <section key={letter}>
                <h3 className="pt-3 pb-1 pl-5 text-[15px] leading-[18px] font-bold text-text-body">
                  {letter}
                </h3>
                <ul>
                  {group.map(({ name, count }) => (
                    <CheckLine
                      key={name}
                      label={name}
                      count={count}
                      checked={selected.includes(name)}
                      onChange={() => onToggle(name)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <BottomCta>
        <Button kind="primary" className="flex-1" onClick={onBack}>
          브랜드 {selected.length}개 적용
        </Button>
      </BottomCta>
    </>
  );
}
