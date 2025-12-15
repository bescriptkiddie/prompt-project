'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Play, Image as ImageIcon, Loader2, X, Key, Settings, Save, Send, Copy, Check, Square } from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  selectedPrompt: string;
  isOpen?: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string; // AI 生成的图片
}

export default function Sidebar({ selectedPrompt, isOpen = false, onClose }: SidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Image upload states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [geminiKey, setGeminiKey] = useState('');

  useEffect(() => {
    setGeminiKey(localStorage.getItem('gemini_key') || '');
  }, []);

  const saveSettings = () => {
    localStorage.setItem('gemini_key', geminiKey);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    if (selectedPrompt) {
      setPrompt(selectedPrompt);
      setChatMessages([]);
    }
  }, [selectedPrompt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];

    Array.from(files).forEach(file => {
      if (file.size > MAX_SIZE) oversizedFiles.push(file.name);
      else validFiles.push(file);
    });

    if (oversizedFiles.length > 0) {
      alert(`以下文件超过 10MB 限制：\n${oversizedFiles.join('\n')}`);
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) return data.url;
        throw new Error(data.error || 'Upload failed');
      });
      const urls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...urls]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传出错，请重试');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Image generation - 结果显示在对话流中
  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);

    // 添加用户的生成请求到对话
    setChatMessages(prev => [...prev, { role: 'user', content: `🎨 生成图片：${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}` }]);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: 'Gemini',
          aspectRatio,
          images: uploadedImages,
          image: uploadedImages[0],
          apiKey: geminiKey,
        }),
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: '图片生成完成：',
          imageUrl: data.imageUrl
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `生成失败: ${data.error || '未知错误'}`
        }]);
      }
    } catch (error) {
      console.error('API Error:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '网络错误，请重试。'
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Chat functions
  const handleStopChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsChatLoading(false);
    }
  };

  // 文字对话：优化提示词
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);
    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const systemPrompt = `你是一个专业的 AI 绘画提示词助手。帮助用户优化和修改提示词。

当前的提示词是：
${prompt || '(用户还没有输入提示词)'}

规则：
1. 根据用户的要求修改提示词
2. 输出修改后的完整提示词时，用【修改后的提示词】标记
3. 保持提示词的专业性和完整性
4. 简洁回复，重点输出修改后的提示词`;

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...chatMessages.filter(m => m.content).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader available');

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setChatMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { role: 'assistant', content: fullContent };
                  return newMessages;
                });
              }
            } catch { /* ignore */ }
          }
        }
      }

      // 检查是否有【修改后的提示词】标记，自动更新 prompt 并生成图片
      const finalMatch = fullContent.match(/【修改后的提示词】[：:\s]*([\s\S]*?)(?=\n\n|$)/);
      if (finalMatch && finalMatch[1]) {
        const newPrompt = finalMatch[1].trim();
        setPrompt(newPrompt);
        
        // 自动生成图片
        setIsGenerating(true);
        try {
          const genResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: newPrompt,
              model: 'Gemini',
              aspectRatio,
              images: uploadedImages,
              image: uploadedImages[0],
              apiKey: geminiKey,
            }),
          });
          const genData = await genResponse.json();
          if (genData.success && genData.imageUrl) {
            setChatMessages(prev => [...prev, { 
              role: 'assistant', 
              content: '',
              imageUrl: genData.imageUrl 
            }]);
          } else {
            setChatMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `生成失败: ${genData.error || '未知错误'}` 
            }]);
          }
        } catch {
          setChatMessages(prev => [...prev, { 
            role: 'assistant', 
            content: '图片生成失败，请重试。' 
          }]);
        } finally {
          setIsGenerating(false);
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1] = { role: 'assistant', content: '网络错误，请重试。' };
        }
        return newMessages;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Fullscreen Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl" />
          <button className="absolute top-8 right-8 text-white/70 hover:text-white" onClick={() => setPreviewImage(null)}>
            <X className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in" onClick={onClose} />
      )}

      <aside className={clsx(
        "h-full bg-paper border-l border-stone-line flex flex-col z-50 shadow-xl transition-transform duration-300 shrink-0",
        "fixed inset-y-0 right-0 w-full sm:w-[500px]",
        isOpen ? "translate-x-0" : "translate-x-full",
        "md:relative md:translate-x-0 md:w-[500px]"
      )}>
        {/* Header */}
        <div className="p-4 pb-2 shrink-0 flex justify-between items-center border-b border-stone-line">
          <div>
            <h2 className="font-serif text-lg text-navy font-bold">创作工坊</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-navy-light hover:text-navy hover:bg-cream rounded-full transition-all" title="设置">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="md:hidden p-2 text-navy-light hover:text-navy hover:bg-cream rounded-full transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="px-4 py-3 shrink-0 border-b border-stone-line bg-cream/30">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-navy uppercase tracking-widest">当前提示词</label>
            {prompt && <button onClick={() => setPrompt('')} className="text-xs text-navy-light hover:text-terra">清空</button>}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-20 bg-white border border-stone-line p-3 text-navy font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra rounded"
            placeholder="从左侧选择一个 Prompt，或直接输入..."
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chatMessages.filter(m => m.content || m.imageUrl).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Send className="w-10 h-10 text-terra/20 mb-3" />
                <p className="text-navy-light text-sm">对话优化提示词</p>
                <p className="text-navy-light/60 text-xs mt-1">告诉 AI 你想要什么风格或修改</p>
                <p className="text-navy-light/60 text-xs">确认后点击下方“生成图片”按钮</p>
              </div>
            ) : (
              chatMessages.filter(m => m.content || m.imageUrl).map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] p-3 text-sm ${
                    message.role === 'user'
                      ? 'bg-terra text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white border border-stone-line rounded-2xl rounded-tl-sm text-navy'
                  }`}>
                    {message.content && <div className="whitespace-pre-wrap">{message.content}</div>}
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Generated"
                        className="mt-2 rounded-lg cursor-zoom-in max-w-full"
                        onClick={() => setPreviewImage(message.imageUrl!)}
                      />
                    )}
                    {message.role === 'assistant' && !message.imageUrl && (
                      <button onClick={() => copyToClipboard(message.content, `chat-${index}`)} className="mt-2 flex items-center gap-1 text-xs text-navy-light hover:text-terra">
                        {copiedId === `chat-${index}` ? <><Check className="w-3 h-3" /> 已复制</> : <><Copy className="w-3 h-3" /> 复制</>}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-stone-line rounded-2xl rounded-tl-sm p-3">
                  <Loader2 className="w-4 h-4 animate-spin text-terra" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="px-4 py-3 border-t border-stone-line bg-cream/30">
            <div className="flex gap-2 items-end">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="告诉 AI 如何修改提示词..."
                className="flex-1 resize-none bg-white border border-stone-line rounded-lg p-2 text-sm text-navy focus:outline-none focus:border-terra min-h-[40px] max-h-[80px]"
                rows={1}
              />
              {isChatLoading ? (
                <button onClick={handleStopChat} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shrink-0">
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button onClick={handleSendChat} disabled={!chatInput.trim()} className="p-2 bg-terra hover:bg-terra-dark disabled:opacity-50 text-white rounded-lg shrink-0">
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Image Generation Section */}
        <div className="border-t border-stone-line bg-cream/50">
          <button
            onClick={() => setShowImageOptions(!showImageOptions)}
            className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-navy hover:bg-cream/50"
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-terra" />
              图片生成选项
            </span>
            {showImageOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showImageOptions && (
            <div className="px-4 pb-3 space-y-3">
              {/* Reference Images */}
              <div>
                <label className="text-xs font-medium text-navy-light mb-2 block">参考图 (可选)</label>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFileUpload} multiple />
                <div className="flex gap-2 flex-wrap">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 bg-white border border-stone-line rounded overflow-hidden group">
                      <img src={url} alt="" className="w-full h-full object-cover" onClick={() => setPreviewImage(url)} />
                      <button
                        onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0 right-0 p-0.5 bg-white/90 text-red-500 rounded-bl opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 border-2 border-dashed border-stone-line rounded flex items-center justify-center text-navy-light hover:border-terra hover:text-terra"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : '+'}
                  </button>
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-xs font-medium text-navy-light mb-2 block">画面比例</label>
                <div className="flex gap-2 flex-wrap">
                  {['16:9', '4:3', '1:1', '3:4', '9:16'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={clsx(
                        "px-3 py-1 text-xs rounded border transition-all",
                        aspectRatio === ratio ? "bg-terra text-white border-terra" : "bg-white text-navy border-stone-line hover:border-terra"
                      )}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="px-4 pb-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="w-full bg-terra hover:bg-terra-dark disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</> : <><Play className="w-4 h-4" /> 生成图片</>}
            </button>
          </div>
        </div>

        {/* Settings Modal */}
        {isSettingsOpen && createPortal(
          <div className="fixed inset-0 z-[100] bg-navy/20 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-paper w-full max-w-sm p-5 shadow-2xl border border-stone-line rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-navy">API 配置</h3>
                <button onClick={() => setIsSettingsOpen(false)} className="text-navy-light hover:text-navy"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-navy uppercase mb-2 block">Gemini API Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full bg-cream border border-stone-line p-3 pr-10 text-sm rounded focus:outline-none focus:border-terra"
                      placeholder="AIza..."
                    />
                    <Key className="absolute right-3 top-3 w-4 h-4 text-navy-light" />
                  </div>
                </div>
                <button onClick={saveSettings} className="w-full bg-navy hover:bg-navy-light text-white font-bold py-2 rounded flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> 保存
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </aside>
    </>
  );
}
