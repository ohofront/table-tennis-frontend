"use client";
import { useId, useState } from "react";
import { useList } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { queryString } from "@/lib/api";
import type { Player } from "@/lib/types";
import { QueryState } from "@/components/common/QueryState";
export function PlayerSelect({
  label,
  value,
  onChange,
  excluded = [],
}: {
  label: string;
  value: string[];
  onChange: (ids: string[]) => void;
  excluded?: string[];
}) {
  const id = useId();
  const [keyword, setKeyword] = useState("");
  const search = useDebounce(keyword);
  const players = useList<Player>(`/users${queryString({ keyword: search })}`);
  const [known, setKnown] = useState<Record<string, string>>({});
  return (
    <fieldset className="player-select">
      <legend>{label}</legend>
      <label className="sr-only" htmlFor={id}>
        선수 이름 검색
      </label>
      <input
        id={id}
        placeholder="선수 이름 검색"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className="selected-players">
        {value.map((userId) => (
          <button
            key={userId}
            type="button"
            className="badge"
            onClick={() => onChange(value.filter((v) => v !== userId))}
          >
            {known[userId] || userId} ×
            <span className="sr-only"> 선택 해제</span>
          </button>
        ))}
      </div>
      <QueryState
        pending={players.isPending}
        error={players.error}
        empty={!players.data?.length}
        retry={() => players.refetch()}
      >
        <div className="player-options">
          {players.data?.map((player) => (
            <label key={player.userId}>
              <input
                type="checkbox"
                checked={value.includes(player.userId)}
                disabled={excluded.includes(player.userId)}
                onChange={(e) => {
                  setKnown((current) => ({
                    ...current,
                    [player.userId]: player.name,
                  }));
                  onChange(
                    e.target.checked
                      ? [...value, player.userId]
                      : value.filter((v) => v !== player.userId),
                  );
                }}
              />
              <span>
                {player.name}
                <small>{player.club || "무소속"}</small>
              </span>
            </label>
          ))}
        </div>
      </QueryState>
    </fieldset>
  );
}
