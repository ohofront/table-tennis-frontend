"use client";
import Link from "next/link";
import { useState } from "react";
import { useApi, useList } from "@/hooks/useApi";
import type { Tournament, Player, Group, Match } from "@/lib/types";
import { QueryState } from "@/components/common/QueryState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { TournamentBracket } from "@/components/match/TournamentBracket";
import { date } from "@/lib/format";
import { queryString } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
export function Tournaments() {
  const [status, setStatus] = useState("");
  const data = useList<Tournament>(`/tournaments${queryString({ status })}`);
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
        empty={!data.data?.length}
        retry={() => data.refetch()}
      >
        <div className="tournament-grid">
          {data.data?.map((t) => (
            <Link
              className="panel tournament-card"
              href={`/tournaments/${t.year}/${t.tournamentId}`}
              key={`${t.year}-${t.tournamentId}`}
            >
              <StatusBadge status={t.status} />
              <h2>{t.name}</h2>
              <p>
                {date(t.startDate)} ~ {date(t.endDate)}
              </p>
              <p>{t.venue}</p>
              <span className="text-link">대회 상세 →</span>
            </Link>
          ))}
        </div>
      </QueryState>
    </>
  );
}
export function TournamentDetail({ year, id }: { year: string; id: string }) {
  const tournament = useApi<Tournament>(`/tournaments/${year}/${id}`);
  const [tab, setTab] = useState("개요");
  const [competition, setCompetition] = useState("");
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
              <h1>{tournament.data.name}</h1>
              <p>
                {date(tournament.data.startDate)} ~{" "}
                {date(tournament.data.endDate)} · {tournament.data.venue}
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
                {tournament.data.description || "등록된 대회 안내가 없습니다."}
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
                  value={
                    competition ||
                    tournament.data.competitions?.[0]?.competitionId ||
                    ""
                  }
                  onChange={(e) => setCompetition(e.target.value)}
                >
                  {tournament.data.competitions?.map((c) => (
                    <option key={c.competitionId} value={c.competitionId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {competition ||
              tournament.data.competitions?.[0]?.competitionId ? (
                <CompetitionView
                  id={
                    competition || tournament.data.competitions[0].competitionId
                  }
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
          rows={players.data ?? []}
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
        {groups.data?.map((g) => (
          <section className="panel form-panel" key={g.groupId}>
            <h2>{g.name}</h2>
            {g.participants.map((p) => (
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
        ))}
      </div>
    </QueryState>
  );
}
