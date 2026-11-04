"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useEffect } from "react";
import { getQueryClient } from "@/lib/api/query-client";
import { connectSession } from "@/lib/auth/session";

export default function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  // 세션 만료와 다른 탭의 로그인·로그아웃에 맞춰 사용자 캐시를 다시 부르거나 비운다
  useEffect(() => connectSession(queryClient), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
