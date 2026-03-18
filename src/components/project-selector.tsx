"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Project = {
  id: string;
  name: string;
  platform: string;
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.projects || []);
        if (data.projects?.length > 0 && !selectedProject) {
          setSelectedProject(data.projects[0].id);
        }
      });
  }, [selectedProject]);

  return { projects, selectedProject, setSelectedProject, setProjects };
}

export function ProjectSelector({
  value,
  onChange,
  projects,
}: {
  value: string;
  onChange: (v: string) => void;
  projects: Project[];
}) {
  if (projects.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        まずプロジェクトを作成してください →{" "}
        <a href="/projects" className="text-violet-600 underline">
          プロジェクト管理
        </a>
      </p>
    );
  }

  const selected = projects.find((p) => p.id === value);

  return (
    <Select value={value} onValueChange={(v) => { if (v) onChange(v); }}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="プロジェクトを選択">
          {selected ? `${selected.name} (${selected.platform})` : "プロジェクトを選択"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name} ({p.platform})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
