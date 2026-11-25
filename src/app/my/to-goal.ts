import type { Goal } from "./_fixtures";

/** 주소 값(?goal= · ?from=)을 목표로 읽는다. 아는 값이 아니면 undefined */
export function toGoal(value: string | string[] | undefined): Goal | undefined {
  return value === "diet" || value === "muscle" ? value : undefined;
}
