'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PromptItem } from '@/types';
import PromptCard from './PromptCard';

interface PromptGridProps {
  prompts: PromptItem[];
  onSelect: (prompt: string) => void;
}

export default function PromptGrid({ prompts, onSelect }: PromptGridProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {prompts.map((item, index) => (
          <PromptCard
            key={item.id}
            item={item}
            index={index}
            onSelect={onSelect}
            onPreview={setPreviewImage}
          />
        ))}
      </div>

      {previewImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-navy/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200"
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
        </div>,
        document.body
      )}
    </>
  );
}
