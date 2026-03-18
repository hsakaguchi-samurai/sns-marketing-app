import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// tool_useで構造化出力を取得する共通関数
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callWithTool(prompt: string, toolName: string, schema: Record<string, unknown>, maxTokens = 4096, model = "claude-sonnet-4-6"): Promise<any> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    tool_choice: { type: "tool", name: toolName },
    tools: [
      {
        name: toolName,
        description: "結果を構造化データで出力",
        input_schema: schema as Anthropic.Tool["input_schema"],
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const toolBlock = message.content.find((b) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("AIからの構造化応答を取得できませんでした");
  }
  return toolBlock.input;
}

// 複数アイデア生成（比較用）
export async function generateIdeas(params: {
  platform: string;
  topic: string;
  style?: string;
  target?: string;
  count?: number;
}) {
  const count = params.count || 3;
  const platformName = params.platform === "tiktok" ? "TikTok" : "Instagram Reels";
  const prompt = `あなたは${platformName}のバズ動画に精通したSNSマーケティング専門家です。

【テーマ】${params.topic}
${params.style ? `【スタイル】${params.style}` : ""}${params.target ? `【ターゲット】${params.target}` : ""}

このジャンルのバズ傾向を具体的に分析した上で、${count}つの異なる切り口の動画企画を提案してください。
アイデアの各項目は1-2文で簡潔にしてください。`;

  return callWithTool(prompt, "output_ideas", {
    type: "object" as const,
    properties: {
      trendAnalysis: { type: "string", description: "このジャンルのバズ傾向分析（構成パターン、人気フック、トレンド演出を3-4つ具体的に）" },
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "企画タイトル（短く）" },
            concept: { type: "string", description: "概要1文" },
            hookPreview: { type: "string", description: "冒頭フック1文" },
            approach: { type: "string", description: "切り口1文" },
            expectedEffect: { type: "string", description: "期待効果1文" },
          },
          required: ["title", "concept", "hookPreview", "approach", "expectedEffect"],
        },
      },
    },
    required: ["trendAnalysis", "ideas"],
  }, 2500);
}

// 保存済みアイデアから完成台本を生成
export async function generateScriptFromIdea(params: {
  platform: string;
  title: string;
  concept: string;
  hookPreview: string;
  approach: string;
  topic: string;
  style?: string;
  target?: string;
}) {
  const prompt = `あなたは${params.platform === "tiktok" ? "TikTok" : "Instagram Reels"}のバズ動画に精通したSNSマーケティングの専門家です。

以下の企画アイデアを元に、完成台本を作成してください。

【プラットフォーム】${params.platform === "tiktok" ? "TikTok" : "Instagram Reels"}
【テーマ】${params.topic}
【企画タイトル】${params.title}
【コンセプト】${params.concept}
【フックイメージ】${params.hookPreview}
【切り口】${params.approach}
${params.style ? `【スタイル】${params.style}` : ""}
${params.target ? `【ターゲット層】${params.target}` : ""}`;

  return callWithTool(prompt, "output_script", {
    type: "object" as const,
    properties: {
      hook: { type: "string", description: "冒頭のフック（最初の1-3秒で視聴者を引きつけるセリフ/演出）" },
      body: { type: "string", description: "本編の構成（ステップバイステップで記述）" },
      cta: { type: "string", description: "CTA（視聴者にしてほしいアクション）" },
      fullScript: { type: "string", description: "完成台本（セリフ形式で記述。タイムスタンプ付き）" },
      tips: { type: "string", description: "この企画を成功させるためのポイント3つ" },
    },
    required: ["hook", "body", "cta", "fullScript", "tips"],
  });
}

export async function analyzeReferenceVideo(params: {
  transcript: string;
  platform: string;
  url: string;
  title: string;
}) {
  const prompt = `あなたはSNSマーケティングの専門家です。以下の動画の文字起こしを分析し、バズった要因や自社コンテンツに活かせるポイントを詳しく分析してください。

【プラットフォーム】${params.platform === "tiktok" ? "TikTok" : "Instagram"}
【動画タイトル/メモ】${params.title}
【動画URL】${params.url}
【文字起こし】
${params.transcript}`;

  return callWithTool(prompt, "output_analysis", {
    type: "object" as const,
    properties: {
      structure: { type: "string", description: "動画の構成分析" },
      hookAnalysis: { type: "string", description: "冒頭のフック手法の分析" },
      buzzFactors: { type: "array", items: { type: "string" }, description: "バズ要因" },
      techniques: { type: "array", items: { type: "string" }, description: "使われているテクニック" },
      reusableElements: { type: "array", items: { type: "string" }, description: "自社に取り入れられる要素" },
      suggestedTags: { type: "array", items: { type: "string" }, description: "ジャンルタグ" },
      summary: { type: "string", description: "全体のまとめ" },
    },
    required: ["structure", "hookAnalysis", "buzzFactors", "techniques", "reusableElements", "suggestedTags", "summary"],
  });
}

export async function generateScriptFromReferences(params: {
  references: Array<{ title: string; transcript: string; analysis: string }>;
  platform: string;
  topic: string;
  style?: string;
  target?: string;
}) {
  const refSummary = params.references
    .map((r, i) => `【参考動画${i + 1}: ${r.title}】\n文字起こし: ${r.transcript}\n分析: ${r.analysis}`)
    .join("\n\n");

  const prompt = `あなたは${params.platform === "tiktok" ? "TikTok" : "Instagram Reels"}のバズ動画に精通したSNSマーケティングの専門家です。

以下の参考動画の文字起こしと分析を踏まえて、それらの良い部分を取り入れた新しい動画の企画と台本を作成してください。

${refSummary}

【プラットフォーム】${params.platform === "tiktok" ? "TikTok" : "Instagram Reels"}
【テーマ】${params.topic}
${params.style ? `【スタイル】${params.style}` : ""}
${params.target ? `【ターゲット層】${params.target}` : ""}`;

  return callWithTool(prompt, "output_script", {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      inspiredBy: { type: "string", description: "どの参考動画のどの要素を取り入れたか" },
      hook: { type: "string" },
      body: { type: "string" },
      cta: { type: "string" },
      fullScript: { type: "string" },
      tips: { type: "string" },
    },
    required: ["title", "inspiredBy", "hook", "body", "cta", "fullScript", "tips"],
  });
}

// カルーセル複数アイデア生成
export async function generateCarouselIdeas(params: {
  topic: string;
  slideCount: number;
  style?: string;
  target?: string;
  tone?: string;
  count?: number;
}) {
  const count = params.count || 3;
  const prompt = `Instagramカルーセル(${params.slideCount}枚)の企画を${count}つ短く提案。テーマ:${params.topic}${params.tone ? ` トーン:${params.tone}` : ""}${params.style ? ` スタイル:${params.style}` : ""}${params.target ? ` ターゲット:${params.target}` : ""} 各項目1-2文で簡潔に。`;

  return callWithTool(prompt, "output_carousel_ideas", {
    type: "object" as const,
    properties: {
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string", description: "タイトル（短く）" },
            concept: { type: "string", description: "概要1文" },
            coverHook: { type: "string", description: "表紙フック1文" },
            contentOutline: { type: "string", description: "内容概要を短く" },
            expectedEffect: { type: "string", description: "期待効果1文" },
          },
          required: ["title", "concept", "coverHook", "contentOutline", "expectedEffect"],
        },
      },
    },
    required: ["ideas"],
  }, 1500, "claude-haiku-4-5-20251001");
}

// カルーセル詳細生成（選ばれたアイデアから完成版を生成）
export async function generateCarouselFromIdea(params: {
  topic: string;
  title: string;
  concept: string;
  coverHook: string;
  contentOutline: string;
  slideCount: number;
  style?: string;
  target?: string;
  tone?: string;
}) {
  const prompt = `あなたはInstagramカルーセル投稿のプロデザイナー兼コピーライターです。

以下の企画アイデアを元に、完成版のカルーセル投稿を作成してください。

【テーマ】${params.topic}
【企画タイトル】${params.title}
【コンセプト】${params.concept}
【表紙フック】${params.coverHook}
【内容概要】${params.contentOutline}
【スライド枚数】${params.slideCount}枚
${params.style ? `【デザインスタイル】${params.style}` : ""}
${params.target ? `【ターゲット層】${params.target}` : ""}
${params.tone ? `【トーン】${params.tone}` : ""}

カルーセルの構成ルール:
- 1枚目（表紙）: スワイプしたくなるフック。短く強い見出し
- 2枚目〜${params.slideCount - 1}枚目: 本編コンテンツ。1スライド1メッセージ
- ${params.slideCount}枚目: CTA（保存・フォロー・シェアを促す）`;

  return callWithTool(prompt, "output_carousel", {
    type: "object" as const,
    properties: {
      slides: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slideNumber: { type: "number" },
            heading: { type: "string" },
            body: { type: "string" },
            designNote: { type: "string" },
          },
          required: ["slideNumber", "heading", "body", "designNote"],
        },
      },
      caption: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
      designTips: { type: "string" },
    },
    required: ["slides", "caption", "hashtags", "designTips"],
  });
}

export async function generateCarousel(params: {
  topic: string;
  slideCount: number;
  style?: string;
  target?: string;
  tone?: string;
}) {
  const prompt = `あなたはInstagramカルーセル投稿のプロデザイナー兼コピーライターです。

以下のテーマで、バズるInstagramカルーセル投稿（${params.slideCount}枚）の構成を作成してください。
各スライドのテキスト内容、デザインの指示、色使いのアドバイスを含めてください。

【テーマ】${params.topic}
【スライド枚数】${params.slideCount}枚
${params.style ? `【デザインスタイル】${params.style}` : ""}
${params.target ? `【ターゲット層】${params.target}` : ""}
${params.tone ? `【トーン】${params.tone}` : ""}

カルーセルの構成ルール:
- 1枚目（表紙）: スワイプしたくなるフック。短く強い見出し
- 2枚目〜${params.slideCount - 1}枚目: 本編コンテンツ。1スライド1メッセージ
- ${params.slideCount}枚目: CTA（保存・フォロー・シェアを促す）`;

  return callWithTool(prompt, "output_carousel", {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      concept: { type: "string" },
      slides: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slideNumber: { type: "number" },
            heading: { type: "string" },
            body: { type: "string" },
            designNote: { type: "string" },
          },
          required: ["slideNumber", "heading", "body", "designNote"],
        },
      },
      caption: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
      designTips: { type: "string" },
    },
    required: ["title", "concept", "slides", "caption", "hashtags", "designTips"],
  });
}

export async function generateCaption(params: {
  content: string;
  platform: string;
  tone?: string;
}) {
  const prompt = `あなたはSNSマーケティングの専門家です。以下の動画内容に最適なキャプションとハッシュタグを作成してください。

【プラットフォーム】${params.platform === "tiktok" ? "TikTok" : "Instagram"}
【動画の内容】
${params.content}
${params.tone ? `【トーン】${params.tone}` : "カジュアルで親しみやすい"}`;

  return callWithTool(prompt, "output_caption", {
    type: "object" as const,
    properties: {
      caption: { type: "string" },
      hashtags: { type: "array", items: { type: "string" } },
      hashtagStrategy: { type: "string" },
      alternativeCaptions: { type: "array", items: { type: "string" } },
    },
    required: ["caption", "hashtags", "hashtagStrategy", "alternativeCaptions"],
  });
}

export async function analyzeMetrics(params: {
  posts: Array<{
    title: string;
    platform: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    postedAt: string;
  }>;
}) {
  const prompt = `あなたはSNSマーケティングのデータアナリストです。以下の投稿データを分析し、わかりやすい日本語で改善提案をしてください。マーケティング未経験者にもわかるように説明してください。

【投稿データ】
${JSON.stringify(params.posts, null, 2)}`;

  return callWithTool(prompt, "output_analytics", {
    type: "object" as const,
    properties: {
      summary: { type: "string" },
      bestPost: { type: "string" },
      insights: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            description: { type: "string" },
            actionable: { type: "string" },
          },
          required: ["label", "description", "actionable"],
        },
      },
      recommendations: { type: "array", items: { type: "string" } },
      nextSteps: { type: "string" },
    },
    required: ["summary", "bestPost", "insights", "recommendations", "nextSteps"],
  });
}
