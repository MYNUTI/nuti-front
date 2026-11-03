export const savedKeys = {
  all: ["saved"] as const,
  list: () => [...savedKeys.all, "list"] as const,
};
