import { z } from "zod";
export const matchSchema = z
  .object({
    competitionId: z.string().min(1, "경기 단계를 선택해주세요."),
    matchFormat: z.enum(["SINGLES", "DOUBLES", "TEAM"]),
    sideA: z.array(z.string()),
    sideB: z.array(z.string()),
    scheduledAt: z
      .string()
      .min(1, "경기 일시를 입력해주세요.")
      .refine(
        (v) => !Number.isNaN(Date.parse(v)),
        "유효한 경기 일시를 입력해주세요.",
      ),
    venue: z.string().min(1, "장소를 입력해주세요."),
    matchRound: z.string().min(1),
    courtNumber: z
      .union([z.literal(""), z.coerce.number().int().positive()])
      .optional(),
    notes: z.string().max(500, "메모는 500자 이내로 입력해주세요."),
  })
  .superRefine((value, ctx) => {
    const count =
      value.matchFormat === "SINGLES"
        ? 1
        : value.matchFormat === "DOUBLES"
          ? 2
          : 3;
    if (
      value.sideA.length < count ||
      value.sideB.length < count ||
      (value.matchFormat !== "TEAM" &&
        (value.sideA.length !== count || value.sideB.length !== count)) ||
      value.sideA.length !== value.sideB.length
    )
      ctx.addIssue({
        code: "custom",
        path: ["sideA"],
        message: `각 팀에 ${count}${value.matchFormat === "TEAM" ? "명 이상, 같은 수의" : "명의"} 선수를 선택해주세요.`,
      });
    const ids = [...value.sideA, ...value.sideB];
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        path: ["sideB"],
        message: "동일 선수를 중복 선택할 수 없습니다.",
      });
  });
export type MatchForm = z.infer<typeof matchSchema>;
export const loginSchema = z.object({
  email: z.string().email("이메일을 확인해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "실명을 입력해주세요.")
    .max(30, "실명은 30자 이내로 입력해주세요."),
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상입니다.")
    .max(20, "닉네임은 20자 이내로 입력해주세요."),
  email: z
    .string()
    .email("이메일을 확인해주세요.")
    .max(30, "이메일은 30자 이내로 입력해주세요."),
  phone: z.string().regex(/^[0-9+\- ]{9,20}$/, "연락처를 확인해주세요."),
  birthDate: z
    .string()
    .min(1, "생년월일을 입력해주세요.")
    .refine(
      (v) => !Number.isNaN(Date.parse(v)) && new Date(v) <= new Date(),
      "유효한 생년월일을 입력해주세요.",
    ),
  gender: z.enum(["M", "F"]),
  club: z.string().max(50, "소속 클럽은 50자 이내로 입력해주세요."),
});
export const signupSchema = profileSchema
  .extend({
    password: z.string().min(8, "비밀번호는 8자 이상입니다.").max(72),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "비밀번호가 일치하지 않습니다.",
  });
export const postSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력해주세요.")
    .max(100, "제목은 100자 이내로 입력해주세요."),
  content: z
    .string()
    .min(1, "내용을 입력해주세요.")
    .max(500, "내용은 500자 이내로 입력해주세요."),
});
export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "댓글을 입력해주세요.")
    .max(500, "댓글은 500자 이내로 입력해주세요."),
});
