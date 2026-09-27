import { getAnthropicApiKey } from "@/lib/env";

const CLAUDE_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5";

type ClaudeResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

export function parseKcal(text: string) {
  const match = text.trim().match(/\d{1,5}/);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  if (!Number.isInteger(value) || value < 1 || value > 9999) {
    return null;
  }
  return value;
}

export function matchCategory(response: string, names: string[]) {
  const cleaned = response
    .trim()
    .replace(/^["「『]|["」』]$/g, "")
    .trim();
  return (
    names.find((name) => name === cleaned) ??
    names.find((name) => cleaned.includes(name)) ??
    null
  );
}

async function askClaude(prompt: string, maxTokens: number) {
  const response = await fetch(CLAUDE_MESSAGES_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": getAnthropicApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
    cache: "no-store",
  });

  const text = await response.text();
  let payload: ClaudeResponse = {};
  try {
    payload = JSON.parse(text) as ClaudeResponse;
  } catch {
    throw new Error(`Claude API failed (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Claude API failed (${response.status})`);
  }

  return (payload.content ?? [])
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("");
}

export async function estimateDishKcal(dishName: string) {
  const text = await askClaude(
    `一般的な日本の料理${dishName}の標準的なカロリーをkcalで1つの数値だけ返してください`,
    32,
  );
  const kcal = parseKcal(text);
  if (kcal === null) {
    throw new Error("カロリーの数値を読み取れませんでした。もう一度記録してください。");
  }
  return kcal;
}

export async function classifyDishCategory(dishName: string, categoryNames: string[]) {
  if (categoryNames.length === 0) {
    return null;
  }

  const text = await askClaude(
    `次の料理を、指定したカテゴリー名のいずれか1つだけに分類してください。カテゴリー名以外は返さないでください。\nカテゴリー: ${categoryNames.join("、")}\n料理: ${dishName}`,
    32,
  );
  return matchCategory(text, categoryNames);
}
