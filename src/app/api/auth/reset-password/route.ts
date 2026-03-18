import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: "メールアドレスと新しいパスワードを入力してください" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "パスワードは6文字以上にしてください" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "このメールアドレスは登録されていません" }, { status: 404 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Reset password error:", message);
    return NextResponse.json({ error: `パスワードの再設定に失敗しました: ${message}` }, { status: 500 });
  }
}
