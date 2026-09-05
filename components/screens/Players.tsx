"use client";
import Link from "next/link";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { Modal } from "@/components/common/Modal";
import { useState } from "react";
import { useApi, useList } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { queryString } from "@/lib/api";
import type { Match, Player, PlayerStats, Ranking } from "@/lib/types";
import { DataTable, type Column } from "@/components/common/DataTable";
import { QueryState } from "@/components/common/QueryState";
import { AdminOnly } from "@/components/common/AdminOnly";
import { RankingChart } from "@/components/ranking/RankingChart";
import { date, names } from "@/lib/format";
import { StatusBadge } from "@/components/common/StatusBadge";
const columns: Column<Player>[] = [
  {
    key: "name",
    label: "선수",
    render: (p) => (
      <Link className="player-cell" href={`/players/${p.userId}`}>
        <PlayerAvatar player={p} />
        <span>
          <strong>{p.name}</strong>
          <small>{p.nickname}</small>
        </span>
      </Link>
    ),
  },
  { key: "club", label: "소속 클럽", render: (p) => p.club || "무소속" },
  {
    key: "winRate",
    label: "승률",
    render: (p) => <strong className="green">{p.winRate}%</strong>,
  },
  { key: "matches", label: "총 경기", render: (p) => `${p.totalMatches}경기` },
  {
    key: "detail",
    label: "관리",
    render: (p) => (
      <div className="inline-actions">
        <Link className="text-link" href={`/players/${p.userId}`}>
          상세 보기 →
        </Link>
        <AdminOnly>
          <Link href={`/players/${p.userId}/edit`}>수정</Link>
        </AdminOnly>
      </div>
    ),
  },
];
export function Players() {
  const [keyword, setKeyword] = useState("");
  const [club, setClub] = useState("");
  const [gender, setGender] = useState("");
  const [sort, setSort] = useState("winRate,desc");
  const search = useDebounce(keyword);
  const clubSearch = useDebounce(club);
  const players = useList<Player>(
    `/users${queryString({ keyword: search, club: clubSearch, gender, sort })}`,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OUR PLAYERS</p>
          <h1>선수 관리</h1>
          <p>함께 플레이하는 선수들을 만나보세요.</p>
        </div>
        <AdminOnly>
          <Link className="button" href="/players/new">
            + 선수 추가
          </Link>
        </AdminOnly>
      </div>
      <section className="panel">
        <div className="filters">
          <input
            aria-label="선수 이름 검색"
            placeholder="이름 / 닉네임 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <input
            aria-label="클럽 검색"
            placeholder="클럽 검색"
            value={club}
            onChange={(e) => setClub(e.target.value)}
          />
          <select
            aria-label="성별"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">성별 전체</option>
            <option value="M">남성</option>
            <option value="F">여성</option>
          </select>
          <select
            aria-label="정렬"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="winRate,desc">승률순</option>
            <option value="totalMatches,desc">경기수순</option>
            <option value="createdAt,desc">최근등록순</option>
          </select>
        </div>
        <QueryState
          pending={players.isPending}
          error={players.error}
          retry={() => players.refetch()}
        >
          <DataTable
            columns={columns}
            rows={players.data ?? []}
            rowKey={(p) => p.userId}
          />
        </QueryState>
      </section>
    </>
  );
}
export function PlayerDetail({ userId }: { userId: string }) {
  const player = useApi<Player>(`/users/${userId}`);
  const stats = useApi<PlayerStats>(`/players/${userId}/stats`);
  const matches = useList<Match>(`/players/${userId}/matches`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PLAYER PROFILE</p>
          <h1>선수 프로필</h1>
        </div>
        <AdminOnly>
          <Link className="button secondary" href={`/players/${userId}/edit`}>
            프로필 수정
          </Link>
        </AdminOnly>
      </div>
      <QueryState
        pending={player.isPending}
        error={player.error}
        retry={() => player.refetch()}
      >
        {player.data && (
          <section className="panel profile">
            <PlayerAvatar player={player.data} large />
            <div>
              <h2>
                {player.data.name} <small>{player.data.nickname}</small>
              </h2>
              <p>
                {player.data.club || "무소속"} ·{" "}
                {player.data.gender === "M" ? "남성" : "여성"}
              </p>
              <p>생년월일: {player.data.birthDate || "미등록"}</p>
              <p>
                오픈부수: {player.data.openDivision || "미등록"} · 지역부수:{" "}
                {player.data.localDivision || "미등록"}
              </p>
            </div>
          </section>
        )}
      </QueryState>
      <QueryState
        pending={stats.isPending}
        error={stats.error}
        retry={() => stats.refetch()}
      >
        {stats.data && (
          <>
            <div className="metric-grid">
              {[
                { label: "총 경기", value: stats.data.totalMatches },
                { label: "승률", value: `${stats.data.winRate}%` },
                {
                  label: "승 / 패",
                  value: `${stats.data.wins} / ${stats.data.losses}`,
                },
              ].map((s) => (
                <div className="metric" key={s.label}>
                  <div>
                    <p>{s.label}</p>
                    <strong>{s.value}</strong>
                  </div>
                </div>
              ))}
            </div>
            <section className="panel">
              <RankingChart
                line
                data={
                  stats.data.history?.map((h) => ({
                    name: h.date,
                    value: h.winRate,
                  })) ?? []
                }
              />
            </section>
          </>
        )}
      </QueryState>
      <section className="panel">
        <div className="panel-heading">
          <h2>최근 경기</h2>
        </div>
        <QueryState
          pending={matches.isPending}
          error={matches.error}
          empty={!matches.data?.length}
          retry={() => matches.refetch()}
        >
          {matches.data?.map((m) => (
            <Link
              href={`/matches/${m.matchId}`}
              key={m.matchId}
              className="match-row"
            >
              <span>{date(m.scheduledAt)}</span>
              <strong>
                {names(m.sideA)} {m.sideAWins} : {m.sideBWins} {names(m.sideB)}
              </strong>
              <StatusBadge status={m.status} />
            </Link>
          ))}
        </QueryState>
      </section>
    </>
  );
}
export function Rankings() {
  const [period, setPeriod] = useState("MONTH");
  const [club, setClub] = useState("");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [selected, setSelected] = useState<Ranking | null>(null);
  const debouncedClub = useDebounce(club);
  const rankings = useList<Ranking>(
    `/rankings${queryString({ period, club: debouncedClub, gender, ageGroup })}`,
  );
  const history = useApi<PlayerStats>(
    `/players/${selected?.userId}/stats${queryString({ period })}`,
    Boolean(selected),
  );
  const rankingColumns: Column<Ranking>[] = [
    {
      key: "rank",
      label: "순위",
      render: (p) => <span className={`rank rank-${p.rank}`}>{p.rank}</span>,
    },
    ...columns.filter((c) => c.key !== "detail"),
    { key: "average", label: "평균 득점", render: (p) => p.averageScore },
    {
      key: "chart",
      label: "추이",
      render: (p) => (
        <button className="text-link" onClick={() => setSelected(p)}>
          그래프 보기 ↗
        </button>
      ),
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TRACK YOUR PROGRESS</p>
          <h1>통계 · 랭킹</h1>
          <p>기록 속에서 발견하는 우리들의 성장.</p>
        </div>
      </div>
      <section className="panel">
        <div className="filters">
          <select
            aria-label="통계 기간"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="MONTH">최근 1개월</option>
            <option value="QUARTER">최근 3개월</option>
            <option value="YEAR">최근 1년</option>
            <option value="ALL">전체 기간</option>
          </select>
          <input
            aria-label="클럽 필터"
            placeholder="전체 클럽"
            value={club}
            onChange={(e) => setClub(e.target.value)}
          />
          <select
            aria-label="성별 필터"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">성별 전체</option>
            <option value="M">남성</option>
            <option value="F">여성</option>
          </select>
          <select
            aria-label="연령 필터"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
          >
            <option value="">연령 전체</option>
            {[10, 20, 30, 40, 50, 60, 70].map((age) => (
              <option key={age} value={age}>
                {age}대
              </option>
            ))}
          </select>
        </div>
        <QueryState
          pending={rankings.isPending}
          error={rankings.error}
          retry={() => rankings.refetch()}
        >
          <DataTable
            columns={rankingColumns}
            rows={rankings.data ?? []}
            rowKey={(r) => r.userId}
          />
          {Boolean(rankings.data?.length) && (
            <RankingChart
              period={
                {
                  MONTH: "최근 1개월",
                  QUARTER: "최근 3개월",
                  YEAR: "최근 1년",
                  ALL: "전체 기간",
                }[period]
              }
              data={rankings
                .data!.slice(0, 10)
                .map((r) => ({ name: r.name, value: r.winRate }))}
            />
          )}
        </QueryState>
      </section>
      {selected && (
        <Modal titleId="chart-title" wide onClose={() => setSelected(null)}>
          <div className="row-between">
            <h2 id="chart-title">{selected.name}의 승률 추이</h2>
            <button
              autoFocus
              className="button secondary"
              onClick={() => setSelected(null)}
            >
              닫기
            </button>
          </div>
          <QueryState
            pending={history.isPending}
            error={history.error}
            empty={!history.data?.history?.length}
            retry={() => history.refetch()}
          >
            <RankingChart
              line
              data={
                history.data?.history?.map((h) => ({
                  name: h.date,
                  value: h.winRate,
                })) ?? []
              }
            />
          </QueryState>
          <Link className="text-link" href={`/players/${selected.userId}`}>
            선수 프로필 보기 →
          </Link>
        </Modal>
      )}
    </>
  );
}
