import { readdir } from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'

import Navbar from '@/components/layout/Navbar'

export default async function Page() {
  const baseDir = path.join(process.cwd(), 'src', 'data', 'html')
  const entries = await readdir(baseDir, { withFileTypes: true })
  const files = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'))

  return (
    <div className="flex h-full w-full flex-col bg-cream overflow-hidden">
      <Navbar />

      <main className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-8 py-8 max-w-[1000px] mx-auto w-full">
        <header className="mb-8">
          <span className="text-terra font-semibold tracking-wider text-xs uppercase mb-2 block">
            Library
          </span>
          <h1 className="font-serif text-2xl md:text-3xl text-navy font-bold mb-2">名人堂</h1>
        </header>

        {files.length === 0 ? (
          <div className="bg-paper border border-stone-line p-6">
            <p className="text-navy-light text-sm">当前没有找到任何 .html 文件。</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {files.map((name) => {
              const href = `/html/${encodeURIComponent(name)}`
              const title = name.replace(/\.html$/i, '')

              return (
                <Link
                  key={name}
                  href={href}
                  className="block bg-paper border border-stone-line hover:border-terra/50 hover:bg-white transition-all p-4"
                >
                  <div className="font-semibold text-navy">{title}</div>
                  <div className="text-xs text-navy-light mt-1 break-all">{name}</div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
