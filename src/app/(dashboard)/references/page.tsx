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
  Video,
  Plus,
  Sparkles,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
} from "lucide-react";

type ReferenceVideo = {
  id: string;
  url: string;
  title: string;
  platform: string;
  transcript: string | null;
  analysis: string | null;
  tags: string[];
  createdAt: string;
};

type ScriptResult = {
  script: { id: string; title: string; hook: string; body: string; cta: string; fullScript: string };
  tips: string;
  inspiredBy: string;
};

export default function ReferencesPage() {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  const [videos, setVideos] = useState<ReferenceVideo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // 動画追加フォーム
  const [form, setForm] = useState({
    url: "",
    title: "",
    platform: "tiktok",
    transcript: "",
  });

  // 台本生成用
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [generatingScript, setGeneratingScript] = useState(false);
  const [scriptTopic, setScriptTopic] = useState("");
  const [scriptStyle, setScriptStyle] = useState("");
  const [scriptTarget, setScriptTarget] = useState("");
  const [scriptResult, setScriptResult] = useState<ScriptResult | null>(null);
  const [showScriptForm, setShowScriptForm] = useState(false);

  useEffect(() => {
    if (!selectedProject) return;
    fetch(`/api/references?projectId=${selectedProject}`)
      .then((r) => r.json())
      .then((d) => setVideos(d.videos || []));
  }, [selectedProject]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, projectId: selectedProject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideos((prev) => [data.video, ...prev]);
      setForm({ url: "", title: "", platform: "tiktok", transcript: "" });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (videoId: string) => {
    setAnalyzingId(videoId);
    setError("");
    try {
      const res = await fetch("/api/references/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVideos((prev) => prev.map((v) => (v.id === videoId ? data.video : v)));
      setExpandedId(videoId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setAnalyzingId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateScript = async () => {
    if (!scriptTopic || selectedVideos.size === 0) return;
    setGeneratingScript(true);
    setError("");
    setScriptResult(null);
    try {
      const res = await fetch("/api/scripts/from-references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoIds: Array.from(selectedVideos),
          platform: videos.find((v) => selectedVideos.has(v.id))?.platform || "tiktok",
          topic: scriptTopic,
          style: scriptStyle,
          target: scriptTarget,
          projectId: selectedProject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScriptResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setGeneratingScript(false);
    }
  };

  const analyzedSelected = videos.filter(
    (v) => selectedVideos.has(v.id) && v.analysis
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="h-7 w-7 text-orange-500" />
            参考動画ライブラリ
          </h1>
          <p className="text-gray-500 mt-1">
            他社のバズ動画を保存・文字起こし・AI分析して自社企画に活用
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          動画を追加
        </Button>
      </div>

      <ProjectSelector
        value={selectedProject}
        onChange={setSelectedProject}
        projects={projects}
      />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      )}

      {/* 動画追加フォーム */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">参考動画を追加</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>動画URL *</Label>
                  <Input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://www.tiktok.com/@user/video/..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>タイトル・メモ *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="例: 100万再生の料理動画"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>プラットフォーム</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => { if (v) setForm({ ...form, platform: v }); }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>文字起こし</Label>
                <Textarea
                  value={form.transcript}
                  onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                  placeholder="動画のセリフ・ナレーションをここに貼り付けてください。&#10;&#10;TikTokの場合: 動画のキャプションや字幕をコピー&#10;手動の場合: 動画を見ながら書き起こし"
                  rows={6}
                />
                <p className="text-xs text-gray-400">
                  ※ 後から追加・編集もできます。文字起こしがあるとAI分析が可能になります。
                </p>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "保存中..." : "保存"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 参考動画から台本生成 */}
      {selectedVideos.size > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                選択した動画から台本生成（{analyzedSelected.length}/{selectedVideos.size}本が分析済み）
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScriptForm(!showScriptForm)}
              >
                {showScriptForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {showScriptForm && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>テーマ *</Label>
                <Input
                  value={scriptTopic}
                  onChange={(e) => setScriptTopic(e.target.value)}
                  placeholder="例: 簡単パスタレシピ"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ターゲット（任意）</Label>
                  <Input
                    value={scriptTarget}
                    onChange={(e) => setScriptTarget(e.target.value)}
                    placeholder="例: 20代女性"
                  />
                </div>
                <div className="space-y-2">
                  <Label>スタイル（任意）</Label>
                  <Input
                    value={scriptStyle}
                    onChange={(e) => setScriptStyle(e.target.value)}
                    placeholder="例: 面白い系"
                  />
                </div>
              </div>
              <Button
                onClick={handleGenerateScript}
                disabled={generatingScript || analyzedSelected.length === 0 || !scriptTopic}
                className="w-full"
              >
                {generatingScript ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    参考動画を踏まえて台本生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    参考動画を踏まえて台本生成
                  </>
                )}
              </Button>
              {analyzedSelected.length === 0 && selectedVideos.size > 0 && (
                <p className="text-xs text-orange-600">
                  ※ 選択した動画を先にAI分析してください
                </p>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* 台本生成結果 */}
      {scriptResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-500" />
              {scriptResult.script.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-orange-700">参考にした要素</p>
              <p className="text-sm text-orange-600 mt-1">{scriptResult.inspiredBy}</p>
            </div>
            <Separator />
            <div>
              <Badge variant="outline" className="mb-2">フック（冒頭）</Badge>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{scriptResult.script.hook}</p>
            </div>
            <Separator />
            <div>
              <Badge variant="outline" className="mb-2">本編構成</Badge>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{scriptResult.script.body}</p>
            </div>
            <Separator />
            <div>
              <Badge variant="outline" className="mb-2">CTA</Badge>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{scriptResult.script.cta}</p>
            </div>
            <Separator />
            <div>
              <Badge className="mb-2 bg-pink-100 text-pink-700">完成台本</Badge>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{scriptResult.script.fullScript}</p>
              </div>
            </div>
            {scriptResult.tips && (
              <>
                <Separator />
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{scriptResult.tips}</p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* 動画一覧 */}
      {videos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              まだ参考動画がありません。「動画を追加」から保存してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <Card key={video.id} className={selectedVideos.has(video.id) ? "ring-2 ring-orange-300" : ""}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleSelect(video.id)}
                    className="mt-1 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {selectedVideos.has(video.id) ? (
                      <CheckSquare className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{video.title}</CardTitle>
                      <Badge variant="secondary">{video.platform}</Badge>
                      {video.analysis && <Badge className="bg-green-100 text-green-700">分析済み</Badge>}
                      {video.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                    >
                      {video.url.length > 60 ? video.url.slice(0, 60) + "..." : video.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === video.id ? null : video.id)}
                    >
                      {expandedId === video.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    {video.transcript && !video.analysis && (
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(video.id)}
                        disabled={analyzingId === video.id}
                      >
                        {analyzingId === video.id ? (
                          <>
                            <Sparkles className="h-4 w-4 mr-1 animate-spin" />
                            分析中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-1" />
                            AI分析
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedId === video.id && (
                <CardContent className="space-y-4">
                  {video.transcript && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">文字起こし</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{video.transcript}</p>
                      </div>
                    </div>
                  )}
                  {!video.transcript && (
                    <p className="text-sm text-gray-400">文字起こしがまだありません</p>
                  )}
                  {video.analysis && (
                    <div>
                      <Separator className="my-2" />
                      <p className="text-sm font-medium text-violet-600 mb-1">AI分析結果</p>
                      <div className="bg-violet-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{video.analysis}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
