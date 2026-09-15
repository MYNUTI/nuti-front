export const GRADES = ["A", "B", "C", "D", "E"] as const;

export type Grade = (typeof GRADES)[number];
