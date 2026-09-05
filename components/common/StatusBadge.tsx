import type { Status } from "@/lib/types";
const labels: Record<Status, string> = {
  SCHEDULED: "예정",
  IN_PROGRESS: "진행 중",
  COMPLETED: "종료",
  CANCELLED: "취소",
};
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge status-${status}`}>{labels[status] ?? status}</span>
  );
}
