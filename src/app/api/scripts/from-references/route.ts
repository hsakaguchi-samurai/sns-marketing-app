import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateScriptFromReferences } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { videoIds, platform, topic, style, target, projectId } = await req.json();
  if (!videoIds?.length || !platform || !topic || !projectId) {
    return NextResponse.json({ error: "参考動画、テーマ、プラットフォームは必須です" }, { status: 400 });
  }

  const videos = await prisma.referenceVideo.findMany({
    where: { id: { in: videoIds }, userId },
  });

  const analyzed = videos.filter((v) => v.transcript && v.analysis);
  if (analyzed.length === 0) {
    return NextResponse.json({ error: "分析済みの参考動画を選択してください" }, { status: 400 });
  }

  try {
    const result = await generateScriptFromReferences({
      references: analyzed.map((v) => ({
        title: v.title,
        transcript: v.transcript!,
        analysis: v.analysis!,
      })),
      platform,
      topic,
      style,
      target,
    });

    const script = await prisma.script.create({
      data: {
        title: result.title,
        reference: result.inspiredBy,
        hook: result.hook,
        body: result.body,
        cta: result.cta,
        fullScript: result.fullScript,
        platform,
        userId,
        projectId,
      },
    });

    return NextResponse.json({ script, tips: result.tips, inspiredBy: result.inspiredBy });
  } catch (error) {
    console.error("Script from references error:", error);
    return NextResponse.json({ error: "台本生成に失敗しました" }, { status: 500 });
  }
}
