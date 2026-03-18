"use client";

import { useState, useEffect } from "react";
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
import {
  FileText,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Bookmark,
  ArrowRight,
  Trash2,
} from "lucide-react";

type Idea = {
  title: string;
  concept: string;
  hookPreview: string;
  approach: string;
  expectedEffect: string;
};

type SavedIdea = Idea & {
  id: string;
  platform: string;
  topic: string;
  savedAt: string;
};

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

// ローカルストレージでアイデアを管理
function loadSavedIdeas(): SavedIdea[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("savedIdeas") || "[]");
  } catch {
    return [];
  }
}

function saveSavedIdeas(ideas: SavedIdea[]) {
  localStorage.setItem("savedIdeas", JSON.stringify(ideas));
}

export default function ScriptsPage() {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  const [platform, setPlatform] = useState("tiktok");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [trendAnalysis, setTrendAnalysis] = useState("");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [error, setError] = useState("");

  // 保存済みアイデア
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");

  // 台本生成
  const [generatingScript, setGeneratingScript] = useState<string | null>(null);
  const [scriptResult, setScriptResult] = useState<ScriptResult | null>(null);

  useEffect(() => {
    setSavedIdeas(loadSavedIdeas());
  }, []);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setError("");
    setIdeas([]);
    setTrendAnalysis("");
    setScriptResult(null);

    try {
      const res = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, topic, style, target, count: 3 }),
      });
      const data = await res.json();
      console.log("Ideas response:", JSON.stringify(data).slice(0, 500));
      if (!res.ok) throw new Error(data.error);
      setTrendAnalysis(data.trendAnalysis || "");
      const ideaList = Array.isArray(data.ideas) ? data.ideas : [];
      console.log("Ideas count:", ideaList.length);
      setIdeas(ideaList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIdea = (idea: Idea) => {
    const newSaved: SavedIdea = {
      ...idea,
      id: crypto.randomUUID(),
      platform,
      topic,
      savedAt: new Date().toISOString(),
    };
    const updated = [newSaved, ...savedIdeas];
    setSavedIdeas(updated);
    saveSavedIdeas(updated);
  };

  const handleDeleteIdea = (id: string) => {
    const updated = savedIdeas.filter((i) => i.id !== id);
    setSavedIdeas(updated);
    saveSavedIdeas(updated);
  };

  const isSaved = (idea: Idea) =>
    savedIdeas.some((s) => s.title === idea.title && s.concept === idea.concept);

  const handleGenerateScript = async (idea: SavedIdea | Idea, ideaTopic?: string) => {
    if (!selectedProject) {
      setError("プロジェクトを選択してください");
      return;
    }
    setGeneratingScript(idea.title);
    setError("");
    setScriptResult(null);

    try {
      const body = {
        platform: "platform" in idea ? idea.platform : platform,
        title: idea.title,
        concept: idea.concept,
        hookPreview: idea.hookPreview,
        approach: idea.approach,
        topic: ideaTopic || ("topic" in idea ? idea.topic : topic),
        style,
        target,
        projectId: selectedProject,
      };
      console.log("Requesting script from idea:", body);
      const res = await fetch("/api/ideas/to-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("Response:", res.status, data);
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setScriptResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "エラーが発生しました";
      setError(msg);
      console.error("台本化エラー:", msg);
    } finally {
      setGeneratingScript(null);
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
          AIが複数のアイデアを提案 → 比較して選択 → 台本化
        </p>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "generate" ? "default" : "outline"}
          onClick={() => setActiveTab("generate")}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          アイデア生成
        </Button>
        <Button
          variant={activeTab === "saved" ? "default" : "outline"}
          onClick={() => setActiveTab("saved")}
        >
          <Bookmark className="h-4 w-4 mr-2" />
          保存済み ({savedIdeas.length})
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      )}

      {activeTab === "generate" && (
        <div className="space-y-6">
          {/* 入力フォーム */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">テーマを入力</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              <div className="space-y-2">
                <Label>ジャンル・テーマ *</Label>
                <Textarea
                  placeholder="どんなジャンルの動画を作りたいですか？&#10;例: 簡単レシピ、コスメレビュー、筋トレ、カフェ巡り"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ターゲット層（任意）</Label>
                  <Input
                    placeholder="例: 20代女性"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>スタイル（任意）</Label>
                  <Input
                    placeholder="例: 面白い系、情報系"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                  />
                </div>
              </div>



              <Button onClick={handleGenerate} disabled={loading || !topic} className="w-full">
                {loading ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    3つのアイデアを生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    3つのアイデアを生成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* バズ傾向分析 */}
          {trendAnalysis && (
            <Card className="border-violet-200 bg-violet-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-violet-500" />
                  バズ傾向分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{trendAnalysis}</p>
              </CardContent>
            </Card>
          )}

          {/* アイデア比較カード */}
          {ideas.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3">アイデアを比較</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ideas.map((idea, i) => (
                  <Card key={i} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <Badge variant="outline" className="w-fit mb-1">案 {i + 1}</Badge>
                      <CardTitle className="text-base">{idea.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">コンセプト</p>
                        <p className="text-sm text-gray-700">{idea.concept}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">フックイメージ</p>
                        <p className="text-sm text-gray-700 italic">{idea.hookPreview}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">切り口</p>
                        <p className="text-sm text-gray-700">{idea.approach}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">期待効果</p>
                        <p className="text-sm text-gray-600">{idea.expectedEffect}</p>
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveIdea(idea)}
                          disabled={isSaved(idea)}
                          className="flex-1"
                        >
                          <Bookmark className="h-4 w-4 mr-1" />
                          {isSaved(idea) ? "保存済み" : "保存"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateScript(idea, topic)}
                          disabled={generatingScript === idea.title || !selectedProject}
                          className="flex-1"
                        >
                          {generatingScript === idea.title ? (
                            <Sparkles className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-1" />
                          )}
                          台本化
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 保存済みアイデア一覧 */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <div className="space-y-2 mb-4">
            <Label>プロジェクト（台本化時に必要）</Label>
            <ProjectSelector
              value={selectedProject}
              onChange={setSelectedProject}
              projects={projects}
            />
          </div>

          {savedIdeas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">保存済みアイデアはまだありません</p>
                <p className="text-sm text-gray-400 mt-1">
                  「アイデア生成」タブでアイデアを生成し、気に入ったものを保存してください
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedIdeas.map((idea) => (
                <Card key={idea.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{idea.platform}</Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(idea.savedAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        <CardTitle className="text-base">{idea.title}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIdea(idea.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-gray-400">テーマ: {idea.topic}</p>
                    <p className="text-sm text-gray-700">{idea.concept}</p>
                    <p className="text-sm text-gray-500 italic">{idea.hookPreview}</p>
                    <Separator />
                    <Button
                      size="sm"
                      onClick={() => handleGenerateScript(idea)}
                      disabled={generatingScript === idea.title || !selectedProject}
                      className="w-full"
                    >
                      {generatingScript === idea.title ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-1 animate-spin" />
                          台本生成中...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-1" />
                          この企画で台本を作成
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 生成された台本 */}
      {scriptResult && (
        <Card className="border-pink-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              {scriptResult.script.title} - 完成台本
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge className="mb-2 bg-pink-100 text-pink-700">完成台本</Badge>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {scriptResult.script.fullScript}
                </p>
              </div>
            </div>
            {scriptResult.tips && (
              <>
                <Separator />
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">成功のポイント</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{scriptResult.tips}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
