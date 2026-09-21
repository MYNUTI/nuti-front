import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CtaButton } from "@/components/common/cta-button";
import { GradeBadge, GradeBar } from "@/components/common/grade";
import { findProductById } from "@/lib/product";

export async function generateMetadata({
  params,
}: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await params;

  return { title: findProductById(id)?.name ?? "제품 정보" };
}

export default async function ProductPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = findProductById(id);

  if (!product) notFound();

  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <div className="flex flex-1 flex-col px-5 pt-14 pb-6">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3.5">
            <span className="size-14 shrink-0 rounded-xl bg-muted" />
            <div className="flex flex-col items-start gap-1.5">
              <h1 className="text-[15px] font-bold">{product.name}</h1>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                분류 비교 전
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <GradeBadge grade={product.grade} className="size-11 text-lg" />
            <span className="text-[15px] font-bold">{product.verdict}</span>
          </div>

          <GradeBar grade={product.grade} className="mt-3" />

          <button type="button" className="mt-4 text-[13px] font-bold">
            왜 {product.grade}인가요?
          </button>
        </div>

        <section className="mt-5">
          <h2 className="sr-only">영양성분</h2>
          <ul className="flex flex-col gap-2.5">
            {product.nutrients.map(({ label, value, note }, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
              >
                <span className="text-[15px]">{label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-bold">{value}</span>
                  {note && (
                    <span className="rounded-md bg-warning px-2 py-1 text-[11px] font-bold text-warning-foreground">
                      {note}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-auto flex gap-2.5 pt-10">
          <CtaButton tone="secondary" className="flex-1">
            저장
          </CtaButton>
          <CtaButton className="flex-1">더 나은 선택</CtaButton>
        </div>
      </div>
    </main>
  );
}
