'use client';

import { useState } from 'react';
import { Upload, Wand2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const HEALING_PROMPT = "保持原图片的真实摄影风格作为背景，不要重绘整个画面。仅在鸭子上使用简单的白色线条进行勾勒，添加可爱的涂鸡风格的眼睛、嘴巴，使某拟人化。他悠闲地说:晒会太阳吧。气泡内的文字必须使用中文。整体效果应为:实景照片+趣味线条涂鸦。";

export default function HealingPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [maxImages, setMaxImages] = useState<number>(2);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const router = useRouter();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // 自动上传文件
      await handleUpload(file);
    }
  };

  const handleUpload = async (file?: File) => {
    const fileToUpload = file || selectedFile;
    if (!fileToUpload) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', fileToUpload);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadedImageUrl(result.url);
        // alert('图片上传成功！'); // Optional: notify user
      } else {
        alert('上传失败: ' + result.error);
      }
    } catch (error) {
      console.error('上传错误:', error);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImageUrl) {
      alert('请先上传图片');
      return;
    }

    setIsGenerating(true);
    try {
      // 图片生成逻辑
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: HEALING_PROMPT,
          image: uploadedImageUrl,
          maxImages: maxImages,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // 将结果存储到 sessionStorage 并跳转到结果页面
        sessionStorage.setItem('generatedImages', JSON.stringify({
          type: 'image',
          images: result.images,
          originalImage: previewUrl,
          prompt: HEALING_PROMPT,
          count: result.count
        }));
        router.push('/result');
      } else {
        alert('生成失败: ' + result.error);
      }
    } catch (error) {
      console.error('生成错误:', error);
      alert('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">治愈派萌宠生成</h1>
          <p className="text-gray-600">上传萌宠照片，一键生成治愈系线条涂鸦风格！</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 图片上传区域 */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Upload className="mr-2" />
              上传图片
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="max-w-full max-h-64 mx-auto rounded-lg"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">文件名: {selectedFile?.name}</p>
                    <p className="text-sm text-gray-600">大小: {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
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

            {uploadedImageUrl && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg">
                ✅ 图片上传成功！可以开始生成了
              </div>
            )}
          </div>

          {/* 参数设置区域 */}
          <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Wand2 className="mr-2" />
                生成设置
              </h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-800 mb-2">✨ 治愈派风格</h3>
                <p className="text-sm text-yellow-700">
                  我们将保留原图片的真实摄影风格，仅使用简单的白色线条勾勒，
                  添加可爱的涂鸦眼睛和嘴巴，并配上治愈的文字气泡。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生成数量
                </label>
                <select
                  value={maxImages}
                  onChange={(e) => setMaxImages(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={1}>1张</option>
                  <option value={2}>2张</option>
                  <option value={3}>3张</option>
                  <option value={4}>4张</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!uploadedImageUrl || isGenerating}
              className="w-full mt-8 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  正在生成治愈美图...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-5 w-5" />
                  开始生成
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
