import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateCarouselFromIdea } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { topic, title, concept, coverHook, contentOutline, slideCount, style, target, tone, projectId } = await req.json();
  if (!title || !concept || !projectId) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  try {
    const result = await generateCarouselFromIdea({
      topic, title, concept, coverHook, contentOutline,
      slideCount: slideCount || 10, style, target, tone,
    });

    const carousel = await prisma.carousel.create({
      data: {
        title,
        topic,
        slideCount: result.slides.length,
        slides: result.slides,
        caption: result.caption,
        hashtags: result.hashtags,
        style: style || null,
        userId,
        projectId,
      },
    });

    return NextResponse.json({
      carousel,
      designTips: result.designTips,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `カルーセル生成に失敗しました: ${message}` }, { status: 500 });
  }
}
