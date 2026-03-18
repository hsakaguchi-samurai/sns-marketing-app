import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { analyzeReferenceVideo } from "@/lib/ai";

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  const { videoId } = await req.json();
  if (!videoId) {
    return NextResponse.json({ error: "動画IDが必要です" }, { status: 400 });
  }

  const video = await prisma.referenceVideo.findFirst({
    where: { id: videoId, userId },
  });

  if (!video) {
    return NextResponse.json({ error: "動画が見つかりません" }, { status: 404 });
  }

  if (!video.transcript) {
    return NextResponse.json({ error: "文字起こしを先に入力してください" }, { status: 400 });
  }

  try {
    const result = await analyzeReferenceVideo({
      transcript: video.transcript,
      platform: video.platform,
      url: video.url,
      title: video.title,
    });

    const analysisText = [
      `【構成分析】\n${result.structure}`,
      `\n【フック分析】\n${result.hookAnalysis}`,
      `\n【バズ要因】\n${result.buzzFactors.map((f: string, i: number) => `${i + 1}. ${f}`).join("\n")}`,
      `\n【テクニック】\n${result.techniques.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}`,
      `\n【自社に活かせる要素】\n${result.reusableElements.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n")}`,
      `\n【まとめ】\n${result.summary}`,
    ].join("\n");

    const updated = await prisma.referenceVideo.update({
      where: { id: videoId },
      data: {
        analysis: analysisText,
        tags: result.suggestedTags,
      },
    });

    return NextResponse.json({ video: updated, result });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "分析に失敗しました" }, { status: 500 });
  }
}
