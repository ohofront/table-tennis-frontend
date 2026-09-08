import { describe, it, expect } from "vitest";
import { hasTitleData } from "@/components/ranking/TitleCard";
import { getDateRange } from "@/components/ranking/TrendChart";
import { autoAssignSchema } from "@/lib/schemas";

describe("TitleCard hasTitleData", () => {
  it("undefined 또는 null 일 때 false 반환", () => {
    expect(hasTitleData(undefined)).toBe(false);
    expect(hasTitleData(null)).toBe(false);
  });

  it("모든 king이 null이면 false 반환 (배치 미실행 빈 상태)", () => {
    const emptyTitles = {
      winRateKing: null,
      mostMatchesKing: null,
      avgScoreKing: null,
    };
    expect(hasTitleData(emptyTitles)).toBe(false);
  });

  it("하나라도 타이틀 보유자가 있으면 true 반환", () => {
    const titles = {
      winRateKing: {
        userId: 1,
        realName: "홍길동",
        winRate: 85.5,
        totalMatches: 20,
      },
      mostMatchesKing: null,
      avgScoreKing: null,
    };
    expect(hasTitleData(titles)).toBe(true);
  });
});

describe("TrendChart getDateRange", () => {
  const baseDate = new Date(2026, 8, 8); // 2026년 9월 8일 (month index 8 = September)

  it("최근 6개월(6m) 범위 올바르게 계산 (YYYY-MM)", () => {
    const { from, to } = getDateRange("6m", baseDate);
    expect(to).toBe("2026-09");
    expect(from).toBe("2026-04");
  });

  it("최근 1년(1y) 범위 올바르게 계산 (YYYY-MM)", () => {
    const { from, to } = getDateRange("1y", baseDate);
    expect(to).toBe("2026-09");
    expect(from).toBe("2025-10");
  });

  it("올해 전체(current-year) 범위 계산", () => {
    const { from, to } = getDateRange("current-year", baseDate);
    expect(from).toBe("2026-01");
    expect(to).toBe("2026-12");
  });

  it("연도 경계 처리 (1월 기준 6개월 전 계산 시 전년도로 이동)", () => {
    const janDate = new Date(2026, 0, 15); // 2026년 1월
    const { from, to } = getDateRange("6m", janDate);
    expect(to).toBe("2026-01");
    expect(from).toBe("2025-08");
  });
});

describe("autoAssignSchema 검증", () => {
  it("유효한 자동 조편성 요청 검증 통과", () => {
    const valid = { groupCount: 4, seedByRanking: true };
    expect(autoAssignSchema.safeParse(valid).success).toBe(true);
  });

  it("시드 미배정 및 1개 조도 유효한 값으로 허용", () => {
    const valid = { groupCount: 1, seedByRanking: false };
    expect(autoAssignSchema.safeParse(valid).success).toBe(true);
  });

  it("조 개수가 0 이하이면 실패", () => {
    const invalid = { groupCount: 0, seedByRanking: true };
    expect(autoAssignSchema.safeParse(invalid).success).toBe(false);
  });

  it("조 개수가 1000 초과이면 실패", () => {
    const invalid = { groupCount: 1001, seedByRanking: true };
    expect(autoAssignSchema.safeParse(invalid).success).toBe(false);
  });

  it("조 개수가 소수점(실수)이면 실패", () => {
    const invalid = { groupCount: 3.5, seedByRanking: true };
    expect(autoAssignSchema.safeParse(invalid).success).toBe(false);
  });
});
