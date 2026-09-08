import { describe, it, expect } from "vitest";
import { scheduleSchema, attendanceResponseSchema } from "@/lib/schemas";
import {
  sortSchedules,
  calculateAttendanceStats,
  formatScheduleDateTime,
} from "@/components/screens/TeamSchedule";
import type { Schedule, AttendanceItem, AttendanceStatus } from "@/lib/types";

describe("scheduleSchema validation", () => {
  it("유효한 일정 데이터는 통과한다", () => {
    const valid = {
      title: "화요일 정기연습",
      scheduleDate: "2026-09-15",
      startTime: "19:00",
      location: "포항실내체육관",
    };
    const res = scheduleSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it("장소(location)가 없거나 빈 문자열이어도 통과한다", () => {
    const withoutLoc = {
      title: "주말 친선전",
      scheduleDate: "2026-09-20",
      startTime: "14:00",
    };
    expect(scheduleSchema.safeParse(withoutLoc).success).toBe(true);

    const emptyLoc = {
      title: "주말 친선전",
      scheduleDate: "2026-09-20",
      startTime: "14:00",
      location: "",
    };
    expect(scheduleSchema.safeParse(emptyLoc).success).toBe(true);
  });

  it("제목이 비어있으면 실패한다", () => {
    const res = scheduleSchema.safeParse({
      title: "   ",
      scheduleDate: "2026-09-15",
      startTime: "19:00",
    });
    expect(res.success).toBe(false);
  });

  it("제목이 100자를 초과하면 실패한다", () => {
    const res = scheduleSchema.safeParse({
      title: "a".repeat(101),
      scheduleDate: "2026-09-15",
      startTime: "19:00",
    });
    expect(res.success).toBe(false);
  });

  it("날짜 포맷이 YYYY-MM-DD가 아니면 실패한다", () => {
    const invalidDates = ["2026/09/15", "2026-9-15", "tomorrow", "2026.09.15"];
    for (const d of invalidDates) {
      const res = scheduleSchema.safeParse({
        title: "연습",
        scheduleDate: d,
        startTime: "19:00",
      });
      expect(res.success).toBe(false);
    }
  });

  it("시작 시간이 비어있으면 실패한다", () => {
    const res = scheduleSchema.safeParse({
      title: "연습",
      scheduleDate: "2026-09-15",
      startTime: "",
    });
    expect(res.success).toBe(false);
  });

  it("장소가 100자를 초과하면 실패한다", () => {
    const res = scheduleSchema.safeParse({
      title: "연습",
      scheduleDate: "2026-09-15",
      startTime: "19:00",
      location: "x".repeat(101),
    });
    expect(res.success).toBe(false);
  });
});

describe("attendanceResponseSchema validation", () => {
  it("허용된 상태값(ATTEND, ABSENT, UNDECIDED)은 통과한다", () => {
    expect(attendanceResponseSchema.safeParse({ status: "ATTEND" }).success).toBe(true);
    expect(attendanceResponseSchema.safeParse({ status: "ABSENT" }).success).toBe(true);
    expect(attendanceResponseSchema.safeParse({ status: "UNDECIDED" }).success).toBe(true);
  });

  it("허용되지 않은 상태값은 실패한다", () => {
    expect(attendanceResponseSchema.safeParse({ status: "MAYBE" }).success).toBe(false);
    expect(attendanceResponseSchema.safeParse({ status: "UNKNOWN" }).success).toBe(false);
    expect(attendanceResponseSchema.safeParse({ status: "" }).success).toBe(false);
  });
});

describe("sortSchedules", () => {
  it("일정을 날짜 및 시작 시간 오름차순으로 정렬한다", () => {
    const schedules: Schedule[] = [
      {
        scheduleId: 1,
        teamId: 1,
        title: "다음 주 연습",
        scheduleDate: "2026-09-22",
        startTime: "19:00:00",
      },
      {
        scheduleId: 2,
        teamId: 1,
        title: "이번 주 저녁 연습",
        scheduleDate: "2026-09-15",
        startTime: "20:00",
      },
      {
        scheduleId: 3,
        teamId: 1,
        title: "이번 주 오후 연습",
        scheduleDate: "2026-09-15",
        startTime: "14:00:00",
      },
    ];

    const sorted = sortSchedules(schedules);
    expect(sorted.map((s) => s.scheduleId)).toEqual([3, 2, 1]);
  });
});

describe("calculateAttendanceStats", () => {
  it("빈 목록일 경우 모든 집계가 0이다", () => {
    const stats = calculateAttendanceStats([]);
    expect(stats).toEqual({
      attendCount: 0,
      absentCount: 0,
      undecidedCount: 0,
      total: 0,
    });
  });

  it("참석/불참/미정 인원을 정확히 집계한다", () => {
    const list: AttendanceItem[] = [
      { userId: 1, status: "ATTEND" },
      { userId: 2, status: "ATTEND" },
      { userId: 3, status: "ABSENT" },
      { userId: 4, status: "UNDECIDED" },
      { userId: 5, status: "UNDECIDED" },
      { userId: 6, status: "ATTEND" },
    ];

    const stats = calculateAttendanceStats(list);
    expect(stats.attendCount).toBe(3);
    expect(stats.absentCount).toBe(1);
    expect(stats.undecidedCount).toBe(2);
    expect(stats.total).toBe(6);
  });
});

describe("formatScheduleDateTime", () => {
  it("날짜, 요일, 시간을 올바르게 포맷한다", () => {
    // 2026-09-15 is Tuesday
    const res = formatScheduleDateTime("2026-09-15", "19:30:00");
    expect(res.dateDisplay).toBe("2026-09-15");
    expect(res.dayOfWeek).toBe("(화)");
    expect(res.timeDisplay).toBe("19:30");
  });

  it("초(seconds)가 없는 시간도 올바르게 5글자로 유지한다", () => {
    const res = formatScheduleDateTime("2026-09-15", "09:00");
    expect(res.timeDisplay).toBe("09:00");
  });
});

describe("Optimistic update cache logic", () => {
  it("기존 참석자가 있을 경우 목록을 유지하며 해당 사용자의 상태만 변경한다", () => {
    const previous: AttendanceItem[] = [
      { userId: 8, status: "UNDECIDED" },
      { userId: 9, status: "ABSENT" },
    ];
    const targetUserId = 8;
    const newStatus: AttendanceStatus = "ATTEND";

    const exists = previous.some((a) => String(a.userId) === String(targetUserId));
    const next = exists
      ? previous.map((a) =>
          String(a.userId) === String(targetUserId)
            ? { ...a, status: newStatus }
            : a
        )
      : [...previous, { userId: targetUserId, status: newStatus }];

    expect(next).toEqual([
      { userId: 8, status: "ATTEND" },
      { userId: 9, status: "ABSENT" },
    ]);
  });

  it("기존 목록에 없는 사용자일 경우 새 항목을 추가한다", () => {
    const previous: AttendanceItem[] = [{ userId: 8, status: "ATTEND" }];
    const targetUserId = 10;
    const newStatus: AttendanceStatus = "ABSENT";

    const exists = previous.some((a) => String(a.userId) === String(targetUserId));
    const next = exists
      ? previous.map((a) =>
          String(a.userId) === String(targetUserId)
            ? { ...a, status: newStatus }
            : a
        )
      : [...previous, { userId: targetUserId, status: newStatus }];

    expect(next).toEqual([
      { userId: 8, status: "ATTEND" },
      { userId: 10, status: "ABSENT" },
    ]);
  });
});
