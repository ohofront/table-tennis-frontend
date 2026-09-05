import { TournamentDetail } from "@/components/screens/Tournaments";
export default function Page({
  params,
}: {
  params: { year: string; tournamentId: string };
}) {
  return <TournamentDetail year={params.year} id={params.tournamentId} />;
}
