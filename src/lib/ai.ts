import Anthropic from "@anthropic-ai/sdk";

export async function generateAIContent(payload: {
  company_name: string;
  industry: string;
  goal: string;
  challenge: string;
}): Promise<{ situationSummary: string; nextSteps: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = `Here is the company intake information:

Company: ${payload.company_name}
Industry: ${payload.industry}
Goal: ${payload.goal}
Challenge: ${payload.challenge}

Write a discovery brief with exactly two sections using these XML tags:

<situation_summary>
Write 2-3 paragraphs synthesizing the company's context, what they're trying to achieve, and the core tension between their goal and challenge.
</situation_summary>

<next_steps>
Write a numbered list of 4-6 concrete, prioritized actions based on the goal and challenge. Each item should be actionable, not generic.
</next_steps>`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system:
      "You are a B2B strategy consultant writing a concise discovery brief. Be specific, professional, and avoid generic filler.",
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  const situationMatch = rawText.match(
    /<situation_summary>([\s\S]*?)<\/situation_summary>/
  );
  const nextStepsMatch = rawText.match(/<next_steps>([\s\S]*?)<\/next_steps>/);

  if (!situationMatch || !nextStepsMatch) {
    throw new Error(
      `Claude response missing expected XML tags. Raw response: ${rawText.slice(0, 200)}`
    );
  }

  return {
    situationSummary: situationMatch[1].trim(),
    nextSteps: nextStepsMatch[1].trim(),
  };
}
