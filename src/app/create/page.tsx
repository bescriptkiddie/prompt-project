'use client';

import { useState } from 'react';
import { Upload, Wand2, Loader2, Image, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GenerationType } from '@/types';

export default function CreatePage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [maxImages, setMaxImages] = useState<number>(3);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [generationType, setGenerationType] = useState<GenerationType>('image');
  const [videoTaskId, setVideoTaskId] = useState<string>('');
  const router = useRouter();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);

      const newPreviewUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);

      // 自动上传文件
      await handleUpload(newFiles);
    }
  };

  const handleUpload = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          return result.url;
        } else {
          throw new Error(result.error || '上传失败');
        }
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImageUrls(prev => [...prev, ...urls]);
      // alert('图片上传成功！');
    } catch (error) {
      console.error('上传错误:', error);
      alert('部分图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (uploadedImageUrls.length === 0 || !prompt.trim()) {
      alert('请先上传图片并输入提示词');
      return;
    }

    setIsGenerating(true);
    try {
      if (generationType === 'image') {
        // 图片生成逻辑
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            images: uploadedImageUrls, // Send array of images
            maxImages: maxImages,
          }),
        });

        const result = await response.json();
        if (result.success) {
          // 将结果存储到 sessionStorage 并跳转到结果页面
          sessionStorage.setItem('generatedImages', JSON.stringify({
            type: 'image',
            images: result.images,
            originalImage: previewUrls[0], // Keep for backward compatibility
            originalImages: previewUrls, // Save all original images
            prompt: prompt,
            count: result.count
          }));
          router.push('/result');
        } else {
          alert('生成失败: ' + result.error);
        }
      } else {
        // 视频生成逻辑
        const response = await fetch('/api/generate-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: uploadedImageUrls[0], // Use first image for video
            prompt: prompt.trim(),
          }),
        });

        const result = await response.json();
        if (result.success && result.taskId) {
          setVideoTaskId(result.taskId);
          // 开始轮询任务状态
          pollVideoStatus(result.taskId);
        } else {
          alert('视频生成失败: ' + result.error);
          setIsGenerating(false);
        }
      }
    } catch (error) {
      console.error('生成错误:', error);
      alert('生成失败，请重试');
      setIsGenerating(false);
    }
  };

  const pollVideoStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/video-status?taskId=${taskId}`);
      const result = await response.json();

      if (result.status === 'succeeded' && result.videoUrl) {
        // 视频生成完成
        sessionStorage.setItem('generatedImages', JSON.stringify({
          type: 'video',
          videoUrl: result.videoUrl,
          originalImage: previewUrls[0],
          prompt: prompt,
          taskId: taskId
        }));
        setIsGenerating(false);
        router.push('/result');
      } else if (result.status === 'failed') {
        alert('视频生成失败: ' + (result.error || '未知错误'));
        setIsGenerating(false);
      } else {
        // 继续轮询
        setTimeout(() => pollVideoStatus(taskId), 3000);
      }
    } catch (error) {
      console.error('查询视频状态错误:', error);
      setTimeout(() => pollVideoStatus(taskId), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-3 md:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-4">萌宠图片处理</h1>
          <p className="text-sm md:text-base text-gray-600">上传你的萌宠图片，输入创意提示词，生成独特的萌宠表情包！</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* 图片上传区域 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 flex items-center">
              <Upload className="mr-2 w-5 h-5 md:w-6 md:h-6" />
              上传图片
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {previewUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`预览 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-32 cursor-pointer hover:bg-gray-50" onClick={() => document.getElementById('file-input')?.click()}>
                    <span className="text-gray-500 text-sm">+ 添加图片</span>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">点击选择图片或拖拽到此处</p>
                  <p className="text-sm text-gray-400 mt-2">支持 JPG、PNG 格式，最大 10MB</p>
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
                multiple
              />
              <label
                htmlFor="file-input"
                className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors"
              >
                选择图片
              </label>
            </div>

            {isUploading && (
              <div className="w-full mt-4 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                正在上传...
              </div>
            )}

            {uploadedImageUrls.length > 0 && uploadedImageUrls.length === previewUrls.length && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
                ✅ 所有图片上传成功！可以开始生成了
              </div>
            )}
          </div>

          {/* 参数设置区域 */}
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 flex items-center">
              <Wand2 className="mr-2 w-5 h-5 md:w-6 md:h-6" />
              生成设置
            </h2>

            <div className="space-y-4">
              {/* 生成类型选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  生成类型
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setGenerationType('image')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      generationType === 'image'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Image className="h-5 w-5" />
                      <span className="font-medium">生成图片</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">生成多张萌宠表情包</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationType('video')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      generationType === 'video'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Video className="h-5 w-5" />
                      <span className="font-medium">生成视频</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">生成5秒短视频</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  提示词 *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想要的效果，例如：可爱的卡通风格，大眼睛，彩虹背景..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">建议不超过300个汉字，描述越具体效果越好</p>
              </div>

              {/* 只在图片生成模式下显示数量选择 */}
              {generationType === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生成数量
                  </label>
                  <select
                    value={maxImages}
                    onChange={(e) => setMaxImages(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={1}>1张</option>
                    <option value={2}>2张</option>
                    <option value={3}>3张</option>
                    <option value={4}>4张</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={uploadedImageUrls.length === 0 || !prompt.trim() || isGenerating}
                className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    {generationType === 'video' ? '生成视频中...' : '生成图片中...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    {generationType === 'video' ? '开始生成视频' : '开始生成图片'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
