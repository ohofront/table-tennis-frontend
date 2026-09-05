import type { Metadata } from "next";
import { Providers } from "./providers";
import { Shell } from "@/components/common/Shell";
import "@/styles/globals.css";
export const metadata: Metadata = {
  title: { default: "PINGPONG | 탁구 경기 기록", template: "%s | PINGPONG" },
  description: "탁구 경기 기록부터 선수 관리, 통계와 랭킹까지.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <a href="#main" className="skip-link">
          본문으로 건너뛰기
        </a>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
