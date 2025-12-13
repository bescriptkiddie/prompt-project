'use client';

import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/home/Header';
import PromptGrid from '@/components/home/PromptGrid';
import MethodologyContent from '@/components/home/MethodologyContent';
import AboutContent from '@/components/home/AboutContent';
import { MOCK_PROMPTS } from '@/data/prompts';

type TabType = 'methodology' | 'collection' | 'about';

export default function Home() {
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('methodology');

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <div className="flex-1 h-full overflow-y-auto no-scrollbar relative flex flex-col bg-cream">
        <Navbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {activeTab === 'methodology' ? (
          <MethodologyContent />
        ) : activeTab === 'about' ? (
          <AboutContent />
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
