"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { FileText, Sparkles, Lightbulb } from "lucide-react";

type ScriptResult = {
  script: {
    id: string;
    title: string;
    hook: string;
    body: string;
    cta: string;
    fullScript: string;
  };
  tips: string;
};

export default function ScriptsPage() {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  const [reference, setReference] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!reference || !selectedProject) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          platform,
          topic,
          style,
          projectId: selectedProject,
        }),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-7 w-7 text-pink-500" />
          企画・台本作成
        </h1>
        <p className="text-gray-500 mt-1">
          バズ動画を参考に、AIが新しい企画と台本を作成します
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
                  <SelectItem value="instagram">Instagram Reels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>参考動画の情報 *</Label>
              <Textarea
                placeholder="バズった動画のURL、内容の説明、何がバズった要因か等を入力してください。&#10;&#10;例: 「料理系TikTokで100万再生。冒頭で完成品を見せてから工程を逆再生する構成。BGMはトレンドの曲を使用」"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>テーマ・ジャンル（任意）</Label>
              <Input
                placeholder="例: 美容、飲食、ファッション"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>スタイル（任意）</Label>
              <Input
                placeholder="例: 面白い系、情報系、感動系"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading || !reference || !selectedProject}
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
                  企画・台本を生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                {result.script.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  フック（冒頭）
                </Badge>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.script.hook}
                </p>
              </div>
              <Separator />
              <div>
                <Badge variant="outline" className="mb-2">
                  本編構成
                </Badge>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.script.body}
                </p>
              </div>
              <Separator />
              <div>
                <Badge variant="outline" className="mb-2">
                  CTA
                </Badge>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.script.cta}
                </p>
              </div>
              <Separator />
              <div>
                <Badge className="mb-2 bg-violet-100 text-violet-700">
                  完成台本
                </Badge>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {result.script.fullScript}
                  </p>
                </div>
              </div>
              {result.tips && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">成功のポイント</span>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {result.tips}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
