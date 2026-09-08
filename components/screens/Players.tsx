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
import { TrendChart } from "@/components/ranking/TrendChart";
import { date, names } from "@/lib/format";
import { StatusBadge } from "@/components/common/StatusBadge";
export function normalizePlayer(
  raw: Partial<Player> & {
    realName?: string;
    userName?: string;
    clubName?: string;
    phoneNumber?: string;
    openRanking?: number;
    regionRanking?: number;
  },
): Player {
  return {
    ...raw,
    userId: String(raw.userId ?? ""),
    name: raw.name || raw.realName || raw.userName || "선수",
    nickname: raw.nickname || raw.userName || "",
    club: raw.club || raw.clubName || "",
    gender: raw.gender || "M",
    phone: raw.phone || raw.phoneNumber || "",
    birthDate: raw.birthDate || "",
    openDivision:
      raw.openDivision || (raw.openRanking ? `${raw.openRanking}부` : ""),
    localDivision:
      raw.localDivision || (raw.regionRanking ? `${raw.regionRanking}부` : ""),
    totalMatches: raw.totalMatches ?? 0,
    winRate: raw.winRate ?? 0,
    profileImageUrl: raw.profileImageUrl,
  };
}

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
    render: (p) => (
      <strong className="green">
        {p.winRate !== undefined && p.winRate !== null ? `${p.winRate}%` : "-"}
      </strong>
    ),
  },
  {
    key: "matches",
    label: "총 경기",
    render: (p) =>
      p.totalMatches !== undefined && p.totalMatches !== null
        ? `${p.totalMatches}경기`
        : "-",
  },
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
  const [sort, setSort] = useState("reg_date,desc");
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
            <option value="reg_date,desc">최근등록순</option>
            <option value="reg_date,asc">오래된순</option>
            <option value="realName,asc">이름순</option>
            <option value="userName,asc">닉네임순</option>
          </select>
        </div>
        <QueryState
          pending={players.isPending}
          error={players.error}
          retry={() => players.refetch()}
        >
          <DataTable
            columns={columns}
            rows={(players.data ?? []).map(normalizePlayer)}
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
  const playerData = player.data ? normalizePlayer(player.data) : null;
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
        {playerData && (
          <section className="panel profile">
            <PlayerAvatar player={playerData} large />
            <div>
              <h2>
                {playerData.name} <small>{playerData.nickname}</small>
              </h2>
              <p>
                {playerData.club || "무소속"} ·{" "}
                {playerData.gender === "M" ? "남성" : "여성"}
              </p>
              <p>생년월일: {playerData.birthDate || "미등록"}</p>
              <p>
                오픈부수: {playerData.openDivision || "미등록"} · 지역부수:{" "}
                {playerData.localDivision || "미등록"}
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
                  value: `${stats.data.wins} / ${
                    stats.data.losses ??
                    Math.max(
                      0,
                      (stats.data.totalMatches ?? 0) - (stats.data.wins ?? 0),
                    )
                  }`,
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
            <TrendChart userId={userId} />
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
  const [period, setPeriod] = useState("month");
  const [club, setClub] = useState("");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [selected, setSelected] = useState<Ranking | null>(null);
  const debouncedClub = useDebounce(club);
  const rankings = useList<Ranking>(
    `/rankings${queryString({ period, club: debouncedClub, gender })}`,
  );
  const history = useApi<PlayerStats>(
    `/players/${selected?.userId}/stats`,
    Boolean(selected),
  );
  const normalizedRankings = (rankings.data ?? []).map((r, i) => {
    const p = normalizePlayer(r);
    const raw = r as unknown as Record<string, unknown>;
    return {
      ...p,
      rank: typeof raw.rank === "number" ? raw.rank : (raw.ranking as number) ?? i + 1,
      averageScore:
        typeof raw.averagePoints === "number"
          ? raw.averagePoints
          : (raw.averageScore as number) ?? 0,
    };
  });
  const filteredRankings = ageGroup
    ? normalizedRankings.filter((r) => {
        if (!r.birthDate) return false;
        const birthYear = new Date(r.birthDate).getFullYear();
        if (Number.isNaN(birthYear)) return false;
        const age = new Date().getFullYear() - birthYear;
        const group = Math.floor(age / 10) * 10;
        return group === Number(ageGroup);
      })
    : normalizedRankings;
  const rankingColumns: Column<Ranking>[] = [
    {
      key: "rank",
      label: "순위",
      render: (p) => <span className={`rank rank-${p.rank}`}>{p.rank}</span>,
    },
    ...columns.filter((c) => c.key !== "detail"),
    {
      key: "average",
      label: "평균 득점",
      render: (p) => p.averageScore,
    },
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
            <option value="month">최근 1개월</option>
            <option value="quarter">최근 3개월</option>
            <option value="year">최근 1년</option>
            <option value="all">전체 기간</option>
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
            rows={filteredRankings}
            rowKey={(r) => r.userId}
          />
          {Boolean(filteredRankings.length) && (
            <RankingChart
              period={
                {
                  month: "최근 1개월",
                  quarter: "최근 3개월",
                  year: "최근 1년",
                  all: "전체 기간",
                }[period]
              }
              data={filteredRankings
                .slice(0, 10)
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
