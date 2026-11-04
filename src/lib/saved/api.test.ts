import axios from "axios";
import { describe, expect, it } from "vitest";
import {
  deleteSavedProduct,
  fetchSavedProducts,
  postSavedProduct,
} from "@/lib/saved/api";
import { mockAdapter, success } from "@/test/http";

function client(data: unknown) {
  const mock = mockAdapter(() => success(data));
  return { http: axios.create({ adapter: mock.adapter }), ...mock };
}

describe("저장 API", () => {
  it("목록은 page·size를 query로 보낸다", async () => {
    const { http, requests } = client({
      items: [],
      totalCount: 0,
      hasNext: false,
    });
    await fetchSavedProducts(http, { page: 2, size: 10 });
    expect(http.getUri(requests[0])).toBe("/me/saved-products?page=2&size=10");
  });

  it("저장·해제는 path에 인코딩한 상품 ID를 넣는다", async () => {
    const { http, requests } = client({ saved: true, savedCount: 3 });
    await postSavedProduct(http, "7");
    await deleteSavedProduct(http, "7/x");
    expect(requests.map(({ method, url }) => [method, url])).toEqual([
      ["post", "/me/saved-products/7"],
      ["delete", "/me/saved-products/7%2Fx"],
    ]);
  });
});
