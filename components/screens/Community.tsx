"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApi, useList, useWrite } from "@/hooks/useApi";
import { useDebounce } from "@/hooks/useDebounce";
import { queryString } from "@/lib/api";
import type { Post, Comment } from "@/lib/types";
import { postSchema, commentSchema } from "@/lib/schemas";
import { QueryState } from "@/components/common/QueryState";
import { AdminOnly } from "@/components/common/AdminOnly";
import { DataTable } from "@/components/common/DataTable";
import { Field, MutationError, applyErrors } from "@/components/common/Forms";
import { useAuth } from "@/store/auth";
import { date } from "@/lib/format";
type Kind = "notices" | "boards";
export function PostList({ kind }: { kind: Kind }) {
  const [keyword, setKeyword] = useState("");
  const search = useDebounce(keyword);
  const posts = useList<Post>(`/${kind}${queryString({ keyword: search })}`);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {kind === "notices" ? "CLUB NEWS" : "COMMUNITY"}
          </p>
          <h1>{kind === "notices" ? "공지사항" : "자유게시판"}</h1>
          <p>
            {kind === "notices"
              ? "대회와 클럽의 새로운 소식을 확인하세요."
              : "탁구로 이어지는 우리들의 이야기."}
          </p>
        </div>
        <AdminOnly>
          <Link href={`/${kind}/new`} className="button">
            + 글 작성
          </Link>
        </AdminOnly>
      </div>
      <section className="panel">
        <div className="filters">
          <input
            aria-label="게시글 검색"
            placeholder="제목 / 내용 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <QueryState
          pending={posts.isPending}
          error={posts.error}
          retry={() => posts.refetch()}
        >
          <DataTable
            rows={posts.data ?? []}
            rowKey={(p) => String(p.id)}
            columns={[
              {
                key: "title",
                label: "제목",
                render: (p) => (
                  <Link className="post-title" href={`/${kind}/${p.id}`}>
                    {p.title}
                  </Link>
                ),
              },
              { key: "author", label: "작성자", render: (p) => p.authorName },
              {
                key: "date",
                label: "등록일",
                render: (p) => date(p.createdAt),
              },
              { key: "views", label: "조회", render: (p) => p.views },
            ]}
          />
        </QueryState>
      </section>
    </>
  );
}
export function PostDetail({ kind, id }: { kind: Kind; id: string }) {
  const post = useApi<Post>(`/${kind}/${id}`);
  const remove = useWrite<void, undefined>(`/${kind}/${id}`, "DELETE");
  const router = useRouter();
  return (
    <>
      <Link className="text-link" href={`/${kind}`}>
        ← {kind === "notices" ? "공지사항" : "게시판"} 목록
      </Link>
      <QueryState
        pending={post.isPending}
        error={post.error}
        retry={() => post.refetch()}
      >
        {post.data && (
          <article className="panel article">
            <div className="row-between">
              <span className="eyebrow">
                {kind === "notices" ? "NOTICE" : "BOARD"}
              </span>
              <AdminOnly>
                <div className="inline-actions">
                  <Link
                    className="button secondary"
                    href={`/${kind}/${id}/edit`}
                  >
                    수정
                  </Link>
                  <button
                    className="button danger"
                    disabled={remove.isPending}
                    onClick={async () => {
                      if (window.confirm("게시글을 삭제할까요?")) {
                        try {
                          await remove.mutateAsync(undefined);
                          router.push(`/${kind}`);
                        } catch {
                          /* rendered below */
                        }
                      }
                    }}
                  >
                    삭제
                  </button>
                </div>
              </AdminOnly>
            </div>
            <h1>{post.data.title}</h1>
            <p className="muted">
              {post.data.authorName} · {date(post.data.createdAt)} · 조회{" "}
              {post.data.views}
            </p>
            <MutationError error={remove.error} />
            <div className="post-content">{post.data.content}</div>
          </article>
        )}
      </QueryState>
      {kind === "boards" && post.data && <CommentThread boardId={id} />}
    </>
  );
}
export function PostEditor({ kind, id }: { kind: Kind; id?: string }) {
  const post = useApi<Post>(`/${kind}/${id}`, Boolean(id));
  if (id)
    return (
      <QueryState
        pending={post.isPending}
        error={post.error}
        retry={() => post.refetch()}
      >
        {post.data && <PostForm kind={kind} post={post.data} />}
      </QueryState>
    );
  return <PostForm kind={kind} />;
}
function PostForm({ kind, post }: { kind: Kind; post?: Post }) {
  const router = useRouter();
  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: { title: post?.title ?? "", content: post?.content ?? "" },
  });
  const write = useWrite<Post, z.infer<typeof postSchema>>(
    `/${kind}${post ? `/${post.id}` : ""}`,
    post ? "PUT" : "POST",
  );
  return (
    <>
      <div className="page-heading">
        <h1>
          {kind === "notices" ? "공지사항" : "게시글"} {post ? "수정" : "작성"}
        </h1>
      </div>
      <form
        className="panel form-panel"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const saved = await write.mutateAsync(values);
            router.push(saved?.id ? `/${kind}/${saved.id}` : `/${kind}`);
          } catch (e) {
            applyErrors(e, form.setError);
          }
        })}
      >
        <Field label="제목" error={form.formState.errors.title?.message}>
          <input {...form.register("title")} maxLength={200} />
        </Field>
        <Field label="내용" error={form.formState.errors.content?.message}>
          <textarea {...form.register("content")} rows={14} />
        </Field>
        <MutationError error={write.error} />
        <div className="actions">
          <Link className="button secondary" href={`/${kind}`}>
            취소
          </Link>
          <button className="button" disabled={write.isPending}>
            {write.isPending ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </>
  );
}
export function CommentThread({ boardId }: { boardId: string }) {
  const comments = useList<Comment>(`/boards/${boardId}/comments`);
  const session = useAuth((s) => s.session);
  const [reply, setReply] = useState<Comment | null>(null);
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });
  const create = useWrite<
    Comment,
    { content: string; parentCommentId?: string; comment_depth: number }
  >(`/boards/${boardId}/comments`);
  const all = comments.data ?? [];
  const roots = all.filter((c) => !c.parentCommentId);
  return (
    <section className="panel form-panel">
      <h2>
        댓글 <span className="green">{all.length}</span>
      </h2>
      <QueryState
        pending={comments.isPending}
        error={comments.error}
        empty={!all.length}
        retry={() => comments.refetch()}
      >
        {roots.map((root) => (
          <div key={root.commentId}>
            <CommentItem
              comment={root}
              onReply={
                session
                  ? () => {
                      setReply(root);
                      form.setFocus("content");
                    }
                  : undefined
              }
            />
            {all
              .filter((c) => c.parentCommentId === root.commentId)
              .map((child) => (
                <CommentItem key={child.commentId} comment={child} nested />
              ))}
          </div>
        ))}
      </QueryState>
      {session ? (
        <form
          onSubmit={form.handleSubmit(async ({ content }) => {
            try {
              await create.mutateAsync({
                content,
                parentCommentId: reply?.commentId,
                comment_depth: reply ? 1 : 0,
              });
              form.reset();
              setReply(null);
            } catch (e) {
              applyErrors(e, form.setError);
            }
          })}
        >
          {reply && (
            <p className="info">
              {reply.authorName}님에게 답글{" "}
              <button type="button" onClick={() => setReply(null)}>
                취소 ×
              </button>
            </p>
          )}
          <Field
            label="댓글 작성"
            error={form.formState.errors.content?.message}
          >
            <textarea
              {...form.register("content")}
              placeholder="서로 존중하는 따뜻한 댓글을 남겨주세요."
              rows={3}
              maxLength={1000}
            />
          </Field>
          <MutationError error={create.error} />
          <div className="actions">
            <button className="button" disabled={create.isPending}>
              {create.isPending ? "등록 중…" : "댓글 등록"}
            </button>
          </div>
        </form>
      ) : (
        <p className="info">
          <Link
            className="text-link"
            href={`/login?next=${encodeURIComponent(`/boards/${boardId}`)}`}
          >
            로그인
          </Link>{" "}
          후 댓글을 남길 수 있습니다.
        </p>
      )}
    </section>
  );
}
function CommentItem({
  comment,
  nested,
  onReply,
}: {
  comment: Comment;
  nested?: boolean;
  onReply?: () => void;
}) {
  return (
    <div className={`comment ${nested ? "reply" : ""}`}>
      <div className="row-between">
        <strong>
          {nested && "↳ "}
          {comment.authorName}
        </strong>
        <small>{date(comment.createdAt)}</small>
      </div>
      <p>{comment.content}</p>
      {onReply && (
        <button className="text-link" onClick={onReply}>
          답글 달기
        </button>
      )}
    </div>
  );
}
