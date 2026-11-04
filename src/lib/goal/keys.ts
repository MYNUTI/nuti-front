export const goalKeys = {
  all: ["goal"] as const,
  mine: () => [...goalKeys.all, "me"] as const,
};
