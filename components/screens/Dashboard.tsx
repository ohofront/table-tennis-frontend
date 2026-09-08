"use client";
import Link from "next/link";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { Modal } from "@/components/common/Modal";
import {
  ArrowRight,
  Plus,
  CalendarDays,
  Trophy,
  Activity,
  Users,
} from "lucide-react";
import { useList } from "@/hooks/useApi";
import type { Match, Ranking } from "@/lib/types";
import { date, names } from "@/lib/format";
import { QueryState } from "@/components/common/QueryState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TitleCard } from "@/components/ranking/TitleCard";
import { useAuth } from "@/store/auth";
import { useEffect, useState } from "react";
export function Dashboard() {
  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => {
    setTodayLabel(date(new Date().toISOString()));
  }, []);
  const today = useList<Match>("/dashboard/today-matches");
  const top = useList<Ranking>("/dashboard/top-players");
  const recent = useList<Match>("/dashboard/recent-results");
  const role = useAuth((s) => s.session?.user.role);
  const [showPermission, setShowPermission] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR TABLE TENNIS, AT A GLANCE</p>
          <h1>
            홈 대시보드<span className="title-dot">.</span>
          </h1>
          <p>오늘도 즐거운 한 게임, 모든 순간을 기록하세요.</p>
        </div>
        <span className="date-chip">
          <CalendarDays size={16} />
          {todayLabel || "오늘"}
        </span>
      </div>
      <section className="hero">
        <div>
          <span className="hero-tag">
            <span /> READY TO PLAY
          </span>
          <h2>
            좋은 경기는 기억으로,
            <br />
            멋진 플레이는 기록으로.
          </h2>
          <p>경기 결과를 기록하고, 함께 성장하는 즐거움을 만나보세요.</p>
          {role === "ADMIN" ? (
            <Link className="button light" href="/matches/new">
              <Plus size={17} />
              새로운 경기 등록
            </Link>
          ) : (
            <button
              className="button light"
              onClick={() => setShowPermission(true)}
            >
              <Plus size={17} />
              새로운 경기 등록
            </button>
          )}
        </div>
        <div className="court-art" aria-hidden="true">
          <div className="court-lines" />
          <div className="net" />
          <div className="paddle" />
          <span className="ball" />
          <span className="art-caption">EVERY POINT COUNTS.</span>
        </div>
      </section>
      <div className="metric-grid">
        {[
          {
            label: "오늘의 경기",
            value: today.data?.length,
            unit: "경기",
            icon: CalendarDays,
          },
          {
            label: "상위 랭킹 선수",
            value: top.data?.length,
            unit: "명",
            icon: Users,
          },
          {
            label: "최근 기록된 결과",
            value: recent.data?.length,
            unit: "경기",
            icon: Activity,
          },
        ].map(({ label, value, unit, icon: Icon }) => (
          <div className="metric" key={label}>
            <span className="metric-icon">
              <Icon size={21} />
            </span>
            <div>
              <p>{label}</p>
              <strong>
                {value ?? "—"}
                <small>{unit}</small>
              </strong>
            </div>
          </div>
        ))}
      </div>
      <TitleCard />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <CalendarDays size={19} />
              오늘의 경기
            </h2>
            <span className="badge">TODAY</span>
          </div>
          <QueryState
            pending={today.isPending}
            error={today.error}
            empty={!today.data?.length}
            retry={() => today.refetch()}
          >
            {today.data?.map((match) => (
              <Link
                href={`/matches/${match.matchId}`}
                className="match-row"
                key={match.matchId}
              >
                <div className="match-time">
                  {new Date(match.scheduledAt).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                  <small>
                    {match.courtNumber
                      ? `${match.courtNumber}번 코트`
                      : match.venue}
                  </small>
                </div>
                <div className="match-players">
                  <strong>
                    {names(match.sideA)} <span>vs</span> {names(match.sideB)}
                  </strong>
                  <small>
                    {match.matchRound} · {match.venue}
                  </small>
                </div>
                <StatusBadge status={match.status} />
              </Link>
            ))}
          </QueryState>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              <Trophy size={19} />
              상위 랭킹 선수
            </h2>
            <Link className="text-link" href="/rankings">
              전체 보기 <ArrowRight size={14} />
            </Link>
          </div>
          <QueryState
            pending={top.isPending}
            error={top.error}
            empty={!top.data?.length}
            retry={() => top.refetch()}
          >
            {top.data?.slice(0, 5).map((player, index) => (
              <Link
                className="ranking-row"
                href={`/players/${player.userId}`}
                key={player.userId}
              >
                <span className={`rank rank-${index + 1}`}>{index + 1}</span>
                <PlayerAvatar player={player} />
                <span className="player-summary">
                  <strong>{player.name}</strong>
                  <small>{player.club || "무소속"}</small>
                </span>
                <strong className="win-rate">
                  {player.winRate}%<small>승률</small>
                </strong>
              </Link>
            ))}
          </QueryState>
        </section>
      </div>
      <section className="panel results-panel">
        <div className="panel-heading">
          <h2>
            <Activity size={19} />
            최근 경기 결과
          </h2>
          <span className="muted">코트 위의 순간들</span>
        </div>
        <QueryState
          pending={recent.isPending}
          error={recent.error}
          empty={!recent.data?.length}
          retry={() => recent.refetch()}
        >
          <div className="result-grid">
            {recent.data?.map((match) => (
              <Link
                href={`/matches/${match.matchId}`}
                className="result-card"
                key={match.matchId}
              >
                <div className="row-between">
                  <span>
                    {date(match.scheduledAt)} · {match.matchRound}
                  </span>
                  <StatusBadge status={match.status} />
                </div>
                <div className="result-score">
                  <strong>{names(match.sideA)}</strong>
                  <b>
                    {match.sideAWins} <span>:</span> {match.sideBWins}
                  </b>
                  <strong>{names(match.sideB)}</strong>
                </div>
                <div className="row-between">
                  <small>{match.venue}</small>
                  <span className="text-link">
                    경기 상세 <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </QueryState>
      </section>
      {showPermission && (
        <Modal
          titleId="permission-title"
          onClose={() => setShowPermission(false)}
        >
          <h2 id="permission-title">관리자 권한이 필요합니다</h2>
          <p>경기 등록은 관리자만 이용할 수 있습니다.</p>
          <div className="actions">
            <button
              autoFocus
              className="button secondary"
              onClick={() => setShowPermission(false)}
            >
              닫기
            </button>
            <Link className="button" href="/login?next=%2Fmatches%2Fnew">
              로그인
            </Link>
          </div>
        </Modal>
      )}
    </>
  );
}
