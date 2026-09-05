export interface JwtPayload {
  sub?: string;
  role?: "USER" | "ADMIN";
  name?: string;
  nickname?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * JWT 문자열의 payload 부분을 디코딩합니다.
 */
export function parseJwt<T = JwtPayload>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    let jsonPayload = "";
    if (typeof window !== "undefined" && typeof window.atob === "function") {
      const binaryString = window.atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      jsonPayload = new TextDecoder("utf-8").decode(bytes);
    } else {
      jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    }
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}
