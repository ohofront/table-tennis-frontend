import { TeamSchedule } from "@/components/screens/TeamSchedule";

export const metadata = {
  title: "팀 모임 일정 | 탁구 경기 기록 관리",
  description: "팀 모임 일정을 확인하고 참석 여부를 등록하세요.",
};

export default function TeamSchedulePage({
  params,
}: {
  params: { teamId: string };
}) {
  return <TeamSchedule teamId={params.teamId} />;
}
