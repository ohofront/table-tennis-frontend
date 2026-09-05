import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, queryString, refreshSession } from "@/lib/api";
import { useAuth } from "@/store/auth";
const session = {
  accessToken: "new-token",
  user: { userId: "1", name: "김철수", role: "ADMIN" },
};
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
beforeEach(() => useAuth.getState().setSession(null));
afterEach(() => vi.unstubAllGlobals());
describe("API 인증 및 오류 처리", () => {
  it("쿠키를 포함하고 토큰을 헤더로 전달한다", async () => {
    useAuth.getState().setSession(session as never);
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ data: { matchId: "1" } }));
    vi.stubGlobal("fetch", fetch);
    expect(await api("/matches/1")).toEqual({ matchId: "1" });
    expect(fetch.mock.calls[0][1]).toMatchObject({
      credentials: "include",
      headers: { Authorization: "Bearer new-token" },
    });
  });
  it("401 발생 시 한 번 재발급 후 재시도한다", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response(session))
      .mockResolvedValueOnce(response({ ok: true }));
    vi.stubGlobal("fetch", fetch);
    expect(await api("/users/1")).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(useAuth.getState().session?.accessToken).toBe("new-token");
  });
  it("재발급 실패 시 세션을 비운다", async () => {
    useAuth.getState().setSession(session as never);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 401)));
    await expect(api("/users/1")).rejects.toBeInstanceOf(ApiError);
    expect(useAuth.getState().session).toBeNull();
  });
  it("동시 재발급 요청을 하나로 합친다", async () => {
    const fetch = vi.fn().mockResolvedValue(response(session));
    vi.stubGlobal("fetch", fetch);
    await Promise.all([refreshSession(), refreshSession()]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("로그인 실패는 재발급하지 않는다", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        response(
          { message: "비밀번호 확인", fieldErrors: { password: "틀렸습니다" } },
          401,
        ),
      );
    vi.stubGlobal("fetch", fetch);
    await expect(api("/auth/login", { method: "POST" })).rejects.toMatchObject({
      status: 401,
      fieldErrors: { password: "틀렸습니다" },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("쿼리 문자열의 특수문자를 인코딩한다", () =>
    expect(queryString({ keyword: "A&B", gender: "" })).toBe("?keyword=A%26B"));
});

it("페이지가 있는 목록은 누락 없이 다음 페이지를 가져온다", async () => {
  const { list } = await import("@/lib/api");
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      response({ content: [{ userId: "1" }], totalPages: 2, number: 0 }),
    )
    .mockResolvedValueOnce(
      response({ content: [{ userId: "2" }], totalPages: 2, number: 1 }),
    );
  vi.stubGlobal("fetch", fetch);
  expect(await list("/users?gender=M")).toEqual([
    { userId: "1" },
    { userId: "2" },
  ]);
  expect(fetch.mock.calls[1][0]).toContain("/users?gender=M&page=1");
});
it("늦게 끝난 재발급이 새로운 로그인 세션을 덮어쓰지 않는다", async () => {
  let finish!: (value: Response) => void;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    ),
  );
  const pending = refreshSession();
  const newLogin = { ...session, accessToken: "just-logged-in" };
  useAuth.getState().setSession(newLogin as never);
  finish(response(session));
  await pending;
  expect(useAuth.getState().session?.accessToken).toBe("just-logged-in");
});
