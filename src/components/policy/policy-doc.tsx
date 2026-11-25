import { IconChevronDown } from "@/components/icons";

/*
 * 5-9 이용약관 · 5-10 개인정보 처리방침이 같이 쓰는 읽기 전용 문서 틀(【최종】).
 * 머리(제목 · 시행일) 아래에 조항 줄이 있고, 줄을 누르면 그 자리에서 본문이 펼쳐진다.
 * 펼침은 <details>라 JS 없이 동작하고 여러 줄을 함께 펼칠 수 있다(메모 「펼친 줄은 ⌃, 닫힌 줄은 ⌄」).
 */

export type PolicySection = { title: string; body: string };

function Divider() {
  return <div aria-hidden className="mx-5 h-px bg-line-default" />;
}

export function PolicyHeader({
  title,
  effectiveDate,
}: {
  title: string;
  effectiveDate: string;
}) {
  return (
    <header className="flex flex-col gap-1.5 px-5 pt-2 pb-6">
      <h2 className="text-title1 text-text-strong">{title}</h2>
      <p className="text-body2 text-text-sub">시행일 {effectiveDate}</p>
    </header>
  );
}

export function PolicySections({ sections }: { sections: PolicySection[] }) {
  return (
    <div className="flex flex-col">
      <Divider />
      {sections.map((section, i) => (
        <div key={`${i}-${section.title}`}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 bg-bg-page px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1 text-body1 text-text-strong">
                {section.title}
              </span>
              <IconChevronDown className="size-5 shrink-0 text-icon-sub group-open:rotate-180" />
            </summary>
            <p className="bg-bg-tint px-5 pt-3 pb-4 text-body2 leading-[21px] break-keep whitespace-pre-line text-text-body">
              {section.body}
            </p>
          </details>
          <Divider />
        </div>
      ))}
    </div>
  );
}
