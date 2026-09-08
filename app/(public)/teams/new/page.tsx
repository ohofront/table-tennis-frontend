import { TeamNew } from "@/components/screens/TeamNew";

export const metadata = {
  title: "팀 만들기 | 탁구 경기 기록 관리",
  description: "새로운 탁구 팀을 개설하세요.",
};

export default function NewTeamPage() {
  return <TeamNew />;
}
