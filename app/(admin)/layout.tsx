import { AuthGuard } from "@/components/common/AdminOnly";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard admin>{children}</AuthGuard>;
}
