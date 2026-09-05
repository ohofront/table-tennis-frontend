import { PostEditor } from "@/components/screens/Community";
export default function Page({ params }: { params: { boardId: string } }) {
  return <PostEditor kind="boards" id={params.boardId} />;
}
