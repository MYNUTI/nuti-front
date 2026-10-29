import "server-only";
import axios from "axios";

/**
 * 서버 컴포넌트용 axios 인스턴스. 서버에서는 CORS가 없으니 rewrites(`/api`)를 거치지 않고
 * 서버 전용 `API_URL`의 백엔드 주소로 바로 보낸다. `NEXT_PUBLIC_`이 아니라 브라우저 번들에 들어가지 않는다.
 */
export const serverApi = axios.create({
  baseURL: process.env.API_URL,
  // 상한 값과 근거는 client.ts와 같다
  timeout: 10_000,
});
