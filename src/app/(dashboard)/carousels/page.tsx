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
  Images,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Palette,
  Hash,
  Bookmark,
  ArrowRight,
  Trash2,
} from "lucide-react";

type CarouselIdea = {
  title: string;
  concept: string;
  coverHook: string;
  contentOutline: string;
  expectedEffect: string;
};

type SavedCarouselIdea = CarouselIdea & {
  id: string;
  topic: string;
  slideCount: number;
  tone: string;
  style: string;
  target: string;
  savedAt: string;
};

type Slide = {
  slideNumber: number;
  heading: string;
  body: string;
  designNote: string;
};

type CarouselResult = {
  carousel: {
    id: string;
    title: string;
    slides: Slide[];
    caption: string;
    hashtags: string[];
  };
  designTips: string;
};

function loadSavedCarouselIdeas(): SavedCarouselIdea[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("savedCarouselIdeas") || "[]");
  } catch {
    return [];
  }
}

function saveSavedCarouselIdeas(ideas: SavedCarouselIdea[]) {
  localStorage.setItem("savedCarouselIdeas", JSON.stringify(ideas));
}

export default function CarouselsPage() {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  const [topic, setTopic] = useState("");
  const [slideCount, setSlideCount] = useState("10");
  const [style, setStyle] = useState("");
  const [target, setTarget] = useState("");
  const [tone, setTone] = useState("カジュアル");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<CarouselIdea[]>([]);
  const [error, setError] = useState("");

  const [savedIdeas, setSavedIdeas] = useState<SavedCarouselIdea[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "saved">("generate");

  const [generatingFrom, setGeneratingFrom] = useState<string | null>(null);
  const [result, setResult] = useState<CarouselResult | null>(null);
  const [designTips, setDesignTips] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    setSavedIdeas(loadSavedCarouselIdeas());
  }, []);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setError("");
    setIdeas([]);
    setResult(null);

    try {
      const res = await fetch("/api/carousels/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, slideCount: Number(slideCount), style, target, tone, count: 3 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIdea = (idea: CarouselIdea) => {
    const newSaved: SavedCarouselIdea = {
      ...idea,
      id: crypto.randomUUID(),
      topic,
      slideCount: Number(slideCount),
      tone,
      style,
      target,
      savedAt: new Date().toISOString(),
    };
    const updated = [newSaved, ...savedIdeas];
    setSavedIdeas(updated);
    saveSavedCarouselIdeas(updated);
  };

  const handleDeleteIdea = (id: string) => {
    const updated = savedIdeas.filter((i) => i.id !== id);
    setSavedIdeas(updated);
    saveSavedCarouselIdeas(updated);
  };

  const isSaved = (idea: CarouselIdea) =>
    savedIdeas.some((s) => s.title === idea.title && s.concept === idea.concept);

  const handleGenerateCarousel = async (idea: CarouselIdea | SavedCarouselIdea) => {
    if (!selectedProject) return;
    setGeneratingFrom(idea.title);
    setError("");
    setResult(null);
    setCurrentSlide(0);

    const ideaTopic = "topic" in idea ? idea.topic : topic;
    const ideaSlideCount = "slideCount" in idea ? idea.slideCount : Number(slideCount);
    const ideaTone = "tone" in idea ? idea.tone : tone;
    const ideaStyle = "style" in idea ? idea.style : style;
    const ideaTarget = "target" in idea ? idea.target : target;

    try {
      const res = await fetch("/api/carousels/from-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: ideaTopic,
          title: idea.title,
          concept: idea.concept,
          coverHook: idea.coverHook,
          contentOutline: idea.contentOutline,
          slideCount: ideaSlideCount,
          style: ideaStyle,
          target: ideaTarget,
          tone: ideaTone,
          projectId: selectedProject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setDesignTips(data.designTips);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setGeneratingFrom(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const slides = (result?.carousel.slides as Slide[]) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Images className="h-7 w-7 text-emerald-500" />
          カルーセル投稿作成
        </h1>
        <p className="text-gray-500 mt-1">
          AIが複数の企画を提案 → 比較して選択 → 完成版を生成
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">テーマを入力</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>プロジェクト</Label>
                  <ProjectSelector value={selectedProject} onChange={setSelectedProject} projects={projects} />
                </div>
                <div className="space-y-2">
                  <Label>スライド枚数</Label>
                  <Select value={slideCount} onValueChange={(v) => { if (v) setSlideCount(v); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[5, 7, 8, 10].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}枚</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>テーマ・内容 *</Label>
                <Textarea
                  placeholder="どんなカルーセルを作りたいですか？&#10;例: 朝のスキンケア5ステップ、初心者向け投資の始め方"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>トーン</Label>
                  <Select value={tone} onValueChange={(v) => { if (v) setTone(v); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="カジュアル">カジュアル</SelectItem>
                      <SelectItem value="プロフェッショナル">プロフェッショナル</SelectItem>
                      <SelectItem value="おしゃれ">おしゃれ</SelectItem>
                      <SelectItem value="ポップ">ポップ</SelectItem>
                      <SelectItem value="シンプル">シンプル</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>デザイン（任意）</Label>
                  <Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder="例: パステルカラー" />
                </div>
                <div className="space-y-2">
                  <Label>ターゲット（任意）</Label>
                  <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="例: 20代女性" />
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={loading || !topic} className="w-full">
                {loading ? (
                  <><Sparkles className="h-4 w-4 mr-2 animate-spin" />3つのアイデアを生成中...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />3つのアイデアを生成</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* アイデア比較 */}
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
                        <p className="text-xs text-gray-500 font-medium">表紙フック</p>
                        <p className="text-sm text-gray-700 font-bold italic">{idea.coverHook}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">内容概要</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{idea.contentOutline}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">期待効果</p>
                        <p className="text-sm text-gray-600">{idea.expectedEffect}</p>
                      </div>
                      <Separator />
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleSaveIdea(idea)} disabled={isSaved(idea)} className="flex-1">
                          <Bookmark className="h-4 w-4 mr-1" />
                          {isSaved(idea) ? "保存済み" : "保存"}
                        </Button>
                        <Button size="sm" onClick={() => handleGenerateCarousel(idea)} disabled={generatingFrom === idea.title || !selectedProject} className="flex-1">
                          {generatingFrom === idea.title ? <Sparkles className="h-4 w-4 mr-1 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-1" />}
                          作成
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

      {/* 保存済みアイデア */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          <div className="space-y-2 mb-4">
            <Label>プロジェクト（作成時に必要）</Label>
            <ProjectSelector value={selectedProject} onChange={setSelectedProject} projects={projects} />
          </div>
          {savedIdeas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">保存済みアイデアはまだありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedIdeas.map((idea) => (
                <Card key={idea.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs text-gray-400">{new Date(idea.savedAt).toLocaleDateString("ja-JP")} / {idea.slideCount}枚</span>
                        <CardTitle className="text-base">{idea.title}</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteIdea(idea.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-gray-400">テーマ: {idea.topic}</p>
                    <p className="text-sm text-gray-700">{idea.concept}</p>
                    <p className="text-sm font-bold italic text-gray-600">{idea.coverHook}</p>
                    <Separator />
                    <Button size="sm" onClick={() => handleGenerateCarousel(idea)} disabled={generatingFrom === idea.title || !selectedProject} className="w-full">
                      {generatingFrom === idea.title ? (
                        <><Sparkles className="h-4 w-4 mr-1 animate-spin" />カルーセル生成中...</>
                      ) : (
                        <><ArrowRight className="h-4 w-4 mr-1" />この企画でカルーセル作成</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 完成カルーセル */}
      {result && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Images className="h-5 w-5 text-emerald-500" />
            {result.carousel.title} - 完成版
          </h2>

          {/* スライドプレビュー */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">スライド {currentSlide + 1} / {slides.length}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {slides[currentSlide] && (
                <div className="space-y-4">
                  <div className="aspect-square max-w-sm mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 p-6 flex flex-col justify-center items-center text-center">
                    <p className="text-xs text-gray-400 mb-3">
                      {currentSlide === 0 ? "表紙" : currentSlide === slides.length - 1 ? "CTA" : `スライド ${currentSlide + 1}`}
                    </p>
                    <h3 className="text-lg font-bold text-gray-800 mb-3">{slides[currentSlide].heading}</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{slides[currentSlide].body}</p>
                  </div>
                  <div className="flex items-start gap-2 bg-amber-50 p-3 rounded-lg">
                    <Palette className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">{slides[currentSlide].designNote}</p>
                  </div>
                </div>
              )}
              <div className="flex justify-center gap-1.5 mt-4">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-colors ${i === currentSlide ? "bg-emerald-500" : "bg-gray-300"}`} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 全スライド一覧 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">全スライドテキスト</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(slides.map((s) => `【${s.slideNumber}枚目】\n${s.heading}\n${s.body}`).join("\n\n"), "all")}>
                  {copied === "all" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {slides.map((slide, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <Badge variant="outline" className="text-xs mb-1">
                    {i === 0 ? "表紙" : i === slides.length - 1 ? "CTA" : `${slide.slideNumber}枚目`}
                  </Badge>
                  <p className="text-sm font-medium">{slide.heading}</p>
                  <p className="text-xs text-gray-500 mt-1">{slide.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* キャプション */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">キャプション</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${result.carousel.caption}\n\n${result.carousel.hashtags.map((t) => `#${t}`).join(" ")}`, "caption")}>
                  {copied === "caption" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.carousel.caption}</p>
              <Separator />
              <div className="flex items-center gap-2 mb-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">ハッシュタグ</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.carousel.hashtags.map((tag, i) => (
                  <Badge key={i} variant="secondary">#{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* デザインTips */}
          {designTips && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5 text-amber-500" />
                  デザインのポイント
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{designTips}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
