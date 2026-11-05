import { redirect } from "next/navigation";

// 0-1 스플래시는 앱 안에 두지 않고 설치한 PWA의 운영체제 스플래시로 대신한다(UI 플랜 결정 기록)
export default function Page() {
  redirect("/intro");
}
