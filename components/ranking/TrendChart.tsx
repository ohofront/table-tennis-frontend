"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TrendingUp, BarChart2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import type { PlayerStatsHistoryItem } from "@/lib/types";
import { QueryState } from "@/components/common/QueryState";

export type TrendRangeType = "6m" | "1y" | "current-year";
export type MetricDisplayType = "both" | "winRate" | "avgPoints";

export function getDateRange(
  rangeType: TrendRangeType,
  baseDate = new Date()
): { from: string; to: string } {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;
  const formatYm = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;
  const to = formatYm(year, month);

  if (rangeType === "current-year") {
    return { from: `${year}-01`, to: `${year}-12` };
  }

  const monthsBack = rangeType === "6m" ? 5 : 11;
  let fromYear = year;
  let fromMonth = month - monthsBack;
  while (fromMonth <= 0) {
    fromMonth += 12;
    fromYear -= 1;
  }
  return { from: formatYm(fromYear, fromMonth), to };
}

export function TrendChart({ userId }: { userId: string }) {
  const [range, setRange] = useState<TrendRangeType>("6m");
  const [metric, setMetric] = useState<MetricDisplayType>("both");

  const { from, to } = useMemo(() => getDateRange(range), [range]);

  const queryPath = `/players/${userId}/stats/history?groupBy=month&from=${from}&to=${to}`;
  const historyQuery = useApi<PlayerStatsHistoryItem[]>(queryPath);

  const chartData = useMemo(() => {
    const rawList = historyQuery.data ?? [];
    return rawList.map((item) => {
      const raw = item as unknown as Record<string, unknown>;
      const periodLabel = item.period || item.date || (raw.month as string) || (raw.yearMonth as string) || "";
      const winRate = item.winRate ?? (raw.winRate as number) ?? 0;
      const avgPoints =
        item.averagePoints ??
        item.averageScore ??
        (raw.avgPoints as number) ??
        (raw.averageScore as number) ??
        0;

      return {
        periodLabel,
        winRate: Math.round(winRate * 10) / 10,
        avgPoints: Math.round(avgPoints * 10) / 10,
        totalMatches: item.totalMatches ?? (raw.totalMatches as number) ?? 0,
      };
    });
  }, [historyQuery.data]);

  return (
    <section className="panel">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-bold text-stone-900">
            <TrendingUp size={18} className="text-emerald-600" />
            시즌 성적 추이
          </h2>
          <p className="text-xs text-stone-500">
            기간별 승률과 평균 득점 변동 그래프를 확인하세요.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center text-xs">
            <label htmlFor="metric-select" className="sr-only">표시 지표</label>
            <select
              id="metric-select"
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricDisplayType)}
              className="py-1 px-2 text-xs"
            >
              <option value="both">승률 & 평균득점</option>
              <option value="winRate">승률만 보기</option>
              <option value="avgPoints">평균득점만 보기</option>
            </select>
          </div>

          <div className="flex items-center text-xs">
            <label htmlFor="range-select" className="sr-only">조회 기간</label>
            <select
              id="range-select"
              value={range}
              onChange={(e) => setRange(e.target.value as TrendRangeType)}
              className="py-1 px-2 text-xs"
            >
              <option value="6m">최근 6개월</option>
              <option value="1y">최근 1년</option>
              <option value="current-year">올해 전체</option>
            </select>
          </div>
        </div>
      </div>

      <QueryState
        pending={historyQuery.isPending}
        error={historyQuery.error}
        retry={() => historyQuery.refetch()}
      >
        {chartData.length === 0 ? (
          <div className="p-8 text-center text-stone-500 bg-stone-50/50 rounded-lg border border-dashed border-stone-200">
            <BarChart2 size={32} className="mx-auto mb-2 text-stone-300" />
            <p className="font-semibold text-stone-700">아직 집계된 시즌 추이 데이터가 없습니다.</p>
            <p className="text-xs text-stone-400 mt-1">
              매일 자정(Asia/Seoul)에 선수들의 월별 통계가 자동 집계됩니다.
            </p>
          </div>
        ) : (
          <div className="w-full h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="periodLabel" tick={{ fontSize: 12, fill: "#6b7280" }} />
                {(metric === "both" || metric === "winRate") && (
                  <YAxis
                    yAxisId="winRate"
                    domain={[0, 100]}
                    unit="%"
                    orientation="left"
                    tick={{ fontSize: 12, fill: "#177052" }}
                  />
                )}
                {(metric === "both" || metric === "avgPoints") && (
                  <YAxis
                    yAxisId="avgPoints"
                    domain={[0, "dataMax + 2"]}
                    unit="점"
                    orientation={metric === "both" ? "right" : "left"}
                    tick={{ fontSize: 12, fill: "#d97706" }}
                  />
                )}
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name.includes("승률")) return [`${value}%`, name];
                    if (name.includes("득점")) return [`${value}점`, name];
                    return [value, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                {(metric === "both" || metric === "winRate") && (
                  <Line
                    yAxisId="winRate"
                    type="monotone"
                    dataKey="winRate"
                    name="승률 (%)"
                    stroke="#177052"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#177052" }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {(metric === "both" || metric === "avgPoints") && (
                  <Line
                    yAxisId="avgPoints"
                    type="monotone"
                    dataKey="avgPoints"
                    name="평균 득점 (점)"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: "#d97706" }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </QueryState>
    </section>
  );
}
