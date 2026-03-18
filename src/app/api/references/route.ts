import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const videos = await prisma.referenceVideo.findMany({
    where: { userId, ...(projectId ? { projectId } : {}) },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ videos });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { url, title, platform, transcript, projectId } = await req.json();
  if (!url || !title || !platform || !projectId) {
    return NextResponse.json({ error: "URL、タイトル、プラットフォームは必須です" }, { status: 400 });
  }

  const video = await prisma.referenceVideo.create({
    data: { url, title, platform, transcript, userId, projectId },
  });

  return NextResponse.json({ video });
}
