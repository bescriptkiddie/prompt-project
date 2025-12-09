import Link from 'next/link';

export default function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  return (
    <nav className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-stone-line px-4 md:px-8 h-20 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-terra rounded-sm flex items-center justify-center text-cream relative overflow-hidden shrink-0">
          <svg
            className="w-5 h-5 absolute"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M2 12s3-3 8-3 12 3 12 3"
              className="organic-line text-white/90"
            />
            <path
              d="M2 16s4-2 7-2 9 4 13 4"
              className="organic-line text-white/90"
            />
          </svg>
        </div>
        <div className="h-8 relative w-40">
           <svg
            height="32"
            viewBox="0 0 160 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <text
              x="0"
              y="24"
              fill="#242936"
              fontFamily="'Noto Serif SC', serif"
              fontWeight="700"
              fontSize="24"
              letterSpacing="0.05em"
            >
              灵感工坊
            </text>
            <text
              x="105"
              y="24"
              fill="#D67052"
              fontFamily="'Noto Serif SC', serif"
              fontStyle="italic"
              fontSize="14"
            >
              Atelier
            </text>
          </svg>
        </div>
      </div>

      <div className="hidden md:flex gap-8 text-sm font-medium tracking-wide text-navy-light">
        <Link
          href="/"
          className="hover:text-terra transition-colors border-b-2 border-transparent hover:border-terra pb-0.5"
        >
          精选集
        </Link>
        <Link
          href="/methodology"
          className="hover:text-terra transition-colors border-b-2 border-transparent hover:border-terra pb-0.5"
        >
          创作方法论
        </Link>
        <Link
          href="/about"
          className="hover:text-terra transition-colors border-b-2 border-transparent hover:border-terra pb-0.5"
        >
          关于我们
        </Link>
      </div>

      <button
        className="md:hidden p-2 text-navy hover:bg-stone-line/20 rounded-full transition-colors"
        onClick={onToggleSidebar}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
    </nav>
  );
}
