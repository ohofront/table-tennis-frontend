import { MatchSets } from "@/components/screens/Matches";
export default function Page({ params }: { params: { matchId: string } }) {
  return <MatchSets matchId={params.matchId} />;
}
