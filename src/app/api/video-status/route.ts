import { NextRequest, NextResponse } from 'next/server';

interface VideoStatusResult {
  taskId: string;
  status: string;
  message: string;
  videoUrl?: string;
  success?: boolean;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: '缺少任务ID参数' },
        { status: 400 }
      );
    }

    const arkApiKey = process.env.ARK_API_KEY;
    const arkApiUrl = process.env.ARK_API_URL;

    if (!arkApiKey || !arkApiUrl) {
      return NextResponse.json(
        { error: '服务器配置错误：缺少API密钥或配置' },
        { status: 500 }
      );
    }

    // 查询任务状态的URL
    const statusUrl = `${arkApiUrl}/${taskId}`;

    console.log('查询视频生成状态:', {
      taskId,
      statusUrl
    });

    // 调用即梦API查询状态
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${arkApiKey}`
      }
    });

    const responseData = await response.json();
    console.log('任务状态响应:', responseData);

    if (!response.ok) {
      console.error('查询状态API错误:', responseData);
      return NextResponse.json(
        {
          error: '查询视频生成状态失败',
          details: responseData.error || responseData.message || '未知错误'
        },
        { status: response.status }
      );
    }

    // 根据火山引擎官方API文档处理响应格式
    // 响应格式: { id, model, status, content: { video_url }, ... }
    if (!responseData.status) {
      console.error('状态API响应格式错误，无法获取任务状态:', responseData);
      return NextResponse.json(
        { error: '状态查询服务响应格式错误，无法获取任务状态' },
        { status: 500 }
      );
    }

    const status = responseData.status;
    console.log('任务状态:', status);

    // 返回任务状态信息
    const result: VideoStatusResult = {
      taskId,
      status,
      message: getStatusMessage(status)
    };

    // 如果任务成功完成，返回视频URL
    if (status === 'succeeded' && responseData.content && responseData.content.video_url) {
      result.videoUrl = responseData.content.video_url;
      result.success = true;
    } else if (status === 'failed') {
      result.error = responseData.error || '视频生成失败';
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('查询视频状态API错误:', error);
    return NextResponse.json(
      {
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return '任务排队中...';
    case 'running':
      return '视频生成中...';
    case 'succeeded':
      return '视频生成完成';
    case 'failed':
      return '视频生成失败';
    default:
      return '未知状态';
  }
}
