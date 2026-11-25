"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useGoBack } from "@/components/common/back-button";
import { Button } from "@/components/common/button";
import { Notice } from "@/components/common/notice";
import { TopBar, TopBarButton } from "@/components/common/top-bar";
import { IconClose } from "@/components/icons";
import { useCameraPlace } from "@/components/scan/use-camera-place";

type Provider = "kakao" | "naver" | "google";

/*
 * 소셜 로그인 시작 주소는 아직 없다(API 플랜 「남은 질문」: 소셜별 client_id · redirect_uri).
 * 그때까지는 로그인에 성공했다고 치고 5-6 가입 동의로 간다(「아직 없는 화면은 경로만」).
 */
const startHref = (provider: Provider) => `/login/agree?provider=${provider}`;

export function LoginScreen({ failed }: { failed: boolean }) {
  const goBack = useGoBack("/my");
  const place = useCameraPlace();
  // 앱 안 브라우저에서 구글을 눌렀을 때만 띄우는 안내(구글은 앱 안 브라우저 로그인을 막는다)
  const [googleBlocked, setGoogleBlocked] = useState(false);
  const inApp = place?.kind === "in-app" ? place : null;
  const openExternal = inApp?.openExternal;

  return (
    <div className="flex min-h-dvh flex-col bg-bg-page pt-safe pb-safe">
      <TopBar
        right={
          <TopBarButton aria-label="닫기" onClick={goBack}>
            <IconClose />
          </TopBarButton>
        }
      />
      <main className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center gap-2 px-5 pt-[70px] pb-11">
          {/* 【최종】은 「학교안심 알림장」 글꼴이다. 앱에 없는 글꼴이라 스플래시(0-1)처럼 Pretendard Bold로 쓴다 */}
          <p className="text-[20px] leading-6 font-bold text-brand-link">
            마이뉴티
          </p>
          <h1 className="text-center text-title1 text-text-strong">
            폰을 바꿔도 기록이 남아요
          </h1>
          <p className="text-center text-body1 text-text-sub">
            지금까지의 기록도 계정으로 그대로 옮겨요.
          </p>
          <Image
            src="/login/hero.png"
            width={1448}
            height={1086}
            sizes="306px"
            alt=""
            // 첫 화면 가운데 큰 그림이라 먼저 받는다(홈 배너와 같음)
            loading="eager"
            fetchPriority="high"
            className="mt-7 h-[230px] w-[306px] object-cover opacity-95"
          />
        </div>

        <div className="flex flex-col items-center gap-5 px-5">
          {failed && !googleBlocked && (
            <Notice className="w-full rounded-md">
              로그인하지 못했어요. 다시 시도하거나 다른 방법을 골라 주세요.
            </Notice>
          )}
          {googleBlocked && inApp && (
            <Notice className="w-full rounded-md">
              이 앱 안에서는 구글 로그인이 열리지 않을 수 있어요.
              {/* 바깥 브라우저로 열 방법이 없는 곳은 버튼을 뺀다(0-4 앱 안 브라우저 안내와 같음) */}
              {openExternal && (
                <Button
                  type="button"
                  kind="text"
                  size="S"
                  className="h-auto px-0 pt-1"
                  onClick={() => {
                    window.location.href = openExternal(window.location.href);
                  }}
                >
                  다른 브라우저로 열기
                </Button>
              )}
            </Notice>
          )}

          {/* 버튼 색 · 심볼은 각 회사 로그인 버튼 지침대로(카카오 #FEE500 · 글자 85% 검정) */}
          <Link
            href={startHref("kakao")}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-md bg-[#fee500] text-body1-bold text-[#191919]"
          >
            <Image src="/login/kakao.svg" width={18} height={18} alt="" />
            카카오로 계속하기
          </Link>

          <div className="flex w-full items-center gap-3">
            <span aria-hidden className="h-px flex-1 bg-line-default" />
            <p className="text-body2 text-text-sub">다른 방법으로 계속하기</p>
            <span aria-hidden className="h-px flex-1 bg-line-default" />
          </div>

          <div className="flex gap-10">
            <Link
              href={startHref("naver")}
              className="flex flex-col items-center gap-2 text-body2-medium text-text-body"
            >
              <Image
                src="/login/naver.png"
                width={224}
                height={224}
                sizes="56px"
                alt=""
                className="size-14 rounded-full"
              />
              네이버
            </Link>
            <Link
              href={startHref("google")}
              onClick={(e) => {
                if (!inApp) return;
                e.preventDefault();
                setGoogleBlocked(true);
              }}
              className="flex flex-col items-center gap-2 text-body2-medium text-text-body"
            >
              <span className="flex size-14 items-center justify-center rounded-full border border-line-strong bg-white">
                <Image
                  src="/login/google.svg"
                  // 속성은 정수로 두고(소수면 next/image가 크기가 바뀌었다고 경고) 그리는 크기는 디자인 19.67×20
                  width={20}
                  height={20}
                  alt=""
                  className="h-5 w-[19.6667px]"
                />
              </span>
              구글
            </Link>
          </div>
        </div>

        <p className="px-5 pt-7 pb-4 text-center text-body2 text-text-sub">
          로그인 없이도 스캔, 점수, 비교는 그대로 쓸 수 있어요.
        </p>
      </main>
    </div>
  );
}
