export function date(value?: string) {
  if (!value) return "일정 미정";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "일정 미정"
    : new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
      }).format(parsed);
}
export function names(players: { name: string }[]) {
  return players.map((p) => p.name).join(" · ") || "미정";
}
export function safeNext(value: string | null) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : "/";
}
