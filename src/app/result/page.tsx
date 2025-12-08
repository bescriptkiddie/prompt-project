'use client';

import { useState, useEffect } from 'react';
import { Download, Share2, RotateCcw, Home, Play, Pause } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GeneratedResult {
  type: 'image' | 'video';
  images?: string[];
  videoUrl?: string;
  originalImage: string;
  prompt: string;
  count?: number;
  taskId?: string;
}

export default function ResultPage() {
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // 从 sessionStorage 获取生成结果
    const savedResult = sessionStorage.getItem('generatedImages');
    if (savedResult) {
      const parsedResult = JSON.parse(savedResult);
      setResult(parsedResult);
      if (parsedResult.type === 'image' && parsedResult.images && parsedResult.images.length > 0) {
        setSelectedImage(parsedResult.images[0]);
      }
    } else {
      // 如果没有结果，跳转到创建页面
      router.push('/create');
    }
  }, [router]);

  const handleDownload = async (url: string, index?: number) => {
    try {
      const isVideo = result?.type === 'video';
      const filename = isVideo 
        ? `萌宠视频_${new Date().getTime()}.mp4`
        : `萌宠表情包_${(index || 0) + 1}.png`;
      
      // 使用服务端代理下载
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: url,
          filename
        })
      });

      if (!response.ok) {
        throw new Error('下载请求失败');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载失败，请重试');
    }
  };

  const handleShare = async (url: string) => {
    const isVideo = result?.type === 'video';
    const title = isVideo ? '我的萌宠视频' : '我的萌宠表情包';
    const text = `用AI生成的萌宠${isVideo ? '视频' : '表情包'}：${result?.prompt}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url
        });
      } catch (error) {
        console.error('分享失败:', error);
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(url).then(() => {
        alert(`${isVideo ? '视频' : '图片'}链接已复制到剪贴板`);
      });
    }
  };

  const handleCreateNew = () => {
    sessionStorage.removeItem('generatedImages');
    router.push('/create');
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">生成结果</h1>
          <p className="text-gray-600 mb-4">提示词: &quot;{result.prompt}&quot;</p>
          {result.type === 'image' && result.count && (
            <p className="text-sm text-gray-500">共生成 {result.count} 张图片</p>
          )}
          {result.type === 'video' && (
            <p className="text-sm text-gray-500">生成了一个5秒短视频</p>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 原图展示 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">原图</h2>
              <img 
                src={result.originalImage} 
                alt="原图" 
                className="w-full rounded-lg shadow-md"
              />
            </div>
          </div>

          {/* 生成结果展示 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                {result.type === 'video' ? '生成的视频' : '生成的图片'}
              </h2>
              
              {/* 主要显示区域 */}
              {result.type === 'video' && result.videoUrl ? (
                <div className="mb-6">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video 
                      src={result.videoUrl}
                      className="w-full max-h-96 object-contain"
                      controls
                      loop
                      muted
                      playsInline
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                    >
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                  <div className="flex justify-center space-x-4 mt-4">
                    <button
                      onClick={() => handleDownload(result.videoUrl!)}
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下载视频
                    </button>
                    <button
                      onClick={() => handleShare(result.videoUrl!)}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      分享
                    </button>
                  </div>
                </div>
              ) : selectedImage && result.type === 'image' ? (
                <div className="mb-6">
                  <img 
                    src={selectedImage} 
                    alt="选中的生成图片" 
                    className="w-full max-h-96 object-contain rounded-lg shadow-md bg-gray-50"
                  />
                  <div className="flex justify-center space-x-4 mt-4">
                    <button
                      onClick={() => handleDownload(selectedImage, result.images!.indexOf(selectedImage))}
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下载
                    </button>
                    <button
                      onClick={() => handleShare(selectedImage)}
                      className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      分享
                    </button>
                  </div>
                </div>
              ) : null}

              {/* 缩略图网格 - 只在图片模式下显示 */}
              {result.type === 'image' && result.images && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {result.images.map((imageUrl, index) => (
                    <div 
                      key={index}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === imageUrl 
                          ? 'border-purple-500 shadow-lg' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedImage(imageUrl)}
                    >
                      <img 
                        src={imageUrl} 
                        alt={`生成图片 ${index + 1}`} 
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={handleCreateNew}
            className="flex items-center px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-lg font-semibold"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            再次生成
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-lg font-semibold"
          >
            <Home className="mr-2 h-5 w-5" />
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}