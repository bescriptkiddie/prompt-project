'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function HtmlViewerPage() {
  const params = useParams();
  const file = params.file as string;
  const decodedFileName = decodeURIComponent(file);
  const title = decodedFileName.replace(/\.html$/i, '');

  return (
    <div className="h-screen flex flex-col bg-cream">
      <div className="bg-white border-b border-stone-line px-4 py-3 flex items-center gap-4">
        <Link
          href="/html"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-line hover:border-terra hover:bg-cream transition-all text-sm text-navy font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-xl text-navy font-bold">{title}</h1>
          <p className="text-xs text-navy-light mt-0.5">{decodedFileName}</p>
        </div>
      </div>

      <iframe
        src={`/api/html/${file}`}
        className="flex-1 w-full border-0"
        title={title}
      />
    </div>
  );
}
