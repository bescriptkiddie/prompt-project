import { NextRequest, NextResponse } from 'next/server';
import { handleGeneration } from '@/lib/generation';

export async function POST(request: NextRequest) {
  try {
    const { prompt, image, images, model, apiKey } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: '请输入提示词' },
        { status: 400 }
      );
    }

    // Normalize images to an array
    const imageList = images || (image ? [image] : undefined);

    const modelType = model === 'Doubao' ? 'Doubao' : 'Gemini';
    const imageUrl = await handleGeneration(prompt, imageList, modelType, apiKey);

    return NextResponse.json({
      success: true,
      imageUrl,
      images: [imageUrl],
      count: 1
    });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
