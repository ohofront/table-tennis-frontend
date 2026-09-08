"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, json } from "@/lib/api";
import { AuthGuard } from "@/components/common/AdminOnly";
import type { Team, TeamType } from "@/lib/types";

export function TeamNew() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [teamType, setTeamType] = useState<TeamType>("CLUB");
  const [description, setDescription] = useState("");
  const [logoImage, setLogoImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("팀 이름을 입력해주세요.");
      return;
    }
    if (teamName.length > 50) {
      setError("팀 이름은 50자 이내로 입력해주세요.");
      return;
    }
    if (description.length > 500) {
      setError("팀 소개는 500자 이내로 입력해주세요.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const result = await api<Team>(
        "/teams",
        json("POST", {
          teamName: teamName.trim(),
          teamType,
          description: description.trim() || undefined,
          logoImage: logoImage.trim() || undefined,
        })
      );

      const raw = result as unknown as Record<string, unknown>;
      const newTeamId = result?.teamId ?? result?.id ?? (raw?.id as string | number);
      if (newTeamId) {
        router.push(`/teams/${newTeamId}`);
      } else {
        router.push("/teams");
      }
    } catch (err) {
      setError((err as Error).message || "팀 생성에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <AuthGuard>
      <div className="page-heading">
        <div>
          <Link href="/teams" className="text-link flex items-center gap-1 mb-2">
            <ArrowLeft size={16} /> 팀 목록으로
          </Link>
          <p className="eyebrow">CREATE TEAM</p>
          <h1>새로운 팀 만들기</h1>
          <p>탁구 클럽, 직장 동호회 또는 공공기관 팀을 개설하고 팀원을 모집하세요.</p>
        </div>
      </div>

      <div className="panel form-panel max-w-2xl">
        {error && <p className="error mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field">
            <label htmlFor="teamName" className="font-semibold block mb-1">
              팀 이름 <span className="text-rose-500">*</span>
            </label>
            <input
              id="teamName"
              type="text"
              required
              maxLength={50}
              placeholder="예: 포항 스매셔즈"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
            <small className="text-stone-500 block mt-1">50자 이내로 입력해주세요.</small>
          </div>

          <div className="field">
            <label htmlFor="teamType" className="font-semibold block mb-1">
              팀 구분 <span className="text-rose-500">*</span>
            </label>
            <select
              id="teamType"
              value={teamType}
              onChange={(e) => setTeamType(e.target.value as TeamType)}
              required
            >
              <option value="CLUB">동호회</option>
              <option value="COMPANY">회사 (직장 동호인부)</option>
              <option value="PUBLIC">공공기관</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="description" className="font-semibold block mb-1">
              팀 소개 (선택)
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={500}
              placeholder="팀의 활동 지역, 정기 모임 시간, 가입 요건 등을 소개해 주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <small className="text-stone-500 block mt-1">500자 이내로 입력해주세요.</small>
          </div>

          <div className="field">
            <label htmlFor="logoImage" className="font-semibold block mb-1">
              팀 로고 이미지 URL (선택)
            </label>
            <input
              id="logoImage"
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoImage}
              onChange={(e) => setLogoImage(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Link href="/teams" className="button secondary">
              취소
            </Link>
            <button type="submit" className="button primary" disabled={submitting}>
              {submitting ? "생성 중..." : "팀 생성하기"}
            </button>
          </div>
        </form>
      </div>
    </AuthGuard>
  );
}
