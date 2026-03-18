import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { id } = await params;
  const data = await req.json();

  const existing = await prisma.post.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });

  const views = data.views ?? existing.views;
  const likes = data.likes ?? existing.likes;
  const comments = data.comments ?? existing.comments;
  const shares = data.shares ?? existing.shares;
  const saves = data.saves ?? existing.saves;
  const engagementRate = views > 0 ? ((likes + comments + shares + saves) / views) * 100 : 0;

  const post = await prisma.post.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      platform: data.platform ?? existing.platform,
      postedAt: data.postedAt ? new Date(data.postedAt) : existing.postedAt,
      views,
      likes,
      comments,
      shares,
      saves,
      followers: data.followers ?? existing.followers,
      engagementRate,
      notes: data.notes ?? existing.notes,
    },
  });

  return NextResponse.json({ post });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.post.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "投稿が見つかりません" }, { status: 404 });

  await prisma.post.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
