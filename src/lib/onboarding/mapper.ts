import type { Bootstrap, BootstrapDto } from "@/lib/onboarding/types";

export function toBootstrap(dto: BootstrapDto): Bootstrap {
  return {
    ...dto,
    kcalBand: dto.kcalBand ?? null,
    currentPolicyVersion: dto.currentPolicyVersion ?? null,
  };
}
