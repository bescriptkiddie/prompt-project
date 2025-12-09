import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { prompt, image, model, apiKey } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '请输入提示词' },
        { status: 400 }
      );
    }

    // Determine model ID based on selection
    let modelId = 'gemini-3.0-pro-image-preview'; // Default
    if (model === 'Doubao') {
      modelId = 'doubao-vision-pro';
    } else if (model === 'Gemini') {
      modelId = 'gemini-3.0-pro-image-preview';
    }

    console.log('Sending request to OpenAI compatible API:', {
      model: modelId,
      prompt: prompt.substring(0, 50) + '...'
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt }
        ]
      }
    ];

    // Add image if provided
    if (image) {
      messages[0].content.push({ type: 'image_url', image_url: { url: image } });
    }

    // Use OpenAI client with selected model
    let client = openai;
    if (apiKey) {
      console.log('Using custom API key');
      client = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.qnaigc.com/v1',
        timeout: 600000
      });
    }

    const response = await client.chat.completions.create({
      model: modelId,
      top_p: 0,
      messages: messages
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = response.choices[0].message as any;
    console.log('OpenAI API Response Content:', message);

    let imageUrl = '';

    // Check if images array exists in the message (non-standard OpenAI response)
    if (message.images && Array.isArray(message.images) && message.images.length > 0) {
      // Handle the structure seen in logs: images: [ { type: 'image_url', image_url: { url: '...' }, index: 0 } ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstImage = message.images[0] as any;
      if (firstImage.image_url && firstImage.image_url.url) {
        imageUrl = firstImage.image_url.url;
      } else if (firstImage.url) {
        imageUrl = firstImage.url;
      }
    } else if (message.content) {
        // Fallback: sometimes image URL is in content or it's a text response describing the image?
        // For now, assume if no images array, it might be in content if it's a URL
        if (message.content.startsWith('http')) {
            imageUrl = message.content;
        }
    }

    if (!imageUrl) {
        return NextResponse.json(
            { success: false, error: 'Failed to generate image from response' },
            { status: 500 }
        );
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      images: [imageUrl],
      count: 1
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch response from OpenAI' },
      { status: 500 }
    );
  }
}
