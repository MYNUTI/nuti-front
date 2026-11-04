export const meKeys = {
  all: ["me"] as const,
  summary: () => [...meKeys.all, "summary"] as const,
  user: () => [...meKeys.all, "user"] as const,
  settings: () => [...meKeys.all, "settings"] as const,
};

// 약관은 사용자와 무관해 `meKeys.all` 무효화에 걸리지 않게 따로 둔다
export const metaKeys = {
  policies: () => ["meta", "policies"] as const,
};
