"use client";
import type { ReactNode } from "react";
export function QueryState({
  pending,
  error,
  empty,
  retry,
  children,
}: {
  pending: boolean;
  error: Error | null;
  empty?: boolean;
  retry?: () => void;
  children: ReactNode;
}) {
  if (pending)
    return (
      <div className="empty" role="status">
        <span className="spinner" />
        데이터를 불러오는 중입니다.
      </div>
    );
  if (error)
    return (
      <div className="empty" role="alert">
        <strong>데이터를 불러오지 못했습니다</strong>
        <p>{error.message}</p>
        {retry && (
          <button className="button secondary" onClick={retry}>
            다시 시도
          </button>
        )}
      </div>
    );
  if (empty) return <div className="empty">아직 등록된 데이터가 없습니다.</div>;
  return <>{children}</>;
}
