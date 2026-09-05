import { PostEditor } from "@/components/screens/Community";
export default function Page({ params }: { params: { noticeNum: string } }) {
  return <PostEditor kind="notices" id={params.noticeNum} />;
}
