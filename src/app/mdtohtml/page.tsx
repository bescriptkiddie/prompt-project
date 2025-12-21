'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';

// 主题配色定义
const themes = {
  coral: {
    name: '珊瑚橘',
    primary: '#e07a5f',
    primaryDark: '#d66a4f',
    secondary: '#3d405b',
    accent: '#f2cc8f',
    blockquoteBg: '#faf8f5',
    h3Bg: 'linear-gradient(to right, #fff5f2, transparent)',
    codeBg: '#fff5f2',
  },
  forest: {
    name: '森林绿',
    primary: '#588157',
    primaryDark: '#4a6f4a',
    secondary: '#344e41',
    accent: '#a3b18a',
    blockquoteBg: '#f5f9f5',
    h3Bg: 'linear-gradient(to right, #e8f0e8, transparent)',
    codeBg: '#e8f0e8',
  },
  ocean: {
    name: '海洋蓝',
    primary: '#457b9d',
    primaryDark: '#3a6a89',
    secondary: '#1d3557',
    accent: '#a8dadc',
    blockquoteBg: '#f5f9fb',
    h3Bg: 'linear-gradient(to right, #e8f4f8, transparent)',
    codeBg: '#e8f4f8',
  },
  lavender: {
    name: '薰衣紫',
    primary: '#7c6a9a',
    primaryDark: '#6b5a87',
    secondary: '#4a4063',
    accent: '#c9b8d8',
    blockquoteBg: '#f9f7fb',
    h3Bg: 'linear-gradient(to right, #f0ebf5, transparent)',
    codeBg: '#f0ebf5',
  },
  rose: {
    name: '玫瑰粉',
    primary: '#c77d8e',
    primaryDark: '#b56b7c',
    secondary: '#5c4a4f',
    accent: '#eac4c9',
    blockquoteBg: '#fdf8f9',
    h3Bg: 'linear-gradient(to right, #fbeef0, transparent)',
    codeBg: '#fbeef0',
  },
  coffee: {
    name: '咖啡棕',
    primary: '#8b6f4e',
    primaryDark: '#7a6044',
    secondary: '#4a3f35',
    accent: '#d4b896',
    blockquoteBg: '#faf7f4',
    h3Bg: 'linear-gradient(to right, #f5efe8, transparent)',
    codeBg: '#f5efe8',
  },
  ink: {
    name: '水墨黑',
    primary: '#4a4a4a',
    primaryDark: '#333333',
    secondary: '#2c2c2c',
    accent: '#9a9a9a',
    blockquoteBg: '#f5f5f5',
    h3Bg: 'linear-gradient(to right, #eeeeee, transparent)',
    codeBg: '#f0f0f0',
  },
  sunset: {
    name: '日落橙',
    primary: '#e07a3d',
    primaryDark: '#c96a32',
    secondary: '#5c4030',
    accent: '#f4a460',
    blockquoteBg: '#fff8f2',
    h3Bg: 'linear-gradient(to right, #fff0e5, transparent)',
    codeBg: '#fff0e5',
  },
};

type ThemeKey = keyof typeof themes;

const defaultContent = `# 慢生活的艺术

## 寻找内心的宁静

在这个快节奏的时代，我们似乎总是被时间追赶。**焦虑**和**压力**成为了现代人的常态。然而，真正的生活美学，往往隐藏在慢下来的时光里。

> "生活不是为了赶路，而是为了感受路。" —— 佚名

### 为什么我们需要慢下来？

1. **恢复精力**：持续的高压状态会耗尽我们的身心能量。
2. **发现美好**：只有放慢脚步，才能注意到路边盛开的花朵。
3. **深度思考**：慢下来，给大脑留出整理和创造的空间。

### 如何开始？

尝试在一个阳光明媚的午后，泡一杯茶，读一本好书。

![阅读时光](https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80)

当你开始享受独处的时光，你会发现，世界变得温柔了许多。

---

*愿你在这个喧嚣的世界里，拥有一方属于自己的宁静天地。*`;

export default function MdToHtmlPage() {
  const [markdown, setMarkdown] = useState(defaultContent);
  const [html, setHtml] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('coral');
  const [showThemePanel, setShowThemePanel] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const theme = themes[currentTheme];

  useEffect(() => {
    const loadMarked = async () => {
      const { Marked } = await import('marked');
      const marked = new Marked();

      const renderer = {
        heading(this: any, token: any): string {
          const text = this.parser.parseInline(token.tokens);
          if (token.depth === 2) {
            return `<h2 style="display: flex; align-items: center; justify-content: center;"><span style="color: ${theme.accent}; margin: 0 10px; font-size: 12px;">✦</span>${text}<span style="color: ${theme.accent}; margin: 0 10px; font-size: 12px;">✦</span></h2>`;
          }
          return `<h${token.depth}>${text}</h${token.depth}>`;
        },
        listitem(this: any, token: any): string {
          const content = this.parser.parse(token.tokens, !!token.loose);
          return `<li><span style="color: #3f3f3f;">${content}</span></li>`;
        }
      };

      marked.use({
        breaks: true,
        gfm: true,
        renderer
      });
      
      setHtml(marked.parse(markdown) as string);
    };
    loadMarked();
  }, [markdown, currentTheme]);

  const handleCopy = async () => {
    try {
      if (previewRef.current) {
        const range = document.createRange();
        range.selectNode(previewRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand('copy');
        selection?.removeAllRanges();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动选择复制。');
    }
  };

  const handleClear = () => {
    if (confirm('确定要清空所有内容吗？')) {
      setMarkdown('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = markdown.substring(0, start) + '\t' + markdown.substring(end);
      setMarkdown(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      }, 0);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-cream">
      {/* 公共导航栏 */}
      <Navbar />

      {/* 工具栏 */}
      <div className="px-4 md:px-8 py-3 flex justify-between items-center bg-white border-b border-stone-line">
        <div className="text-sm text-navy-light">
          Markdown 转微信公众号排版
        </div>
        <div className="flex gap-2 items-center">
          {/* 主题选择器 */}
          <div className="relative">
            <button
              onClick={() => setShowThemePanel(!showThemePanel)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 border border-stone-line hover:bg-cream"
            >
              <span 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: theme.primary }}
              />
              <span className="hidden sm:inline">{theme.name}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showThemePanel ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showThemePanel && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowThemePanel(false)}
                />
                <div className="absolute right-0 top-full mt-2 p-3 rounded-lg shadow-xl z-50 min-w-[280px] bg-white border border-stone-line">
                  <div className="text-xs text-navy-light mb-2 px-1">选择主题配色</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(themes) as ThemeKey[]).map((key) => {
                      const isSelected = currentTheme === key;
                      const themeColor = themes[key].primary;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setCurrentTheme(key);
                            setShowThemePanel(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all hover:bg-cream"
                          style={{ 
                            outline: isSelected ? `2px solid ${themeColor}` : 'none',
                            outlineOffset: '-2px',
                            backgroundColor: isSelected ? `${themeColor}1A` : 'transparent'
                          }}
                        >
                          <span 
                            className="w-5 h-5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: themeColor }}
                          />
                          <span style={{ color: themes[key].secondary }}>{themes[key].name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-all border border-stone-line text-navy-light hover:bg-cream"
          >
            清空
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-md text-sm font-medium text-white transition-all"
            style={{ backgroundColor: theme.primary }}
          >
            复制富文本
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* 编辑器 */}
        <div className="flex flex-col h-[40vh] md:h-full border-r border-stone-line bg-white">
          <div className="px-4 py-2 text-xs uppercase tracking-widest font-semibold bg-cream/50 border-b border-stone-line text-navy-light">
            Markdown 输入
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="在此输入 Markdown 内容..."
            className="flex-1 w-full p-4 md:p-6 resize-none outline-none font-mono text-sm leading-relaxed text-navy"
          />
        </div>

        {/* 预览 */}
        <div className="overflow-y-auto p-4 md:p-6 flex justify-center items-start bg-white">
          <div className="w-full max-w-[677px] p-6 md:p-10 rounded-lg bg-white shadow-sm self-start">
            <div 
              ref={previewRef}
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </main>

      {/* Toast */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm text-white flex items-center gap-2 z-50 transition-all duration-300 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24 pointer-events-none'
        }`}
        style={{ backgroundColor: '#333', boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        已复制到剪贴板，请到微信编辑器粘贴
      </div>

      <style key={currentTheme} dangerouslySetInnerHTML={{ __html: `
        .preview-content {
          font-family: var(--font-noto-sans-sc), 'Noto Sans SC', sans-serif;
          color: #3f3f3f;
          line-height: 1.8;
          font-size: 16px;
          text-align: justify;
        }

        .preview-content h1 {
          font-family: var(--font-noto-serif-sc), 'Noto Serif SC', serif;
          font-size: 24px;
          font-weight: 700;
          color: #333;
          text-align: center;
          margin: 40px 0 30px 0;
          padding-bottom: 15px;
          border-bottom: 1px solid ${theme.primary};
        }

        .preview-content h2 {
          font-family: var(--font-noto-serif-sc), 'Noto Serif SC', serif;
          font-size: 18px;
          font-weight: 700;
          color: ${theme.primary};
          margin: 35px 0 20px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-content h3 {
          font-size: 16px;
          font-weight: 700;
          color: ${theme.secondary};
          margin: 25px 0 15px 0;
          padding: 5px 10px;
          border-left: 4px solid ${theme.primary};
          background: ${theme.h3Bg};
        }

        .preview-content p {
          margin-bottom: 20px;
          letter-spacing: 0.05em;
        }

        .preview-content blockquote {
          margin: 25px 0;
          padding: 20px;
          background-color: ${theme.blockquoteBg};
          border-left: none;
          border-top: 2px solid ${theme.primary};
          color: #666;
          font-family: var(--font-noto-serif-sc), 'Noto Serif SC', serif;
          font-style: italic;
          border-radius: 4px;
        }

        .preview-content ul,
        .preview-content ol {
          margin: 0 0 20px 20px;
          padding-left: 20px;
        }

        .preview-content li {
          margin-bottom: 8px;
          color: ${theme.primary};
        }
        
        .preview-content ul li {
            list-style-type: disc;
        }
        
        .preview-content ol li {
            list-style-type: decimal;
        }

        .preview-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 30px auto;
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .preview-content pre {
          background-color: #f6f8fa;
          padding: 15px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 20px 0;
          font-family: 'Menlo', monospace;
          font-size: 13px;
          border: 1px solid #eee;
        }

        .preview-content code {
          background-color: ${theme.codeBg};
          color: ${theme.primary};
          padding: 2px 5px;
          border-radius: 3px;
          font-family: 'Menlo', monospace;
          font-size: 0.9em;
        }

        .preview-content pre code {
          background-color: transparent;
          color: #333;
          padding: 0;
        }

        .preview-content a {
          color: ${theme.primary};
          text-decoration: none;
          border-bottom: 1px dashed ${theme.primary};
        }

        .preview-content strong {
          color: ${theme.secondary};
          font-weight: 700;
        }

        .preview-content hr {
          border: 0;
          height: 1px;
          background-image: linear-gradient(
            to right,
            rgba(0, 0, 0, 0),
            ${theme.primary}BF,
            rgba(0, 0, 0, 0)
          );
          margin: 40px 0;
        }

        .preview-content em {
          font-style: italic;
        }
      `}} />
    </div>
  );
}
