import { useState } from 'react';
import { ArrowRight, Circle, Globe, Tag, Sparkles, Languages, Code, FileText } from 'lucide-react';
import { PromptItem } from '@/types';
import { clsx } from 'clsx';

interface PromptCardProps {
  item: PromptItem;
  onSelect: (prompt: string) => void;
  index: number;
}

export default function PromptCard({ item, onSelect, index }: PromptCardProps) {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');
  const animationDelay = `${(index + 1) * 0.1}s`;

  const currentPrompt = lang === 'zh' ? item.promptZh : item.promptEn;

  if (item.type === 'article' || item.type === 'code') {
    return (
      <article
        className="article-fade-in group relative break-inside-avoid bg-terra p-6 shadow-sm text-cream flex flex-col justify-between min-h-[350px]"
        style={{ animationDelay }}
      >
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-mustard">
              {item.type === 'code' ? (
                <Code className="w-12 h-12 stroke-[1.5]" />
              ) : (
                <FileText className="w-12 h-12 stroke-[1.5]" />
              )}
            </div>
            {item.category && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-mustard/20 text-mustard border border-mustard/30">
                {item.category}
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl mb-2 font-bold">{item.title}</h3>

          {item.description && (
            <p className="text-cream/70 text-xs mb-3 italic">
              {item.description}
            </p>
          )}

          <div className="relative">
            <p className="text-cream/90 font-light text-sm leading-relaxed line-clamp-4 min-h-[5rem]">
              {currentPrompt}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLang(l => l === 'zh' ? 'en' : 'zh');
              }}
              className="absolute top-0 right-0 p-1 hover:bg-white/10 rounded transition-colors"
              title="Switch Language"
            >
              <Languages className="w-4 h-4 text-mustard" />
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-cream/20 flex flex-col gap-3">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono opacity-70">{item.model}</span>
              {item.source && (
                <span className="text-[10px] opacity-50">Src: {item.source}</span>
              )}
            </div>
            <button
              onClick={() => onSelect(currentPrompt)}
              className="text-sm font-medium hover:text-mustard transition-colors flex items-center gap-1"
            >
              Use Prompt <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className="article-fade-in group relative break-inside-avoid bg-paper border border-stone-line p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
      style={{ animationDelay }}
    >
      <div className="aspect-[16/9] overflow-hidden bg-cream relative mb-4 border border-stone-line/50">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-[0.85] group-hover:saturate-100"
            alt={item.title}
          />
        )}
        {item.category && (
          <div className="absolute top-2 right-2 bg-paper/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-navy border border-stone-line shadow-sm">
            {item.category}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-baseline border-b border-stone-line pb-2 mb-1">
          <h3
            className="font-serif text-xl text-navy font-bold truncate pr-2 hover:whitespace-normal hover:overflow-visible hover:text-clip relative z-10"
            title={item.title}
          >
            {item.title}
          </h3>
          <span className="text-[10px] uppercase tracking-widest text-terra font-semibold shrink-0">
            {item.model}
          </span>
        </div>

        {item.description && (
          <div className="flex items-start gap-1.5 text-navy/70">
            <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-terra/60" />
            <p className="text-xs italic leading-tight">{item.description}</p>
          </div>
        )}

        <div className="relative group/prompt">
          <div className="absolute right-2 top-2 z-10 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLang(l => l === 'zh' ? 'en' : 'zh');
              }}
              className="p-1.5 bg-paper border border-stone-line shadow-sm hover:bg-cream transition-colors rounded-sm"
              title="Switch Language"
            >
              <Languages className="w-3 h-3 text-navy" />
            </button>
          </div>
          <p className="font-mono text-xs text-navy-light leading-relaxed bg-cream/50 p-3 border-l-2 border-terra line-clamp-3 min-h-[4.5rem]">
            {currentPrompt}
          </p>
        </div>

        <div className="pt-2 flex justify-between items-center">
          {item.source ? (
            <span className="text-[10px] text-navy-light/60 flex items-center gap-1">
              <Tag className="w-3 h-3" /> {item.source}
            </span>
          ) : <span></span>}

          <button
            onClick={() => onSelect(currentPrompt)}
            className="group/btn text-xs font-semibold text-navy hover:text-terra transition-colors flex items-center gap-1 border-b border-transparent hover:border-terra pb-0.5"
          >
            在工坊中调试
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </article>
  );
}
