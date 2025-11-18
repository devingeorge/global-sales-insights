import OpenAI from 'openai';
import { AccountRecord } from '../data/mockCustomerData';

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const client = apiKey ? new OpenAI({ apiKey }) : null;

interface LLMBriefContext {
  account: AccountRecord;
  templateId: string;
  personaUserId?: string;
}

export async function generateLLMBrief(context: LLMBriefContext): Promise<string> {
  if (!client) {
    return buildFallbackNarrative(context.account);
  }

  const prompt = buildPrompt(context);
  try {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const output: any = response as any;
    const text =
      output.output_text ||
      output.output?.map((chunk: any) => chunk.content?.map((item: any) => item.text?.value || '').join('')).join('');
    return (text && String(text).trim()) || buildFallbackNarrative(context.account);
  } catch (error) {
    console.warn('[llm] Falling back to scripted content:', error);
    return buildFallbackNarrative(context.account);
  }
}

function buildPrompt({ account, personaUserId }: LLMBriefContext) {
  return `You are a Salesforce Global Sales Insights assistant. Draft a concise executive meeting brief in markdown with headings for: Customer Snapshot, Carrier Relationship, Metrics Pulse, Goals & Risks, Opportunities & Asks. Reference the following details: ${JSON.stringify(
    account
  )}. Tailor the tone for the persona ${personaUserId ? `<@${personaUserId}>` : 'Sales Leader'} and include clear bullet points.`;
}

function buildFallbackNarrative(account: AccountRecord): string {
  return `## Customer Snapshot\n${account.summary}\n\n## Carrier Relationship\n${account.carrierRelationship}\n\n## Metrics Pulse\n- Pipe Coverage: ${account.metrics.pipeCoverage}\n- ACV YoY: ${account.metrics.acvYoY}\n- Adoption: ${account.metrics.productAdoption}`;
}
