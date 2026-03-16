"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProjectSelector, useProjects } from "@/components/project-selector";
import { MessageSquare, Sparkles, Hash, Copy, Check } from "lucide-react";

type CaptionResult = {
  caption: { id: string; content: string; hashtags: string[] };
  hashtagStrategy: string;
  alternativeCaptions: string[];
};

export default function CaptionsPage() {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [tone, setTone] = useState("カジュアル");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CaptionResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!content || !selectedProject) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/captions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, platform, tone, projectId: selectedProject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-violet-500" />
          キャプション・ハッシュタグ生成
        </h1>
        <p className="text-gray-500 mt-1">
          動画内容に最適なキャプションとハッシュタグをAIが提案します
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">入力情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>プロジェクト</Label>
              <ProjectSelector
                value={selectedProject}
                onChange={setSelectedProject}
                projects={projects}
              />
            </div>

            <div className="space-y-2">
              <Label>プラットフォーム</Label>
              <Select value={platform} onValueChange={(v) => { if (v) setPlatform(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>動画の内容 *</Label>
              <Textarea
                placeholder="投稿する動画の内容を説明してください。&#10;&#10;例: 「3ステップで作れる簡単パスタレシピ。材料3つだけ。忙しい人向け。」"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>トーン</Label>
              <Select value={tone} onValueChange={(v) => { if (v) setTone(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="カジュアル">カジュアル</SelectItem>
                  <SelectItem value="ビジネス">ビジネス</SelectItem>
                  <SelectItem value="おもしろ">おもしろ</SelectItem>
                  <SelectItem value="エモーショナル">エモーショナル</SelectItem>
                  <SelectItem value="情報提供">情報提供</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading || !content || !selectedProject}
              className="w-full"
            >
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  AIが生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  キャプション・タグを生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">メインキャプション</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(result.caption.content, "main")}
                  >
                    {copied === "main" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.caption.content}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    ハッシュタグ
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        result.caption.hashtags.map((t) => `#${t}`).join(" "),
                        "tags"
                      )
                    }
                  >
                    {copied === "tags" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.caption.hashtags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                {result.hashtagStrategy && (
                  <>
                    <Separator className="my-3" />
                    <p className="text-xs text-gray-500">
                      {result.hashtagStrategy}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {result.alternativeCaptions?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">別案</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.alternativeCaptions.map((alt, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-lg"
                    >
                      <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">
                        {alt}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(alt, `alt-${i}`)}
                      >
                        {copied === `alt-${i}` ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
