import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateScript } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { reference, platform, topic, style, projectId } = await req.json();
  if (!reference || !platform || !projectId) {
    return NextResponse.json({ error: "必須項目を入力してください" }, { status: 400 });
  }

  try {
    const result = await generateScript({ reference, platform, topic, style });

    const script = await prisma.script.create({
      data: {
        title: result.title,
        reference,
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
    console.error("Script generation error:", error);
    return NextResponse.json({ error: "台本生成に失敗しました" }, { status: 500 });
  }
}
