import { PlayerDetail } from "@/components/screens/Players";
export default function Page({ params }: { params: { userId: string } }) {
  return <PlayerDetail userId={params.userId} />;
}
