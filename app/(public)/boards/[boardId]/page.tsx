import { PostDetail } from "@/components/screens/Community";
export default function Page({ params }: { params: { boardId: string } }) {
  return <PostDetail kind="boards" id={params.boardId} />;
}
