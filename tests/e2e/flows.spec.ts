import { test, expect, type Page } from "@playwright/test";
const players = [
  {
    userId: "1",
    name: "김철수",
    nickname: "드라이브",
    club: "포항 탁구클럽",
    gender: "M",
    birthDate: "1990-03-12",
    totalMatches: 50,
    winRate: 78,
    email: "admin@example.com",
    phone: "01012345678",
    rank: 2,
    averageScore: 8.9,
  },
  {
    userId: "2",
    name: "이영희",
    nickname: "스매시",
    club: "한마음 클럽",
    gender: "F",
    birthDate: "1992-06-22",
    totalMatches: 45,
    winRate: 82,
    email: "player@example.com",
    phone: "01012345679",
    rank: 1,
    averageScore: 9.3,
  },
  {
    userId: "3",
    name: "박민수",
    nickname: "핑퐁",
    club: "포항 탁구클럽",
    gender: "M",
    totalMatches: 30,
    winRate: 65,
    rank: 3,
    averageScore: 8.1,
  },
];
async function backend(page: Page, role: "ADMIN" | "USER" | null = null) {
  if (role)
    await page.context().addCookies([
      {
        name: "refreshToken",
        value: "test-only-cookie",
        url: "http://localhost:3100",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  let currentRole = role;
  let sets: {
    setNumber: number;
    sideAScore: number;
    sideBScore: number;
    setId?: string;
  }[] = [];
  const match = {
    matchId: "m1",
    competitionId: "c1",
    matchFormat: "SINGLES",
    sideA: [players[0]],
    sideB: [players[1]],
    scheduledAt: "2026-09-05T10:00:00+09:00",
    venue: "포항체육관",
    matchRound: "예선",
    courtNumber: 1,
    notes: "클럽 정기전",
    bestOf: 5,
    status: "SCHEDULED",
    sideAWins: 0,
    sideBWins: 0,
    winnerSide: null as string | null,
  };
  const comments = [
    {
      commentId: "1",
      authorName: "김철수",
      content: "좋은 경기였습니다!",
      createdAt: "2026-09-05",
      comment_depth: 0,
      parentCommentId: null as string | null,
    },
  ];
  const requests: { path: string; method: string; body: unknown }[] = [];
  await page.route("http://localhost:8080/api/v1/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      path = url.pathname.replace("/api/v1", ""),
      method = request.method();
    const body = request.postData() ? request.postDataJSON() : undefined;
    requests.push({ path, method, body });
    const send = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3100",
          "Access-Control-Allow-Credentials": "true",
        },
        body: JSON.stringify(data),
      });
    if (method === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3100",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Headers": "authorization,content-type",
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
        },
      });
    if (path === "/auth/refresh")
      return currentRole
        ? send({
            accessToken: "test-access",
            user: { ...players[0], role: currentRole },
          })
        : send({ message: "로그인 필요" }, 401);
    if (path === "/auth/login") {
      currentRole = "USER";
      return send({
        accessToken: "test-access",
        user: { ...players[0], role: "USER" },
      });
    }
    if (path === "/auth/logout") {
      currentRole = null;
      return send({});
    }
    if (path === "/auth/signup") return send(players[0]);
    if (path === "/dashboard/today-matches")
      return send([
        match,
        {
          ...match,
          matchId: "m2",
          sideA: [players[2]],
          sideB: [players[0]],
          scheduledAt: "2026-09-05T14:00:00+09:00",
        },
      ]);
    if (path === "/dashboard/top-players")
      return send([players[1], players[0], players[2]]);
    if (path === "/dashboard/recent-results")
      return send([
        { ...match, status: "COMPLETED", sideAWins: 3, sideBWins: 1 },
        {
          ...match,
          matchId: "m2",
          sideA: [players[1]],
          sideB: [players[2]],
          status: "COMPLETED",
          sideAWins: 3,
          sideBWins: 0,
        },
      ]);
    if (path === "/users")
      return send(
        players.filter(
          (p) =>
            !url.searchParams.get("keyword") ||
            p.name.includes(url.searchParams.get("keyword")!),
        ),
      );
    if (/^\/users\/\d+$/.test(path))
      return send({
        ...players.find((p) => p.userId === path.split("/")[2]),
        ...body,
      });
    if (path === "/tournaments")
      return send([
        {
          tournamentId: "t1",
          year: 2026,
          name: "가을 정기전",
          status: "SCHEDULED",
          startDate: "2026-09-05",
          endDate: "2026-09-06",
          venue: "포항체육관",
          competitions: [],
        },
      ]);
    if (path === "/tournaments/2026/t1")
      return send({
        tournamentId: "t1",
        year: 2026,
        name: "가을 정기전",
        status: "SCHEDULED",
        startDate: "2026-09-05",
        endDate: "2026-09-06",
        venue: "포항체육관",
        competitions: [
          {
            competitionId: "c1",
            name: "가을 정기전 예선",
            matchFormat: "SINGLES",
            bestOf: 5,
          },
        ],
      });
    if (path.endsWith("/tournaments")) return send([]);
    if (path.endsWith("/stats"))
      return send({
        totalMatches: 50,
        wins: 39,
        losses: 11,
        winRate: 78,
        averageScore: 8.9,
        history: [
          { date: "7월", winRate: 70 },
          { date: "8월", winRate: 75 },
          { date: "9월", winRate: 78 },
        ],
      });
    if (path.startsWith("/players/") && path.endsWith("/matches"))
      return send([match]);
    if (path === "/rankings") return send([players[1], players[0], players[2]]);
    if (path === "/competitions/c1")
      return send({
        competitionId: "c1",
        name: "가을 정기전 예선",
        matchFormat: "SINGLES",
        bestOf: 5,
      });
    if (path === "/matches" && method === "POST") return send(match);
    if (path === "/matches/m1/sets" && method === "POST") {
      sets = body.sets.map((s: (typeof sets)[number], i: number) => ({
        ...s,
        setId: String(i + 1),
      }));
      match.sideAWins = 3;
      match.winnerSide = "A";
      match.status = "IN_PROGRESS";
      return send(match);
    }
    if (path === "/matches/m1/sets") return send(sets);
    if (path === "/matches/m1/finalize") {
      match.status = "COMPLETED";
      return send(match);
    }
    if (path === "/matches/m1") return send(match);
    if (path === "/boards/1/comments" && method === "POST") {
      comments.push({
        commentId: String(comments.length + 1),
        authorName: "김철수",
        createdAt: "2026-09-05",
        ...body,
      });
      return send(comments.at(-1));
    }
    if (path === "/boards/1/comments") return send(comments);
    if (path === "/boards/1" || path === "/notices/1")
      return send({
        id: "1",
        title: "가을 정기전 안내",
        content: "9월 정기전에 함께해요.",
        authorName: "운영진",
        createdAt: "2026-09-05",
        views: 32,
      });
    if (path === "/boards" || path === "/notices")
      return send([
        {
          id: "1",
          title: "가을 정기전 안내",
          content: "9월 정기전",
          authorName: "운영진",
          createdAt: "2026-09-05",
          views: 32,
        },
      ]);
    return send({ message: `테스트에서 정의하지 않은 API: ${path}` }, 404);
  });
  return requests;
}
test("홈 데이터, 권한 안내 모달, 모바일 가로 넘침", async ({ page }) => {
  await backend(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "홈 대시보드." }),
  ).toBeVisible();
  await expect(page.getByText("82%").first()).toBeVisible();
  await page.getByRole("button", { name: "새로운 경기 등록" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
});
test("비로그인 직접 접근은 middleware에서 로그인 이동", async ({ page }) => {
  await backend(page);
  await page.goto("/matches/new");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(
    page.getByRole("heading", { name: "다시 만나 반가워요." }),
  ).toBeVisible();
});
test("USER는 ADMIN 화면에 접근할 수 없다", async ({ page }) => {
  await backend(page, "USER");
  await page.goto("/matches/new");
  await expect(
    page.getByRole("heading", { name: "관리자 권한이 필요합니다" }),
  ).toBeVisible();
  await expect(page.getByLabel("경기 단계 선택")).toHaveCount(0);
});
test("관리자 경기 생성, 3:0 점수 저장과 명시적 확정", async ({ page }) => {
  const requests = await backend(page, "ADMIN");
  await page.goto("/matches/new");
  await page.getByLabel("대회 선택").selectOption("2026/t1");
  await page.getByLabel("경기 단계 선택").selectOption("c1");
  await expect(
    page.locator(".info").getByText(/가을 정기전 예선/),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "SIDE A · 선수 1 / 팀 A" })
    .getByRole("checkbox", { name: /김철수/ })
    .check();
  await page
    .getByRole("group", { name: "SIDE B · 선수 2 / 팀 B" })
    .getByRole("checkbox", { name: /이영희/ })
    .check();
  await page.getByLabel("경기 일시").fill("2026-09-05T10:00");
  await page.getByLabel("경기 장소").fill("포항체육관");
  await page.getByRole("button", { name: "다음 → 세트 점수 입력" }).click();
  await expect(page).toHaveURL("/matches/m1/sets");
  for (let i = 1; i <= 3; i++) {
    await page
      .getByRole("spinbutton", { name: `${i}세트 김철수 점수`, exact: true })
      .fill("11");
    await page
      .getByRole("spinbutton", { name: `${i}세트 이영희 점수`, exact: true })
      .fill("9");
  }
  await expect(page.getByText("예상 승자: 김철수")).toBeVisible();
  await page.getByRole("button", { name: "점수 저장", exact: true }).click();
  await expect(page.getByText(/서버에 저장되었습니다/)).toBeVisible();
  await page.getByRole("button", { name: "경기 확정", exact: true }).click();
  await expect(page).toHaveURL("/matches/m1");
  await expect(page.getByText("WINNER · 승리")).toBeVisible();
  expect(
    requests.find((r) => r.path === "/matches" && r.method === "POST")?.body,
  ).toMatchObject({
    participants: [
      { userId: "1", side: "A" },
      { userId: "2", side: "B" },
    ],
  });
});
test("선수 검색 debounce, 모바일 카드, 랭킹 차트 모달", async ({ page }) => {
  const requests = await backend(page);
  await page.goto("/players");
  await page.getByLabel("선수 이름 검색").fill("김철수");
  await expect.poll(() => requests.some((r) => r.path === "/users")).toBe(true);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".mobile-row")).toHaveCount(1);
  await page.goto("/rankings");
  await page.getByRole("button", { name: "그래프 보기 ↗" }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("img", { name: /7월: 70%/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("로그인 회원은 1단계 답글을 등록한다", async ({ page }) => {
  const requests = await backend(page, "USER");
  await page.goto("/boards/1");
  await page.getByRole("button", { name: "답글 달기" }).click();
  await page.getByLabel("댓글 작성").fill("다음 경기에도 함께해요.");
  await page.getByRole("button", { name: "댓글 등록" }).click();
  await expect(page.locator(".reply")).toContainText("다음 경기에도 함께해요.");
  expect(
    requests.find((r) => r.path === "/boards/1/comments" && r.method === "POST")
      ?.body,
  ).toEqual({
    content: "다음 경기에도 함께해요.",
    parentCommentId: "1",
    comment_depth: 1,
  });
});
test("로그인 폼과 외부 next URL 방어", async ({ page }) => {
  await backend(page);
  await page.goto("/login?next=https://evil.example");
  await page.getByLabel("이메일", { exact: true }).fill("user@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("password1");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: /드라이브/ })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
test("API 오류와 재시도 버튼", async ({ page }) => {
  await page.route("http://localhost:8080/api/v1/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "서버 점검 중입니다." }),
    }),
  );
  await page.goto("/");
  await expect(
    page.getByText("데이터를 불러오지 못했습니다").first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toHaveCount(3);
});
