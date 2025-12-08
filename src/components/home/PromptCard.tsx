import { ArrowRight, Circle } from 'lucide-react';
import { PromptItem } from '@/types';
import { clsx } from 'clsx';

interface PromptCardProps {
  item: PromptItem;
  onSelect: (prompt: string) => void;
  index: number;
}

export default function PromptCard({ item, onSelect, index }: PromptCardProps) {
  // Calculate delay based on index for the staggered animation
  const animationDelay = `${(index + 1) * 0.1}s`;

  if (item.type === 'text') {
    return (
      <article
        className="article-fade-in group relative break-inside-avoid bg-terra p-6 shadow-sm text-cream flex flex-col justify-between min-h-[300px]"
        style={{ animationDelay }}
      >
        <div>
          <div className="mb-4 text-mustard">
            <Circle className="w-12 h-12 stroke-[1.5]" />
          </div>
          <h3 className="font-serif text-2xl mb-2 font-bold">{item.title}</h3>
          <p className="text-cream/90 font-light text-sm leading-relaxed">
            {item.prompt}
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-cream/20 flex justify-between items-end">
          <span className="text-xs font-mono opacity-70">{item.model}</span>
          <a
            href="#"
            className="text-sm font-medium hover:text-mustard transition-colors"
          >
            阅读更多 -&gt;
          </a>
        </div>
      </article>
    );
  }

  return (
    <article
      className="article-fade-in group relative break-inside-avoid bg-paper border border-stone-line p-4 shadow-sm hover:shadow-md transition-shadow duration-300"
      style={{ animationDelay }}
    >
      <div className="aspect-[16/9] overflow-hidden bg-cream relative mb-5 border border-stone-line/50">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 saturate-[0.85] group-hover:saturate-100"
            alt={item.title}
          />
        )}
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-baseline border-b border-stone-line pb-2 mb-2">
          <h3 className="font-serif text-xl text-navy font-bold">{item.title}</h3>
          <span className="text-[10px] uppercase tracking-widest text-terra font-semibold">
            {item.model}
          </span>
        </div>
        <p className="font-mono text-xs text-navy-light leading-relaxed bg-cream/50 p-3 border-l-2 border-terra line-clamp-3">
          {item.prompt}
        </p>
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onSelect(item.prompt)}
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
