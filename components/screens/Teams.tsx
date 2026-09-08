"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { useList } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { queryString } from "@/lib/api";
import type { Team, TeamType } from "@/lib/types";
import { QueryState } from "@/components/common/QueryState";
import { DataTable } from "@/components/common/DataTable";

const teamTypeLabels: Record<TeamType, string> = {
  CLUB: "동호회",
  COMPANY: "회사",
  PUBLIC: "공공기관",
};

export function Teams() {
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<string>("");
  const debouncedKeyword = useDebounce(keyword);

  const queryPath = `/teams${queryString({
    keyword: debouncedKeyword || undefined,
    type: type || undefined,
  })}`;

  const teamsQuery = useList<Team>(queryPath);
  const teams = teamsQuery.data ?? [];

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CLUBS & TEAMS</p>
          <h1>팀 찾기 / 관리</h1>
          <p>지역 동호회, 직장 동호인부, 공공기관 탁구팀을 찾고 함께 활동하세요.</p>
        </div>
        <Link href="/teams/new" className="button primary flex items-center gap-1.5">
          <Plus size={16} /> 팀 만들기
        </Link>
      </div>

      <div className="filters flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            aria-label="팀명 검색"
            placeholder="팀명 검색..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          aria-label="팀 구분"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-auto"
        >
          <option value="">구분: 전체</option>
          <option value="CLUB">동호회</option>
          <option value="COMPANY">회사</option>
          <option value="PUBLIC">공공기관</option>
        </select>
      </div>

      <QueryState
        pending={teamsQuery.isPending}
        error={teamsQuery.error}
        empty={!teams.length}
        retry={() => teamsQuery.refetch()}
      >
        <DataTable
          rows={teams}
          rowKey={(t) => String(t.teamId ?? t.id)}
          columns={[
            {
              key: "teamName",
              label: "팀명",
              render: (t) => {
                const raw = t as unknown as Record<string, unknown>;
                const teamId = String(t.teamId ?? t.id);
                const name = t.teamName || (raw.name as string) || "이름 없는 팀";
                return (
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-bold text-xs shrink-0">
                      {name.slice(0, 1)}
                    </span>
                    <div>
                      <Link href={`/teams/${teamId}`} className="text-link font-semibold text-base">
                        {name}
                      </Link>
                      {t.description && (
                        <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{t.description}</p>
                      )}
                    </div>
                  </div>
                );
              },
            },
            {
              key: "teamType",
              label: "구분",
              render: (t) => {
                const raw = t as unknown as Record<string, unknown>;
                const teamType = (t.teamType || (raw.type as TeamType) || "CLUB") as TeamType;
                const label = teamTypeLabels[teamType] || teamType;
                return (
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700">
                    {label}
                  </span>
                );
              },
            },
            {
              key: "memberCount",
              label: "팀원수",
              render: (t) => {
                const raw = t as unknown as Record<string, unknown>;
                const count =
                  t.memberCount ??
                  t.members?.length ??
                  (raw.memberCount as number) ??
                  (Array.isArray(raw.members) ? raw.members.length : 0);
                return (
                  <span className="inline-flex items-center gap-1 text-sm text-stone-700">
                    <Users size={14} className="text-stone-400" />
                    {count}명
                  </span>
                );
              },
            },
            {
              key: "captain",
              label: "팀장",
              render: (t) => {
                const raw = t as unknown as Record<string, unknown>;
                const captainName =
                  t.captainName ||
                  t.captain?.realName ||
                  t.captain?.userName ||
                  (raw.captain as { realName?: string; name?: string })?.realName ||
                  (raw.captainName as string) ||
                  "-";
                return <span className="text-sm font-medium">{captainName}</span>;
              },
            },
            {
              key: "actions",
              label: "상세보기",
              render: (t) => {
                const teamId = String(t.teamId ?? t.id);
                return (
                  <Link href={`/teams/${teamId}`} className="button small secondary">
                    보기
                  </Link>
                );
              },
            },
          ]}
        />
      </QueryState>
    </>
  );
}
