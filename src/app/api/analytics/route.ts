import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { analyzeMetrics } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { projectId } = await req.json();

  const posts = await prisma.post.findMany({
    where: { userId, ...(projectId ? { projectId } : {}) },
    orderBy: { postedAt: "desc" },
    take: 30,
  });

  if (posts.length === 0) {
    return NextResponse.json({ error: "分析するデータがありません。投稿データを追加してください。" }, { status: 400 });
  }

  try {
    const analysis = await analyzeMetrics({
      posts: posts.map((p: typeof posts[number]) => ({
        title: p.title,
        platform: p.platform,
        views: p.views,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        saves: p.saves,
        postedAt: p.postedAt.toISOString(),
      })),
    });

    return NextResponse.json({ analysis, posts });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "分析に失敗しました" }, { status: 500 });
  }
}
