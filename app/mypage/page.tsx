import { MyPage } from "@/components/screens/Auth";
import { AuthGuard } from "@/components/common/AdminOnly";
export default function Page() {
  return (
    <AuthGuard>
      <MyPage />
    </AuthGuard>
  );
}
