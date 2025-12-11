import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择要上传的图片' },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (!file.type.includes('image/')) {
      return NextResponse.json(
        { success: false, error: '只支持图片文件' },
        { status: 400 }
      );
    }

    // 检查文件大小
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 10MB' },
        { status: 400 }
      );
    }

    // 将文件转换为 base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    );
  }
}