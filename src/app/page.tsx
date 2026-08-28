import { Splash } from "@/components/splash";

export default function Page() {
  return (
    <>
      <main className="flex flex-1 flex-col items-center justify-center">
        <p className="text-sm text-muted">메인 화면 자리</p>
      </main>
      <Splash />
    </>
  );
}
