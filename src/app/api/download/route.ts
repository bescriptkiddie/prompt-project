import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  let imageUrl: string = '';
  let filename: string = '';
  
  try {
    const requestData = await request.json();
    imageUrl = requestData.imageUrl;
    filename = requestData.filename;

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少图片URL' },
        { status: 400 }
      );
    }

    // 通过服务端代理下载图片
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // 返回图片数据
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename || 'image.png'}"`,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('下载图片失败:', error);
    console.error('错误详情:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      imageUrl,
      filename
    });
    return NextResponse.json(
      { 
        error: '下载图片失败，请重试',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}