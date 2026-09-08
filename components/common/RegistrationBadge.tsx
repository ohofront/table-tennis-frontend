export type RegistrationStateType = "upcoming" | "open" | "closing" | "closed";

export interface RegistrationStateInfo {
  type: RegistrationStateType;
  label: string;
}

export function getRegistrationState({
  registrationStart,
  registrationEnd,
  isClosed,
  today = new Date(),
}: {
  registrationStart?: string;
  registrationEnd?: string;
  isClosed?: "Y" | "N" | string;
  today?: Date;
}): RegistrationStateInfo {
  if (isClosed === "Y") {
    return { type: "closed", label: "마감" };
  }

  if (!registrationStart && !registrationEnd) {
    return { type: "open", label: "접수중" };
  }

  // Normalize today to start of day in local time
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (registrationStart) {
    const [sy, sm, sd] = registrationStart.split("-").map(Number);
    if (sy && sm && sd) {
      const start = new Date(sy, sm - 1, sd);
      if (now < start) {
        const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          type: "upcoming",
          label: diffDays > 0 ? `접수전 (D-${diffDays})` : "접수전",
        };
      }
    }
  }

  if (registrationEnd) {
    const [ey, em, ed] = registrationEnd.split("-").map(Number);
    if (ey && em && ed) {
      const end = new Date(ey, em - 1, ed);
      if (now > end) {
        return { type: "closed", label: "마감" };
      }
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return { type: "closing", label: "마감 당일" };
      }
      if (diffDays <= 3) {
        return { type: "closing", label: `마감임박 (D-${diffDays})` };
      }
      return { type: "open", label: `접수중 (D-${diffDays})` };
    }
  }

  return { type: "open", label: "접수중" };
}

export function RegistrationBadge({
  registrationStart,
  registrationEnd,
  isClosed,
}: {
  registrationStart?: string;
  registrationEnd?: string;
  isClosed?: "Y" | "N" | string;
}) {
  const state = getRegistrationState({ registrationStart, registrationEnd, isClosed });

  const colorStyles: Record<RegistrationStateType, string> = {
    upcoming: "bg-blue-50 text-blue-700 border border-blue-200",
    open: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    closing: "bg-amber-50 text-amber-700 border border-amber-200",
    closed: "bg-stone-100 text-stone-500 border border-stone-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colorStyles[state.type]}`}
      data-testid="registration-badge"
    >
      {state.label}
    </span>
  );
}

export function CapacityBar({
  current,
  capacity,
  unit = "팀",
}: {
  current: number;
  capacity?: number;
  unit?: string;
}) {
  if (!capacity || capacity <= 0) return null;
  const percentage = Math.min(100, Math.max(0, Math.round((current / capacity) * 100)));
  const isFull = current >= capacity;

  return (
    <div className="w-full my-2">
      <div className="flex justify-between items-center text-xs text-stone-600 mb-1">
        <span>접수 현황</span>
        <span className="font-medium">
          <strong className={isFull ? "text-amber-600" : "text-stone-900"}>{current}</strong> / {capacity}{unit} ({percentage}%)
        </span>
      </div>
      <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isFull ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
