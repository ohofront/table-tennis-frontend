"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useApi, useList } from "@/hooks/useApi";
import { useAuth } from "@/store/auth";
import { api, json } from "@/lib/api";
import type { Team, TeamMember, TournamentTeamRegistration } from "@/lib/types";
import { QueryState } from "@/components/common/QueryState";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { date } from "@/lib/format";

const teamTypeLabels: Record<string, string> = {
  CLUB: "동호회",
  COMPANY: "회사",
  PUBLIC: "공공기관",
};

const statusBadgeStyles: Record<string, { label: string; className: string }> = {
  PENDING: { label: "승인 대기", className: "bg-amber-50 text-amber-700 border border-amber-200" },
  APPROVED: { label: "승인 완료", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  REJECTED: { label: "반려", className: "bg-rose-50 text-rose-700 border border-rose-200" },
};

export function TournamentTeams({ year, id }: { year: string; id: string }) {
  const queryClient = useQueryClient();
  const session = useAuth((s) => s.session);
  const isAdmin = session?.user.role === "ADMIN";

  const teamsQuery = useList<TournamentTeamRegistration>(`/tournaments/${year}/${id}/teams`);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  // Review approval/rejection (Admin only)
  async function handleReview(registrationId: string | number, status: "APPROVED" | "REJECTED") {
    setActionError("");
    setActionSuccess("");
    setProcessingId(registrationId);
    try {
      await api(
        `/tournaments/${year}/${id}/teams/${registrationId}`,
        json("PUT", { status })
      );
      setActionSuccess(status === "APPROVED" ? "참가팀이 승인되었습니다." : "참가팀이 반려되었습니다.");
      queryClient.invalidateQueries({ queryKey: [`/tournaments/${year}/${id}/teams`] });
    } catch (e) {
      setActionError((e as Error).message || "처리에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  }

  // Cancel registration
  async function handleCancel(registrationId: string | number) {
    if (!confirm("정말 접수를 취소하시겠습니까?")) return;
    setActionError("");
    setActionSuccess("");
    setProcessingId(registrationId);
    try {
      await api(`/tournaments/${year}/${id}/teams/${registrationId}`, {
        method: "DELETE",
      });
      setActionSuccess("참가 접수가 취소되었습니다.");
      queryClient.invalidateQueries({ queryKey: [`/tournaments/${year}/${id}/teams`] });
    } catch (e) {
      setActionError((e as Error).message || "접수 취소에 실패했습니다.");
    } finally {
      setProcessingId(null);
    }
  }

  const registrations = teamsQuery.data ?? [];

  return (
    <section className="panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>참가팀 목록 ({registrations.length}팀)</h2>
          <p className="text-sm text-stone-500">본 대회에 접수된 팀 목록 및 로스터입니다.</p>
        </div>
        {session && (
          <button
            type="button"
            className="button primary"
            onClick={() => {
              setActionError("");
              setActionSuccess("");
              setIsApplyModalOpen(true);
            }}
          >
            + 우리 팀으로 접수하기
          </button>
        )}
      </div>

      {actionError && <p className="error mb-4">{actionError}</p>}
      {actionSuccess && <p className="success mb-4 text-emerald-700 bg-emerald-50 p-3 rounded">{actionSuccess}</p>}

      <QueryState
        pending={teamsQuery.isPending}
        error={teamsQuery.error}
        empty={!registrations.length}
        retry={() => teamsQuery.refetch()}
      >
        <DataTable
          rows={registrations}
          rowKey={(r) => String(r.registrationId ?? r.id ?? `${r.teamId}-${r.teamName}`)}
          columns={[
            {
              key: "teamName",
              label: "팀명",
              render: (r) => {
                const raw = r as unknown as Record<string, unknown>;
                const teamName = r.teamName || (raw.name as string) || `팀 #${r.teamId}`;
                const teamType = r.teamType || (raw.type as string) || "CLUB";
                return (
                  <div>
                    <Link className="text-link font-semibold" href={`/teams/${r.teamId}`}>
                      {teamName}
                    </Link>
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-stone-100 text-stone-600 rounded">
                      {teamTypeLabels[teamType] || teamType}
                    </span>
                  </div>
                );
              },
            },
            {
              key: "captain",
              label: "팀장",
              render: (r) => {
                const raw = r as unknown as Record<string, unknown>;
                return r.captainName || (raw.captain as { realName?: string; name?: string })?.realName || "-";
              },
            },
            {
              key: "roster",
              label: "출전 선수(로스터)",
              render: (r) => {
                const raw = r as unknown as Record<string, unknown>;
                const members = r.rosterMembers || (raw.members as { userId: string | number; realName?: string; name?: string }[]) || [];
                if (members.length > 0) {
                  return (
                    <div className="flex flex-wrap gap-1">
                      {members.map((m) => (
                        <span key={String(m.userId)} className="px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded text-xs">
                          {m.realName || m.name || `선수 ${m.userId}`}
                        </span>
                      ))}
                    </div>
                  );
                }
                const ids = r.rosterUserIds || [];
                return ids.length > 0 ? `${ids.length}명 지정됨` : "미지정";
              },
            },
            {
              key: "regDate",
              label: "접수일시",
              render: (r) => {
                const raw = r as unknown as Record<string, unknown>;
                const d = r.registeredAt || r.regDate || (raw.createdAt as string);
                return d ? date(d) : "-";
              },
            },
            {
              key: "status",
              label: "상태",
              render: (r) => {
                const raw = r as unknown as Record<string, unknown>;
                const status = (r.status || raw.registrationStatus || "PENDING") as string;
                const badge = statusBadgeStyles[status] || { label: status, className: "bg-stone-100 text-stone-600" };
                return (
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badge.className}`}>
                    {badge.label}
                  </span>
                );
              },
            },
            {
              key: "actions",
              label: "관리",
              render: (r) => {
                const raw = r as unknown as Record<string, unknown>;
                const regId = r.registrationId ?? r.id ?? (raw.registrationId as number);
                const status = (r.status || raw.registrationStatus || "PENDING") as string;
                const isBusy = processingId === regId;

                return (
                  <div className="flex items-center gap-1">
                    {isAdmin && status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          className="button small"
                          disabled={isBusy}
                          onClick={() => handleReview(regId, "APPROVED")}
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          className="button small secondary"
                          disabled={isBusy}
                          onClick={() => handleReview(regId, "REJECTED")}
                        >
                          반려
                        </button>
                      </>
                    )}
                    {session && regId && (
                      <button
                        type="button"
                        className="button small secondary text-rose-600"
                        disabled={isBusy}
                        onClick={() => handleCancel(regId)}
                      >
                        취소
                      </button>
                    )}
                  </div>
                );
              },
            },
          ]}
        />
      </QueryState>

      {isApplyModalOpen && (
        <ApplyTeamModal
          year={year}
          tournamentId={id}
          onClose={() => setIsApplyModalOpen(false)}
          onSuccess={() => {
            setIsApplyModalOpen(false);
            setActionSuccess("대회 참가 신청이 완료되었습니다.");
            queryClient.invalidateQueries({ queryKey: [`/tournaments/${year}/${id}/teams`] });
          }}
        />
      )}
    </section>
  );
}

function ApplyTeamModal({
  year,
  tournamentId,
  onClose,
  onSuccess,
}: {
  year: string;
  tournamentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const session = useAuth((s) => s.session);
  const currentUserId = session?.user.userId;

  // Fetch teams to choose from
  const teamsQuery = useList<Team>("/teams");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedRosterIds, setSelectedRosterIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch detailed team information (members) when a team is selected
  const teamDetailQuery = useApi<Team>(`/teams/${selectedTeamId}`, Boolean(selectedTeamId));

  const allTeams = teamsQuery.data ?? [];
  // Prefer teams where user is captain or member, but allow picking any team if not restricted
  const userTeams = allTeams.filter((t) => {
    const raw = t as unknown as Record<string, unknown>;
    const capId = t.captainId ?? t.captainUserId ?? (raw.captain as { userId?: string | number })?.userId;
    return String(capId) === String(currentUserId);
  });
  const availableTeams = userTeams.length > 0 ? userTeams : allTeams;

  // Initialize selectedTeamId if empty
  if (!selectedTeamId && availableTeams.length > 0) {
    const firstId = String(availableTeams[0].teamId ?? availableTeams[0].id);
    setSelectedTeamId(firstId);
  }

  const teamMembers: TeamMember[] = teamDetailQuery.data?.members ?? [];

  function handleToggleRoster(userId: number) {
    setSelectedRosterIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamId) {
      setError("접수할 팀을 선택해주세요.");
      return;
    }
    if (selectedRosterIds.length === 0) {
      setError("출전 선수를 최소 1명 이상 선택해주세요.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await api(
        `/tournaments/${year}/${tournamentId}/teams`,
        json("POST", {
          teamId: Number(selectedTeamId),
          rosterUserIds: selectedRosterIds,
          notes: notes.trim() || undefined,
        })
      );
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "접수 신청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal titleId="apply-team-title" onClose={onClose} wide>
      <div className="p-6">
        <h2 id="apply-team-title" className="text-xl font-bold mb-2">
          우리 팀으로 대회 접수하기
        </h2>
        <p className="text-sm text-stone-500 mb-6">
          참가할 팀과 출전할 로스터(선수단)를 선택해주세요.
        </p>

        {error && <p className="error mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field">
            <label htmlFor="team-select" className="font-medium block mb-1">
              참가 팀 선택 <span className="text-rose-500">*</span>
            </label>
            <select
              id="team-select"
              value={selectedTeamId}
              onChange={(e) => {
                setSelectedTeamId(e.target.value);
                setSelectedRosterIds([]);
              }}
              required
            >
              <option value="">팀을 선택하세요</option>
              {availableTeams.map((t) => {
                const tid = String(t.teamId ?? t.id);
                const tname = t.teamName || t.name;
                const ttype = t.teamType || t.type || "CLUB";
                return (
                  <option key={tid} value={tid}>
                    {tname} ({teamTypeLabels[ttype] || ttype})
                  </option>
                );
              })}
            </select>
            {userTeams.length === 0 && (
              <small className="text-stone-500 block mt-1">
                ※ 본인이 팀장인 팀이 없으면 전체 등록된 팀 중에서 선택할 수 있습니다.
              </small>
            )}
          </div>

          <div className="field">
            <label className="font-medium block mb-1">
              출전 선수(로스터) 선택 <span className="text-rose-500">*</span>
            </label>
            {teamDetailQuery.isPending ? (
              <p className="text-stone-400 text-sm">팀원 목록을 불러오는 중...</p>
            ) : teamMembers.length === 0 ? (
              <div className="p-3 bg-stone-50 border border-stone-200 rounded text-sm text-stone-500">
                등록된 팀원이 없습니다. 먼저 팀 상세 페이지에서 팀원을 추가해주세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-stone-200 rounded">
                {teamMembers.map((m) => {
                  const uid = Number(m.userId);
                  const isChecked = selectedRosterIds.includes(uid);
                  const displayName = m.realName || m.name || m.nickname || `선수 ${uid}`;
                  const isCap = m.role === "CAPTAIN" || m.isCaptain;

                  return (
                    <label
                      key={uid}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${
                        isChecked ? "bg-emerald-50 border-emerald-300" : "bg-white border-stone-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRoster(uid)}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">{displayName}</span>
                      {isCap && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-1 rounded">팀장</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
            <small className="text-stone-500 block mt-1">
              선택된 선수: {selectedRosterIds.length}명
            </small>
          </div>

          <div className="field">
            <label htmlFor="apply-notes" className="font-medium block mb-1">
              비고 / 메모 (선택)
            </label>
            <textarea
              id="apply-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="대회 주최측에 전달할 메모가 있다면 작성해주세요. (최대 500자)"
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={submitting}
            >
              닫기
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={submitting || !selectedTeamId || selectedRosterIds.length === 0}
            >
              {submitting ? "접수 중..." : "접수 신청하기"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
