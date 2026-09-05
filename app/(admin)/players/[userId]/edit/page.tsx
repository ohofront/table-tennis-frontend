import { ProfileEdit } from "@/components/screens/Auth";
export default function Page({ params }: { params: { userId: string } }) {
  return <ProfileEdit userId={params.userId} />;
}
