"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Trophy,
  Users,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  ArrowUpRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { api, json } from "@/lib/api";
import { clearStoredRefreshToken } from "@/lib/token";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
const navigation = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/players", label: "선수 관리", icon: Users },
  { href: "/rankings", label: "통계 · 랭킹", icon: Activity },
  { href: "/tournaments", label: "대회", icon: Trophy },
  { href: "/notices", label: "공지사항", icon: Megaphone },
  { href: "/boards", label: "커뮤니티", icon: MessagesSquare },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const session = useAuth((s) => s.session);
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await api("/auth/logout", json("POST")).catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      clearStoredRefreshToken();
      useAuth.getState().setSession(null);
      client.clear();
      setBusy(false);
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            P<span>•</span>
          </span>
          <span>
            PINGPONG<small>탁구 경기 기록 관리</small>
          </span>
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="주 메뉴">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={
                path === href || (href !== "/" && path.startsWith(href))
                  ? "nav-item active"
                  : "nav-item"
              }
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-court" />
          <strong>한 경기, 한 기록.</strong>
          <p>
            함께 쌓아가는
            <br />
            우리의 탁구 이야기
          </p>
          <Link href="/matches/new">
            경기 기록하기 <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          TABLE TENNIS CLUB<span>PLAY. RECORD. GROW.</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>우리의 플레이가 기록이 되는 곳</span>
          <div className="account">
            {session ? (
              <>
                <Link href="/mypage">
                  <span className="avatar small">
                    {session.user.name?.slice(0, 1)}
                  </span>
                  {session.user.nickname || session.user.name}
                  <span className="badge">
                    {session.user.role === "ADMIN" ? "관리자" : "회원"}
                  </span>
                </Link>
                <button aria-label="로그아웃" disabled={busy} onClick={logout}>
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <>
                <Link href="/login">로그인</Link>
                <Link className="button secondary small-button" href="/signup">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </header>
        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}
        <main id="main" className="main-content">
          {children}
        </main>
        <footer>
          © {new Date().getFullYear()} PINGPONG{" "}
          <span>모든 경기는 더 나은 내일의 시작.</span>
        </footer>
      </div>
    </div>
  );
}
