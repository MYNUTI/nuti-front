import type {
  GoalDto,
  GoalUpdate,
  GoalUpdateDto,
  MyGoal,
} from "@/lib/goal/types";

export function toMyGoal(dto: GoalDto): MyGoal {
  return { ...dto, appliedAt: dto.appliedAt ?? null };
}

export function toGoalUpdate(dto: GoalUpdateDto): GoalUpdate {
  return {
    ...dto,
    recalculation: dto.recalculation && {
      ...dto.recalculation,
      productId: String(dto.recalculation.productId),
    },
  };
}
