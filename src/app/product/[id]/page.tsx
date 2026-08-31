import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "제품 정보",
};

export default async function ProductPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-1">
      <p className="text-base font-bold">3-2 제품 결과</p>
      <p className="text-sm text-muted">/product/{id}</p>
    </main>
  );
}
