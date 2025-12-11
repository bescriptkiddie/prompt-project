export default function Header() {
  return (
    <header className="px-4 md:px-8 pt-10 md:pt-16 pb-8 md:pb-12 max-w-[1200px] mx-auto w-full grid grid-cols-12 gap-4 md:gap-8 items-end">
      <div className="col-span-12 lg:col-span-8">
        <span className="text-terra font-semibold tracking-wider text-xs uppercase mb-2 md:mb-4 block">
          Est. 2025 • Prompt 美学
        </span>
        <h1 className="font-serif text-3xl md:text-5xl w-full text-navy leading-[1.2] mb-4 md:mb-6 font-bold">
          给 AI 注入有趣的灵魂
        </h1>
        <p className="text-navy-light max-w-xl text-base md:text-lg leading-relaxed font-light">
          精选 Prompt 指令库 —— 让 AI 生成的每一张图、每一段话，都带着你的审美印记。
        </p>
      </div>
      <div className="hidden lg:col-span-4 lg:flex justify-end opacity-80">
        <svg width="150" height="80" viewBox="0 0 150 80">
          <path
            d="M10 40 Q 40 10, 75 40 T 140 40"
            stroke="#D67052"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="25" cy="25" r="4" fill="#F0B857" />
          <circle cx="125" cy="55" r="4" fill="#242936" />
        </svg>
      </div>
    </header>
  );
}
