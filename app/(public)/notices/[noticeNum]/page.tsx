import { PostDetail } from "@/components/screens/Community";
export default function Page({ params }: { params: { noticeNum: string } }) {
  return <PostDetail kind="notices" id={params.noticeNum} />;
}
