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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FolderOpen, Plus, FileText, MessageSquare, BarChart3 } from "lucide-react";

type Project = {
  id: string;
  name: string;
  platform: string;
  createdAt: string;
  _count: { scripts: number; captions: number; posts: number };
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("tiktok");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects || []));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, platform }),
      });
      const data = await res.json();
      if (res.ok) {
        setProjects((prev) => [{ ...data.project, _count: { scripts: 0, captions: 0, posts: 0 } }, ...prev]);
        setName("");
        setPlatform("tiktok");
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const platformLabel = (p: string) => {
    switch (p) {
      case "tiktok": return "TikTok";
      case "instagram": return "Instagram";
      case "both": return "TikTok & Instagram";
      default: return p;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="h-7 w-7 text-green-500" />
            プロジェクト管理
          </h1>
          <p className="text-gray-500 mt-1">
            アカウントやキャンペーン別にコンテンツを管理
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Plus className="h-4 w-4 mr-2" />
            新規プロジェクト
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新規プロジェクト作成</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>プロジェクト名</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 〇〇ブランド TikTokアカウント"
                  required
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
                    <SelectItem value="both">両方</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "作成中..." : "作成"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              まだプロジェクトがありません。新規プロジェクトを作成してください。
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant="secondary">{platformLabel(project.platform)}</Badge>
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(project.createdAt).toLocaleDateString("ja-JP")}作成
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    台本 {project._count.scripts}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    キャプション {project._count.captions}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    投稿 {project._count.posts}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
