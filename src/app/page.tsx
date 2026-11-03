import { redirect } from "next/navigation";

// 0-1 스플래시는 앱 안에 두지 않고 설치한 PWA의 운영체제 스플래시로 대신한다(UI 플랜 결정 기록).
// /intro(0-4)가 생기기 전까지는 임시 온보딩으로 보낸다. 0-4를 추가하는 커밋에서 /intro로 바꾼다
export default function Page() {
  redirect("/onboarding");
}
