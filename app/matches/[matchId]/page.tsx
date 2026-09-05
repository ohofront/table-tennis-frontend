import { MatchDetail } from "@/components/screens/Matches";
export default function Page({ params }: { params: { matchId: string } }) {
  return <MatchDetail matchId={params.matchId} />;
}
