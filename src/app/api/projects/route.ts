import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { scripts: true, captions: true, posts: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { name, platform } = await req.json();
  if (!name || !platform) {
    return NextResponse.json({ error: "プロジェクト名とプラットフォームを入力してください" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: { name, platform, userId },
  });

  return NextResponse.json({ project });
}
