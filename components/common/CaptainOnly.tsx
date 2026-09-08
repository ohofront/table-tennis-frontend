"use client";
import type { ReactNode } from "react";
import { useAuth } from "@/store/auth";

export function CaptainOnly({
  captainUserId,
  children,
  fallback = null,
}: {
  captainUserId?: string | number;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const user = useAuth((s) => s.session?.user);
  if (!user) return <>{fallback}</>;
  const isCaptain =
    captainUserId !== undefined &&
    captainUserId !== null &&
    String(user.userId) === String(captainUserId);
  const isAdmin = user.role === "ADMIN";

  if (isCaptain || isAdmin) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}
