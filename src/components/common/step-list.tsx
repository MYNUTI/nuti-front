/* v2/StepList — 번호 + 한 문장 단계(권한 다시 켜는 방법 등) */
export function StepList({ steps }: { steps: readonly React.ReactNode[] }) {
  return (
    <ol>
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-3 px-5 py-2.5">
          <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-bg-band px-1.5 text-caption-bold text-text-strong">
            {i + 1}
          </span>
          <span className="min-w-0 flex-1 text-body1 text-text-body">
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}
