import { CompetitionView } from "@/components/screens/Tournaments";
export default function Page({
  params,
}: {
  params: { competitionId: string };
}) {
  return (
    <>
      <div className="page-heading">
        <h1>조편성 현황</h1>
      </div>
      <CompetitionView id={params.competitionId} />
    </>
  );
}
