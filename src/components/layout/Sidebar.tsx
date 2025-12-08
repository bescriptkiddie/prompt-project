'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Play, Image as ImageIcon, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  selectedPrompt: string;
}

export default function Sidebar({ selectedPrompt }: SidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const [model, setModel] = useState('Doubao');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync prop to local state
  useEffect(() => {
    if (selectedPrompt) {
      setPrompt(selectedPrompt);
      // Focus logic could go here but might be annoying if auto-triggered
      setResultImage(null); // Reset result on new prompt selection
    }
  }, [selectedPrompt]);

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (data.success) {
        setUploadedImage(data.url);
      } else {
        console.error('Upload failed:', data.error);
        alert('上传失败: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传出错，请重试');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    setResultImage(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          image: uploadedImage, // Include uploaded image URL
        }),
      });

      const data = await response.json();

      if (data.success && data.imageUrl) {
        setResultImage(data.imageUrl);
      } else {
        console.error('Generation failed:', data.error);
        // You might want to show an error toast here
      }
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* Fullscreen Modal */}
      {isFullscreen && resultImage && (
        <div
          className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={resultImage}
            alt="Full Preview"
            className="max-w-full max-h-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-8 right-8 text-white/70 hover:text-white transition-colors"
            onClick={() => setIsFullscreen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}

      <aside className="w-[600px] h-full bg-paper border-l border-stone-line flex flex-col z-50 shadow-xl relative transition-all duration-300 shrink-0">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-stone-line/0 via-stone-line/50 to-stone-line/0"></div>

        <div className="p-8 pb-4 shrink-0">
          <h2 className="font-serif text-2xl text-navy italic font-bold">创作工坊</h2>
          <p className="text-xs text-navy-light mt-1 font-sans">实验与调优</p>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-8 overflow-y-auto flex-shrink-0">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-terra rounded-full"></span>
                  提示词输入 (Prompt)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-32 bg-cream border border-stone-line p-4 text-navy font-mono text-sm leading-7 resize-none focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all shadow-inner placeholder:text-navy-light/50"
                  placeholder="从左侧选择一个案例开始创作..."
                ></textarea>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-mustard rounded-full"></span>
                  参考图 (可选)
                </label>

                {!uploadedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                      "w-full h-24 border-2 border-dashed border-stone-line bg-cream rounded-sm flex flex-col items-center justify-center cursor-pointer hover:border-terra hover:bg-white transition-all group",
                      isUploading && "opacity-50 pointer-events-none"
                    )}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg"
                      onChange={handleFileUpload}
                    />
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-terra animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-navy-light group-hover:text-terra mb-2 transition-colors" />
                        <span className="text-xs text-navy-light group-hover:text-navy font-medium">点击上传图片</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-24 bg-cream border border-stone-line p-2 group">
                    <img
                      src={uploadedImage}
                      alt="Reference"
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white text-navy hover:text-red-500 rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
                    模型选择
                  </label>
                  <div className="relative">
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full appearance-none bg-cream border-b border-stone-line py-2 text-sm text-navy focus:outline-none focus:border-terra rounded-none font-medium pr-8"
                    >
                      <option value="Doubao">Doubao</option>
                      <option value="Gemini">Gemini</option>
                    </select>
                    <div className="absolute right-0 top-3 pointer-events-none">
                      <ChevronDown className="w-3 h-3 text-navy-light" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
                    画面比例
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAspectRatio('16:9')}
                      className={clsx(
                        "flex-1 py-1.5 border border-stone-line text-xs transition-colors font-medium",
                        aspectRatio === '16:9' ? "bg-terra text-white border-terra" : "hover:bg-terra hover:text-white hover:border-terra"
                      )}
                    >
                      16:9 (横屏)
                    </button>
                    <button
                      onClick={() => setAspectRatio('1:1')}
                      className={clsx(
                        "flex-1 py-1.5 border border-stone-line text-xs transition-colors font-medium",
                        aspectRatio === '1:1' ? "bg-terra text-white border-terra" : "hover:bg-terra hover:text-white hover:border-terra"
                      )}
                    >
                      1:1 (方图)
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="w-full bg-terra hover:bg-terra-dark disabled:opacity-70 disabled:cursor-not-allowed text-white font-serif font-bold text-lg py-3 transition-colors flex items-center justify-center gap-3"
              >
                <span>{isGenerating ? '生成中...' : '开始生成图像'}</span>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 bg-cream border-t border-stone-line p-8 relative flex flex-col justify-center items-center min-h-0 m-8 mt-6 border border-stone-line/50 shadow-inner group">
            {!isGenerating && !resultImage && (
              <div className="text-center opacity-40">
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-navy stroke-1" />
                <p className="font-serif italic text-navy">生成结果将在此处显现</p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-cream flex flex-col items-center justify-center z-20">
                <div className="w-12 h-12 border-2 border-terra border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-serif text-terra text-sm font-medium">
                  正在处理创意逻辑...
                </p>
              </div>
            )}

            {resultImage && !isGenerating && (
              <>
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={resultImage}
                    alt="Generated Result"
                    className="max-w-full max-h-full object-contain shadow-lg border-4 border-white bg-white animate-in fade-in duration-500 cursor-zoom-in"
                    onClick={() => setIsFullscreen(true)}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                     <span className="bg-navy/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">点击全屏预览</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
