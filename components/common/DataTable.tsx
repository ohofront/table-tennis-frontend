"use client";
import { useState, type ReactNode } from "react";
export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
}
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  search,
  pageSize = 10,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  search?: ReactNode;
  pageSize?: number;
}) {
  const [page, setPage] = useState(0);
  const last = Math.max(0, Math.ceil(rows.length / pageSize) - 1);
  const current = Math.min(page, last);
  const shown = rows.slice(current * pageSize, (current + 1) * pageSize);
  return (
    <>
      {search}
      <div className="desktop-table">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-cards">
        {shown.map((row) => (
          <dl className="mobile-row" key={rowKey(row)}>
            {columns.map((c) => (
              <div key={c.key}>
                <dt>{c.label}</dt>
                <dd>{c.render(row)}</dd>
              </div>
            ))}
          </dl>
        ))}
      </div>
      {!rows.length && <p className="empty">검색 결과가 없습니다.</p>}
      {rows.length > pageSize && (
        <nav className="pagination" aria-label="페이지 이동">
          <button disabled={current === 0} onClick={() => setPage(current - 1)}>
            이전
          </button>
          <span>
            {current + 1} / {last + 1}
          </span>
          <button
            disabled={current === last}
            onClick={() => setPage(current + 1)}
          >
            다음
          </button>
        </nav>
      )}
    </>
  );
}
