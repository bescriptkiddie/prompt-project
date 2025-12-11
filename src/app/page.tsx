'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/home/Header';
import PromptGrid from '@/components/home/PromptGrid';
import MethodologyContent from '@/components/home/MethodologyContent';
import { MOCK_PROMPTS } from '@/data/prompts';

type TabType = 'methodology' | 'collection';

export default function Home() {
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('methodology');

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <div className="flex-1 h-full overflow-y-auto no-scrollbar relative flex flex-col bg-cream">
        <Navbar onToggleSidebar={() => setIsSidebarOpen(true)} />
        
        {/* Tab 切换 */}
        <div className="px-4 md:px-8 pt-8 max-w-[1400px] mx-auto w-full">
          <div className="flex gap-1 bg-stone-line/30 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('methodology')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'methodology'
                  ? 'bg-white text-terra shadow-sm'
                  : 'text-navy-light hover:text-navy'
              }`}
            >
              创作方法论
            </button>
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'collection'
                  ? 'bg-white text-terra shadow-sm'
                  : 'text-navy-light hover:text-navy'
              }`}
            >
              精选集
            </button>
          </div>
        </div>

        {activeTab === 'methodology' ? (
          <MethodologyContent />
        ) : (
          <>
            <Header />
            <main className="flex-1 px-4 md:px-8 pb-20 max-w-[1400px] mx-auto w-full">
              <PromptGrid
                prompts={MOCK_PROMPTS}
                onSelect={(prompt) => {
                  setSelectedPrompt(prompt);
                  setIsSidebarOpen(true);
                }}
              />
            </main>
          </>
        )}
      </div>
      {activeTab === 'collection' && (
        <Sidebar
          selectedPrompt={selectedPrompt}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
