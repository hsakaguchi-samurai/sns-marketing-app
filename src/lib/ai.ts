import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateScript(params: {
  reference: string;
  platform: string;
  topic?: string;
  style?: string;
}) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `あなたはSNSマーケティングの専門家です。以下のバズ動画の情報を分析し、新しい動画の企画と台本を作成してください。

【プラットフォーム】${params.platform === "tiktok" ? "TikTok" : "Instagram Reels"}
【参考動画の情報】
${params.reference}
${params.topic ? `【テーマ・ジャンル】${params.topic}` : ""}
${params.style ? `【スタイル】${params.style}` : ""}

以下のJSON形式で回答してください:
{
  "title": "企画タイトル",
  "hook": "冒頭のフック（最初の1-3秒で視聴者を引きつけるセリフ/演出）",
  "body": "本編の構成（ステップバイステップで記述）",
  "cta": "CTA（視聴者にしてほしいアクション）",
  "fullScript": "完成台本（セリフ形式で記述。タイムスタンプ付き）",
  "tips": "この企画を成功させるためのポイント3つ"
}

JSONのみを出力してください。`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AIからの応答を解析できませんでした");
  return JSON.parse(jsonMatch[0]);
}

export async function generateCaption(params: {
  content: string;
  platform: string;
  tone?: string;
}) {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `あなたはSNSマーケティングの専門家です。以下の動画内容に最適なキャプションとハッシュタグを作成してください。

【プラットフォーム】${params.platform === "tiktok" ? "TikTok" : "Instagram"}
【動画の内容】
${params.content}
${params.tone ? `【トーン】${params.tone}` : "カジュアルで親しみやすい"}

以下のJSON形式で回答してください:
{
  "caption": "投稿キャプション（改行や絵文字を効果的に使用）",
  "hashtags": ["ハッシュタグ1", "ハッシュタグ2", ...],
  "hashtagStrategy": "ハッシュタグ選定の理由と戦略の説明",
  "alternativeCaptions": ["別案1", "別案2"]
}

JSONのみを出力してください。`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AIからの応答を解析できませんでした");
  return JSON.parse(jsonMatch[0]);
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
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `あなたはSNSマーケティングのデータアナリストです。以下の投稿データを分析し、わかりやすい日本語で改善提案をしてください。マーケティング未経験者にもわかるように説明してください。

【投稿データ】
${JSON.stringify(params.posts, null, 2)}

以下のJSON形式で回答してください:
{
  "summary": "全体的な分析サマリー（3-4文）",
  "bestPost": "最もパフォーマンスが良い投稿とその理由",
  "insights": [
    {"label": "インサイト名", "description": "説明", "actionable": "具体的なアクション"}
  ],
  "recommendations": [
    "改善提案1",
    "改善提案2",
    "改善提案3"
  ],
  "nextSteps": "次にやるべきこと"
}

JSONのみを出力してください。`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AIからの応答を解析できませんでした");
  return JSON.parse(jsonMatch[0]);
}
