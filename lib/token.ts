export const REFRESH_COOKIE_NAME =
  (typeof process !== "undefined" &&
    process.env.AUTH_REFRESH_COOKIE_NAME) ||
  "refreshToken";

export const REFRESH_STORAGE_KEY = "table_tennis_refresh_token";

/**
 * 브라우저 쿠키 또는 localStorage에서 저장된 refreshToken을 가져옵니다.
 */
export function getStoredRefreshToken(): string | null {
  if (typeof document !== "undefined") {
    const escapedName = REFRESH_COOKIE_NAME.replace(
      /[-[\]{}()*+?.,\\^$|#\s]/g,
      "\\$&",
    );
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${escapedName}=([^;]+)`),
    );
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
    try {
      return localStorage.getItem(REFRESH_STORAGE_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * refreshToken을 쿠키와 localStorage에 동기화하여 저장합니다.
 */
export function setStoredRefreshToken(token: string): void {
  if (typeof document !== "undefined" && token) {
    document.cookie = `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    try {
      localStorage.setItem(REFRESH_STORAGE_KEY, token);
    } catch {}
  }
}

/**
 * 저장된 refreshToken 쿠키 및 localStorage 값을 완전히 삭제합니다.
 */
export function clearStoredRefreshToken(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${REFRESH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    try {
      localStorage.removeItem(REFRESH_STORAGE_KEY);
    } catch {}
  }
}
