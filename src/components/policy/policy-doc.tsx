import { IconChevronDown } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * 5-9 이용약관 · 5-10 개인정보 처리방침이 같이 쓰는 읽기 전용 문서 틀(【최종】).
 * 머리(제목 · 시행일) 아래에 조항 줄이 있고, 줄을 누르면 그 자리에서 본문이 펼쳐진다.
 * 펼침은 <details>라 JS 없이 동작하고 여러 줄을 함께 펼칠 수 있다(메모 「펼친 줄은 ⌃, 닫힌 줄은 ⌄」).
 * 5-10은 목차가 13줄이라 줄 높이 48 · 머리 아래 16으로 5-9(56 · 24)보다 촘촘하다(【최종】) — `compact`
 */

/** 5-10처럼 굵은 소제목 + 내용 묶음으로 펼치는 본문 */
export type PolicyBlock = { heading: string; text: string };

export type PolicySection = { title: string; body: string | PolicyBlock[] };

function Divider() {
  return <div aria-hidden className="mx-5 h-px bg-line-default" />;
}

const BODY_CLASS =
  "bg-bg-tint px-5 pt-3 pb-4 text-body2 leading-[21px] break-keep whitespace-pre-line";

function SectionBody({ body }: { body: PolicySection["body"] }) {
  if (typeof body === "string") {
    return <p className={cn(BODY_CLASS, "text-text-body")}>{body}</p>;
  }
  return (
    <dl className={cn(BODY_CLASS, "flex flex-col gap-1.5")}>
      {body.map((block, i) => (
        <div key={`${i}-${block.heading}`} className="contents">
          <dt className="font-bold text-text-strong">{block.heading}</dt>
          <dd className="text-text-body">{block.text}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PolicyHeader({
  title,
  effectiveDate,
  compact = false,
}: {
  title: string;
  effectiveDate: string;
  compact?: boolean;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-1.5 px-5 pt-2",
        compact ? "pb-4" : "pb-6",
      )}
    >
      <h2 className="text-title1 text-text-strong">{title}</h2>
      <p className="text-body2 text-text-sub">시행일 {effectiveDate}</p>
    </header>
  );
}

export function PolicySections({
  sections,
  compact = false,
  lastDivider = true,
}: {
  sections: PolicySection[];
  compact?: boolean;
  /** 마지막 줄 아래 선. 5-10은 바로 아래 띠(Band)가 와서 선을 긋지 않는다 */
  lastDivider?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <Divider />
      {sections.map((section, i) => (
        <div key={`${i}-${section.title}`}>
          <details className="group">
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center gap-3 bg-bg-page px-5 [&::-webkit-details-marker]:hidden",
                compact ? "py-3" : "py-4",
              )}
            >
              <span className="min-w-0 flex-1 text-body1 text-text-strong">
                {section.title}
              </span>
              <IconChevronDown className="size-5 shrink-0 text-icon-sub group-open:rotate-180" />
            </summary>
            <SectionBody body={section.body} />
          </details>
          {(lastDivider || i < sections.length - 1) && <Divider />}
        </div>
      ))}
    </div>
  );
}
