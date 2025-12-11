import { NextRequest } from 'next/server';

const DOUBAO_API_KEY = '5fd30a51-af34-41b5-a3e1-025be2224659';
const DOUBAO_BOT_URL = 'https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions';
const DOUBAO_BOT_ID = 'bot-20251211185244-nt66f';

async function callDoubaoBot(prompt: string): Promise<string> {
  const body = {
    model: DOUBAO_BOT_ID,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  const response = await fetch(DOUBAO_BOT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DOUBAO_API_KEY}`
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Doubao Bot API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  
  // OpenAI 兼容格式: choices[0].message.content
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content;
  }
  
  throw new Error('无法解析API响应');
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return Response.json({ success: false, error: '请提供有效的URL' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return Response.json({ success: false, error: 'URL格式不正确' }, { status: 400 });
    }

    const prompt = `请搜索并总结这篇公众号文章：${url}`;
    const content = await callDoubaoBot(prompt);

    if (!content || content.length < 50) {
      return Response.json({ success: false, error: '无法提取网页内容，请手动复制文章内容' }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      content: content,
      title: ''
    });
  } catch (error) {
    console.error('Fetch URL error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
