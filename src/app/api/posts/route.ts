import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const posts = await prisma.post.findMany({
    where: { userId, ...(projectId ? { projectId } : {}) },
    orderBy: { postedAt: "desc" },
  });

  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const data = await req.json();
  if (!data.title || !data.platform || !data.projectId || !data.postedAt) {
    return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
  }

  const engagementRate =
    data.views > 0
      ? ((data.likes + data.comments + data.shares + data.saves) / data.views) * 100
      : 0;

  const post = await prisma.post.create({
    data: {
      title: data.title,
      platform: data.platform,
      postedAt: new Date(data.postedAt),
      views: data.views || 0,
      likes: data.likes || 0,
      comments: data.comments || 0,
      shares: data.shares || 0,
      saves: data.saves || 0,
      followers: data.followers || 0,
      engagementRate,
      notes: data.notes,
      userId,
      projectId: data.projectId,
    },
  });

  return NextResponse.json({ post });
}
