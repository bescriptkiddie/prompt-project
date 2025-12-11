import { NextRequest } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-88fb4fd5dad2619831741f5e6f14670bf9308134dd08ed41a1a79400a3de874e',
  baseURL: 'https://api.qnaigc.com/v1',
  timeout: 120000
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { messages } = body;
    const { prompt, images, stream = true } = body;

    // 如果提供了 prompt 和 images，构造 messages
    if (!messages && prompt) {
      const content: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [
        { type: 'text', text: prompt }
      ];

      if (images && Array.isArray(images)) {
        images.forEach((imageUrl: string) => {
          content.push({
            type: 'image_url',
            image_url: {
              url: imageUrl
            }
          });
        });
      }

      messages = [{ role: 'user', content }];
    }

    // 根据是否有图片选择模型：有图片用 gemini，纯文本对话用 claude
    const hasImages = images && Array.isArray(images) && images.length > 0;
    const model = hasImages ? 'gemini-2.5-flash' : 'claude-4.5-opus';

    // SSE 流式输出
    if (stream) {
      const streamResponse = await client.chat.completions.create({
        model,
        messages: messages || [{ role: 'user', content: 'Hello!' }],
        stream: true
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
            console.error('Stream error:', error);
            if (!isClosed) {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`));
                controller.close();
              } catch {
                // Controller already closed, ignore
              }
            }
          }
        }
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // 非流式输出（保持兼容）
    const response = await client.chat.completions.create({
      model,
      messages: messages || [{ role: 'user', content: 'Hello!' }]
    });

    const content = response.choices[0].message.content;
    return Response.json({ success: true, content });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return Response.json(
      { success: false, error: 'Failed to fetch response from OpenAI' },
      { status: 500 }
    );
  }
}
