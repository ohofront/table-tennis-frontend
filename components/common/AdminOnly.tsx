"use client";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
export function AdminOnly({ children }: { children: ReactNode }) {
  return useAuth((s) => s.session?.user.role) === "ADMIN" ? (
    <>{children}</>
  ) : null;
}
export function AuthGuard({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { session, ready } = useAuth();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (ready && !session)
      router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ready, session, router, path]);
  if (!ready || !session)
    return (
      <div className="empty" role="status">
        로그인 상태를 확인하고 있습니다.
      </div>
    );
  if (admin && session.user.role !== "ADMIN")
    return (
      <section className="panel empty">
        <h1>관리자 권한이 필요합니다</h1>
        <p>관리자 계정으로 로그인한 후 이용해주세요.</p>
        <Link href="/" className="button secondary">
          홈으로 돌아가기
        </Link>
      </section>
    );
  return <>{children}</>;
}
