import { PromptItem } from '@/types';
import PromptCard from './PromptCard';

interface PromptGridProps {
  prompts: PromptItem[];
  onSelect: (prompt: string) => void;
}

export default function PromptGrid({ prompts, onSelect }: PromptGridProps) {
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
      {prompts.map((item, index) => (
        <PromptCard
          key={item.id}
          item={item}
          index={index}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
