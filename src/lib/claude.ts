// Claude API client — direct fetch, no SDK needed

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  usage: { input_tokens: number; output_tokens: number };
}

export async function askClaude(
  systemPrompt: string,
  messages: ClaudeMessage[],
  maxTokens: number = 1500
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set in .env.local");
  }

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API error: ${res.status} ${body.slice(0, 300)}`);
  }

  const data: ClaudeResponse = await res.json();
  return data.content[0]?.text || "";
}
