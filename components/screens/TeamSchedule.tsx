"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { api, json, ApiError } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Modal } from "@/components/common/Modal";
import { QueryState } from "@/components/common/QueryState";
import { scheduleSchema } from "@/lib/schemas";
import type {
  Schedule,
  ScheduleRequest,
  AttendanceItem,
  AttendanceStatus,
  Team,
  TeamMember,
} from "@/lib/types";

// Helper: sort schedules chronologically
export function sortSchedules(schedules: Schedule[]): Schedule[] {
  return [...schedules].sort((a, b) => {
    const timeA = a.startTime ? (a.startTime.length === 5 ? `${a.startTime}:00` : a.startTime) : "00:00:00";
    const timeB = b.startTime ? (b.startTime.length === 5 ? `${b.startTime}:00` : b.startTime) : "00:00:00";
    const dateA = `${a.scheduleDate}T${timeA}`;
    const dateB = `${b.scheduleDate}T${timeB}`;
    return dateA.localeCompare(dateB);
  });
}

// Helper: calculate attendance stats
export function calculateAttendanceStats(attendances: AttendanceItem[] = []) {
  let attendCount = 0;
  let absentCount = 0;
  let undecidedCount = 0;
  for (const item of attendances) {
    if (item.status === "ATTEND") attendCount++;
    else if (item.status === "ABSENT") absentCount++;
    else undecidedCount++;
  }
  return {
    attendCount,
    absentCount,
    undecidedCount,
    total: attendances.length,
  };
}

// Helper: format date & time for display
export function formatScheduleDateTime(dateStr: string, timeStr?: string) {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = Number.isNaN(d.getTime()) ? "" : days[d.getDay()];
  const timeDisplay = (timeStr || "").slice(0, 5);
  return {
    dateDisplay: dateStr,
    dayOfWeek: dayOfWeek ? `(${dayOfWeek})` : "",
    timeDisplay,
  };
}

export function TeamSchedule({ teamId }: { teamId: string }) {
  const session = useAuth((s) => s.session);
  const currentUserId = session?.user?.userId;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToMessage(msg);
    setTimeout(() => setToMessage(null), 3000);
  }

  // Fetch Team details (for team name, captain, members)
  const teamQuery = useQuery({
    queryKey: [`/teams/${teamId}`],
    queryFn: () => api<Team>(`/teams/${teamId}`),
  });

  // Fetch Schedules
  const schedulesQuery = useQuery({
    queryKey: [`/teams/${teamId}/schedules`],
    queryFn: () => api<Schedule[]>(`/teams/${teamId}/schedules`),
    retry: false,
  });

  const team = teamQuery.data;
  const captainUserId =
    team?.captainId ??
    team?.captainUserId ??
    team?.captain?.userId;
  const isCaptain =
    Boolean(
      currentUserId &&
        (String(captainUserId) === String(currentUserId) ||
          session?.user?.role === "ADMIN")
    );

  // Check 403 / Forbidden error
  const isForbidden =
    (schedulesQuery.error as ApiError)?.status === 403 ||
    schedulesQuery.error?.message?.includes("팀원만");

  if (isForbidden) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="panel p-8 text-center bg-white shadow-sm border border-stone-200 rounded-xl">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">팀원 전용 페이지입니다</h2>
          <p className="text-stone-600 mb-6 leading-relaxed">
            {team?.teamName ? <strong>[{team.teamName}] </strong> : ""}
            모임 일정 및 참석 현황은 팀에 소속된 멤버만 확인하고 참석 여부를 등록할 수 있습니다.
          </p>
          <div className="flex justify-center gap-3">
            <Link href={`/teams/${teamId}`} className="button primary">
              팀 상세 페이지로 이동
            </Link>
            <Link href="/teams" className="button secondary">
              팀 목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const schedules = schedulesQuery.data ? sortSchedules(schedulesQuery.data) : [];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="page-heading mb-6">
        <div>
          <Link
            href={`/teams/${teamId}`}
            className="text-link flex items-center gap-1.5 mb-2 text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft size={16} /> 팀 상세로 돌아가기
          </Link>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="eyebrow">SCHEDULE</p>
            {team?.teamName && (
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                {team.teamName}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            팀 모임 일정
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            정기 연습 및 친선 경기 일정을 확인하고 참석 여부를 등록하세요.
          </p>
        </div>

        <div>
          <button
            type="button"
            className="button primary flex items-center gap-1.5"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus size={16} /> + 일정 등록
          </button>
        </div>
      </div>

      {/* Query State Loading / Error */}
      <QueryState
        pending={schedulesQuery.isPending}
        error={schedulesQuery.error}
        retry={() => schedulesQuery.refetch()}
      >
        {schedules.length === 0 ? (
          <div className="panel text-center py-16 px-4 bg-white rounded-xl border border-dashed border-stone-300">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-800 mb-1">등록된 모임 일정이 없습니다</h3>
            <p className="text-sm text-stone-500 mb-5">
              새로운 모임 일정을 등록하여 팀원들과 일정을 공유하고 참석 여부를 확인해보세요.
            </p>
            <button
              type="button"
              className="button primary small inline-flex items-center gap-1.5"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={15} /> 첫 일정 등록하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.scheduleId}
                schedule={schedule}
                team={team}
                currentUserId={currentUserId}
                isCaptain={isCaptain}
                teamId={teamId}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </QueryState>

      {/* Schedule Create Modal */}
      {isCreateModalOpen && (
        <CreateScheduleModal
          teamId={teamId}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            showToast("일정이 성공적으로 등록되었습니다.");
          }}
        />
      )}
    </div>
  );
}

// Subcomponent: Individual Schedule Card
function ScheduleCard({
  schedule,
  team,
  currentUserId,
  isCaptain,
  teamId,
  onToast,
}: {
  schedule: Schedule;
  team?: Team;
  currentUserId?: string | number;
  isCaptain: boolean;
  teamId: string;
  onToast: (msg: string) => void;
}) {
  const session = useAuth((s) => s.session);
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const attendanceQueryKey = [`/schedules/${schedule.scheduleId}/attendance`];

  // Attendance query
  const attendanceQuery = useQuery({
    queryKey: attendanceQueryKey,
    queryFn: () => api<AttendanceItem[]>(`/schedules/${schedule.scheduleId}/attendance`),
  });

  const attendances = attendanceQuery.data ?? [];
  const stats = calculateAttendanceStats(attendances);

  // Current user's attendance status
  const myAttendance = attendances.find(
    (a) => String(a.userId) === String(currentUserId)
  );
  const currentStatus: AttendanceStatus = myAttendance?.status ?? "UNDECIDED";

  // Optimistic update mutation for attendance
  const attendanceMutation = useMutation({
    mutationFn: async (newStatus: AttendanceStatus) => {
      return api<AttendanceItem>(
        `/schedules/${schedule.scheduleId}/attendance`,
        json("PUT", { status: newStatus })
      );
    },
    onMutate: async (newStatus: AttendanceStatus) => {
      await queryClient.cancelQueries({ queryKey: attendanceQueryKey });
      const previous = queryClient.getQueryData<AttendanceItem[]>(attendanceQueryKey);

      if (previous) {
        const exists = previous.some(
          (a) => String(a.userId) === String(currentUserId)
        );
        const next = exists
          ? previous.map((a) =>
              String(a.userId) === String(currentUserId)
                ? { ...a, status: newStatus }
                : a
            )
          : [
              ...previous,
              { userId: currentUserId ?? "me", status: newStatus },
            ];
        queryClient.setQueryData<AttendanceItem[]>(attendanceQueryKey, next);
      } else if (currentUserId) {
        queryClient.setQueryData<AttendanceItem[]>(attendanceQueryKey, [
          { userId: currentUserId, status: newStatus },
        ]);
      }

      return { previous };
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previous) {
        queryClient.setQueryData(attendanceQueryKey, context.previous);
      }
      onToast("참석 여부 변경에 실패했습니다. 다시 시도해주세요.");
    },
    onSuccess: (data) => {
      const label =
        data.status === "ATTEND"
          ? "참석"
          : data.status === "ABSENT"
          ? "불참"
          : "미정";
      onToast(`내 참석 여부가 '${label}'(으)로 변경되었습니다.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: attendanceQueryKey });
    },
  });

  // Delete schedule
  const isCreator =
    Boolean(currentUserId && String(schedule.createdBy) === String(currentUserId));
  const canDelete = isCreator || isCaptain;

  async function handleDelete() {
    if (!confirm(`'${schedule.title}' 일정을 삭제하시겠습니까?`)) return;
    setIsDeleting(true);
    try {
      await api(`/schedules/${schedule.scheduleId}`, { method: "DELETE" });
      onToast("일정이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: [`/teams/${teamId}/schedules`] });
    } catch (e) {
      alert((e as Error).message || "일정 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }

  const { dateDisplay, dayOfWeek, timeDisplay } = formatScheduleDateTime(
    schedule.scheduleDate,
    schedule.startTime
  );

  // Group attendees by status for the accordion
  const membersMap = new Map<string, TeamMember>();
  team?.members?.forEach((m) => {
    membersMap.set(String(m.userId), m);
  });

  const getMemberDisplayName = (userId: number | string) => {
    const member = membersMap.get(String(userId));
    if (member?.realName) return member.realName;
    if (member?.name) return member.name;
    if (member?.nickname) return member.nickname;
    if (String(userId) === String(currentUserId)) {
      return (
        session?.user?.name ||
        session?.user?.nickname ||
        "나"
      );
    }
    return `선수 ${userId}`;
  };

  const attendingList = attendances.filter((a) => a.status === "ATTEND");
  const absentList = attendances.filter((a) => a.status === "ABSENT");
  const undecidedList = attendances.filter((a) => a.status === "UNDECIDED");

  return (
    <div className="panel bg-white border border-stone-200 rounded-xl p-5 shadow-sm transition hover:shadow-md">
      {/* Top row: Date, Time, Location & Delete button */}
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap text-sm text-stone-600">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <Calendar size={14} />
            {dateDisplay} {dayOfWeek}
          </span>
          {timeDisplay && (
            <span className="inline-flex items-center gap-1 font-medium text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md">
              <Clock size={14} />
              {timeDisplay}
            </span>
          )}
          {schedule.location && (
            <span className="inline-flex items-center gap-1 text-stone-600 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-200">
              <MapPin size={14} className="text-stone-400" />
              {schedule.location}
            </span>
          )}
        </div>

        {canDelete && (
          <button
            type="button"
            className="text-xs text-stone-400 hover:text-rose-600 p-1 rounded transition flex items-center gap-1"
            title="일정 삭제"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">삭제</span>
          </button>
        )}
      </div>

      {/* Schedule Title */}
      <h2 className="text-lg font-bold text-stone-900 mb-4">{schedule.title}</h2>

      {/* Middle row: Attendance status summary & My Attendance dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 px-4 bg-stone-50 rounded-lg border border-stone-200 mb-3">
        {/* Attendance counter badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-stone-500 mr-1">참석 현황:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={12} /> 참 {stats.attendCount}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle size={12} /> 불참 {stats.absentCount}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-700">
            <HelpCircle size={12} /> 미정 {stats.undecidedCount}
          </span>
        </div>

        {/* My attendance dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor={`attend-select-${schedule.scheduleId}`}
            className="text-xs font-bold text-stone-700 whitespace-nowrap"
          >
            내 참석 여부:
          </label>
          <select
            id={`attend-select-${schedule.scheduleId}`}
            value={currentStatus}
            onChange={(e) => {
              const val = e.target.value as AttendanceStatus;
              attendanceMutation.mutate(val);
            }}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
              currentStatus === "ATTEND"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-400"
                : currentStatus === "ABSENT"
                ? "bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-400"
                : "bg-white text-stone-700 border-stone-300 focus:ring-stone-400"
            }`}
          >
            <option value="ATTEND">🟢 참석</option>
            <option value="ABSENT">🔴 불참</option>
            <option value="UNDECIDED">⚪ 미정</option>
          </select>
        </div>
      </div>

      {/* Accordion toggle: Attendee list */}
      <div>
        <button
          type="button"
          className="w-full flex items-center justify-between py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-stone-400" />
            참석자 명단 ({stats.total}명)
          </span>
          <span className="flex items-center gap-0.5 text-stone-400">
            {isExpanded ? (
              <>
                접기 <ChevronUp size={14} />
              </>
            ) : (
              <>
                펼치기 <ChevronDown size={14} />
              </>
            )}
          </span>
        </button>

        {/* Expanded Attendee List */}
        {isExpanded && (
          <div className="mt-2 pt-3 border-t border-stone-100 text-sm space-y-3">
            {attendanceQuery.isPending ? (
              <div className="py-2 text-center text-xs text-stone-400">명단을 불러오는 중...</div>
            ) : stats.total === 0 ? (
              <div className="py-2 text-center text-xs text-stone-400">아직 등록된 참석자가 없습니다.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Attending */}
                <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1">
                    <CheckCircle2 size={12} /> 참석 ({attendingList.length}명)
                  </p>
                  {attendingList.length === 0 ? (
                    <p className="text-xs text-stone-400">-</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {attendingList.map((att) => (
                        <span
                          key={String(att.userId)}
                          className="inline-block text-xs bg-white text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs font-medium"
                        >
                          {getMemberDisplayName(att.userId)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Absent */}
                <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-100">
                  <p className="text-xs font-bold text-rose-800 mb-1.5 flex items-center gap-1">
                    <XCircle size={12} /> 불참 ({absentList.length}명)
                  </p>
                  {absentList.length === 0 ? (
                    <p className="text-xs text-stone-400">-</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {absentList.map((att) => (
                        <span
                          key={String(att.userId)}
                          className="inline-block text-xs bg-white text-rose-900 border border-rose-200 px-2 py-0.5 rounded shadow-2xs font-medium"
                        >
                          {getMemberDisplayName(att.userId)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Undecided */}
                <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                  <p className="text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                    <HelpCircle size={12} /> 미정 ({undecidedList.length}명)
                  </p>
                  {undecidedList.length === 0 ? (
                    <p className="text-xs text-stone-400">-</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {undecidedList.map((att) => (
                        <span
                          key={String(att.userId)}
                          className="inline-block text-xs bg-white text-stone-700 border border-stone-200 px-2 py-0.5 rounded shadow-2xs font-medium"
                        >
                          {getMemberDisplayName(att.userId)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Modal: Create Schedule
function CreateScheduleModal({
  teamId,
  onClose,
  onSuccess,
}: {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsed = scheduleSchema.safeParse({
      title,
      scheduleDate,
      startTime,
      location: location || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "입력값을 확인해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: ScheduleRequest = {
        title: title.trim(),
        scheduleDate,
        startTime: startTime.trim(),
        location: location.trim() || undefined,
      };

      await api(`/teams/${teamId}/schedules`, json("POST", payload));
      queryClient.invalidateQueries({ queryKey: [`/teams/${teamId}/schedules`] });
      onSuccess();
    } catch (e) {
      setError((e as Error).message || "일정 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal titleId="create-schedule-title" onClose={onClose}>
      <div className="p-6">
        <h2 id="create-schedule-title" className="text-xl font-bold text-stone-900 mb-4">
          팀 모임 일정 등록
        </h2>
        {error && <p className="error mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field">
            <label htmlFor="scheduleTitle" className="font-semibold block mb-1">
              일정 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              id="scheduleTitle"
              type="text"
              required
              maxLength={100}
              placeholder="예: 화요일 저녁 정기연습"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="field">
              <label htmlFor="scheduleDate" className="font-semibold block mb-1">
                날짜 <span className="text-rose-500">*</span>
              </label>
              <input
                id="scheduleDate"
                type="date"
                required
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="scheduleStartTime" className="font-semibold block mb-1">
                시작 시간 <span className="text-rose-500">*</span>
              </label>
              <input
                id="scheduleStartTime"
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="scheduleLocation" className="font-semibold block mb-1">
              장소 <span className="text-stone-400 font-normal text-xs">(선택)</span>
            </label>
            <input
              id="scheduleLocation"
              type="text"
              maxLength={100}
              placeholder="예: 포항실내체육관 탁구장"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={submitting}
            >
              {submitting ? "등록 중..." : "일정 등록"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
