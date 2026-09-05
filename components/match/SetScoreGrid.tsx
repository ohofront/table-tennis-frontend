"use client";
import { setWinner } from "@/lib/scoring";
export type ScoreRow = { a: string; b: string };
export function SetScoreGrid({
  rows,
  onChange,
  sideA,
  sideB,
  readOnly = false,
}: {
  rows: ScoreRow[];
  onChange?: (rows: ScoreRow[]) => void;
  sideA: string;
  sideB: string;
  readOnly?: boolean;
}) {
  return (
    <div className="score-scroll">
      <table className="score-table">
        <caption className="sr-only">세트별 점수</caption>
        <thead>
          <tr>
            <th scope="col">선수</th>
            {rows.map((_, index) => (
              <th scope="col" key={index}>
                {index + 1}세트
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["a", "b"] as const).map((side) => (
            <tr key={side}>
              <th scope="row">{side === "a" ? sideA : sideB}</th>
              {rows.map((row, index) => {
                const winner =
                  row.a !== "" && row.b !== ""
                    ? setWinner(Number(row.a), Number(row.b))
                    : null;
                const won = winner === side.toUpperCase();
                return (
                  <td key={index} className={won ? "set-won" : ""}>
                    {readOnly ? (
                      <strong>
                        {row[side] || "—"}
                        {won && <small> 승</small>}
                      </strong>
                    ) : (
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        aria-label={`${index + 1}세트 ${side === "a" ? sideA : sideB} 점수`}
                        value={row[side]}
                        onChange={(e) =>
                          onChange?.(
                            rows.map((r, i) =>
                              i === index
                                ? { ...r, [side]: e.target.value }
                                : r,
                            ),
                          )
                        }
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
