import type {
  MeSettings,
  MeSettingsDto,
  MeSummary,
  MeSummaryDto,
  Policies,
  PoliciesDto,
  User,
  UserDto,
} from "@/lib/me/types";

export function toMeSummary(dto: MeSummaryDto): MeSummary {
  return {
    isLoggedIn: dto.isLoggedIn,
    profile: dto.profile ?? null,
    goal: { goal: dto.goal.code, label: dto.goal.label },
    recordCount: dto.recordCount,
    contribution: dto.contribution,
    footerNotice: dto.footerNotice ?? null,
  };
}

export function toUser(dto: UserDto): User {
  return { ...dto, id: String(dto.id) };
}

export function toMeSettings(dto: MeSettingsDto): MeSettings {
  return {
    clipboardLinkDetection: dto.clipboardLinkDetection,
    goal: { goal: dto.goal.code, label: dto.goal.label },
    privacyUrl: dto.policies.privacyUrl ?? null,
    termsUrl: dto.policies.termsUrl ?? null,
    supportUrl: dto.supportUrl ?? null,
    appVersion: dto.appVersion,
  };
}

export function toPolicies(dto: PoliciesDto): Policies {
  return { privacy: dto.privacy ?? null, terms: dto.terms ?? null };
}
