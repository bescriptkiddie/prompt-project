'use client';

import Navbar from '@/components/layout/Navbar';

export default function Methodology() {
  return (
    <div className="flex h-full w-full flex-col bg-cream overflow-hidden">
      <div className="flex-1 h-full overflow-y-auto no-scrollbar relative flex flex-col">
        <Navbar />

        <main className="flex-1 px-8 py-16 max-w-[900px] mx-auto w-full animate-in fade-in duration-500">
          <header className="mb-16 text-center">
            <span className="text-terra font-semibold tracking-wider text-xs uppercase mb-4 block">
              Methodology
            </span>
            <h1 className="font-serif text-4xl md:text-5xl text-navy font-bold mb-6">
              创作方法论
            </h1>
            <p className="text-navy-light text-lg font-light italic max-w-2xl mx-auto">
              &ldquo;Prompt Engineering 不仅仅是技术，更是一门与机器对话的艺术。&rdquo;
            </p>
          </header>

          <article className="prose prose-stone prose-lg max-w-none text-navy/80">
            <section className="mb-16">
              <h2 className="font-serif text-2xl text-navy font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-terra/10 text-terra flex items-center justify-center text-sm font-bold">01</span>
                结构化思维 (Structure)
              </h2>
              <p className="leading-relaxed mb-6">
                优秀的提示词往往具有清晰的结构。我们将 Prompt 解构为以下核心模块：
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mb-8">
                <li className="bg-paper p-4 border border-stone-line rounded-sm">
                  <strong className="text-terra block mb-1">Role (角色)</strong>
                  赋予 AI 特定的专家身份，设定视角与知识边界。
                </li>
                <li className="bg-paper p-4 border border-stone-line rounded-sm">
                  <strong className="text-terra block mb-1">Context (背景)</strong>
                  提供任务发生的场景、受众以及必要的限制条件。
                </li>
                <li className="bg-paper p-4 border border-stone-line rounded-sm">
                  <strong className="text-terra block mb-1">Instruction (指令)</strong>
                  清晰、动词导向的具体行动指南，避免歧义。
                </li>
                <li className="bg-paper p-4 border border-stone-line rounded-sm">
                  <strong className="text-terra block mb-1">Output (输出)</strong>
                  规定格式、风格、语气以及具体的交付标准。
                </li>
              </ul>
            </section>

            <section className="mb-16">
              <h2 className="font-serif text-2xl text-navy font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-mustard/20 text-navy flex items-center justify-center text-sm font-bold">02</span>
                迭代与打磨 (Iteration)
              </h2>
              <p className="leading-relaxed mb-4">
                没有一次完美的生成。Prompt 的创作是一个持续对话的过程：
              </p>
              <div className="pl-6 border-l-2 border-stone-line italic text-navy-light space-y-2">
                <p>1. <strong>测试基准：</strong> 先用简单的指令获取基准结果。</p>
                <p>2. <strong>识别偏差：</strong> 分析结果与预期的差距（风格、准确性、逻辑）。</p>
                <p>3. <strong>精确修正：</strong> 引入具体的修饰词、参考样例或否定约束。</p>
              </div>
            </section>

            <section className="mb-16">
              <h2 className="font-serif text-2xl text-navy font-bold mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-navy/5 text-navy flex items-center justify-center text-sm font-bold">03</span>
                审美自觉 (Aesthetics)
              </h2>
              <p className="leading-relaxed">
                在 AI 时代，<strong>审美力</strong>成为了新的编程语言。我们不仅追求“正确”的答案，更追求“优雅”的表达。通过积累艺术史、设计原则和文学修辞的知识，我们能引导 AI 突破平庸，创造出具有灵魂的作品。
              </p>
            </section>
          </article>
        </main>
      </div>
    </div>
  );
}
