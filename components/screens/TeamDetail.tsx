"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit3, Shield, UserCheck, UserMinus, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useApi, useList } from "@/hooks/useApi";
import { api, json, queryString } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import type { Player, Team, TeamMember, TeamType } from "@/lib/types";
import { QueryState } from "@/components/common/QueryState";
import { DataTable } from "@/components/common/DataTable";
import { Modal } from "@/components/common/Modal";
import { CaptainOnly } from "@/components/common/CaptainOnly";
import { date } from "@/lib/format";

const teamTypeLabels: Record<TeamType, string> = {
  CLUB: "동호회",
  COMPANY: "회사",
  PUBLIC: "공공기관",
};

export function TeamDetail({ teamId }: { teamId: string }) {
  const queryClient = useQueryClient();

  const teamQuery = useApi<Team>(`/teams/${teamId}`);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [processingUser, setProcessingUser] = useState<string | number | null>(null);

  const team = teamQuery.data;
  const raw = team as unknown as Record<string, unknown>;

  const teamName = team?.teamName || (raw?.name as string) || "팀 상세";
  const teamType = (team?.teamType || (raw?.type as TeamType) || "CLUB") as TeamType;
  const captainUserId =
    team?.captainId ??
    team?.captainUserId ??
    team?.captain?.userId ??
    (raw?.captain as { userId?: string | number })?.userId ??
    (raw?.captainUserId as string | number);
  const captainName =
    team?.captainName ??
    team?.captain?.realName ??
    team?.captain?.userName ??
    (raw?.captain as { realName?: string; name?: string })?.realName ??
    (raw?.captainName as string) ??
    "-";

  const members: TeamMember[] = team?.members ?? (raw?.members as TeamMember[]) ?? [];

  // Remove member
  async function handleRemoveMember(userId: string | number, name: string) {
    if (!confirm(`'${name}' 님을 팀에서 제외하시겠습니까?`)) return;
    setActionError("");
    setActionSuccess("");
    setProcessingUser(userId);
    try {
      await api(`/teams/${teamId}/members/${userId}`, { method: "DELETE" });
      setActionSuccess(`${name} 님이 팀에서 제외되었습니다.`);
      queryClient.invalidateQueries({ queryKey: [`/teams/${teamId}`] });
    } catch (e) {
      setActionError((e as Error).message || "팀원 제외에 실패했습니다.");
    } finally {
      setProcessingUser(null);
    }
  }

  // Delegate captain
  async function handleDelegateCaptain(userId: string | number, name: string) {
    if (!confirm(`'${name}' 님에게 팀장 권한을 위임하시겠습니까?`)) return;
    setActionError("");
    setActionSuccess("");
    setProcessingUser(userId);
    try {
      await api(
        `/teams/${teamId}/captain`,
        json("PUT", { newCaptainUserId: Number(userId) })
      );
      setActionSuccess(`${name} 님에게 팀장이 위임되었습니다.`);
      queryClient.invalidateQueries({ queryKey: [`/teams/${teamId}`] });
    } catch (e) {
      setActionError((e as Error).message || "팀장 위임에 실패했습니다.");
    } finally {
      setProcessingUser(null);
    }
  }

  return (
    <QueryState
      pending={teamQuery.isPending}
      error={teamQuery.error}
      retry={() => teamQuery.refetch()}
    >
      {team && (
        <>
          <div className="page-heading">
            <div>
              <Link href="/teams" className="text-link flex items-center gap-1 mb-2">
                <ArrowLeft size={16} /> 팀 목록으로
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="eyebrow">TEAM</p>
                <span className="px-2 py-0.5 text-xs font-semibold bg-stone-100 text-stone-700 rounded">
                  {teamTypeLabels[teamType] || teamType}
                </span>
              </div>
              <h1>{teamName}</h1>
              <p>팀장: <strong className="text-stone-900">{captainName}</strong></p>
            </div>
            <CaptainOnly captainUserId={captainUserId}>
              <button
                type="button"
                className="button secondary flex items-center gap-1.5"
                onClick={() => {
                  setActionError("");
                  setActionSuccess("");
                  setIsEditModalOpen(true);
                }}
              >
                <Edit3 size={15} /> 팀 정보 수정
              </button>
            </CaptainOnly>
          </div>

          {actionError && <p className="error mb-4">{actionError}</p>}
          {actionSuccess && <p className="success mb-4 text-emerald-700 bg-emerald-50 p-3 rounded">{actionSuccess}</p>}

          {team.description && (
            <section className="panel form-panel mb-6">
              <h2>팀 소개</h2>
              <p className="post-content whitespace-pre-wrap">{team.description}</p>
            </section>
          )}

          <section className="panel mb-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div>
                <h2>팀원 목록 ({members.length}명)</h2>
                <p className="text-sm text-stone-500">현재 소속된 선수단입니다.</p>
              </div>
              <CaptainOnly captainUserId={captainUserId}>
                <button
                  type="button"
                  className="button primary small flex items-center gap-1.5"
                  onClick={() => {
                    setActionError("");
                    setActionSuccess("");
                    setIsInviteModalOpen(true);
                  }}
                >
                  <UserPlus size={15} /> + 팀원 초대
                </button>
              </CaptainOnly>
            </div>

            <DataTable
              rows={members}
              rowKey={(m) => String(m.userId)}
              columns={[
                {
                  key: "name",
                  label: "이름",
                  render: (m) => {
                    const displayName = m.realName || m.name || m.nickname || `선수 ${m.userId}`;
                    return (
                      <Link href={`/players/${m.userId}`} className="text-link font-semibold">
                        {displayName}
                      </Link>
                    );
                  },
                },
                {
                  key: "role",
                  label: "역할",
                  render: (m) => {
                    const isCap =
                      m.role === "CAPTAIN" ||
                      m.isCaptain ||
                      String(m.userId) === String(captainUserId);
                    return isCap ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Shield size={12} /> 팀장
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs text-stone-600 bg-stone-100">
                        팀원
                      </span>
                    );
                  },
                },
                {
                  key: "joinedAt",
                  label: "가입일",
                  render: (m) => {
                    const d = m.joinedAt || m.regDate;
                    return d ? date(d) : "-";
                  },
                },
                {
                  key: "actions",
                  label: "관리",
                  render: (m) => {
                    const isCap =
                      m.role === "CAPTAIN" ||
                      m.isCaptain ||
                      String(m.userId) === String(captainUserId);
                    if (isCap) return <span className="text-xs text-stone-400">-</span>;

                    const displayName = m.realName || m.name || m.nickname || `선수 ${m.userId}`;
                    const isBusy = processingUser === m.userId;

                    return (
                      <CaptainOnly captainUserId={captainUserId} fallback={<span className="text-xs text-stone-400">-</span>}>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="button small secondary"
                            disabled={isBusy}
                            onClick={() => handleDelegateCaptain(m.userId, displayName)}
                            title="팀장 권한 위임"
                          >
                            <UserCheck size={13} className="mr-1 inline" /> 팀장위임
                          </button>
                          <button
                            type="button"
                            className="button small secondary text-rose-600"
                            disabled={isBusy}
                            onClick={() => handleRemoveMember(m.userId, displayName)}
                            title="팀에서 제외"
                          >
                            <UserMinus size={13} className="mr-1 inline" /> 제외
                          </button>
                        </div>
                      </CaptainOnly>
                    );
                  },
                },
              ]}
            />
          </section>

          <section className="panel">
            <h2>이 팀이 참가한 대회</h2>
            <p className="text-sm text-stone-500 mb-4">팀 단위로 출전 신청한 대회 내역입니다.</p>
            {team.tournaments && team.tournaments.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {team.tournaments.map((t, idx) => (
                  <div key={idx} className="py-3 flex justify-between items-center">
                    <span className="font-medium">{t.tournamentName || t.name}</span>
                    <span className="text-xs text-stone-500">{t.status || "접수완료"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">아직 참가 신청한 대회가 없습니다.</p>
            )}
          </section>

          {isEditModalOpen && (
            <EditTeamModal
              teamId={teamId}
              initialData={{
                teamName: team.teamName || (raw?.name as string) || "",
                teamType,
                description: team.description || "",
                logoImage: team.logoImage || "",
              }}
              onClose={() => setIsEditModalOpen(false)}
              onSuccess={() => {
                setIsEditModalOpen(false);
                setActionSuccess("팀 정보가 수정되었습니다.");
                queryClient.invalidateQueries({ queryKey: [`/teams/${teamId}`] });
              }}
            />
          )}

          {isInviteModalOpen && (
            <InviteMemberModal
              teamId={teamId}
              existingMemberIds={members.map((m) => String(m.userId))}
              onClose={() => setIsInviteModalOpen(false)}
              onSuccess={() => {
                setIsInviteModalOpen(false);
                setActionSuccess("팀원이 추가되었습니다.");
                queryClient.invalidateQueries({ queryKey: [`/teams/${teamId}`] });
              }}
            />
          )}
        </>
      )}
    </QueryState>
  );
}

function EditTeamModal({
  teamId,
  initialData,
  onClose,
  onSuccess,
}: {
  teamId: string;
  initialData: {
    teamName: string;
    teamType: TeamType;
    description: string;
    logoImage: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [teamName, setTeamName] = useState(initialData.teamName);
  const [teamType, setTeamType] = useState<TeamType>(initialData.teamType);
  const [description, setDescription] = useState(initialData.description);
  const [logoImage, setLogoImage] = useState(initialData.logoImage);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("팀 이름을 입력해주세요.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api(
        `/teams/${teamId}`,
        json("PUT", {
          teamName: teamName.trim(),
          teamType,
          description: description.trim() || undefined,
          logoImage: logoImage.trim() || undefined,
        })
      );
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "팀 정보 수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal titleId="edit-team-title" onClose={onClose}>
      <div className="p-6">
        <h2 id="edit-team-title" className="text-xl font-bold mb-4">
          팀 정보 수정
        </h2>
        {error && <p className="error mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field">
            <label htmlFor="editTeamName" className="font-semibold block mb-1">
              팀 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              id="editTeamName"
              type="text"
              required
              maxLength={50}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="editTeamType" className="font-semibold block mb-1">
              팀 구분 <span className="text-rose-500">*</span>
            </label>
            <select
              id="editTeamType"
              value={teamType}
              onChange={(e) => setTeamType(e.target.value as TeamType)}
              required
            >
              <option value="CLUB">동호회</option>
              <option value="COMPANY">회사</option>
              <option value="PUBLIC">공공기관</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="editDescription" className="font-semibold block mb-1">
              팀 소개
            </label>
            <textarea
              id="editDescription"
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="editLogoImage" className="font-semibold block mb-1">
              로고 URL
            </label>
            <input
              id="editLogoImage"
              type="url"
              value={logoImage}
              onChange={(e) => setLogoImage(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
            <button type="button" className="button secondary" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="submit" className="button primary" disabled={submitting}>
              {submitting ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function InviteMemberModal({
  teamId,
  existingMemberIds,
  onClose,
  onSuccess,
}: {
  teamId: string;
  existingMemberIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const usersQuery = useList<Player>(`/users${queryString({ keyword: debounced || undefined })}`);
  const allUsers = usersQuery.data ?? [];
  const candidates = allUsers.filter((u) => !existingMemberIds.includes(String(u.userId)));

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) {
      setError("추가할 선수를 선택해주세요.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await api(
        `/teams/${teamId}/members`,
        json("POST", { userId: selectedUserId })
      );
      onSuccess();
    } catch (err) {
      setError((err as Error).message || "팀원 추가에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal titleId="invite-member-title" onClose={onClose}>
      <div className="p-6">
        <h2 id="invite-member-title" className="text-xl font-bold mb-2">
          팀원 추가 / 초대
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          팀에 등록할 선수를 검색하여 선택하세요.
        </p>

        {error && <p className="error mb-4">{error}</p>}

        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="field">
            <label className="font-semibold block mb-1">선수 검색</label>
            <input
              type="text"
              placeholder="이름 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="font-semibold block mb-1">
              선수 선택 <span className="text-rose-500">*</span>
            </label>
            {usersQuery.isPending ? (
              <p className="text-stone-400 text-sm">선수 목록 불러오는 중...</p>
            ) : candidates.length === 0 ? (
              <p className="text-stone-500 text-sm p-3 bg-stone-50 border border-stone-200 rounded">
                선택 가능한 선수가 없습니다.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-stone-200 rounded divide-y divide-stone-100">
                {candidates.map((u) => {
                  const uid = Number(u.userId);
                  const isSelected = selectedUserId === uid;
                  const name = u.name || u.nickname || `사용자 #${uid}`;
                  return (
                    <label
                      key={uid}
                      className={`flex items-center justify-between p-2.5 cursor-pointer hover:bg-stone-50 ${
                        isSelected ? "bg-emerald-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="inviteUserId"
                          value={uid}
                          checked={isSelected}
                          onChange={() => setSelectedUserId(uid)}
                        />
                        <span className="font-medium text-sm">{name}</span>
                        {u.club && <span className="text-xs text-stone-400">({u.club})</span>}
                      </div>
                      <span className="text-xs text-stone-400">ID: {uid}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
            <button type="button" className="button secondary" onClick={onClose} disabled={submitting}>
              취소
            </button>
            <button type="submit" className="button primary" disabled={submitting || !selectedUserId}>
              {submitting ? "추가 중..." : "팀원으로 추가"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
