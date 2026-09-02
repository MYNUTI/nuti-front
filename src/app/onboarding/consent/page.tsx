import type { Metadata } from "next";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = {
  title: "개인정보 수집 동의",
};

export default function ConsentPage() {
  return (
    <main className="flex flex-1 flex-col pt-safe pb-safe">
      <ConsentForm />
    </main>
  );
}
