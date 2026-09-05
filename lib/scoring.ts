import type { MatchSet } from "./types";
export function setWinner(a: number, b: number): "A" | "B" | null {
  if (![a, b].every((n) => Number.isInteger(n) && n >= 0)) return null;
  const high = Math.max(a, b),
    low = Math.min(a, b);
  if (!((high === 11 && low <= 9) || (high > 11 && high - low === 2)))
    return null;
  return a > b ? "A" : "B";
}
export function scoreMatch(sets: MatchSet[], bestOf: number) {
  let sideAWins = 0,
    sideBWins = 0;
  const errors: string[] = [];
  const target = Math.floor(bestOf / 2) + 1;
  if (!Number.isInteger(bestOf) || bestOf < 1 || bestOf % 2 === 0)
    errors.push("경기의 세트 수 설정이 올바르지 않습니다.");
  sets.forEach((set, index) => {
    if (set.setNumber !== index + 1)
      errors.push("세트는 1세트부터 순서대로 입력해주세요.");
    if (sideAWins >= target || sideBWins >= target)
      errors.push("승자가 확정된 뒤에는 세트를 추가할 수 없습니다.");
    const winner = setWinner(set.sideAScore, set.sideBScore);
    if (!winner)
      errors.push(
        `${set.setNumber}세트: 11점 이상, 2점 차로 종료된 점수를 입력해주세요.`,
      );
    if (winner === "A") sideAWins++;
    if (winner === "B") sideBWins++;
  });
  if (sets.length > bestOf) errors.push("최대 세트 수를 초과했습니다.");
  const winnerSide =
    sideAWins >= target ? "A" : sideBWins >= target ? "B" : null;
  return { sideAWins, sideBWins, winnerSide, errors };
}
