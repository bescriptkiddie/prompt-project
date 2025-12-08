import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt } = await request.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: '缺少必要参数：图片URL和提示词' },
        { status: 400 }
      );
    }

    const arkApiKey = process.env.ARK_API_KEY;
    const arkApiUrl = process.env.ARK_API_URL;
    const arkVideoModel = process.env.ARK_VIDEO_MODEL;

    if (!arkApiKey || !arkApiUrl || !arkVideoModel) {
      return NextResponse.json(
        { error: '服务器配置错误：缺少API密钥或配置' },
        { status: 500 }
      );
    }

    // 构建请求体，按照火山引擎官方API格式
    const requestBody = {
      model: arkVideoModel,
      content: [
        {
          type: 'text',
          text: `${prompt} --ratio adaptive --dur 5`
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          },
          role: 'first_frame'  // 指定为首帧图片
        }
      ]
    };

    console.log('发送视频生成请求:', {
      url: arkApiUrl,
      model: arkVideoModel,
      prompt: prompt,
      imageUrl: imageUrl
    });

    // 调用即梦API
    const response = await fetch(arkApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${arkApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    const responseData = await response.json();
    console.log('即梦API响应:', responseData);

    if (!response.ok) {
      console.error('即梦API错误:', responseData);
      return NextResponse.json(
        { 
          error: '视频生成失败', 
          details: responseData.error || responseData.message || '未知错误'
        },
        { status: response.status }
      );
    }

    // 检查响应格式 - 即梦API可能返回不同格式
    let taskId = null;
    
    // 尝试不同的响应格式
    if (responseData.data && responseData.data.task_id) {
      taskId = responseData.data.task_id;
    } else if (responseData.id) {
      taskId = responseData.id;
    } else if (responseData.task_id) {
      taskId = responseData.task_id;
    }
    
    if (!taskId) {
      console.error('API响应格式错误，无法获取任务ID:', responseData);
      return NextResponse.json(
        { error: '视频生成服务响应格式错误，无法获取任务ID' },
        { status: 500 }
      );
    }

    console.log('获取到任务ID:', taskId);

    // 返回任务ID，前端需要轮询获取结果
    return NextResponse.json({
      success: true,
      taskId: taskId,
      message: '视频生成任务已提交，请等待处理完成'
    });

  } catch (error) {
    console.error('视频生成API错误:', error);
    return NextResponse.json(
      { 
        error: '服务器内部错误', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}