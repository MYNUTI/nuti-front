import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { invalidateGoalDependents } from "@/lib/goal/invalidate";
import { goalKeys } from "@/lib/goal/keys";
import { meKeys, metaKeys } from "@/lib/me/keys";
import { onboardingKeys } from "@/lib/onboarding/keys";
import { productKeys } from "@/lib/product/keys";
import { savedKeys } from "@/lib/saved/keys";
import { searchKeys } from "@/lib/search/keys";

describe("invalidateGoalDependents", () => {
  it("계정 목표를 보여 주는 조회와 아직 계정 목표로 계산되는 목록만 다시 부른다", async () => {
    const queryClient = new QueryClient();
    const dependents = [
      goalKeys.mine(),
      meKeys.summary(),
      meKeys.settings(),
      onboardingKeys.bootstrap(),
      // 아직 계정 목표로 계산되는 목록(13-3 저장·검색에서 뺀다)
      searchKeys.result("두유"),
      savedKeys.list(),
    ];
    // 계정 목표와 상관없는 조회. 상품 결과는 두 목표 점수를 함께 준다
    const unrelated = [
      productKeys.detail("7"),
      productKeys.barcode("08801062633029"),
      productKeys.alternatives("7", "WEIGHT_LOSS"),
      meKeys.user(),
      metaKeys.policies(),
      onboardingKeys.healthConsent(),
      onboardingKeys.samples(),
      searchKeys.suggestions("두유"),
      searchKeys.popularKeywords(),
    ];
    for (const key of [...dependents, ...unrelated])
      queryClient.setQueryData(key, {});

    await invalidateGoalDependents(queryClient);

    const isInvalidated = (key: readonly unknown[]) =>
      queryClient.getQueryState(key)?.isInvalidated;
    for (const key of dependents) expect(isInvalidated(key)).toBe(true);
    for (const key of unrelated) expect(isInvalidated(key)).toBe(false);
  });
});
