"use client";
import Link from "next/link";
import { useState } from "react";
import { useApi, useList } from "@/hooks/useApi";
import type {
  Tournament,
  Player,
  Group,
  Match,
  MatchFormat,
  Competition,
} from "@/lib/types";
import { QueryState } from "@/components/common/QueryState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RegistrationBadge, CapacityBar } from "@/components/common/RegistrationBadge";
import { TournamentTeams } from "@/components/screens/TournamentTeams";
import { DataTable } from "@/components/common/DataTable";
import { TournamentBracket } from "@/components/match/TournamentBracket";
import { Modal } from "@/components/common/Modal";
import { Shuffle } from "lucide-react";
import { api, json, queryString } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { date } from "@/lib/format";
export function Tournaments() {
  const [status, setStatus] = useState("");
  const data = useList<Tournament>("/tournaments");
  const filtered = status
    ? (data.data ?? []).filter((t) => t.status === status)
    : (data.data ?? []);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ON THE COURT</p>
          <h1>대회 현황</h1>
          <p>대회의 일정과 참가선수, 경기 결과를 확인하세요.</p>
        </div>
      </div>
      <div className="filters">
        <select
          aria-label="대회 상태"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">전체 상태</option>
          <option value="SCHEDULED">예정</option>
          <option value="IN_PROGRESS">진행 중</option>
          <option value="COMPLETED">종료</option>
          <option value="CANCELLED">취소</option>
        </select>
      </div>
      <QueryState
        pending={data.isPending}
        error={data.error}
        empty={!filtered.length}
        retry={() => data.refetch()}
      >
        <div className="tournament-grid">
          {filtered.map((t) => {
            const raw = t as unknown as Record<string, unknown>;
            const year = t.year || (raw.tournamentYear as number);
            const id = t.tournamentId || (raw.id as string);
            const name = t.name || (raw.tournamentName as string);
            const venue = t.venue || (raw.location as string);
            return (
              <Link
                className="panel tournament-card"
                href={`/tournaments/${year}/${id}`}
                key={`${year}-${id}`}
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge status={t.status} />
                  <RegistrationBadge
                    registrationStart={t.registrationStart ?? (raw.registrationStart as string)}
                    registrationEnd={t.registrationEnd ?? (raw.registrationEnd as string)}
                    isClosed={t.isClosed ?? (raw.isClosed as string)}
                  />
                </div>
                <h2>{name}</h2>
                <p>
                  {date(t.startDate)} ~ {date(t.endDate)}
                </p>
                <p>{venue}</p>
                {Boolean(t.capacity || raw.capacity) && (
                  <CapacityBar
                    current={t.currentParticipants ?? (raw.currentParticipants as number) ?? 0}
                    capacity={t.capacity ?? (raw.capacity as number)}
                  />
                )}
                <span className="text-link">대회 상세 →</span>
              </Link>
            );
          })}
        </div>
      </QueryState>
    </>
  );
}
import { normalizePlayer } from "@/components/screens/Players";

export function TournamentDetail({ year, id }: { year: string; id: string }) {
  const tournament = useApi<Tournament>(`/tournaments/${year}/${id}`);
  const compList = useList<Competition>(
    `/tournaments/${year}/${id}/competitions`,
  );
  const [tab, setTab] = useState("개요");
  const [competition, setCompetition] = useState("");
  const rawTournament = tournament.data as unknown as Record<string, unknown>;
  const tournamentName =
    tournament.data?.name || (rawTournament?.tournamentName as string) || "";
  const tournamentVenue =
    tournament.data?.venue || (rawTournament?.location as string) || "";
  const availableCompetitions =
    tournament.data?.competitions?.length
      ? tournament.data.competitions
      : compList.data?.length
        ? compList.data.map((c) => {
            const raw = c as unknown as Record<string, unknown>;
            return {
              ...c,
              competitionId: String(c.competitionId ?? raw.id ?? ""),
              name: c.name || (raw.competitionName as string) || "경기 단계",
              matchFormat:
                c.matchFormat || (raw.matchFormat as MatchFormat) || "SINGLES",
              bestOf: c.bestOf || 5,
            };
          })
        : [];
  const selectedCompId =
    competition || availableCompetitions[0]?.competitionId || "";

  return (
    <QueryState
      pending={tournament.isPending}
      error={tournament.error}
      retry={() => tournament.refetch()}
    >
      {tournament.data && (
        <>
          <div className="page-heading">
            <div>
              <p className="eyebrow">TOURNAMENT</p>
              <h1>{tournamentName}</h1>
              <p>
                {date(tournament.data.startDate)} ~{" "}
                {date(tournament.data.endDate)} · {tournamentVenue}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={tournament.data.status} />
                <RegistrationBadge
                  registrationStart={tournament.data.registrationStart ?? (rawTournament?.registrationStart as string)}
                  registrationEnd={tournament.data.registrationEnd ?? (rawTournament?.registrationEnd as string)}
                  isClosed={tournament.data.isClosed ?? (rawTournament?.isClosed as string)}
                />
              </div>
              {Boolean(tournament.data.capacity || rawTournament?.capacity) && (
                <div className="w-48">
                  <CapacityBar
                    current={tournament.data.currentParticipants ?? (rawTournament?.currentParticipants as number) ?? 0}
                    capacity={tournament.data.capacity ?? (rawTournament?.capacity as number)}
                  />
                </div>
              )}
            </div>
          </div>
          <nav className="tabs" aria-label="대회 상세 메뉴">
            {["개요", "참가선수", "참가팀", "조편성", "대진표 / 결과"].map((t) => (
              <button
                className={tab === t ? "active" : ""}
                aria-pressed={tab === t}
                key={t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
          {tab === "개요" && (
            <section className="panel form-panel">
              <h2>대회 안내</h2>
              <p className="post-content">
                {tournament.data.description ||
                  (rawTournament?.eventInfo as string) ||
                  (rawTournament?.notes as string) ||
                  "등록된 대회 안내가 없습니다."}
              </p>
            </section>
          )}
          {tab === "참가선수" && <Participants year={year} id={id} />}
          {tab === "참가팀" && <TournamentTeams year={year} id={id} />}
          {(tab === "조편성" || tab === "대진표 / 결과") && (
            <>
              <div className="field">
                <label htmlFor="competition-select">경기 단계 선택</label>
                <select
                  id="competition-select"
                  value={selectedCompId}
                  onChange={(e) => setCompetition(e.target.value)}
                >
                  {availableCompetitions.map((c) => (
                    <option key={c.competitionId} value={c.competitionId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCompId ? (
                <CompetitionView
                  id={selectedCompId}
                  bracket={tab !== "조편성"}
                />
              ) : (
                <p className="empty">등록된 경기 단계가 없습니다.</p>
              )}
            </>
          )}
        </>
      )}
    </QueryState>
  );
}
function Participants({ year, id }: { year: string; id: string }) {
  const [keyword, setKeyword] = useState("");
  const search = useDebounce(keyword);
  const players = useList<Player>(
    `/tournaments/${year}/${id}/participants${queryString({ keyword: search })}`,
  );
  const normalizedPlayers = (players.data ?? []).map(normalizePlayer);
  return (
    <section className="panel">
      <div className="filters">
        <input
          aria-label="참가선수 이름 또는 단체 검색"
          placeholder="이름 / 단체 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <QueryState
        pending={players.isPending}
        error={players.error}
        retry={() => players.refetch()}
      >
        <DataTable
          rows={normalizedPlayers}
          rowKey={(p) => p.userId}
          columns={[
            {
              key: "name",
              label: "선수 이름",
              render: (p) => (
                <Link className="text-link" href={`/players/${p.userId}`}>
                  {p.name}
                </Link>
              ),
            },
            { key: "club", label: "소속", render: (p) => p.club || "무소속" },
          ]}
        />
      </QueryState>
    </section>
  );
}
export function CompetitionView({
  id,
  bracket = false,
}: {
  id: string;
  bracket?: boolean;
}) {
  const queryClient = useQueryClient();
  const groups = useList<Group>(`/competitions/${id}/groups`, !bracket);
  const matches = useList<Match>(`/competitions/${id}/matches`, bracket);

  const [groupCount, setGroupCount] = useState(4);
  const [seedByRanking, setSeedByRanking] = useState(true);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function executeAutoAssign() {
    setIsConfirmModalOpen(false);
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      await api(
        `/competitions/${id}/groups/auto-assign`,
        json("POST", { groupCount, seedByRanking })
      );
      setSuccess("자동 조편성이 성공적으로 완료되었습니다.");
      queryClient.invalidateQueries({ queryKey: [`/competitions/${id}/groups`] });
    } catch (err) {
      setError((err as Error).message || "자동 조편성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (bracket)
    return (
      <section className="panel">
        <QueryState
          pending={matches.isPending}
          error={matches.error}
          empty={!matches.data?.length}
          retry={() => matches.refetch()}
        >
          <TournamentBracket matches={matches.data ?? []} />
        </QueryState>
      </section>
    );

  const existingGroups = groups.data ?? [];

  return (
    <>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="group-count-select" className="text-sm font-semibold text-stone-700">
              조 개수
            </label>
            <select
              id="group-count-select"
              value={groupCount}
              onChange={(e) => setGroupCount(Number(e.target.value))}
              className="py-1 px-2 text-sm w-24"
              disabled={isSubmitting}
            >
              {[2, 3, 4, 5, 6, 8, 10, 12, 16].map((n) => (
                <option key={n} value={n}>
                  {n}개 조
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-sm font-medium text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={seedByRanking}
              onChange={(e) => setSeedByRanking(e.target.checked)}
              disabled={isSubmitting}
              className="rounded"
            />
            랭킹 기준 시드 배정
          </label>
        </div>

        <button
          type="button"
          className="button primary small flex items-center gap-1.5"
          onClick={() => {
            if (existingGroups.length > 0) {
              setIsConfirmModalOpen(true);
            } else {
              executeAutoAssign();
            }
          }}
          disabled={isSubmitting}
        >
          <Shuffle size={14} />
          {isSubmitting ? "조편성 중..." : "자동 조편성 실행"}
        </button>
      </div>

      {error && <p className="error mb-4">{error}</p>}
      {success && <p className="success mb-4 text-emerald-700 bg-emerald-50 p-3 rounded">{success}</p>}

      <QueryState
        pending={groups.isPending}
        error={groups.error}
        empty={!existingGroups.length}
        retry={() => groups.refetch()}
      >
        <div className="tournament-grid">
          {existingGroups.map((g) => {
            const rawGroup = g as unknown as Record<string, unknown>;
            const groupName = g.name || (rawGroup.groupName as string) || "조";
            const groupId = g.groupId || (rawGroup.id as string) || groupName;
            const participants = (g.participants ?? []).map(normalizePlayer);
            return (
              <section className="panel form-panel" key={groupId}>
                <h2>{groupName}</h2>
                {participants.length === 0 ? (
                  <p className="text-stone-400 text-xs py-2">배정된 선수가 없습니다.</p>
                ) : (
                  participants.map((p) => (
                    <Link
                      className="match-row"
                      href={`/players/${p.userId}`}
                      key={p.userId}
                    >
                      {p.name}
                      <small>{p.club || "무소속"}</small>
                    </Link>
                  ))
                )}
              </section>
            );
          })}
        </div>
      </QueryState>

      {isConfirmModalOpen && (
        <Modal titleId="confirm-auto-assign-title" onClose={() => setIsConfirmModalOpen(false)}>
          <div className="p-6">
            <h2 id="confirm-auto-assign-title" className="text-xl font-bold mb-2">
              기존 조편성 덮어쓰기 확인
            </h2>
            <p className="text-sm text-stone-600 mb-6">
              기존에 등록된 조편성({existingGroups.length}개 조)이 존재합니다.<br />
              자동 조편성을 실행하면 기존 조편성이 모두 덮어써집니다. 계속 진행하시겠습니까?
            </p>
            <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
              <button
                type="button"
                className="button secondary"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="button primary bg-rose-600 hover:bg-rose-700 text-white"
                onClick={executeAutoAssign}
              >
                덮어쓰고 실행
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
