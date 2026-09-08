"use client";

import Link from "next/link";
import { Award, Flame, Trophy, type LucideIcon } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import type { PlayerTitle, RankingTitles } from "@/lib/types";
import { QueryState } from "@/components/common/QueryState";

export function hasTitleData(titles?: RankingTitles | null): boolean {
  if (!titles) return false;
  return Boolean(titles.winRateKing || titles.mostMatchesKing || titles.avgScoreKing);
}

export function TitleCard() {
  const titlesQuery = useApi<RankingTitles>("/rankings/titles?period=month");
  const titles = titlesQuery.data;
  const hasData = hasTitleData(titles);

  return (
    <section className="panel mb-6">
      <div className="panel-heading">
        <h2>
          <Trophy size={19} className="text-amber-500" />
          이달의 타이틀
        </h2>
        <span className="badge">MONTHLY</span>
      </div>

      <QueryState
        pending={titlesQuery.isPending}
        error={titlesQuery.error}
        retry={() => titlesQuery.refetch()}
      >
        {!hasData ? (
          <div className="p-6 text-center text-stone-500 bg-stone-50/50 rounded-lg border border-dashed border-stone-200">
            <Trophy size={32} className="mx-auto mb-2 text-stone-300" />
            <p className="font-semibold text-stone-700">아직 집계된 타이틀 데이터가 없습니다.</p>
            <p className="text-xs text-stone-400 mt-1">
              매일 자정(Asia/Seoul) 배치 집계 후 이달의 타이틀이 갱신됩니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 승률왕 */}
            <TitleItem
              title="승률왕"
              icon={Trophy}
              badge="WIN RATE"
              color="amber"
              player={titles?.winRateKing}
              metricLabel="승률"
              metricValue={
                titles?.winRateKing?.winRate !== undefined
                  ? `${titles.winRateKing.winRate}%`
                  : "-"
              }
              subMetric={
                titles?.winRateKing?.totalMatches !== undefined
                  ? `${titles.winRateKing.totalMatches}전`
                  : undefined
              }
            />

            {/* 최다경기왕 */}
            <TitleItem
              title="최다경기왕"
              icon={Flame}
              badge="MOST MATCHES"
              color="rose"
              player={titles?.mostMatchesKing}
              metricLabel="출전"
              metricValue={
                titles?.mostMatchesKing?.totalMatches !== undefined
                  ? `${titles.mostMatchesKing.totalMatches}경기`
                  : "-"
              }
              subMetric={
                titles?.mostMatchesKing?.winRate !== undefined
                  ? `승률 ${titles.mostMatchesKing.winRate}%`
                  : undefined
              }
            />

            {/* 평균득점왕 */}
            <TitleItem
              title="평균득점왕"
              icon={Award}
              badge="AVG POINTS"
              color="emerald"
              player={titles?.avgScoreKing}
              metricLabel="평균"
              metricValue={
                titles?.avgScoreKing?.averagePoints !== undefined
                  ? `${titles.avgScoreKing.averagePoints}점`
                  : titles?.avgScoreKing?.averageScore !== undefined
                    ? `${titles.avgScoreKing.averageScore}점`
                    : "-"
              }
              subMetric={
                titles?.avgScoreKing?.totalMatches !== undefined
                  ? `${titles.avgScoreKing.totalMatches}경기`
                  : undefined
              }
            />
          </div>
        )}
      </QueryState>
    </section>
  );
}

function TitleItem({
  title,
  icon: Icon,
  badge,
  color,
  player,
  metricLabel,
  metricValue,
  subMetric,
}: {
  title: string;
  icon: LucideIcon;
  badge: string;
  color: "amber" | "rose" | "emerald";
  player?: PlayerTitle | null;
  metricLabel: string;
  metricValue: string;
  subMetric?: string;
}) {
  const colorMap = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  if (!player) {
    return (
      <div className="p-4 rounded-lg border border-stone-200 bg-stone-50/40 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
            <Icon size={14} /> {title}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-400">
            {badge}
          </span>
        </div>
        <p className="text-sm text-stone-400 italic">집계 중</p>
      </div>
    );
  }

  const displayName = player.realName || player.userName || `선수 ${player.userId}`;
  const club = player.clubName || "무소속";

  return (
    <Link
      href={`/players/${player.userId}`}
      className="p-4 rounded-lg border border-stone-200 bg-white hover:border-stone-400 transition-all flex flex-col justify-between group shadow-sm hover:shadow"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colorMap[color]} flex items-center gap-1`}>
          <Icon size={14} /> {title}
        </span>
        <span className="text-[10px] text-stone-400 tracking-wider font-semibold">
          {badge}
        </span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div>
          <strong className="text-base font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
            {displayName}
          </strong>
          <p className="text-xs text-stone-500 mt-0.5">{club}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-stone-400">{metricLabel}</p>
          <strong className="text-lg font-black text-stone-900">{metricValue}</strong>
          {subMetric && <p className="text-[10px] text-stone-400 mt-0.5">{subMetric}</p>}
        </div>
      </div>
    </Link>
  );
}
