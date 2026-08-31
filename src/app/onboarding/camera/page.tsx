import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "카메라 안내",
};

export default function CameraNoticePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-1">
      <p className="text-base font-bold">0-3 카메라 안내</p>
      <p className="text-sm text-muted">/onboarding/camera</p>
    </main>
  );
}
