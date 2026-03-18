import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { generateCarouselIdeas } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { topic, slideCount, style, target, tone, count } = await req.json();
  if (!topic) {
    return NextResponse.json({ error: "テーマを入力してください" }, { status: 400 });
  }

  try {
    const result = await generateCarouselIdeas({ topic, slideCount: slideCount || 10, style, target, tone, count });
    return NextResponse.json({
      ideas: Array.isArray(result.ideas) ? result.ideas : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `アイデア生成に失敗しました: ${message}` }, { status: 500 });
  }
}
