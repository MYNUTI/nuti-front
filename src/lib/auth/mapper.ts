import type {
  LoginResult,
  SignedIn,
  SignedInTokenDto,
  TokenDto,
} from "@/lib/auth/types";

export function toLoginResult(dto: TokenDto): LoginResult {
  if (dto.signupRequired)
    return {
      status: "SIGNUP_REQUIRED",
      signupToken: dto.signupToken,
      profile: dto.signupProfile,
    };
  return toSignedIn(dto);
}

export function toSignedIn(dto: SignedInTokenDto): SignedIn {
  return {
    status: "SIGNED_IN",
    newUser: dto.newUser,
    mergedRecordCount: dto.mergedRecordCount ?? 0,
    merged: dto.merged ?? null,
    user: dto.user ? { ...dto.user, id: String(dto.user.id) } : null,
  };
}
