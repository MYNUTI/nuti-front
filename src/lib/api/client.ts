import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  // 응답 없는 요청이 무한정 걸려 있지 않게 하는 상한. 백엔드 API는 DB 조회 위주라 넉넉히 잡은 값
  timeout: 10_000,
});
