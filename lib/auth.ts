import { api } from "./api";
import { parseJwt, type JwtPayload } from "./jwt";
import type { LoginResponseData, Player, Role, Session } from "./types";

import {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
} from "./token";

export {
  clearStoredRefreshToken,
  getStoredRefreshToken,
  setStoredRefreshToken,
};

export interface LoginResult {
  data?: LoginResponseData;
  accessToken?: string;
  refreshToken?: string;
  user?: Player & { role: Role };
}

/**
 * 백엔드 로그인 응답을 받아 세션 객체(accessToken, refreshToken, user)로 변환합니다.
 * 백엔드 응답에 user 정보가 없는 경우, JWT accessToken을 디코딩하여 userId(payload.sub)와 role(payload.role)을 추출한 뒤
 * GET /api/v1/users/{userId} 를 호출하여 사용자 정보를 조회합니다.
 */
export async function processLoginResponse(
  rawResponse: LoginResult,
): Promise<Session> {
  const tokenData = rawResponse?.data ?? (rawResponse as LoginResponseData);
  const accessToken = tokenData?.accessToken;
  const refreshToken = tokenData?.refreshToken;

  if (!accessToken) {
    throw new Error("로그인 응답 형식을 확인해주세요.");
  }

  let user: (Player & { role: Role }) | null = tokenData?.user ?? null;

  if (!user) {
    const payload = parseJwt<JwtPayload>(accessToken);
    const userId = payload?.sub;
    const role: Role = payload?.role === "ADMIN" ? "ADMIN" : "USER";

    if (!userId) {
      throw new Error("로그인 응답 형식을 확인해주세요.");
    }

    try {
      const player = await api<Player & { role?: Role }>(`/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const rawUser = player as unknown as Record<string, unknown>;
      user = {
        ...player,
        userId: String(rawUser.userId ?? userId),
        name:
          (rawUser.realName as string) ||
          player.name ||
          payload?.name ||
          "사용자",
        nickname:
          (rawUser.userName as string) ||
          player.nickname ||
          payload?.nickname ||
          "사용자",
        club: (rawUser.clubName as string) || player.club || "",
        phone: (rawUser.phoneNumber as string) || player.phone || "",
        gender: (rawUser.gender as "M" | "F") || player.gender || "M",
        role: player.role || role,
        totalMatches:
          typeof rawUser.totalMatches === "number" ? rawUser.totalMatches : 0,
        winRate: typeof rawUser.winRate === "number" ? rawUser.winRate : 0,
      };
    } catch (err) {
      console.error("사용자 정보 조회 실패:", err);
      user = {
        userId,
        name: payload?.name || "사용자",
        nickname: payload?.nickname || "사용자",
        club: "",
        gender: "M",
        totalMatches: 0,
        winRate: 0,
        role,
      };
    }
  }

  const session: Session = {
    accessToken,
    refreshToken,
    user,
  };

  if (refreshToken) {
    setStoredRefreshToken(refreshToken);
  }

  return session;
}
