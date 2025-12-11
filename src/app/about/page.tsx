'use client';

import Navbar from '@/components/layout/Navbar';
import { Mail, MessageCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="flex h-full w-full flex-col bg-cream overflow-hidden">
      <div className="flex-1 h-full overflow-y-auto no-scrollbar relative flex flex-col">
        <Navbar />

        <main className="flex-1 px-4 md:px-8 py-10 md:py-16 max-w-[900px] mx-auto w-full animate-in fade-in duration-500">
          <header className="mb-10 md:mb-16 text-center">
            <span className="text-terra font-semibold tracking-wider text-xs uppercase mb-3 md:mb-4 block">
              About Us
            </span>
            <h1 className="font-serif text-3xl md:text-5xl text-navy font-bold mb-4 md:mb-6">
              关于我们
            </h1>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
            <div className="col-span-12 md:col-span-7 prose prose-stone prose-lg text-navy/80">
              <p className="lead text-xl text-navy font-serif italic mb-6">
                灵感工坊 (Inspiration Atelier) 致力于构建人与 AI 协作的新范式。
              </p>
              <p className="mb-6">
                我们相信，在生成式 AI 爆发的时代，人类的创造力并没有被取代，而是被赋予了新的翅膀。Prompt（提示词）成为了连接人类意图与机器智能的桥梁。
              </p>
              <p className="mb-6">
                这个项目不仅仅是一个指令库，更是一个关于“如何更精准地表达”、“如何更优雅地创造”的实验场。我们收集、验证并分享高质量的 Prompt，希望能帮助每一位创作者找到属于自己的 AI 缪斯。
              </p>
              <p>
                无论你是设计师、开发者、写作者，还是对 AI 充满好奇的探索者，这里都有你的一席之地。
              </p>
            </div>

            <div className="col-span-12 md:col-span-5 space-y-8">
              <div className="bg-paper p-6 border border-stone-line shadow-sm">
                <h3 className="font-serif text-xl text-navy font-bold mb-4">联系方式</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-navy-light">
                    <MessageCircle className="w-5 h-5" />
                    <span>微信：feiqiu-666</span>
                  </li>
                  <li>
                    <a href="mailto:1040906259@qq.com" className="flex items-center gap-3 text-navy-light hover:text-terra transition-colors">
                      <Mail className="w-5 h-5" />
                      <span>邮箱：1040906259@qq.com</span>
                    </a>
                  </li>
                </ul>
              </div>

              <div className="bg-mustard/10 p-6 border border-mustard/20 rounded-sm">
                <h3 className="font-serif text-lg text-navy font-bold mb-4">加入社区</h3>
                <div className="bg-white p-3 border border-stone-line/50 inline-block shadow-sm">
                  <div className="w-full aspect-square min-w-[150px] bg-cream/50 flex items-center justify-center text-navy-light/50 text-xs mb-0">
                    <img
                      src="/images/feishu.png"
                      alt="飞书群二维码"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
                <p className="text-sm text-navy/70 leading-relaxed mt-4">
                  扫码加入飞书群，获取最新的 Prompt 技巧和 AI 创意灵感。让我们一起探索数字创作的边界。
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
