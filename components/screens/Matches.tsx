"use client";
import Link from "next/link";
import { PlayerAvatar } from "@/components/common/PlayerAvatar";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useApi, useList, useWrite } from "@/hooks/useApi";
import type { Competition, Match, MatchSet, Tournament } from "@/lib/types";
import { matchSchema, type MatchForm } from "@/lib/schemas";
import { Field, MutationError, applyErrors } from "@/components/common/Forms";
import { QueryState } from "@/components/common/QueryState";
import { PlayerSelect } from "@/components/match/PlayerSelect";
import { SetScoreGrid, type ScoreRow } from "@/components/match/SetScoreGrid";
import { scoreMatch } from "@/lib/scoring";
import { names, date } from "@/lib/format";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AdminOnly } from "@/components/common/AdminOnly";
export function NewMatch() {
  const router = useRouter();
  const [competitionId, setCompetitionId] = useState("");
  const [tournamentPath, setTournamentPath] = useState("");
  const tournaments = useList<Tournament>("/tournaments");
  const tournament = useApi<Tournament>(
    `/tournaments/${tournamentPath}`,
    Boolean(tournamentPath),
  );
  const competition = useApi<Competition>(
    `/competitions/${encodeURIComponent(competitionId)}`,
    Boolean(competitionId),
  );
  const create = useWrite<Match, unknown>("/matches");
  const form = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      competitionId: "",
      matchFormat: "SINGLES",
      sideA: [],
      sideB: [],
      scheduledAt: "",
      venue: "",
      matchRound: "예선",
      notes: "",
      courtNumber: "",
    },
  });
  const error = form.formState.errors;
  const setValue = form.setValue;
  useEffect(() => {
    if (competition.data) setValue("matchFormat", competition.data.matchFormat);
  }, [competition.data, setValue]);
  const roundMap: Record<string, number> = {
    예선: 1,
    본선: 2,
    "16강": 16,
    "8강": 8,
    준결승: 4,
    결승: 2,
  };
  async function submit(values: MatchForm) {
    if (
      !competition.data ||
      competition.data.competitionId !== values.competitionId
    )
      return;
    try {
      const matchRoundNum =
        (roundMap[values.matchRound] ?? Number(values.matchRound)) || 1;
      const result = await create.mutateAsync({
        competitionId: Number(values.competitionId),
        participants: [
          ...values.sideA.map((userId, i) => ({
            userId: Number(userId),
            side: "SIDE_A",
            participantOrder: i + 1,
          })),
          ...values.sideB.map((userId, i) => ({
            userId: Number(userId),
            side: "SIDE_B",
            participantOrder: i + 1,
          })),
        ],
        scheduledAt: new Date(values.scheduledAt).toISOString(),
        location: values.venue,
        venue: values.venue,
        matchRound: matchRoundNum,
        courtNumber: values.courtNumber ? Number(values.courtNumber) : undefined,
        notes: values.notes || undefined,
      });
      const matchId =
        result.matchId ?? (result as unknown as Record<string, unknown>).id;
      if (!matchId) throw new Error("등록 응답에 matchId가 없습니다.");
      router.push(`/matches/${matchId}/sets`);
    } catch (e) {
      applyErrors(e, form.setError);
      form.setError("root", { message: (e as Error).message });
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">NEW MATCH</p>
          <h1>새로운 경기 등록</h1>
          <p>경기 정보를 등록하고 세트별 점수를 기록하세요.</p>
        </div>
      </div>
      <div className="steps">
        <b>01 경기 정보</b>
        <span>02 세트 점수</span>
        <span>03 경기 결과</span>
      </div>
      <form className="panel form-panel" onSubmit={form.handleSubmit(submit)}>
        <h2>경기 정보</h2>
        <QueryState
          pending={tournaments.isPending}
          error={tournaments.error}
          empty={!tournaments.data?.length}
          retry={() => tournaments.refetch()}
        >
          <div className="form-grid">
            <Field label="대회 선택">
              <select
                value={tournamentPath}
                onChange={(e) => {
                  setTournamentPath(e.target.value);
                  setCompetitionId("");
                  form.setValue("competitionId", "");
                  form.setValue("sideA", []);
                  form.setValue("sideB", []);
                }}
              >
                <option value="">대회를 선택해주세요</option>
                {tournaments.data?.map((t) => (
                  <option
                    key={`${t.year}/${t.tournamentId}`}
                    value={`${t.year}/${t.tournamentId}`}
                  >
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="경기 단계 선택" error={error.competitionId?.message}>
              <select
                {...form.register("competitionId")}
                disabled={!tournament.data}
                onChange={(e) => {
                  form.setValue("competitionId", e.target.value);
                  setCompetitionId(e.target.value);
                  form.setValue("sideA", []);
                  form.setValue("sideB", []);
                }}
              >
                <option value="">경기 단계를 선택해주세요</option>
                {tournament.data?.competitions?.map((c) => (
                  <option key={c.competitionId} value={c.competitionId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </QueryState>
        {tournamentPath && (
          <QueryState
            pending={tournament.isPending}
            error={tournament.error}
            empty={!tournament.data?.competitions?.length}
            retry={() => tournament.refetch()}
          >
            <span className="sr-only">대회 경기 단계 조회 완료</span>
          </QueryState>
        )}
        {competitionId && (
          <QueryState
            pending={competition.isPending}
            error={competition.error}
            retry={() => competition.refetch()}
          >
            {competition.data && (
              <CompetitionInfo competition={competition.data} />
            )}
          </QueryState>
        )}
        <div className="form-grid">
          <Controller
            control={form.control}
            name="sideA"
            render={({ field }) => (
              <PlayerSelect
                label="SIDE A · 선수 1 / 팀 A"
                value={field.value}
                onChange={field.onChange}
                excluded={form.watch("sideB")}
              />
            )}
          />
          <Controller
            control={form.control}
            name="sideB"
            render={({ field }) => (
              <PlayerSelect
                label="SIDE B · 선수 2 / 팀 B"
                value={field.value}
                onChange={field.onChange}
                excluded={form.watch("sideA")}
              />
            )}
          />
        </div>
        {error.sideA?.message && (
          <p className="field-error">{error.sideA.message}</p>
        )}
        {error.sideB?.message && (
          <p className="field-error">{error.sideB.message}</p>
        )}
        <div className="form-grid">
          <Field label="경기 일시" error={error.scheduledAt?.message}>
            <input type="datetime-local" {...form.register("scheduledAt")} />
          </Field>
          <Field label="경기 장소" error={error.venue?.message}>
            <input placeholder="예: 포항체육관" {...form.register("venue")} />
          </Field>
          <Field label="경기 라운드">
            <select {...form.register("matchRound")}>
              <option>예선</option>
              <option>본선</option>
              <option>16강</option>
              <option>8강</option>
              <option>준결승</option>
              <option>결승</option>
            </select>
          </Field>
          <Field label="코트 번호 (선택)" error={error.courtNumber?.message}>
            <input type="number" min="1" {...form.register("courtNumber")} />
          </Field>
        </div>
        <Field label="메모 (최대 500자)" error={error.notes?.message}>
          <textarea rows={3} maxLength={500} {...form.register("notes")} />
        </Field>
        {error.root && (
          <p role="alert" className="alert">
            {error.root.message}
          </p>
        )}
        <div className="actions">
          <Link className="button secondary" href="/">
            취소
          </Link>
          <button
            className="button"
            disabled={create.isPending || !competition.data || !competitionId}
          >
            {create.isPending ? "등록 중…" : "다음 → 세트 점수 입력"}
          </button>
        </div>
      </form>
    </>
  );
}
import { useEffect } from "react";
function CompetitionInfo({ competition }: { competition: Competition }) {
  return (
    <p className="info">
      {competition.name} ·{" "}
      {
        { SINGLES: "단식", DOUBLES: "복식", TEAM: "단체전" }[
          competition.matchFormat
        ]
      }{" "}
      · {competition.bestOf}전 {Math.floor(competition.bestOf / 2) + 1}선승
    </p>
  );
}
function normalizeMatchSet(
  raw: Partial<MatchSet> & {
    id?: string | number;
    sideAPoint?: number;
    sideBPoint?: number;
  },
): MatchSet {
  return {
    setId: String(raw.setId ?? raw.id ?? ""),
    setNumber: raw.setNumber ?? 0,
    sideAScore: raw.sideAPoint ?? raw.sideAScore ?? 0,
    sideBScore: raw.sideBPoint ?? raw.sideBScore ?? 0,
  };
}

export function MatchSets({ matchId }: { matchId: string }) {
  const match = useApi<Match>(`/matches/${matchId}`);
  const sets = useList<MatchSet>(`/matches/${matchId}/sets`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">RECORD EVERY POINT</p>
          <h1>세트 점수 입력</h1>
          <p>점수를 입력하면 세트 승수와 예상 승자가 자동으로 계산됩니다.</p>
        </div>
      </div>
      <QueryState
        pending={match.isPending || sets.isPending}
        error={match.error || sets.error}
        retry={() => {
          void match.refetch();
          void sets.refetch();
        }}
      >
        {match.data && sets.data && (
          <ScoreEditor
            key={matchId}
            match={match.data}
            sets={sets.data.map(normalizeMatchSet)}
          />
        )}
      </QueryState>
    </>
  );
}
function ScoreEditor({ match, sets }: { match: Match; sets: MatchSet[] }) {
  const router = useRouter();
  const bestOf = match.bestOf || 5;
  const [rows, setRows] = useState<ScoreRow[]>(
    Array.from({ length: bestOf }, (_, i) => ({
      a: sets.find((s) => s.setNumber === i + 1)?.sideAScore.toString() ?? "",
      b: sets.find((s) => s.setNumber === i + 1)?.sideBScore.toString() ?? "",
    })),
  );
  const [duration, setDuration] = useState(
    match.durationSeconds
      ? new Date(match.durationSeconds * 1000).toISOString().slice(11, 19)
      : "",
  );
  const [validation, setValidation] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Match | null>(null);
  const filled = rows.flatMap((row, i) =>
    row.a !== "" && row.b !== ""
      ? [
          {
            setNumber: i + 1,
            sideAScore: Number(row.a),
            sideBScore: Number(row.b),
          },
        ]
      : [],
  );
  const score = scoreMatch(filled, bestOf);
  const write = useWrite<Match, unknown>(`/matches/${match.matchId}/sets`);
  const finalize = useWrite<Match, unknown>(
    `/matches/${match.matchId}/finalize`,
  );
  const client = useQueryClient();
  async function save() {
    setValidation("");
    if (rows.some((r) => (r.a === "") !== (r.b === "")))
      return setValidation("한 세트의 두 점수를 모두 입력해주세요.");
    if (!filled.length) return setValidation("한 세트 이상 입력해주세요.");
    if (score.errors.length) return setValidation(score.errors.join(" "));
    if (duration && !/^\d{2}:[0-5]\d:[0-5]\d$/.test(duration))
      return setValidation("경기 시간은 HH:MM:SS 형식으로 입력해주세요.");
    if (sets.some((s) => !filled.some((f) => f.setNumber === s.setNumber)))
      return setValidation(
        "저장된 세트는 비울 수 없습니다. 점수를 수정해주세요.",
      );
    setBusy(true);
    try {
      const setsPayload = filled.map((s) => ({
        setNumber: s.setNumber,
        sideAPoint: s.sideAScore,
        sideBPoint: s.sideBScore,
      }));
      if (!sets.length) {
        const result = await write.mutateAsync({
          sets: setsPayload,
        });
        setSaved(result);
        if (result.status === "COMPLETED")
          router.push(`/matches/${match.matchId}`);
      } else {
        for (const set of filled) {
          const old = sets.find((s) => s.setNumber === set.setNumber);
          if (
            old &&
            (old.sideAScore !== set.sideAScore ||
              old.sideBScore !== set.sideBScore)
          ) {
            if (!old.setId)
              throw new Error("세트 수정에 필요한 setId가 없습니다.");
            await api(
              `/matches/${match.matchId}/sets/${old.setId}`,
              json("PUT", {
                setNumber: set.setNumber,
                sideAPoint: set.sideAScore,
                sideBPoint: set.sideBScore,
              }),
            );
          }
        }
        const added = filled
          .filter((s) => !sets.some((old) => old.setNumber === s.setNumber))
          .map((s) => ({
            setNumber: s.setNumber,
            sideAPoint: s.sideAScore,
            sideBPoint: s.sideBScore,
          }));
        if (added.length)
          await api(
            `/matches/${match.matchId}/sets`,
            json("POST", { sets: added }),
          );
        setSaved(await api<Match>(`/matches/${match.matchId}`));
        await client.invalidateQueries();
      }
    } catch (e) {
      setValidation((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel form-panel">
      <div className="row-between">
        <h2>
          {names(match.sideA)} <span className="muted">vs</span>{" "}
          {names(match.sideB)}
        </h2>
        <span className="badge">
          {bestOf}전 {Math.floor(bestOf / 2) + 1}선승
        </span>
      </div>
      <SetScoreGrid
        rows={rows}
        onChange={(r) => {
          setRows(r);
          setSaved(null);
        }}
        sideA={names(match.sideA)}
        sideB={names(match.sideB)}
      />
      <div className="score-summary" aria-live="polite">
        <strong>
          {score.sideAWins} : {score.sideBWins}
        </strong>
        <span>
          {score.winnerSide && !score.errors.length
            ? `예상 승자: ${names(score.winnerSide === "A" ? match.sideA : match.sideB)}`
            : "경기 진행 중 · 승자 미확정"}
          <small>저장 시 서버 결과로 최종 확인합니다.</small>
        </span>
      </div>
      <Field label="총 경기 시간 (선택, HH:MM:SS)">
        <input
          placeholder="00:35:20"
          value={duration}
          disabled={sets.length > 0}
          onChange={(e) => setDuration(e.target.value)}
        />
      </Field>
      {validation && (
        <p className="alert" role="alert">
          {validation}
        </p>
      )}
      <MutationError error={finalize.error} />
      {saved && (
        <p className="info" role="status">
          서버에 저장되었습니다. 상태: {saved.status} · 승자:{" "}
          {saved.winnerSide
            ? names(saved.winnerSide === "A" ? match.sideA : match.sideB)
            : "미확정"}
        </p>
      )}
      <div className="actions">
        <Link className="button secondary" href={`/matches/${match.matchId}`}>
          경기 상세
        </Link>
        <button
          className="button"
          disabled={busy || finalize.isPending}
          onClick={save}
        >
          {busy ? "저장 중…" : "점수 저장"}
        </button>
        {saved &&
          saved.status !== "COMPLETED" &&
          score.winnerSide &&
          !score.errors.length && (
            <button
              className="button"
              disabled={finalize.isPending}
              onClick={async () => {
                try {
                  await finalize.mutateAsync(undefined);
                  router.push(`/matches/${match.matchId}`);
                } catch {
                  /* mutation error rendered */
                }
              }}
            >
              경기 확정
            </button>
          )}
      </div>
    </section>
  );
}
import { useQueryClient } from "@tanstack/react-query";
import { api, json } from "@/lib/api";
export function MatchDetail({ matchId }: { matchId: string }) {
  const router = useRouter();
  const match = useApi<Match>(`/matches/${matchId}`);
  const sets = useList<MatchSet>(`/matches/${matchId}/sets`);
  const remove = useWrite<void, undefined>(`/matches/${matchId}`, "DELETE");
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MATCH RESULT</p>
          <h1>경기 상세</h1>
          <p>경기의 모든 순간을 한눈에 확인하세요.</p>
        </div>
        <AdminOnly>
          <div className="actions">
            <Link
              className="button secondary"
              href={`/matches/${matchId}/sets`}
            >
              점수 편집
            </Link>
            <button
              className="button danger"
              disabled={remove.isPending}
              onClick={async () => {
                if (
                  window.confirm(
                    "이 경기를 삭제할까요? 삭제 후 복구할 수 없습니다.",
                  )
                ) {
                  try {
                    await remove.mutateAsync(undefined);
                    router.push("/");
                  } catch {
                    /* error rendered */
                  }
                }
              }}
            >
              삭제
            </button>
          </div>
        </AdminOnly>
      </div>
      <MutationError error={remove.error} />
      <QueryState
        pending={match.isPending}
        error={match.error}
        retry={() => match.refetch()}
      >
        {match.data && (
          <>
            <section className="panel match-detail">
              <div className="row-between">
                <span>
                  {date(match.data.scheduledAt)} ·{" "}
                  {match.data.venue ||
                    (match.data as unknown as Record<string, unknown>)
                      .location as string ||
                    ""}{" "}
                  · {match.data.matchRound}
                </span>
                <StatusBadge status={match.data.status} />
              </div>
              <div className="versus">
                {[match.data.sideA, match.data.sideB].map((side, index) => (
                  <div className="versus-side" key={index}>
                    {side.map((player) => (
                      <Link
                        href={`/players/${player.userId}`}
                        key={player.userId}
                      >
                        <PlayerAvatar player={player} large />
                        <h2>{player.name}</h2>
                        <p>{player.club || "무소속"}</p>
                      </Link>
                    ))}
                    {match.data?.winnerSide === (index === 0 ? "A" : "B") && (
                      <span className="badge">WINNER · 승리</span>
                    )}
                  </div>
                ))}
                <div className="versus-score">
                  {match.data.sideAWins}
                  <span>:</span>
                  {match.data.sideBWins}
                </div>
              </div>
              <QueryState
                pending={sets.isPending}
                error={sets.error}
                empty={!sets.data?.length}
                retry={() => sets.refetch()}
              >
                <SetScoreGrid
                  rows={(sets.data ?? [])
                    .map(normalizeMatchSet)
                    .slice()
                    .sort((a, b) => a.setNumber - b.setNumber)
                    .map((s) => ({
                      a: String(s.sideAScore),
                      b: String(s.sideBScore),
                    }))}
                  sideA={names(match.data.sideA)}
                  sideB={names(match.data.sideB)}
                  readOnly
                />
              </QueryState>
              {match.data.notes && (
                <p className="info">메모: {match.data.notes}</p>
              )}
              {match.data.durationSeconds != null && (
                <p>
                  경기 시간: {Math.floor(match.data.durationSeconds / 60)}분{" "}
                  {match.data.durationSeconds % 60}초
                </p>
              )}
            </section>
            <Link className="text-link" href="/rankings">
              통계 및 랭킹 분석 →
            </Link>
          </>
        )}
      </QueryState>
    </>
  );
}
