"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/*
 * 검토용 목록의 「실제 서버 응답」 칸. 랭킹 조회 주소를 한 번씩 불러 상태 코드만 보인다.
 * 조회(GET)만 부르고, 실패해도 다시 보내지 않는다.
 */
const PROBES = [
  { label: "GET /rankings/categories", url: "/rankings/categories" },
  {
    label: "GET /rankings/overview?major=01",
    url: "/rankings/overview",
    params: { major: "01" },
  },
  {
    label: "GET /rankings?category=0101",
    url: "/rankings",
    params: { category: "0101", page: 0, size: 1 },
  },
];

type Probe = (typeof PROBES)[number];

function probe({ url, params }: Probe, signal: AbortSignal) {
  return api.get(url, { params, signal }).then(
    (response) => ({ ok: true, text: String(response.status) }),
    (error: unknown) => {
      if (!(error instanceof ApiError)) throw error;
      return {
        ok: false,
        // 응답이 없으면(네트워크·타임아웃) 상태 코드가 없다
        text:
          error.status === null ? error.code : `${error.status} ${error.code}`,
      };
    },
  );
}

export function ApiStatus() {
  return (
    <ul className="flex flex-col divide-y divide-line-default rounded-md border border-line-default">
      {PROBES.map((item) => (
        <StatusRow key={item.label} item={item} />
      ))}
    </ul>
  );
}

function StatusRow({ item }: { item: Probe }) {
  const { data, isPending } = useQuery({
    queryKey: ["v3-review", "probe", item.label],
    queryFn: ({ signal }) => probe(item, signal),
    retry: false,
    staleTime: 0,
  });

  return (
    <li className="flex flex-col gap-1 px-4 py-3">
      <span className="text-caption [overflow-wrap:anywhere] text-text-body">
        {item.label}
      </span>
      <span
        className={cn(
          "text-caption-bold",
          isPending
            ? "text-text-sub"
            : data?.ok
              ? "text-brand-link"
              : "text-text-danger",
        )}
      >
        {isPending ? "확인 중" : (data?.text ?? "확인 못 함")}
      </span>
    </li>
  );
}
