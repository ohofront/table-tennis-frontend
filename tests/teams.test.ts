import { describe, it, expect } from "vitest";
import { getRegistrationState } from "@/components/common/RegistrationBadge";
import { teamSchema, applyTeamSchema } from "@/lib/schemas";

describe("RegistrationBadge getRegistrationState", () => {
  it("isClosed=Y 이면 마감 상태 반환", () => {
    const res = getRegistrationState({
      isClosed: "Y",
      registrationStart: "2026-09-01",
      registrationEnd: "2026-09-30",
    });
    expect(res.type).toBe("closed");
    expect(res.label).toBe("마감");
  });

  it("접수 시작 전이면 upcoming 상태 반환", () => {
    const today = new Date(2026, 8, 1); // 2026-09-01
    const res = getRegistrationState({
      registrationStart: "2026-09-10",
      registrationEnd: "2026-09-20",
      today,
    });
    expect(res.type).toBe("upcoming");
    expect(res.label).toBe("접수전 (D-9)");
  });

  it("접수 진행 중 (D-5) 이면 open 상태 반환", () => {
    const today = new Date(2026, 8, 10); // 2026-09-10
    const res = getRegistrationState({
      registrationStart: "2026-09-01",
      registrationEnd: "2026-09-15",
      today,
    });
    expect(res.type).toBe("open");
    expect(res.label).toBe("접수중 (D-5)");
  });

  it("마감 임박 (D-2) 이면 closing 상태 반환", () => {
    const today = new Date(2026, 8, 13); // 2026-09-13
    const res = getRegistrationState({
      registrationStart: "2026-09-01",
      registrationEnd: "2026-09-15",
      today,
    });
    expect(res.type).toBe("closing");
    expect(res.label).toBe("마감임박 (D-2)");
  });

  it("마감 당일 (D-0) 이면 closing 상태 반환", () => {
    const today = new Date(2026, 8, 15); // 2026-09-15
    const res = getRegistrationState({
      registrationStart: "2026-09-01",
      registrationEnd: "2026-09-15",
      today,
    });
    expect(res.type).toBe("closing");
    expect(res.label).toBe("마감 당일");
  });

  it("마감일 경과 후이면 closed 상태 반환", () => {
    const today = new Date(2026, 8, 16); // 2026-09-16
    const res = getRegistrationState({
      registrationStart: "2026-09-01",
      registrationEnd: "2026-09-15",
      today,
    });
    expect(res.type).toBe("closed");
    expect(res.label).toBe("마감");
  });
});

describe("teamSchema 검증", () => {
  it("정상 팀 생성 입력 검증 통과", () => {
    const valid = {
      teamName: "포항 스매셔즈",
      teamType: "CLUB",
      description: "포항 최고의 탁구 동호회입니다.",
    };
    expect(teamSchema.safeParse(valid).success).toBe(true);
  });

  it("팀 이름이 비어있으면 실패", () => {
    const invalid = {
      teamName: "",
      teamType: "CLUB",
    };
    expect(teamSchema.safeParse(invalid).success).toBe(false);
  });

  it("팀 이름이 50자 초과하면 실패", () => {
    const invalid = {
      teamName: "a".repeat(51),
      teamType: "COMPANY",
    };
    expect(teamSchema.safeParse(invalid).success).toBe(false);
  });

  it("유효하지 않은 teamType 거부", () => {
    const invalid = {
      teamName: "테스트팀",
      teamType: "INVALID",
    };
    expect(teamSchema.safeParse(invalid).success).toBe(false);
  });

  it("팀 소개가 500자 초과하면 실패", () => {
    const invalid = {
      teamName: "테스트팀",
      teamType: "PUBLIC",
      description: "x".repeat(501),
    };
    expect(teamSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("applyTeamSchema 검증", () => {
  it("정상 참가 신청 검증 통과", () => {
    const valid = {
      teamId: 1,
      rosterUserIds: [10, 20, 30],
      notes: "잘 부탁드립니다.",
    };
    expect(applyTeamSchema.safeParse(valid).success).toBe(true);
  });

  it("출전 선수가 0명이면 실패", () => {
    const invalid = {
      teamId: 1,
      rosterUserIds: [],
    };
    expect(applyTeamSchema.safeParse(invalid).success).toBe(false);
  });

  it("teamId가 없거나 음수이면 실패", () => {
    const invalid = {
      teamId: -1,
      rosterUserIds: [10],
    };
    expect(applyTeamSchema.safeParse(invalid).success).toBe(false);
  });
});
