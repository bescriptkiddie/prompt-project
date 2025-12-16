'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Edit3, ImagePlus, Loader2, Plus, Save, Send, Sparkles, Square, Trash2, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { CREATIVE_PROMPTS, CREATIVE_CATEGORIES, type CreativePrompt } from '@/data/prompts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 图片数组
}

export default function MethodologyContent() {
  const [selectedPrompt, setSelectedPrompt] = useState<CreativePrompt | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  // prompt 管理相关状态
  const [allPrompts, setAllPrompts] = useState<CreativePrompt[]>([]);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptData, setEditingPromptData] = useState({
    title: '',
    description: '',
    systemPrompt: '',
    placeholder: '',
    icon: '✨',
    category: '文章创作' as CreativePrompt['category']
  });

  const customPrompts = allPrompts.filter((p) => p.id.startsWith('custom-'));

  // 从 localStorage 加载 prompts，合并预设和自定义
  useEffect(() => {
    const saved = localStorage.getItem('allPrompts');
    if (saved) {
      try {
        const savedPrompts = JSON.parse(saved) as CreativePrompt[];

        // 迁移逻辑：保留用户对旧 prompts 的编辑/自定义，同时自动补齐新加入的预设 prompts
        const savedById = new Map(savedPrompts.map((p) => [p.id, p] as const));
        const mergedPresets = CREATIVE_PROMPTS.map((p) => savedById.get(p.id) ?? p);
        const extraPrompts = savedPrompts.filter((p) => !CREATIVE_PROMPTS.some((d) => d.id === p.id));
        const merged = [...mergedPresets, ...extraPrompts];

        setAllPrompts(merged);
        localStorage.setItem('allPrompts', JSON.stringify(merged));
      } catch {
        setAllPrompts(CREATIVE_PROMPTS);
        localStorage.setItem('allPrompts', JSON.stringify(CREATIVE_PROMPTS));
      }
    } else {
      setAllPrompts(CREATIVE_PROMPTS);
      localStorage.setItem('allPrompts', JSON.stringify(CREATIVE_PROMPTS));
    }
  }, []);

  const saveAllPrompts = (prompts: CreativePrompt[]) => {
    setAllPrompts(prompts);
    localStorage.setItem('allPrompts', JSON.stringify(prompts));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  const handleSelectPrompt = (prompt: CreativePrompt) => {
    setSelectedPrompt(prompt);
    setMessages([]);
    setInputValue('');
    setPendingImages([]);
  };

  // 图片上传处理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPendingImages((prev) => [...prev, base64]);
      };
      reader.readAsDataURL(file);
    });

    // 清空 input 以便重复选择同一文件
    e.target.value = '';
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 粘贴图片处理
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        if (file.size > 10 * 1024 * 1024) {
          alert('图片大小不能超过 10MB');
          continue;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target?.result as string;
          setPendingImages((prev) => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // 检测并抓取URL内容
  const fetchUrlContent = async (text: string): Promise<{ processedText: string; urls: string[] }> => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);

    if (!urls || urls.length === 0) {
      return { processedText: text, urls: [] };
    }

    setIsFetchingUrl(true);
    let processedText = text;
    const fetchedUrls: string[] = [];

    for (const url of urls) {
      try {
        const response = await fetch('/api/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.success && data.content) {
          const urlContent = `\n\n---\n【网页内容】${data.title ? `标题：${data.title}\n` : ''}${data.content}\n---\n`;
          processedText = processedText.replace(url, url + urlContent);
          fetchedUrls.push(url);
        }
      } catch (error) {
        console.error('Failed to fetch URL:', url, error);
      }
    }

    setIsFetchingUrl(false);
    return { processedText, urls: fetchedUrls };
  };

  const handleSend = async () => {
    if ((!inputValue.trim() && pendingImages.length === 0) || !selectedPrompt || isLoading) return;

    const userMessage = inputValue.trim();
    const imagesToSend = [...pendingImages];
    setInputValue('');
    setPendingImages([]);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage, images: imagesToSend.length > 0 ? imagesToSend : undefined }]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    const { processedText } = await fetchUrlContent(userMessage);

    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      // 构建消息内容：如果有图片，使用多模态格式
      const userContent = imagesToSend.length > 0
        ? [
            { type: 'text', text: processedText || '请分析这张图片' },
            ...imagesToSend.map((img) => ({ type: 'image_url', image_url: { url: img } }))
          ]
        : processedText;

      const apiMessages = [
        { role: 'system', content: selectedPrompt.systemPrompt },
        ...messages.map((m) => {
          if (m.images && m.images.length > 0) {
            return {
              role: m.role,
              content: [
                { type: 'text', text: m.content || '' },
                ...m.images.map((img) => ({ type: 'image_url', image_url: { url: img } }))
              ]
            };
          }
          return { role: m.role, content: m.content };
        }),
        { role: 'user', content: userContent }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages, 
          images: imagesToSend.length > 0 ? imagesToSend : undefined,
          stream: true 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

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
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: 'assistant',
                    content: fullContent
                  };
                  return newMessages;
                });
              }
            } catch {
              // ignore
            }
          }
        }
      }

      if (!fullContent) {
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: '抱歉，生成失败了，请重试。'
          };
          return newMessages;
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Chat error:', error);
      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'assistant') {
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: '网络错误，请检查连接后重试。'
          };
        }
        return newMessages;
      });
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
  };

  // 创建新的自定义 prompt
  const handleCreateCustomPrompt = () => {
    setEditingPromptId(null);
    setEditingPromptData({
      title: '',
      description: '',
      systemPrompt: '',
      placeholder: '输入你想让 AI 帮你处理的内容...',
      icon: '✨',
      category: '文章创作'
    });
    setIsEditingPrompt(true);
  };

  // 编辑现有 prompt
  const handleEditPrompt = (prompt: CreativePrompt) => {
    setEditingPromptId(prompt.id);
    setEditingPromptData({
      title: prompt.title,
      description: prompt.description,
      systemPrompt: prompt.systemPrompt,
      placeholder: prompt.placeholder,
      icon: prompt.icon,
      category: prompt.category
    });
    setIsEditingPrompt(true);
  };

  // 保存 prompt（新建或编辑）
  const handleSaveCustomPrompt = () => {
    if (!editingPromptData.title.trim() || !editingPromptData.systemPrompt.trim()) {
      alert('请填写标题和系统提示词');
      return;
    }

    if (editingPromptId) {
      const updated = allPrompts.map((p) => {
        if (p.id === editingPromptId) {
          return {
            ...p,
            title: editingPromptData.title,
            description: editingPromptData.description || '自定义创作工具',
            systemPrompt: editingPromptData.systemPrompt,
            placeholder: editingPromptData.placeholder || '输入你想让 AI 帮你处理的内容...'
          };
        }
        return p;
      });

      saveAllPrompts(updated);
      if (selectedPrompt?.id === editingPromptId) {
        setSelectedPrompt(updated.find((p) => p.id === editingPromptId) || null);
      }
      setIsEditingPrompt(false);
      setEditingPromptId(null);
      return;
    }

    const newPrompt: CreativePrompt = {
      id: `custom-${Date.now()}`,
      title: editingPromptData.title,
      description: editingPromptData.description || '自定义创作工具',
      icon: '✨',
      category: '文章创作',
      systemPrompt: editingPromptData.systemPrompt,
      placeholder: editingPromptData.placeholder || '输入你想让 AI 帮你处理的内容...'
    };

    saveAllPrompts([...allPrompts, newPrompt]);
    setIsEditingPrompt(false);
    setSelectedPrompt(newPrompt);
    setMessages([]);
  };

  // 删除自定义 prompt
  const handleDeleteCustomPrompt = (id: string) => {
    if (confirm('确定要删除这个自定义 Prompt 吗？')) {
      const updated = allPrompts.filter((p) => p.id !== id);
      saveAllPrompts(updated);
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
        setMessages([]);
      }
    }
  };

  const categories = CREATIVE_CATEGORIES;

  return (
    <div className="flex h-full w-full flex-col bg-cream overflow-hidden">
      <div className="flex-1 h-full overflow-hidden relative flex flex-col">
        <Navbar />

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* 左侧 - Prompt 模板列表 */}
          <div className="w-full md:w-1/2 flex-1 min-h-0 border-b md:border-b-0 md:border-r border-stone-line overflow-y-auto p-4 md:p-6 no-scrollbar">
            <header className="mb-6 md:mb-8">
              <span className="text-terra font-semibold tracking-wider text-xs uppercase mb-2 block">
                Creative Toolkit
              </span>
              <h1 className="font-serif text-2xl md:text-3xl text-navy font-bold mb-2 md:mb-3">
                创作方法论
              </h1>
              <p className="text-navy-light text-xs md:text-sm">
                选择一个创作工具，在下方对话框中输入你的内容，AI 将帮你生成专业结果。
              </p>
            </header>

            {/* 自定义 Prompt 区域 */}
            <div className="mb-6">
              <h2 className="text-xs font-bold text-navy uppercase tracking-widest mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-mustard rounded-full"></span>
                  我的 Prompt
                </span>
                <button
                  onClick={handleCreateCustomPrompt}
                  className="flex items-center gap-1 text-terra hover:text-terra-dark transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>新建</span>
                </button>
              </h2>
              <div className="grid gap-3">
                {customPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`w-full text-left p-4 border transition-all duration-200 group ${
                      selectedPrompt?.id === prompt.id
                        ? 'border-terra bg-terra/5 shadow-sm'
                        : 'border-stone-line bg-paper hover:border-terra/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleSelectPrompt(prompt)}
                        className="flex-1 text-left flex items-start gap-3"
                      >
                        <span className="text-2xl">{prompt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-semibold mb-1 ${
                              selectedPrompt?.id === prompt.id
                                ? 'text-terra'
                                : 'text-navy group-hover:text-terra'
                            }`}
                          >
                            {prompt.title}
                          </h3>
                          <p className="text-sm text-navy-light line-clamp-2">{prompt.description}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditPrompt(prompt)}
                          className="p-1 text-navy-light hover:text-terra opacity-0 group-hover:opacity-100 transition-all"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomPrompt(prompt.id)}
                          className="p-1 text-navy-light hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {customPrompts.length === 0 && (
                  <button
                    onClick={handleCreateCustomPrompt}
                    className="w-full p-4 border-2 border-dashed border-stone-line text-navy-light hover:border-terra hover:text-terra transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span>创建自定义 Prompt</span>
                  </button>
                )}
              </div>
            </div>

            {categories.map((category) => {
              const categoryPrompts = allPrompts.filter(
                (p) => p.category === category && !p.id.startsWith('custom-')
              );
              if (categoryPrompts.length === 0) return null;

              return (
                <div key={category} className="mb-6">
                  <h2 className="text-xs font-bold text-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-terra rounded-full"></span>
                    {category}
                  </h2>
                  <div className="grid gap-3">
                    {categoryPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className={`w-full text-left p-4 border transition-all duration-200 group ${
                          selectedPrompt?.id === prompt.id
                            ? 'border-terra bg-terra/5 shadow-sm'
                            : 'border-stone-line bg-paper hover:border-terra/50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleSelectPrompt(prompt)}
                            className="flex-1 text-left flex items-start gap-3"
                          >
                            <span className="text-2xl">{prompt.icon}</span>
                            <div className="flex-1 min-w-0">
                              <h3
                                className={`font-semibold mb-1 ${
                                  selectedPrompt?.id === prompt.id
                                    ? 'text-terra'
                                    : 'text-navy group-hover:text-terra'
                                }`}
                              >
                                {prompt.title}
                              </h3>
                              <p className="text-sm text-navy-light line-clamp-2">{prompt.description}</p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleEditPrompt(prompt)}
                            className="p-1 text-navy-light hover:text-terra opacity-0 group-hover:opacity-100 transition-all"
                            title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 右侧 - 聊天区域 */}
          <div className="w-full md:w-1/2 flex-1 flex flex-col bg-white min-h-0">
            {selectedPrompt ? (
              <>
                {/* 聊天头部 */}
                <div className="p-4 border-b border-stone-line bg-cream/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{selectedPrompt.icon}</span>
                      <div>
                        <h2 className="font-semibold text-navy">{selectedPrompt.title}</h2>
                        <p className="text-xs text-navy-light">{selectedPrompt.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditPrompt(selectedPrompt)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-terra border border-terra/30 hover:bg-terra/10 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>编辑</span>
                      </button>
                      {messages.length > 0 && (
                        <button
                          onClick={clearChat}
                          className="p-2 text-navy-light hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          title="清空对话"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {messages.filter((m) => m.content).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <Sparkles className="w-12 h-12 text-terra/30 mb-4" />
                      <p className="text-navy-light text-sm max-w-xs">{selectedPrompt.placeholder}</p>
                    </div>
                  ) : (
                    messages
                      .filter((m) => m.content || (m.images && m.images.length > 0))
                      .map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-4 ${
                              message.role === 'user'
                                ? 'bg-terra text-white rounded-2xl rounded-tr-sm'
                                : 'bg-cream border border-stone-line rounded-2xl rounded-tl-sm'
                            }`}
                          >
                            {/* 显示用户上传的图片 */}
                            {message.images && message.images.length > 0 && (
                              <div className="flex gap-2 flex-wrap mb-2">
                                {message.images.map((img, imgIndex) => (
                                  <img
                                    key={imgIndex}
                                    src={img}
                                    alt={`图片 ${imgIndex + 1}`}
                                    className="max-w-[200px] max-h-[200px] object-contain rounded-lg"
                                  />
                                ))}
                              </div>
                            )}
                            {message.content && (
                              <div
                                className={`text-sm whitespace-pre-wrap ${
                                  message.role === 'assistant' ? 'text-navy' : ''
                                }`}
                              >
                                {message.content}
                              </div>
                            )}
                            {message.role === 'assistant' && (
                              <button
                                onClick={() => copyToClipboard(message.content, `msg-${index}`)}
                                className="mt-2 flex items-center gap-1 text-xs text-navy-light hover:text-terra transition-colors"
                              >
                                {copiedId === `msg-${index}` ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    已复制
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    复制
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-cream border border-stone-line rounded-2xl rounded-tl-sm p-4">
                        <div className="flex items-center gap-2 text-navy-light">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">正在生成...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* 输入区域 */}
                <div className="p-4 border-t border-stone-line bg-cream/30">
                  {/* 待发送图片预览 */}
                  {pendingImages.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {pendingImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`待发送图片 ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-stone-line"
                          />
                          <button
                            onClick={() => removePendingImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 items-end">
                    {/* 隐藏的文件输入 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {/* 图片上传按钮 */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3 bg-white border border-stone-line hover:border-terra text-navy-light hover:text-terra rounded-xl transition-colors shrink-0"
                      title="上传图片"
                    >
                      <ImagePlus className="w-5 h-5" />
                    </button>
                    <textarea
                      ref={textareaRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onPaste={handlePaste}
                      placeholder="输入内容或粘贴图片..."
                      className="flex-1 resize-none bg-white border border-stone-line rounded-xl p-3 text-sm text-navy focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all placeholder:text-navy-light/50 min-h-[48px] max-h-[150px]"
                      rows={1}
                    />
                    {isLoading ? (
                      <button
                        onClick={handleStop}
                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors shrink-0"
                        title="停止生成"
                      >
                        <Square className="w-5 h-5 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() && pendingImages.length === 0}
                        className="p-3 bg-terra hover:bg-terra-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {isFetchingUrl && (
                      <span className="flex items-center gap-1 text-xs text-terra">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        正在抓取网页内容...
                      </span>
                    )}
                    <p className="text-xs text-navy-light text-center">按 Enter 发送 · 支持粘贴/上传图片</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center mb-6">
                  <Sparkles className="w-10 h-10 text-terra/50" />
                </div>
                <h2 className="font-serif text-xl text-navy font-bold mb-2">选择一个创作工具</h2>
                <p className="text-navy-light text-sm max-w-xs">从左侧选择你需要的创作辅助工具，开始你的创作之旅</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 创建/编辑自定义 Prompt 弹窗 */}
      {isEditingPrompt && (
        <div className="fixed inset-0 z-50 bg-navy/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-lg rounded-lg shadow-2xl border border-stone-line animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-line">
              <h3 className="font-serif text-xl text-navy font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-terra" />
                {editingPromptId ? '编辑 Prompt' : '创建自定义 Prompt'}
              </h3>
              <button
                onClick={() => setIsEditingPrompt(false)}
                className="p-1 text-navy-light hover:text-navy transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">标题 *</label>
                <input
                  type="text"
                  value={editingPromptData.title}
                  onChange={(e) => setEditingPromptData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：文案润色助手"
                  className="w-full bg-cream border border-stone-line p-3 text-sm text-navy focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all placeholder:text-navy-light/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">描述</label>
                <input
                  type="text"
                  value={editingPromptData.description}
                  onChange={(e) =>
                    setEditingPromptData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="简短描述这个 Prompt 的用途"
                  className="w-full bg-cream border border-stone-line p-3 text-sm text-navy focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all placeholder:text-navy-light/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
                  系统提示词 (System Prompt) *
                </label>
                <textarea
                  value={editingPromptData.systemPrompt}
                  onChange={(e) =>
                    setEditingPromptData((prev) => ({ ...prev, systemPrompt: e.target.value }))
                  }
                  placeholder="定义 AI 的角色和行为，例如：你是一位专业的文案编辑，擅长..."
                  className="w-full bg-cream border border-stone-line p-3 text-sm text-navy focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all placeholder:text-navy-light/50 min-h-[150px] resize-none"
                />
                <p className="text-xs text-navy-light mt-1">
                  这是 AI 看到的指令，用户看不到。定义 AI 应该扮演什么角色、如何回复等。
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
                  输入框占位符
                </label>
                <input
                  type="text"
                  value={editingPromptData.placeholder}
                  onChange={(e) =>
                    setEditingPromptData((prev) => ({ ...prev, placeholder: e.target.value }))
                  }
                  placeholder="引导用户输入的提示文字"
                  className="w-full bg-cream border border-stone-line p-3 text-sm text-navy focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all placeholder:text-navy-light/50"
                />
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-stone-line">
              <button
                onClick={() => setIsEditingPrompt(false)}
                className="flex-1 px-4 py-2 border border-stone-line text-navy hover:bg-cream transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveCustomPrompt}
                className="flex-1 px-4 py-2 bg-terra hover:bg-terra-dark text-white transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
