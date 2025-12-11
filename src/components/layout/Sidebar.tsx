'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Play, Image as ImageIcon, Loader2, X, Key, Settings, Save } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  selectedPrompt: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface Option {
  label: string;
  value: string;
}

function CustomSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    };

    // Update position on scroll/resize to keep attached or close
    const handleScrollOrResize = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full bg-cream border p-3 text-sm font-medium flex justify-between items-center transition-all duration-200 outline-none",
          isOpen
            ? "border-terra ring-1 ring-terra text-navy"
            : "border-stone-line hover:border-terra text-navy"
        )}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown
          className={clsx(
            "w-4 h-4 text-navy-light transition-transform duration-200",
            isOpen && "rotate-180 text-terra"
          )}
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-paper border border-stone-line shadow-xl z-[9999] animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-auto rounded-sm"
          style={{
            top: coords.top,
            left: coords.left,
            width: coords.width,
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={clsx(
                "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between group",
                value === option.value
                  ? "bg-mustard/10 text-navy font-bold"
                  : "text-navy hover:bg-cream hover:text-terra"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && (
                <span className="w-1.5 h-1.5 rounded-full bg-terra" />
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default function Sidebar({ selectedPrompt, isOpen = false, onClose }: SidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const [model, setModel] = useState('Gemini');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [doubaoKey, setDoubaoKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');

  // Load API Keys from localStorage
  useEffect(() => {
    setDoubaoKey(localStorage.getItem('doubao_key') || '');
    setGeminiKey(localStorage.getItem('gemini_key') || '');
  }, []);

  const saveSettings = () => {
    localStorage.setItem('doubao_key', doubaoKey);
    localStorage.setItem('gemini_key', geminiKey);
    setIsSettingsOpen(false);
  };

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
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          return data.url;
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      });

      const urls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...urls]);

    } catch (error) {
      console.error('Upload error:', error);
      alert('上传出错，请重试');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAspectRatioChange = (newRatio: string) => {
    setAspectRatio(newRatio);

    setPrompt((prev) => {
      // Match --ar followed by any spacing and a ratio (digits:digits)
      const arRegex = /--ar\s+\d+:\d+/;
      const newArTag = `--ar ${newRatio}`;

      if (arRegex.test(prev)) {
        // Replace existing tag
        return prev.replace(arRegex, newArTag);
      } else {
        // Append new tag
        return prev.trim() ? `${prev.trim()} ${newArTag}` : newArTag;
      }
    });
  };

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    setResultImage(null);

    try {
      const apiKey = model === 'Doubao' ? doubaoKey : geminiKey;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model,
          aspectRatio,
          images: uploadedImages, // Include uploaded image URLs array
          image: uploadedImages[0], // Keep backward compatibility
          apiKey,
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
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Full Preview"
            className="max-w-full max-h-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-8 right-8 text-white/70 hover:text-white transition-colors"
            onClick={() => setPreviewImage(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in"
          onClick={onClose}
        />
      )}

      <aside className={clsx(
        "h-full bg-paper border-l border-stone-line flex flex-col z-50 shadow-xl transition-transform duration-300 shrink-0",
        // Mobile styles
        "fixed inset-y-0 right-0 w-full sm:w-[600px]",
        isOpen ? "translate-x-0" : "translate-x-full",
        // Desktop styles (override mobile)
        "md:relative md:translate-x-0 md:w-[600px]"
      )}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-stone-line/0 via-stone-line/50 to-stone-line/0 hidden md:block"></div>

        <div className="p-8 pb-4 shrink-0 flex justify-between items-start">
          <div>
            <h2 className="font-serif text-2xl text-navy italic font-bold">创作工坊</h2>
            <p className="text-xs text-navy-light mt-1 font-sans">实验与调优</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-navy-light hover:text-navy hover:bg-cream rounded-full transition-all"
              title="设置 API Key"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="md:hidden p-2 text-navy-light hover:text-navy hover:bg-cream rounded-full transition-all"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-8 overflow-y-auto flex-shrink-0">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-terra rounded-full"></span>
                  提示词输入 (Prompt)
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 bg-cream border border-stone-line p-4 pr-10 text-navy font-mono text-sm leading-7 resize-none focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all shadow-inner placeholder:text-navy-light/50"
                    placeholder="从左侧选择一个案例开始创作..."
                  ></textarea>
                  {prompt && (
                    <button
                      onClick={() => setPrompt('')}
                      className="absolute top-2 right-2 p-1 text-navy-light hover:text-terra transition-colors rounded-full hover:bg-stone-line/20"
                      title="清空提示词"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-mustard rounded-full"></span>
                  参考图 (可选)
                </label>

                {!uploadedImages.length ? (
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
                      multiple
                    />
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 text-terra animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 text-navy-light group-hover:text-terra mb-2 transition-colors" />
                        <span className="text-xs text-navy-light group-hover:text-navy font-medium">点击上传图片 (可多选)</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {uploadedImages.map((url, index) => (
                        <div key={index} className="relative w-full h-24 bg-cream border border-stone-line p-2 group">
                          <img
                            src={url}
                            alt={`Reference ${index + 1}`}
                            className="w-full h-full object-contain cursor-zoom-in"
                            onClick={() => setPreviewImage(url)}
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-white/80 hover:bg-white text-navy hover:text-red-500 rounded-full shadow-sm transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                      ))}
                      <div
                        className="relative w-full h-24 bg-cream border border-dashed border-stone-line flex items-center justify-center cursor-pointer hover:bg-white hover:border-terra transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                         <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/png, image/jpeg"
                          onChange={handleFileUpload}
                          multiple
                        />
                         {isUploading ? (
                          <Loader2 className="w-5 h-5 text-terra animate-spin" />
                        ) : (
                          <div className="text-center">
                            <span className="text-xl text-navy-light/50">+</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <CustomSelect
                  label="模型选择"
                  value={model}
                  onChange={setModel}
                  options={[
                    { label: 'Gemini', value: 'Gemini' }
                  ]}
                />
                <CustomSelect
                  label="画面比例"
                  value={aspectRatio}
                  onChange={handleAspectRatioChange}
                  options={[
                    { label: '16:9 (横屏)', value: '16:9' },
                    { label: '4:3 (标准)', value: '4:3' },
                    { label: '1:1 (方图)', value: '1:1' },
                    { label: '3:4 (竖屏)', value: '3:4' },
                    { label: '9:16 (全屏)', value: '9:16' }
                  ]}
                />
              </div>

              {/* Settings Modal */}
              {isSettingsOpen && createPortal(
                <div className="fixed inset-0 z-[100] bg-navy/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-paper w-full max-w-md p-6 shadow-2xl border border-stone-line relative animate-in zoom-in-95 duration-200">
                    <button
                      onClick={() => setIsSettingsOpen(false)}
                      className="absolute top-4 right-4 text-navy-light hover:text-navy transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <h3 className="font-serif text-xl text-navy font-bold mb-6 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      API 配置
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
                          Doubao API Key
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={doubaoKey}
                            onChange={(e) => setDoubaoKey(e.target.value)}
                            className="w-full bg-cream border border-stone-line p-3 pr-10 text-sm text-navy focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all placeholder:text-navy-light/50 font-mono"
                            placeholder="sk-..."
                          />
                          <Key className="absolute right-3 top-3 w-4 h-4 text-navy-light" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
                          Gemini API Key
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                            className="w-full bg-cream border border-stone-line p-3 pr-10 text-sm text-navy focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all placeholder:text-navy-light/50 font-mono"
                            placeholder="AIza..."
                          />
                          <Key className="absolute right-3 top-3 w-4 h-4 text-navy-light" />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={saveSettings}
                          className="w-full bg-navy hover:bg-navy-light text-white font-bold py-3 transition-colors flex items-center justify-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          保存配置
                        </button>
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}

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
                    onClick={() => setPreviewImage(resultImage)}
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
