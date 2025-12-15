import { NextRequest, NextResponse } from 'next/server';
import OpenAI, { toFile } from 'openai';

export const runtime = 'nodejs';

type ArkFileObject = {
  id: string;
  status?: string | null;
};

function toAsciiFilename(original: string) {
  const name = (original || 'attachment').trim() || 'attachment';
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf('.');
  const ext = dot > 0 ? lower.slice(dot) : '';
  const base = dot > 0 ? name.slice(0, dot) : name;

  // multipart header filename is often treated as ByteString in some runtimes
  // so we keep it ASCII-only to avoid `ByteString` conversion errors.
  const safeBase = base
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/[\\"']/g, '_')
    .trim();
  return (safeBase || 'attachment') + (ext || '');
}

function createClient(customApiKey?: string) {
  const apiKey = customApiKey || process.env.ARK_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ARK_API_KEY');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    timeout: 120000
  });
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForFileReady(client: OpenAI, fileId: string) {
  // Ark files usually go through `processing` -> `active`
  // Keep it simple for MVP: poll up to ~20s.
  for (let i = 0; i < 20; i++) {
    const f = (await (client as unknown as { files: { retrieve: (id: string) => Promise<unknown> } }).files.retrieve(
      fileId
    )) as ArkFileObject;
    const status = String(f?.status || '').toLowerCase();
    if (status === 'active' || status === 'processed') return f;
    if (status === 'error' || status === 'failed') return f;
    await sleep(1000);
  }
  return (await (client as unknown as { files: { retrieve: (id: string) => Promise<unknown> } }).files.retrieve(
    fileId
  )) as ArkFileObject;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const customApiKey = (formData.get('apiKey') as string | null) || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: '缺少文件' }, { status: 400 });
    }

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 20MB' },
        { status: 400 }
      );
    }

    const filename = file.name || 'attachment';
    const mimeType = file.type || '';

    const uploadFilename = toAsciiFilename(filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const looksLikePdf = mimeType.includes('pdf') || filename.toLowerCase().endsWith('.pdf');
    const looksLikeText =
      mimeType.startsWith('text/') ||
      filename.toLowerCase().endsWith('.txt') ||
      filename.toLowerCase().endsWith('.md') ||
      filename.toLowerCase().endsWith('.markdown');

    if (looksLikePdf) {
      const client = createClient(customApiKey);

      const upload = await client.files.create({
        file: await toFile(buffer, uploadFilename, {
          type: mimeType || 'application/pdf'
        }),
        purpose: 'user_data'
      });

      const ready = await waitForFileReady(client, (upload as unknown as ArkFileObject).id);
      const status = String(
        ready?.status || (upload as unknown as ArkFileObject).status || 'processing'
      );

      return NextResponse.json({
        success: true,
        filename,
        type: 'pdf',
        fileId: upload.id,
        status,
        uploadFilename
      });
    }

    if (looksLikeText) {
      const text = buffer.toString('utf-8').trim();
      return NextResponse.json({
        success: true,
        filename,
        type: 'text',
        text
      });
    }

    return NextResponse.json(
      { success: false, error: '仅支持 txt/md/pdf 文件' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Parse attachment error:', error);
    return NextResponse.json(
      { success: false, error: '解析失败，请重试' },
      { status: 500 }
    );
  }
}
