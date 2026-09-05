import { useAuth } from "@/store/auth";
import type { Session } from "./types";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}
const origin = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
).replace(/\/$/, "");
export function queryString(
  params: Record<string, string | number | undefined>,
) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.size ? `?${search}` : "";
}
let refreshing: Promise<Session | null> | null = null;
async function decode<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      response.status,
      body?.message ?? body?.error?.message ?? "요청을 처리하지 못했습니다.",
      body?.fieldErrors ?? body?.error?.fieldErrors ?? {},
    );
  return (
    body && Object.prototype.hasOwnProperty.call(body, "data")
      ? body.data
      : body
  ) as T;
}
export function refreshSession() {
  if (!refreshing) {
    const previous = useAuth.getState().session;
    refreshing = fetch(`${origin}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(decode<Session>)
      .then((session) => {
        if (!session?.accessToken || !session.user)
          throw new Error("인증 응답을 확인해주세요.");
        if (useAuth.getState().session === previous)
          useAuth.getState().setSession(session);
        return useAuth.getState().session;
      })
      .catch(() => {
        if (useAuth.getState().session === previous)
          useAuth.getState().setSession(null);
        return useAuth.getState().session;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = useAuth.getState().session?.accessToken;
  let response: Response;
  try {
    response = await fetch(`${origin}/api/v1${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "서버에 연결할 수 없습니다. API 주소와 백엔드 실행 상태를 확인해주세요.",
    );
  }
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    if (await refreshSession()) return api<T>(path, options, false);
  }
  return decode<T>(response);
}
export async function list<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  type Page = { content: T[]; totalPages?: number; number?: number };
  const body = await api<T[] | Page>(path, { signal });
  if (Array.isArray(body)) return body;
  if (!body || !Array.isArray(body.content))
    throw new ApiError(
      502,
      "목록 응답 형식이 예상과 다릅니다. API 계약을 확인해주세요.",
    );
  const rows = [...body.content];
  if (body.totalPages && body.totalPages > 1) {
    const url = new URL(path, "http://api.local");
    for (let page = (body.number ?? 0) + 1; page < body.totalPages; page++) {
      url.searchParams.set("page", String(page));
      const next = await api<Page>(url.pathname + url.search, { signal });
      if (!Array.isArray(next.content))
        throw new ApiError(502, "페이지 응답 형식이 예상과 다릅니다.");
      rows.push(...next.content);
    }
  }
  return rows;
}
export const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});
