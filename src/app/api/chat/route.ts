import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { messages } = body;

    const response = await openai.chat.completions.create({
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
