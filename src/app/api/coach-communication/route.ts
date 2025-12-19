import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

function createClient(customApiKey?: string) {
  const apiKey = (customApiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  return new OpenAI({
    apiKey,
    baseURL: process.env.GEMINI_BASE_URL || 'https://api.qnaigc.com/v1',
    timeout: 120000
  });
}

const fallbackSystemPrompt = `你是一位资深“教练沟通训练”导师，目标是通过互动练习提升学员的沟通影响力与教练式提问能力。

授课方式（强约束）：
1) 先澄清：如果学员给的信息不足，用不超过 5 个问题补齐（对象/关系/冲突点/目标/限制）。
2) 给出一份迷你课程结构：\n- 目标（1-2条）\n- 关键原则（3-5条）\n- 可直接照读的对话模板（2-4轮对话）
3) 进入角色扮演：你扮演“对方”（客户/同事/伴侣等），并在每轮后给出：\n- 点评（具体到一句话）\n- 改写（给 2 个不同风格版本：温和型/坚定型）\n- 下一句建议（给学员下一句可以怎么说）

边界：不做医疗/心理诊断，不提供违法/危险建议。若涉及高风险（自伤他伤/暴力/严重骚扰/职场违法），只给边界提醒与建议寻求线下专业帮助。

输出要求：用中文，结构清晰，少空话，多可直接复制的句子。`;

let cachedCoachTrainerPrompt: string | null = null;

async function getSystemPromptFromFile(): Promise<string> {
  if (cachedCoachTrainerPrompt) return cachedCoachTrainerPrompt;
  const promptPath = path.join(process.cwd(), 'public', 'prompt', 'Coach Trainer.md');
  const content = (await readFile(promptPath, 'utf8')).trim();
  if (!content) return fallbackSystemPrompt;
  cachedCoachTrainerPrompt = content;
  return content;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages, stream = true, apiKey, model } = body || {};

    const client = createClient(apiKey);
    const chatModel = (typeof model === 'string' && model.trim()) || 'gemini-2.5-flash';

    const apiMessages = Array.isArray(messages)
      ? messages
          .filter((m: unknown) => m && typeof m === 'object')
          .map((m: Record<string, unknown>) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: typeof m.content === 'string' ? m.content : ''
          }))
      : [{ role: 'user', content: '' }];

    const systemPrompt = await getSystemPromptFromFile().catch(() => fallbackSystemPrompt);
    const finalMessages = [{ role: 'system', content: systemPrompt }, ...apiMessages];

    if (stream) {
      const streamResponse = await client.chat.completions.create({
        model: chatModel,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messages: finalMessages as any,
        stream: true,
        temperature: 0.5
      });

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          let isClosed = false;
          try {
            for await (const chunk of streamResponse) {
              if (isClosed) break;
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
            if (!isClosed) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              isClosed = true;
            }
          } catch (error) {
            console.error('Coach communication stream error:', error);
            if (!isClosed) {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
                controller.close();
              } catch {
                // ignore
              }
            }
          }
        }
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive'
        }
      });
    }

    const response = await client.chat.completions.create({
      model: chatModel,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: finalMessages as any,
      temperature: 0.5
    });

    const content = response.choices[0].message.content;
    return Response.json({ success: true, content });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch response';
    const isMissingKey = msg.includes('Missing GEMINI_API_KEY');
    return Response.json(
      { success: false, error: isMissingKey ? '未配置 Gemini API Key（GEMINI_API_KEY 或前端传 apiKey）' : '生成失败，请稍后重试' },
      { status: 500 }
    );
  }
}
