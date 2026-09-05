"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
export function RankingChart({
  data,
  line = false,
  period = "",
}: {
  data: { name: string; value: number }[];
  line?: boolean;
  period?: string;
}) {
  return (
    <figure className="chart">
      <figcaption>
        {line ? "기간별 승률 추이" : "선수별 승률 비교"}{" "}
        {period && `· ${period}`}
      </figcaption>
      <div
        className="chart-canvas"
        role="img"
        aria-label={data.map((d) => `${d.name}: ${d.value}%`).join(", ")}
      >
        <ResponsiveContainer width="100%" height="100%">
          {line ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                name="승률"
                stroke="#177052"
                strokeWidth={3}
              />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Bar
                dataKey="value"
                name="승률"
                fill="#177052"
                radius={[5, 5, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
