"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginSchema, profileSchema, signupSchema } from "@/lib/schemas";
import { Field, MutationError, applyErrors } from "@/components/common/Forms";
import { QueryState } from "@/components/common/QueryState";
import { useApi, useList, useWrite } from "@/hooks/useApi";
import { useAuth } from "@/store/auth";
import type { Match, Player, Session, Tournament } from "@/lib/types";
import { safeNext, date, names } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
export function Login() {
  const router = useRouter();
  const client = useQueryClient();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });
  const write = useWrite<Session, z.infer<typeof loginSchema>>("/auth/login");
  return (
    <div className="auth-wrap">
      <p className="eyebrow">WELCOME BACK</p>
      <h1>다시 만나 반가워요.</h1>
      <p className="muted">로그인하고 나의 탁구 기록을 이어가세요.</p>
      <form
        className="panel form-panel"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const session = await write.mutateAsync(values);
            if (!session?.accessToken || !session.user) {
              form.setError("root", {
                message: "로그인 응답 형식을 확인해주세요.",
              });
              return;
            }
            client.clear();
            useAuth.getState().setSession(session);
            router.replace(
              safeNext(new URLSearchParams(window.location.search).get("next")),
            );
          } catch (e) {
            applyErrors(e, form.setError);
          }
        })}
      >
        <Field label="이메일" error={form.formState.errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            {...form.register("email")}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="비밀번호" error={form.formState.errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
        </Field>
        <MutationError error={write.error} />
        {form.formState.errors.root && (
          <p role="alert" className="alert">
            {form.formState.errors.root.message}
          </p>
        )}
        <button className="button full" disabled={write.isPending}>
          {write.isPending ? "로그인 중…" : "로그인"}
        </button>
        <p className="center muted">
          아직 계정이 없으신가요?{" "}
          <Link className="text-link" href="/signup">
            회원가입
          </Link>
        </p>
      </form>
    </div>
  );
}
const fields = [
  { name: "name", label: "실명", type: "text" },
  { name: "nickname", label: "닉네임", type: "text" },
  { name: "email", label: "이메일", type: "email" },
  { name: "phone", label: "연락처", type: "tel" },
  { name: "birthDate", label: "생년월일", type: "date" },
  { name: "club", label: "소속 클럽 (선택)", type: "text" },
] as const;
export function Signup({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { gender: "M", club: "" },
  });
  const write = useWrite<Player, unknown>("/auth/signup");
  return (
    <div className="auth-wrap wide-auth">
      <p className="eyebrow">JOIN THE GAME</p>
      <h1>{admin ? "선수 신규 등록" : "회원가입"}</h1>
      <p className="muted">프로필을 작성하고 함께 플레이하세요.</p>
      <form
        className="panel form-panel"
        onSubmit={form.handleSubmit(async (values) => {
          const { confirmPassword, ...body } = values;
          void confirmPassword;
          try {
            await write.mutateAsync(body);
            router.push(admin ? "/players" : "/login?registered=1");
          } catch (e) {
            applyErrors(e, form.setError);
          }
        })}
      >
        <div className="form-grid">
          {fields.map((field) => (
            <Field
              key={field.name}
              label={field.label}
              error={form.formState.errors[field.name]?.message}
            >
              <input type={field.type} {...form.register(field.name)} />
            </Field>
          ))}
          <Field label="성별">
            <select {...form.register("gender")}>
              <option value="M">남성</option>
              <option value="F">여성</option>
            </select>
          </Field>
          <Field
            label="비밀번호 (8자 이상)"
            error={form.formState.errors.password?.message}
          >
            <input
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
          </Field>
          <Field
            label="비밀번호 확인"
            error={form.formState.errors.confirmPassword?.message}
          >
            <input
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
          </Field>
        </div>
        <MutationError error={write.error} />
        <button className="button full" disabled={write.isPending}>
          {write.isPending ? "등록 중…" : admin ? "선수 등록" : "가입하기"}
        </button>
      </form>
    </div>
  );
}
export function ProfileEdit({ userId }: { userId: string }) {
  const player = useApi<Player>(`/users/${userId}`);
  return (
    <QueryState
      pending={player.isPending}
      error={player.error}
      retry={() => player.refetch()}
    >
      {player.data && <ProfileForm player={player.data} />}
    </QueryState>
  );
}
function ProfileForm({ player }: { player: Player }) {
  const [saved, setSaved] = useState(false);
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: player.name,
      nickname: player.nickname,
      email: player.email ?? "",
      phone: player.phone ?? "",
      birthDate: player.birthDate ?? "",
      gender: player.gender,
      club: player.club ?? "",
    },
  });
  const write = useWrite<Player, z.infer<typeof profileSchema>>(
    `/users/${player.userId}`,
    "PUT",
  );
  return (
    <form
      className="panel form-panel"
      onSubmit={form.handleSubmit(async (values) => {
        setSaved(false);
        try {
          const result = await write.mutateAsync(values);
          const session = useAuth.getState().session;
          if (session?.user.userId === player.userId)
            useAuth
              .getState()
              .setSession({
                ...session,
                user: {
                  ...session.user,
                  ...values,
                  ...result,
                  role: session.user.role,
                },
              });
          setSaved(true);
        } catch (e) {
          applyErrors(e, form.setError);
        }
      })}
    >
      <h2>프로필 수정</h2>
      <div className="form-grid">
        {fields.map((field) => (
          <Field
            key={field.name}
            label={field.label}
            error={form.formState.errors[field.name]?.message}
          >
            <input type={field.type} {...form.register(field.name)} />
          </Field>
        ))}
        <Field label="성별">
          <select {...form.register("gender")}>
            <option value="M">남성</option>
            <option value="F">여성</option>
          </select>
        </Field>
      </div>
      <MutationError error={write.error} />
      {saved && (
        <p className="info" role="status">
          프로필을 저장했습니다.
        </p>
      )}
      <div className="actions">
        <button className="button" disabled={write.isPending}>
          {write.isPending ? "저장 중…" : "변경사항 저장"}
        </button>
      </div>
    </form>
  );
}
export function MyPage() {
  const session = useAuth((s) => s.session)!;
  const matches = useList<Match>(`/players/${session.user.userId}/matches`);
  const tournaments = useList<Tournament>(
    `/users/${session.user.userId}/tournaments`,
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">MY PLAYBOOK</p>
          <h1>마이페이지</h1>
          <p>{session.user.name}님의 경기 기록과 프로필을 관리하세요.</p>
        </div>
      </div>
      <ProfileEdit userId={session.user.userId} />
      <section className="panel">
        <div className="panel-heading">
          <h2>최근 참가 경기</h2>
        </div>
        <QueryState
          pending={matches.isPending}
          error={matches.error}
          empty={!matches.data?.length}
          retry={() => matches.refetch()}
        >
          {matches.data?.map((m) => (
            <Link
              className="match-row"
              href={`/matches/${m.matchId}`}
              key={m.matchId}
            >
              <span>{date(m.scheduledAt)}</span>
              <strong>
                {names(m.sideA)} vs {names(m.sideB)}
              </strong>
              <span>
                {m.sideAWins} : {m.sideBWins}
              </span>
            </Link>
          ))}
        </QueryState>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>최근 참가 대회</h2>
        </div>
        <QueryState
          pending={tournaments.isPending}
          error={tournaments.error}
          empty={!tournaments.data?.length}
          retry={() => tournaments.refetch()}
        >
          {tournaments.data?.map((t) => (
            <Link
              className="match-row"
              href={`/tournaments/${t.year}/${t.tournamentId}`}
              key={t.tournamentId}
            >
              {t.name}
              <span>{date(t.startDate)}</span>
            </Link>
          ))}
        </QueryState>
      </section>
    </>
  );
}
