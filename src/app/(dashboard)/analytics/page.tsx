"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProjectSelector, useProjects } from "@/components/project-selector";
import {
  BarChart3,
  Plus,
  Sparkles,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

type Post = {
  id: string;
  title: string;
  platform: string;
  postedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number | null;
};

type Analysis = {
  summary: string;
  bestPost: string;
  insights: Array<{ label: string; description: string; actionable: string }>;
  recommendations: string[];
  nextSteps: string;
};

export default function AnalyticsPage() {
  const { projects, selectedProject, setSelectedProject } = useProjects();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  // 編集
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "", platform: "tiktok", postedAt: "",
    views: "", likes: "", comments: "", shares: "", saves: "", followers: "",
  });
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    platform: "tiktok",
    postedAt: "",
    measuredAt: "48h",
    views: "",
    likes: "",
    comments: "",
    shares: "",
    saves: "",
    followers: "",
  });

  useEffect(() => {
    if (!selectedProject) return;
    fetch(`/api/posts?projectId=${selectedProject}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []));
  }, [selectedProject]);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          views: Number(form.views) || 0,
          likes: Number(form.likes) || 0,
          comments: Number(form.comments) || 0,
          shares: Number(form.shares) || 0,
          saves: Number(form.saves) || 0,
          followers: Number(form.followers) || 0,
          notes: `計測タイミング: ${form.measuredAt}`,
          projectId: selectedProject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts((prev) => [data.post, ...prev]);
      setForm({
        title: "",
        platform: "tiktok",
        postedAt: "",
        measuredAt: "48h",
        views: "",
        likes: "",
        comments: "",
        shares: "",
        saves: "",
        followers: "",
      });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError("");
    setAnalysis(null);
    try {
      const res = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingId(post.id);
    setEditForm({
      title: post.title,
      platform: post.platform,
      postedAt: new Date(post.postedAt).toISOString().split("T")[0],
      views: String(post.views),
      likes: String(post.likes),
      comments: String(post.comments),
      shares: String(post.shares),
      saves: String(post.saves),
      followers: "0",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          platform: editForm.platform,
          postedAt: editForm.postedAt,
          views: Number(editForm.views) || 0,
          likes: Number(editForm.likes) || 0,
          comments: Number(editForm.comments) || 0,
          shares: Number(editForm.shares) || 0,
          saves: Number(editForm.saves) || 0,
          followers: Number(editForm.followers) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPosts((prev) => prev.map((p) => (p.id === editingId ? data.post : p)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この投稿データを削除しますか？")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  };

  const formatNumber = (n: number) =>
    n >= 10000 ? `${(n / 10000).toFixed(1)}万` : n.toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-blue-500" />
            数値分析
          </h1>
          <p className="text-gray-500 mt-1">
            投稿データを記録してAIが改善提案します
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" />
            投稿データ追加
          </Button>
          <Button onClick={handleAnalyze} disabled={analyzing || posts.length === 0}>
            {analyzing ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                AI分析を実行
              </>
            )}
          </Button>
        </div>
      </div>

      <ProjectSelector
        value={selectedProject}
        onChange={setSelectedProject}
        projects={projects}
      />

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">投稿データを追加</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-800">計測タイミングについて</p>
              <p className="text-xs text-blue-600 mt-1">
                数値を正しく比較するために、全ての投稿で同じタイミングのデータを入力してください。
                おすすめは<strong>投稿から48時間後</strong>の数値です。初速の比較がしやすく、アルゴリズムの評価にも近い指標になります。
              </p>
            </div>
            <form onSubmit={handleAddPost} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-3 space-y-2">
                <Label>投稿タイトル *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>プラットフォーム</Label>
                <Select
                  value={form.platform}
                  onValueChange={(v) => { if (v) setForm({ ...form, platform: v }); }}
                >
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
                <Label>投稿日 *</Label>
                <Input
                  type="date"
                  value={form.postedAt}
                  onChange={(e) => setForm({ ...form, postedAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>計測タイミング</Label>
                <Select
                  value={form.measuredAt}
                  onValueChange={(v) => { if (v) setForm({ ...form, measuredAt: v }); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">投稿から24時間後</SelectItem>
                    <SelectItem value="48h">投稿から48時間後（推奨）</SelectItem>
                    <SelectItem value="72h">投稿から72時間後</SelectItem>
                    <SelectItem value="7d">投稿から7日後</SelectItem>
                    <SelectItem value="30d">投稿から30日後</SelectItem>
                    <SelectItem value="latest">最新の数値</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>再生数</Label>
                <Input
                  type="number"
                  value={form.views}
                  onChange={(e) => setForm({ ...form, views: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>いいね数</Label>
                <Input
                  type="number"
                  value={form.likes}
                  onChange={(e) => setForm({ ...form, likes: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>コメント数</Label>
                <Input
                  type="number"
                  value={form.comments}
                  onChange={(e) => setForm({ ...form, comments: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>シェア数</Label>
                <Input
                  type="number"
                  value={form.shares}
                  onChange={(e) => setForm({ ...form, shares: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>保存数</Label>
                <Input
                  type="number"
                  value={form.saves}
                  onChange={(e) => setForm({ ...form, saves: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>フォロワー数</Label>
                <Input
                  type="number"
                  value={form.followers}
                  onChange={(e) => setForm({ ...form, followers: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 md:col-span-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "保存中..." : "保存"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats summary */}
      {posts.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "合計再生数", value: posts.reduce((s, p) => s + p.views, 0), icon: Eye, color: "text-blue-500" },
            { label: "合計いいね", value: posts.reduce((s, p) => s + p.likes, 0), icon: Heart, color: "text-red-500" },
            { label: "合計コメント", value: posts.reduce((s, p) => s + p.comments, 0), icon: MessageCircle, color: "text-green-500" },
            { label: "合計シェア", value: posts.reduce((s, p) => s + p.shares, 0), icon: Share2, color: "text-violet-500" },
            { label: "合計保存", value: posts.reduce((s, p) => s + p.saves, 0), icon: Bookmark, color: "text-yellow-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  {stat.label}
                </div>
                <p className="text-2xl font-bold mt-1">{formatNumber(stat.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Posts table */}
      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">投稿データ一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>タイトル</TableHead>
                  <TableHead>媒体</TableHead>
                  <TableHead>投稿日</TableHead>
                  <TableHead className="text-right">再生数</TableHead>
                  <TableHead className="text-right">いいね</TableHead>
                  <TableHead className="text-right">コメント</TableHead>
                  <TableHead className="text-right">ER%</TableHead>
                  <TableHead className="text-right w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{post.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(post.postedAt).toLocaleDateString("ja-JP")}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(post.views)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(post.likes)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(post.comments)}
                    </TableCell>
                    <TableCell className="text-right">
                      {post.engagementRate != null ? `${post.engagementRate.toFixed(2)}%` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(post)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 編集フォーム */}
      {editingId && (
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">投稿データを編集</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-2 md:col-span-3 space-y-2">
                <Label>投稿タイトル</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>プラットフォーム</Label>
                <Select value={editForm.platform} onValueChange={(v) => { if (v) setEditForm({ ...editForm, platform: v }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>投稿日</Label>
                <Input type="date" value={editForm.postedAt} onChange={(e) => setEditForm({ ...editForm, postedAt: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>再生数</Label>
                <Input type="number" value={editForm.views} onChange={(e) => setEditForm({ ...editForm, views: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>いいね数</Label>
                <Input type="number" value={editForm.likes} onChange={(e) => setEditForm({ ...editForm, likes: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>コメント数</Label>
                <Input type="number" value={editForm.comments} onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>シェア数</Label>
                <Input type="number" value={editForm.shares} onChange={(e) => setEditForm({ ...editForm, shares: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>保存数</Label>
                <Input type="number" value={editForm.saves} onChange={(e) => setEditForm({ ...editForm, saves: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>フォロワー数</Label>
                <Input type="number" value={editForm.followers} onChange={(e) => setEditForm({ ...editForm, followers: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-3 flex gap-2">
                <Button onClick={handleSaveEdit} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "保存中..." : "変更を保存"}
                </Button>
                <Button variant="outline" onClick={() => setEditingId(null)}>キャンセル</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            AI分析結果
          </h2>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">サマリー</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">{analysis.summary}</p>
              <Separator className="my-3" />
              <p className="text-sm">
                <span className="font-medium">ベスト投稿: </span>
                {analysis.bestPost}
              </p>
            </CardContent>
          </Card>

          {analysis.insights?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">インサイト</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.insights.map((insight, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{insight.label}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {insight.description}
                    </p>
                    <p className="text-sm text-violet-600 mt-1">
                      → {insight.actionable}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">改善提案</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.recommendations?.map((rec, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <Badge variant="outline" className="shrink-0">
                      {i + 1}
                    </Badge>
                    {rec}
                  </li>
                ))}
              </ul>
              <Separator className="my-3" />
              <div className="bg-violet-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-violet-700">
                  次にやるべきこと
                </p>
                <p className="text-sm text-violet-600 mt-1">
                  {analysis.nextSteps}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
