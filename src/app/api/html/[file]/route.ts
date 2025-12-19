import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

type Context = {
  params: Promise<{ file: string }>
}

export async function GET(_request: Request, ctx: Context) {
  const { file } = await ctx.params
  const decoded = decodeURIComponent(file)

  if (!decoded.toLowerCase().endsWith('.html')) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const baseDir = path.join(process.cwd(), 'src', 'data', 'html')
  const targetPath = path.resolve(baseDir, decoded)
  const safeBase = path.resolve(baseDir) + path.sep

  if (!targetPath.startsWith(safeBase)) {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const html = await readFile(targetPath, 'utf8')
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
