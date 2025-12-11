'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Copy, Check, Trash2, Plus, Edit3, Save, X, Square, ChevronLeft } from 'lucide-react';
import { CREATIVE_PROMPTS, CreativePrompt } from '@/data/creativePrompts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const [allPrompts, setAllPrompts] = useState<CreativePrompt[]>([]);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editingPromptData, setEditingPromptData] = useState({
    title: '',
    description: '',
    systemPrompt: '',
    placeholder: '',
    icon: '✨',
    category: '文章创作' as CreativePrompt['category']
  });

  const customPrompts = allPrompts.filter(p => p.id.startsWith('custom-'));

  useEffect(() => {
    const saved = localStorage.getItem('allPrompts');
    if (saved) {
      try {
        setAllPrompts(JSON.parse(saved));
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
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

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
    if (!inputValue.trim() || !selectedPrompt || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    const { processedText } = await fetchUrlContent(userMessage);

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const apiMessages = [
        { role: 'system', content: selectedPrompt.systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: processedText }
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
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
                setMessages(prev => {
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
        setMessages(prev => {
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
      setMessages(prev => {
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

  const handleCreateCustomPrompt = () => {
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

  const handleSaveCustomPrompt = () => {
    if (!editingPromptData.title.trim() || !editingPromptData.systemPrompt.trim()) {
      alert('请填写标题和系统提示词');
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

  const handleDeleteCustomPrompt = (id: string) => {
    if (confirm('确定要删除这个自定义 Prompt 吗？')) {
      const updated = allPrompts.filter(p => p.id !== id);
      saveAllPrompts(updated);
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
        setMessages([]);
      }
    }
  };

  const categories = ['内容分析', '个人IP', '文章创作', '营销文案'] as const;

  const handleBack = () => {
    setSelectedPrompt(null);
    setMessages([]);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
      {/* 左侧 - Prompt 模板列表 (移动端选择后隐藏) */}
      <div className={`w-full md:w-1/2 border-b md:border-b-0 md:border-r border-stone-line overflow-y-auto p-4 md:p-6 no-scrollbar md:block ${selectedPrompt ? 'hidden' : 'flex-1'}`}>
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
            {customPrompts.map(prompt => (
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
                      <h3 className={`font-semibold mb-1 ${
                        selectedPrompt?.id === prompt.id ? 'text-terra' : 'text-navy group-hover:text-terra'
                      }`}>
                        {prompt.title}
                      </h3>
                      <p className="text-sm text-navy-light line-clamp-2">
                        {prompt.description}
                      </p>
                    </div>
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

        {categories.map(category => {
          const categoryPrompts = CREATIVE_PROMPTS.filter(p => p.category === category);
          if (categoryPrompts.length === 0) return null;

          return (
            <div key={category} className="mb-6">
              <h2 className="text-xs font-bold text-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-terra rounded-full"></span>
                {category}
              </h2>
              <div className="grid gap-3">
                {categoryPrompts.map(prompt => (
                  <button
                    key={prompt.id}
                    onClick={() => handleSelectPrompt(prompt)}
                    className={`w-full text-left p-4 border transition-all duration-200 group ${
                      selectedPrompt?.id === prompt.id
                        ? 'border-terra bg-terra/5 shadow-sm'
                        : 'border-stone-line bg-paper hover:border-terra/50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{prompt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 ${
                          selectedPrompt?.id === prompt.id ? 'text-terra' : 'text-navy group-hover:text-terra'
                        }`}>
                          {prompt.title}
                        </h3>
                        <p className="text-sm text-navy-light line-clamp-2">
                          {prompt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 右侧 - 聊天区域 (移动端选择后全屏) */}
      <div className={`w-full md:w-1/2 flex-col bg-white min-h-0 md:flex ${selectedPrompt ? 'flex flex-1' : 'hidden'}`}>
        {selectedPrompt ? (
          <>
            <div className="p-4 border-b border-stone-line bg-cream/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* 移动端返回按钮 */}
                  <button
                    onClick={handleBack}
                    className="md:hidden p-2 -ml-2 text-navy-light hover:text-navy hover:bg-cream rounded-full transition-colors"
                    title="返回列表"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-2xl">{selectedPrompt.icon}</span>
                  <div>
                    <h2 className="font-semibold text-navy">{selectedPrompt.title}</h2>
                    <p className="text-xs text-navy-light">{selectedPrompt.description}</p>
                  </div>
                </div>
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.filter(m => m.content).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <Sparkles className="w-12 h-12 text-terra/30 mb-4" />
                  <p className="text-navy-light text-sm max-w-xs">
                    {selectedPrompt.placeholder}
                  </p>
                </div>
              ) : (
                messages.filter(m => m.content).map((message, index) => (
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
                      <div className={`text-sm whitespace-pre-wrap ${
                        message.role === 'assistant' ? 'text-navy' : ''
                      }`}>
                        {message.content}
                      </div>
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

            <div className="p-4 border-t border-stone-line bg-cream/30">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
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
                    disabled={!inputValue.trim()}
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
                <p className="text-xs text-navy-light text-center">
                  按 Enter 发送 · 支持粘贴文章链接自动抓取
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-cream flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-terra/50" />
            </div>
            <h2 className="font-serif text-xl text-navy font-bold mb-2">
              选择一个创作工具
            </h2>
            <p className="text-navy-light text-sm max-w-xs">
              从左侧选择你需要的创作辅助工具，开始你的创作之旅
            </p>
          </div>
        )}
      </div>

      {/* 创建自定义 Prompt 弹窗 */}
      {isEditingPrompt && (
        <div className="fixed inset-0 z-50 bg-navy/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-lg rounded-lg shadow-2xl border border-stone-line animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-stone-line">
              <h3 className="font-serif text-xl text-navy font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-terra" />
                创建自定义 Prompt
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
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  value={editingPromptData.title}
                  onChange={(e) => setEditingPromptData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="例如：文案润色助手"
                  className="w-full bg-cream border border-stone-line p-3 text-sm text-navy focus:outline-none focus:border-terra focus:ring-1 focus:ring-terra transition-all placeholder:text-navy-light/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-widest mb-2">
                  描述
                </label>
                <input
                  type="text"
                  value={editingPromptData.description}
                  onChange={(e) => setEditingPromptData(prev => ({ ...prev, description: e.target.value }))}
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
                  onChange={(e) => setEditingPromptData(prev => ({ ...prev, systemPrompt: e.target.value }))}
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
                  onChange={(e) => setEditingPromptData(prev => ({ ...prev, placeholder: e.target.value }))}
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
