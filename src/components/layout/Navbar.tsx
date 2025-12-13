'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 内部页面导航配置
export const internalPages = [
  { name: '精选集', path: '/', tab: 'collection' },
  { name: '创作方法论', path: '/', tab: 'methodology' },
  { name: '关于我们', path: '/', tab: 'about' },
  { name: 'MD排版', path: '/mdtohtml' }
]

// 外部链接配置
export const externalLinks = [
  { name: 'Twitter热榜', url: 'https://twitterhot.vercel.app/' },
  {
    name: 'Youmind Prompts',
    url: 'https://youmind.com/nano-banana-pro-prompts'
  }
]

type TabType = 'methodology' | 'collection' | 'about'

interface NavbarProps {
  // 首页 Tab 切换相关
  activeTab?: TabType
  onTabChange?: (tab: TabType) => void
  // 移动端菜单
  onMobileMenuOpen?: () => void
  // 是否显示返回首页按钮（用于独立页面）
  showBackHome?: boolean
}

export default function Navbar({
  activeTab,
  onTabChange,
  onMobileMenuOpen,
  showBackHome = false
}: NavbarProps) {
  const [showLinksDropdown, setShowLinksDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const pathname = usePathname()

  const isHomePage = pathname === '/'
  const isActive = (page: (typeof internalPages)[0]) => {
    if (page.tab && isHomePage) {
      return activeTab === page.tab
    }
    return pathname === page.path && !page.tab
  }

  const handleNavClick = (page: (typeof internalPages)[0]) => {
    if (page.tab && onTabChange) {
      onTabChange(page.tab as TabType)
    }
    setShowMobileMenu(false)
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-stone-line px-4 md:px-8 h-16 md:h-20 flex items-center justify-between shrink-0">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3"
        >
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
          <div className="h-8 relative hidden sm:block">
            <svg
              height="32"
              viewBox="0 0 160 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
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
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-6 text-sm font-medium tracking-wide items-center">
          {internalPages.map((page) =>
            page.tab ? (
              <button
                key={page.name}
                onClick={() => handleNavClick(page)}
                className={`transition-colors border-b-2 pb-0.5 ${
                  isActive(page)
                    ? 'text-terra border-terra'
                    : 'text-navy-light border-transparent hover:text-terra hover:border-terra'
                }`}
              >
                {page.name}
              </button>
            ) : (
              <Link
                key={page.name}
                href={page.path}
                className={`transition-colors border-b-2 pb-0.5 ${
                  isActive(page)
                    ? 'text-terra border-terra'
                    : 'text-navy-light border-transparent hover:text-terra hover:border-terra'
                }`}
              >
                {page.name}
              </Link>
            )
          )}

          {/* External Links Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLinksDropdown(!showLinksDropdown)}
              className="flex items-center gap-1 transition-colors border-b-2 pb-0.5 text-navy-light border-transparent hover:text-terra hover:border-terra"
            >
              外链
              <svg
                className={`w-4 h-4 transition-transform ${
                  showLinksDropdown ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showLinksDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLinksDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 py-2 bg-white rounded-lg shadow-lg border border-stone-line z-50 min-w-[160px]">
                  {externalLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-navy-light hover:bg-cream hover:text-terra transition-colors"
                      onClick={() => setShowLinksDropdown(false)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      {link.name}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-navy hover:bg-stone-line/20 rounded-full transition-colors"
          onClick={() => setShowMobileMenu(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line
              x1="4"
              x2="20"
              y1="12"
              y2="12"
            />
            <line
              x1="4"
              x2="20"
              y1="6"
              y2="6"
            />
            <line
              x1="4"
              x2="20"
              y1="18"
              y2="18"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-xl animate-slide-left">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-stone-line">
              <span className="font-semibold text-navy">导航菜单</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-stone-line/30 rounded-full"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="p-4">
              <div className="text-xs text-navy-light uppercase tracking-wider mb-2">
                页面
              </div>
              <div className="space-y-1">
                {internalPages.map((page) =>
                  page.tab ? (
                    <button
                      key={page.name}
                      onClick={() => handleNavClick(page)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isActive(page)
                          ? 'bg-terra/10 text-terra'
                          : 'text-navy hover:bg-cream'
                      }`}
                    >
                      {page.name}
                    </button>
                  ) : (
                    <Link
                      key={page.name}
                      href={page.path}
                      onClick={() => setShowMobileMenu(false)}
                      className={`block px-3 py-2 rounded-lg transition-colors ${
                        isActive(page)
                          ? 'bg-terra/10 text-terra'
                          : 'text-navy hover:bg-cream'
                      }`}
                    >
                      {page.name}
                    </Link>
                  )
                )}
              </div>

              {/* External Links */}
              <div className="text-xs text-navy-light uppercase tracking-wider mb-2 mt-6">
                外部链接
              </div>
              <div className="space-y-1">
                {externalLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-navy hover:bg-cream transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <svg
                      className="w-4 h-4 text-navy-light"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
