import Link from "next/link";
import type { Match } from "@/lib/types";
import { names } from "@/lib/format";
export function TournamentBracket({ matches }: { matches: Match[] }) {
  const order = ["예선", "본선", "32강", "16강", "8강", "준결승", "결승"];
  const rounds = [...new Set(matches.map((m) => m.matchRound))].sort(
    (a, b) =>
      (order.includes(a) ? order.indexOf(a) : 99) -
      (order.includes(b) ? order.indexOf(b) : 99),
  );
  return (
    <div className="bracket">
      {rounds.map((round) => (
        <section key={round} className="bracket-round">
          <h3>{round}</h3>
          {matches
            .filter((m) => m.matchRound === round)
            .map((m) => (
              <Link
                className="bracket-match"
                href={`/matches/${m.matchId}`}
                key={m.matchId}
              >
                <span>
                  {names(m.sideA)} <b>{m.sideAWins}</b>
                </span>
                <span>
                  {names(m.sideB)} <b>{m.sideBWins}</b>
                </span>
              </Link>
            ))}
        </section>
      ))}
    </div>
  );
}
