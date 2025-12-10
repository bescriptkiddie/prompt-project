import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'sk-88fb4fd5dad2619831741f5e6f14670bf9308134dd08ed41a1a79400a3de874e',
  baseURL: 'https://api.qnaigc.com/v1',
  timeout: 60000
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let { messages } = body;
    const { prompt, images } = body;

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

    const response = await client.chat.completions.create({
      model: 'gemini-3.0-pro-image-preview',
      messages: messages || [
        { role: 'user', content: 'Hello!' }
      ]
    });

    const content = response.choices[0].message.content;
    console.log('OpenAI Response:', content);

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch response from OpenAI' },
      { status: 500 }
    );
  }
}
