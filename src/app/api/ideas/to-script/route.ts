import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateScriptFromIdea } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { platform, title, concept, hookPreview, approach, topic, style, target, projectId } = await req.json();
  if (!title || !concept || !platform || !projectId) {
    return NextResponse.json({ error: "必須項目が不足しています" }, { status: 400 });
  }

  try {
    const result = await generateScriptFromIdea({
      platform, title, concept, hookPreview, approach, topic, style, target,
    });

    const script = await prisma.script.create({
      data: {
        title,
        reference: `コンセプト: ${concept}\n切り口: ${approach}`,
        hook: result.hook,
        body: result.body,
        cta: result.cta,
        fullScript: result.fullScript,
        platform,
        userId,
        projectId,
      },
    });

    return NextResponse.json({ script, tips: result.tips });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Script from idea error:", message);
    return NextResponse.json({ error: `台本生成に失敗しました: ${message}` }, { status: 500 });
  }
}
