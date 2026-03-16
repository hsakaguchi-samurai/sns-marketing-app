import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateCaption } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { content, platform, tone, projectId } = await req.json();
  if (!content || !platform || !projectId) {
    return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
  }

  try {
    const result = await generateCaption({ content, platform, tone });

    const caption = await prisma.caption.create({
      data: {
        content: result.caption,
        hashtags: result.hashtags,
        platform,
        tone: tone || "カジュアル",
        userId,
        projectId,
      },
    });

    return NextResponse.json({
      caption,
      hashtagStrategy: result.hashtagStrategy,
      alternativeCaptions: result.alternativeCaptions,
    });
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json({ error: "キャプション生成に失敗しました" }, { status: 500 });
  }
}
