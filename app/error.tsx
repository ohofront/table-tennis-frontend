"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="panel empty" role="alert">
      <h1>화면을 표시하지 못했습니다.</h1>
      <button className="button" onClick={reset}>
        다시 시도
      </button>
    </div>
  );
}
