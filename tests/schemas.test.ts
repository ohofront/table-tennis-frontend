import { describe, it, expect } from "vitest";
import { matchSchema, signupSchema, commentSchema } from "@/lib/schemas";
import { safeNext } from "@/lib/format";
const base = {
  competitionId: "c1",
  matchFormat: "SINGLES",
  sideA: ["1"],
  sideB: ["2"],
  scheduledAt: "2026-09-05T10:00",
  venue: "체육관",
  matchRound: "예선",
  notes: "",
};
describe("경기 등록 검증", () => {
  it("단식 두 명", () =>
    expect(matchSchema.safeParse(base).success).toBe(true));
  it("중복 선수 거부", () =>
    expect(matchSchema.safeParse({ ...base, sideB: ["1"] }).success).toBe(
      false,
    ));
  it("복식 최소 4명", () =>
    expect(
      matchSchema.safeParse({ ...base, matchFormat: "DOUBLES" }).success,
    ).toBe(false));
  it("복식 정상 두 팀", () =>
    expect(
      matchSchema.safeParse({
        ...base,
        matchFormat: "DOUBLES",
        sideA: ["1", "2"],
        sideB: ["3", "4"],
      }).success,
    ).toBe(true));
  it("단체전 6명 이상", () =>
    expect(
      matchSchema.safeParse({
        ...base,
        matchFormat: "TEAM",
        sideA: ["1", "2", "3"],
        sideB: ["4", "5", "6"],
      }).success,
    ).toBe(true));
  it("불균형 단체전 거부", () =>
    expect(
      matchSchema.safeParse({
        ...base,
        matchFormat: "TEAM",
        sideA: ["1", "2", "3"],
        sideB: ["4", "5", "6", "7"],
      }).success,
    ).toBe(false));
  it("메모 500자 제한", () =>
    expect(
      matchSchema.safeParse({ ...base, notes: "a".repeat(501) }).success,
    ).toBe(false));
});
describe("인증과 댓글", () => {
  it.each([
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "javascript:alert(1)",
  ])("외부 리디렉션 거부 %s", (url) => expect(safeNext(url)).toBe("/"));
  it("내부 경로 유지", () =>
    expect(safeNext("/matches/new")).toBe("/matches/new"));
  it("공백 댓글 거부", () =>
    expect(commentSchema.safeParse({ content: "   " }).success).toBe(false));
  it("비밀번호 불일치 거부", () =>
    expect(
      signupSchema.safeParse({
        name: "김철수",
        nickname: "철수",
        email: "test@example.com",
        phone: "01012345678",
        birthDate: "1990-01-01",
        gender: "M",
        club: "",
        password: "password1",
        confirmPassword: "password2",
      }).success,
    ).toBe(false));
});
