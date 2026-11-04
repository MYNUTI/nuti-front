import type { LoginDto, LoginResult } from "@/lib/auth/types";

export function toLoginResult(dto: LoginDto): LoginResult {
  return {
    newUser: dto.newUser,
    mergedRecordCount: dto.mergedRecordCount ?? 0,
    user: dto.user ? { ...dto.user, id: String(dto.user.id) } : null,
  };
}
