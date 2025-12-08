export default function Header() {
  return (
    <header className="px-8 pt-16 pb-12 max-w-[1200px] mx-auto w-full grid grid-cols-12 gap-8 items-end">
      <div className="col-span-12 lg:col-span-8">
        <span className="text-terra font-semibold tracking-wider text-xs uppercase mb-4 block">
          Est. 2025 • 数字时代的匠心
        </span>
        <h1 className="font-serif text-5xl md:text-6xl text-navy leading-[1.2] mb-6 font-bold">
          为计算创意而生的<br />
          <span className="italic text-navy-light font-normal">
            精选提示词库。
          </span>
        </h1>
        <p className="text-navy-light max-w-xl text-lg leading-relaxed font-light">
          一个精心编纂的生成式指令档案馆。旨在提供清晰度、可复现性，并激发美学探索。
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
