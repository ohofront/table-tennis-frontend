import { TeamDetail } from "@/components/screens/TeamDetail";

export const metadata = {
  title: "팀 상세 | 탁구 경기 기록 관리",
  description: "팀 정보 및 소속 선수 목록을 확인하세요.",
};

export default function TeamDetailPage({
  params,
}: {
  params: { teamId: string };
}) {
  return <TeamDetail teamId={params.teamId} />;
}
