import { describe, expect, it } from "vitest";
import { scoreMatch, setWinner } from "@/lib/scoring";
const sets = (scores: number[][]) =>
  scores.map(([sideAScore, sideBScore], i) => ({
    setNumber: i + 1,
    sideAScore,
    sideBScore,
  }));
describe("탁구 세트 종료와 경기 승자", () => {
  it.each([
    [11, 0, "A"],
    [9, 11, "B"],
    [12, 10, "A"],
    [24, 26, "B"],
    [10, 8, null],
    [11, 10, null],
    [12, 9, null],
    [14, 10, null],
    [-1, 11, null],
    [11.5, 9, null],
    [11, 11, null],
  ])("%s:%s → %s", (a, b, winner) =>
    expect(setWinner(a as number, b as number)).toBe(winner),
  );
  it("5전제에서 2:1은 아직 승자 미확정이다", () =>
    expect(
      scoreMatch(
        sets([
          [11, 9],
          [7, 11],
          [11, 8],
        ]),
        5,
      ).winnerSide,
    ).toBeNull());
  it("3전제에서는 2:1이 승리다", () =>
    expect(
      scoreMatch(
        sets([
          [11, 9],
          [7, 11],
          [11, 8],
        ]),
        3,
      ),
    ).toMatchObject({
      winnerSide: "A",
      sideAWins: 2,
      sideBWins: 1,
      errors: [],
    }));
  it("승부가 끝난 뒤 세트를 거부한다", () =>
    expect(
      scoreMatch(
        sets([
          [11, 8],
          [11, 6],
          [11, 2],
          [4, 11],
        ]),
        5,
      ).errors,
    ).toContain("승자가 확정된 뒤에는 세트를 추가할 수 없습니다."));
  it("중간 세트가 빠지면 거부한다", () =>
    expect(
      scoreMatch([{ setNumber: 2, sideAScore: 11, sideBScore: 5 }], 5).errors
        .length,
    ).toBeGreaterThan(0));
  it("진행 중 점수는 저장할 수 없다", () =>
    expect(scoreMatch(sets([[8, 9]]), 5).errors.length).toBeGreaterThan(0));
});
