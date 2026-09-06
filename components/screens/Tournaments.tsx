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
import { DataTable } from "@/components/common/DataTable";
import { TournamentBracket } from "@/components/match/TournamentBracket";
import { date } from "@/lib/format";
import { queryString } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
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
                <StatusBadge status={t.status} />
                <h2>{name}</h2>
                <p>
                  {date(t.startDate)} ~ {date(t.endDate)}
                </p>
                <p>{venue}</p>
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
            <StatusBadge status={tournament.data.status} />
          </div>
          <nav className="tabs" aria-label="대회 상세 메뉴">
            {["개요", "참가선수", "조편성", "대진표 / 결과"].map((t) => (
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
          {tab === "참가선수" && <Participants year={year} id={id} />}{" "}
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
  const groups = useList<Group>(`/competitions/${id}/groups`, !bracket);
  const matches = useList<Match>(`/competitions/${id}/matches`, bracket);
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
  return (
    <QueryState
      pending={groups.isPending}
      error={groups.error}
      empty={!groups.data?.length}
      retry={() => groups.refetch()}
    >
      <div className="tournament-grid">
        {groups.data?.map((g) => {
          const rawGroup = g as unknown as Record<string, unknown>;
          const groupName = g.name || (rawGroup.groupName as string) || "조";
          const groupId = g.groupId || (rawGroup.id as string) || groupName;
          const participants = (g.participants ?? []).map(normalizePlayer);
          return (
            <section className="panel form-panel" key={groupId}>
              <h2>{groupName}</h2>
              {participants.map((p) => (
                <Link
                  className="match-row"
                  href={`/players/${p.userId}`}
                  key={p.userId}
                >
                  {p.name}
                  <small>{p.club || "무소속"}</small>
                </Link>
              ))}
            </section>
          );
        })}
      </div>
    </QueryState>
  );
}
