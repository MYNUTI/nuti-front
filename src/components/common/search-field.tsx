import Link from "next/link";

import { IconClose, IconSearch } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 피그마 v2/SearchField — 검색칸 48 · 회색 면. 상단 막대 안(search)에서는 className으로 h-11을 준다.
 * 지우기 버튼은 값이 있고 onClear를 넘겼을 때만 보인다.
 */
export function SearchField({
  value,
  onClear,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  value?: string;
  onClear?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex h-12 items-center gap-2 rounded-md bg-bg-field pr-3 pl-3.5",
        className,
      )}
    >
      <IconSearch className="size-5 shrink-0 text-icon-sub" />
      <input
        type="search"
        enterKeyHint="search"
        value={value}
        className="min-w-0 flex-1 bg-transparent text-body1 text-text-strong outline-none placeholder:text-text-hint [&::-webkit-search-cancel-button]:appearance-none"
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={onClear}
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-line-strong text-white"
        >
          <IconClose className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** 홈처럼 누르면 검색 화면(2-3)으로 가는 검색칸. 모양은 SearchField와 같고 입력은 받지 않는다 */
export function SearchFieldLink({
  placeholder,
  className,
  ...props
}: React.ComponentProps<typeof Link> & { placeholder: string }) {
  return (
    <Link
      {...props}
      className={cn(
        "flex h-12 items-center gap-2 rounded-md bg-bg-field pr-3 pl-3.5",
        className,
      )}
    >
      <IconSearch className="size-5 shrink-0 text-icon-sub" />
      <span className="text-body1 text-text-hint">{placeholder}</span>
    </Link>
  );
}
