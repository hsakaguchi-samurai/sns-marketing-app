import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { generateIdeas } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { platform, topic, style, target, count } = await req.json();
  if (!topic || !platform) {
    return NextResponse.json({ error: "テーマとプラットフォームを入力してください" }, { status: 400 });
  }

  try {
    const result = await generateIdeas({ platform, topic, style, target, count });
    console.log("generateIdeas result keys:", Object.keys(result));
    console.log("ideas is array:", Array.isArray(result.ideas), "length:", result.ideas?.length);
    return NextResponse.json({
      trendAnalysis: result.trendAnalysis || "",
      ideas: Array.isArray(result.ideas) ? result.ideas : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Idea generation error:", message);
    return NextResponse.json({ error: `アイデア生成に失敗しました: ${message}` }, { status: 500 });
  }
}
