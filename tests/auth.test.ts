import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { parseJwt } from "@/lib/jwt";
import { useAuth } from "@/store/auth";
import { api, refreshSession } from "@/lib/api";

describe("JWT 유틸리티 (parseJwt)", () => {
  it("JWT 토큰의 payload(sub, role)를 올바르게 파싱한다", () => {
    // header: {"alg":"HS256","typ":"JWT"} -> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // payload: {"sub":"user-42","role":"ADMIN","name":"홍길동"} -> base64url
    const payload = { sub: "user-42", role: "ADMIN", name: "홍길동" };
    const base64UrlPayload = Buffer.from(JSON.stringify(payload))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const token = `header.${base64UrlPayload}.signature`;

    const parsed = parseJwt(token);
    expect(parsed).toEqual(payload);
    expect(parsed?.sub).toBe("user-42");
    expect(parsed?.role).toBe("ADMIN");
  });

  it("잘못된 형식의 토큰은 null을 반환한다", () => {
    expect(parseJwt("invalid-token")).toBeNull();
    expect(parseJwt("")).toBeNull();
  });
});

describe("새로운 백엔드 응답 구조 기반 세션 복구 및 리프레시", () => {
  beforeEach(() => {
    useAuth.getState().setSession(null);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const response = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  it("user 정보가 없는 refresh 응답 시 JWT와 /users/{userId} 호출로 세션을 복구한다", async () => {
    const payload = { sub: "user-99", role: "ADMIN" };
    const base64Url = Buffer.from(JSON.stringify(payload))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const accessToken = `header.${base64Url}.signature`;

    const backendRefreshResponse = {
      success: true,
      data: {
        accessToken,
        refreshToken: "ref-uuid-123",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
    };

    const userProfileResponse = {
      success: true,
      data: {
        userId: "user-99",
        name: "탁구왕",
        nickname: "핑퐁마스터",
        club: "서울탁구",
        gender: "M",
        totalMatches: 10,
        winRate: 80,
      },
    };

    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response(backendRefreshResponse))
      .mockResolvedValueOnce(response(userProfileResponse));

    vi.stubGlobal("fetch", fetch);

    const session = await refreshSession();
    expect(session?.accessToken).toBe(accessToken);
    expect(session?.refreshToken).toBe("ref-uuid-123");
    expect(session?.user.userId).toBe("user-99");
    expect(session?.user.name).toBe("탁구왕");
    expect(session?.user.role).toBe("ADMIN");
  });
});

describe("processLoginResponse (실제 백엔드 로그인 응답 파싱 및 세션 생성)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const response = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  it("백엔드의 실제 응답 구조({ success: true, data: { accessToken, refreshToken, ... } })를 정상 처리한다", async () => {
    const { processLoginResponse } = await import("@/lib/auth");

    const payload = { sub: "user-100", role: "USER" };
    const base64Url = Buffer.from(JSON.stringify(payload))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const accessToken = `header.${base64Url}.signature`;

    // 실제 백엔드 로그인 API 응답 구조
    const backendResponse = {
      success: true,
      data: {
        accessToken,
        refreshToken: "e3693234-fb80-4e01-test",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
    };

    // GET /api/v1/users/user-100 응답 구조
    const userProfileResponse = {
      success: true,
      data: {
        userId: "user-100",
        name: "이선수",
        nickname: "탁구꿈나무",
        club: "탁구교실",
        gender: "F",
        totalMatches: 25,
        winRate: 64,
      },
    };

    const fetch = vi.fn().mockResolvedValueOnce(response(userProfileResponse));
    vi.stubGlobal("fetch", fetch);

    const session = await processLoginResponse(backendResponse);

    expect(session.accessToken).toBe(accessToken);
    expect(session.refreshToken).toBe("e3693234-fb80-4e01-test");
    expect(session.user.userId).toBe("user-100");
    expect(session.user.name).toBe("이선수");
    expect(session.user.nickname).toBe("탁구꿈나무");
    expect(session.user.role).toBe("USER");

    // /users/user-100 호출 시 Authorization 헤더가 전달되었는지 확인
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/users/user-100"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${accessToken}`,
        }),
      }),
    );
  });

  it("accessToken이 없으면 에러를 발생시킨다", async () => {
    const { processLoginResponse } = await import("@/lib/auth");
    await expect(
      processLoginResponse({ success: true, data: {} } as any),
    ).rejects.toThrow("로그인 응답 형식을 확인해주세요.");
  });

  it("기존처럼 응답에 이미 user가 포함되어 있으면 추가 호출 없이 세션을 생성한다", async () => {
    const { processLoginResponse } = await import("@/lib/auth");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const legacyResponse = {
      accessToken: "legacy-token",
      refreshToken: "legacy-refresh",
      user: {
        userId: "user-legacy",
        name: "레거시",
        nickname: "구형유저",
        club: "클럽",
        gender: "M" as const,
        totalMatches: 5,
        winRate: 50,
        role: "ADMIN" as const,
      },
    };

    const session = await processLoginResponse(legacyResponse as any);
    expect(session.accessToken).toBe("legacy-token");
    expect(session.user.userId).toBe("user-legacy");
    expect(session.user.role).toBe("ADMIN");
    expect(fetch).not.toHaveBeenCalled();
  });
});
