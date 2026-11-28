export const consentKeys = {
  all: ["consent"] as const,
  /** 내 동의 상태. 로그인한 계정마다 다르다 */
  mine: () => [...consentKeys.all, "mine"] as const,
};

// 가입 동의 항목은 사용자와 무관해 `consentKeys.all` 무효화에 걸리지 않게 따로 둔다
export const consentItemKeys = {
  all: () => ["meta", "consent-items"] as const,
};
