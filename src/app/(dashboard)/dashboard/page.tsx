"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageSquare, BarChart3, FolderOpen } from "lucide-react";
import Link from "next/link";

type UserInfo = { name: string; email: string };

const features = [
  {
    href: "/scripts",
    icon: FileText,
    title: "企画・台本作成",
    description: "バズ動画を参考にAIが企画・台本を自動生成",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
  {
    href: "/captions",
    icon: MessageSquare,
    title: "キャプション・ハッシュタグ",
    description: "最適なキャプションとハッシュタグをAIが提案",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    href: "/analytics",
    icon: BarChart3,
    title: "数値分析",
    description: "投稿データを入力してAIが改善提案",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    href: "/projects",
    icon: FolderOpen,
    title: "プロジェクト管理",
    description: "チームで企画や分析結果を整理・共有",
    color: "text-green-500",
    bg: "bg-green-50",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setUser(d.user))
      .catch(() => router.push("/login"));
  }, [router]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          こんにちは、{user.name}さん
        </h1>
        <p className="text-gray-500 mt-1">
          SNSマーケティングをAIでもっと効率的に
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f) => (
          <Link key={f.href} href={f.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`p-3 rounded-lg ${f.bg}`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{f.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
