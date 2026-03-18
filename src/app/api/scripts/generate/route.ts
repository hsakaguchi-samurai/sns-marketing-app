import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

// このルートは /api/ideas/generate と /api/ideas/to-script に移行しました
export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "未認証" }, { status: 401 });

  return NextResponse.json(
    { error: "このエンドポイントは廃止されました。/api/ideas/generate を使用してください。" },
    { status: 410 }
  );
}
