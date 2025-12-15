'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/layout/Navbar';

type DomainOption =
  | ''
  | 'Relationship Building'
  | 'Executing'
  | 'Influencing'
  | 'Strategic Thinking';

type RouteId = 'challenge' | 'empathy' | 'structured';

interface CoachRoute {
  id: RouteId;
  name: string;
  intensity: 'high' | 'medium' | 'low';
  toneStyle: {
    domain: string | null;
    principles: string[];
    samplePhrases: string[];
  };
  sessionGoal: string;
  agenda: string[];
  keyQuestions: {
    clarify: string[];
    challenge: string[];
    action: string[];
  };
  microInterventions: string[];
  actionOptions: Array<{ action: string; metric: string; deadline: string; firstStep: string }>;
  risksAndBoundaries: string[];
  evidence: Array<{ quote: string; whyItMatters: string; locationHint: string }>;
}

interface CoachRoutesPayload {
  meta: {
    routeCount: number;
    domainUsed: string | null;
    topThemes: string[];
    notes: string[];
  };
  routes: CoachRoute[];
}

type AttachmentStatus = 'pending' | 'parsing' | 'done' | 'error';
interface AttachmentItem {
  id: string;
  filename: string;
  size: number;
  status: AttachmentStatus;
  kind: 'text';
  error?: string;
}

function isCoachRoutesPayload(x: unknown): x is CoachRoutesPayload {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return Array.isArray(obj.routes) && typeof obj.meta === 'object' && obj.meta !== null;
}

function stripListPrefix(input: string): string {
  const s = (input || '').trim();
  if (!s) return s;
  return s.replace(/^\s*(?:[-*]|\d{1,3}[.)、]|[（(]?\d{1,3}[)）])\s*/u, '').trim();
}

function extractFirstJsonObjectSubstring(text: string): string | null {
  let inString = false;
  let escaped = false;
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (ch === '}') {
      if (depth > 0) depth -= 1;
      if (depth === 0 && start >= 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

function normalizePayload(payload: CoachRoutesPayload): CoachRoutesPayload {
  const routes = Array.isArray(payload.routes) ? payload.routes : [];
  return {
    ...payload,
    meta: {
      routeCount: routes.length,
      domainUsed: payload.meta?.domainUsed ?? null,
      topThemes: Array.isArray(payload.meta?.topThemes) ? payload.meta.topThemes : [],
      notes: Array.isArray(payload.meta?.notes) ? payload.meta.notes : []
    },
    routes
  };
}

function tryParseCoachRoutesPayloadFromText(input: string): CoachRoutesPayload | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  const fenced = raw.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate0 = fenced?.[1] ? fenced[1].trim() : raw;
  const candidate = extractFirstJsonObjectSubstring(candidate0) || candidate0;

  try {
    const parsed = JSON.parse(candidate);
    if (!isCoachRoutesPayload(parsed)) return null;
    return normalizePayload(parsed);
  } catch {
    return null;
  }
}

const defaultMaterial = `【材料示例】\n\n- 你可以粘贴：音频转写 / 手记 / 文本\n- 建议包含一些“客户原话”，这样证据链会更强\n\n示例：\n客户：我最近总觉得团队不理解我，我也不想把压力带给他们。\n客户：我其实很在意关系，但一到冲突就会退一步。\n客户：我希望下个月能更坚定地表达边界，但又不想伤人。\n`;

export default function CoachRoutesPage() {
  const [material, setMaterial] = useState(defaultMaterial);
  const [domain, setDomain] = useState<DomainOption>('Relationship Building');
  const [topThemesInput, setTopThemesInput] = useState('');
  const [routeCount, setRouteCount] = useState<2 | 3>(3);
  const [arkKey, setArkKey] = useState('');
  const [model, setModel] = useState('doubao-seed-1-6-251015');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CoachRoutesPayload | null>(null);
  const [raw, setRaw] = useState<string | null>(null);

  useEffect(() => {
    const migrated = localStorage.getItem('ark_api_key') || localStorage.getItem('gemini_key') || '';
    setArkKey(migrated);
  }, []);

  const topThemes = useMemo(() => {
    return topThemesInput
      .split(/[，,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }, [topThemesInput]);

  const appendAttachmentText = (filename: string, text: string) => {
    const cleaned = (text || '').trim();
    if (!cleaned) return;
    setMaterial((prev) => {
      const suffix = `\n\n---\n\n【附件：${filename}】\n\n${cleaned}\n`;
      return prev.trimEnd() + suffix;
    });
  };

  const handleImportFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsImporting(true);

    const list = Array.from(files);
    const newItems: AttachmentItem[] = list.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      filename: f.name,
      size: f.size,
      status: 'pending',
      kind: 'text'
    }));
    setAttachments((prev) => [...newItems, ...prev]);

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      const itemId = newItems[i].id;
      setAttachments((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, status: 'parsing', error: undefined } : it))
      );

      try {
        const isText =
          file.type.startsWith('text/') ||
          /\.(txt|md|markdown)$/i.test(file.name);

        if (isText) {
          const extracted = (await file.text()).trim();
          appendAttachmentText(file.name, extracted);
          setAttachments((prev) =>
            prev.map((it) => (it.id === itemId ? { ...it, status: 'done', kind: 'text' } : it))
          );
        } else {
          throw new Error('仅支持 txt/md');
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : '导入失败';
        setAttachments((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, status: 'error', error: message } : it))
        );
      }
    }

    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildMarkdown = (payload: CoachRoutesPayload): string => {
    const lines: string[] = [];
    lines.push('# 下一次会谈多路线设计');
    lines.push('');
    lines.push(`- Domain: ${payload.meta.domainUsed || 'auto'}`);
    if (payload.meta.topThemes?.length) lines.push(`- Top Themes: ${payload.meta.topThemes.join(', ')}`);
    lines.push('');

    if (payload.meta.notes?.length) {
      lines.push('## Notes');
      payload.meta.notes.forEach((n) => lines.push(`- ${n}`));
      lines.push('');
    }

    payload.routes.forEach((r, idx) => {
      lines.push(`## ${idx + 1}. ${r.name}`);
      lines.push('');
      lines.push(`- 类型: ${r.id}`);
      lines.push(`- 强度: ${r.intensity}`);
      lines.push(`- 语气适配域: ${r.toneStyle.domain || 'auto'}`);
      lines.push('');

      lines.push('### Session Goal');
      lines.push(r.sessionGoal || '');
      lines.push('');

      lines.push('### Agenda');
      (Array.isArray(r.agenda) ? r.agenda : []).forEach((a) => lines.push(`1. ${stripListPrefix(a)}`));
      lines.push('');

      lines.push('### Key Questions');
      lines.push('**澄清**');
      (Array.isArray(r.keyQuestions?.clarify) ? r.keyQuestions.clarify : []).forEach((q) => lines.push(`- ${q}`));
      lines.push('');
      lines.push('**挑战**');
      (Array.isArray(r.keyQuestions?.challenge) ? r.keyQuestions.challenge : []).forEach((q) => lines.push(`- ${q}`));
      lines.push('');
      lines.push('**行动**');
      (Array.isArray(r.keyQuestions?.action) ? r.keyQuestions.action : []).forEach((q) => lines.push(`- ${q}`));
      lines.push('');

      lines.push('### 语气原则');
      (Array.isArray(r.toneStyle?.principles) ? r.toneStyle.principles : []).forEach((p) => lines.push(`- ${p}`));
      lines.push('');
      if (Array.isArray(r.toneStyle?.samplePhrases) && r.toneStyle.samplePhrases.length) {
        lines.push('### 示例句式');
        r.toneStyle.samplePhrases.forEach((s) => lines.push(`- ${s}`));
        lines.push('');
      }

      lines.push('### Evidence（证据摘录）');
      (Array.isArray(r.evidence) ? r.evidence : []).forEach((ev) => {
        lines.push(`> ${ev.quote}`);
        lines.push(`- Why: ${ev.whyItMatters}`);
        lines.push(`- Location: ${ev.locationHint}`);
        lines.push('');
      });
    });

    return lines.join('\n');
  };

  const downloadText = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = () => {
    if (!data) return;
    const md = buildMarkdown(data);
    downloadText('coach-routes.md', md, 'text/markdown;charset=utf-8');
  };

  const exportHtml = async () => {
    if (!data) return;
    const md = buildMarkdown(data);
    const { marked } = await import('marked');
    marked.setOptions({ breaks: true, gfm: true });
    const htmlBody = marked.parse(md) as string;
    const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Coach Routes</title>
</head>
<body>
${htmlBody}
</body>
</html>`;
    downloadText('coach-routes.html', html, 'text/html;charset=utf-8');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setRaw(null);

    try {
      const resp = await fetch('/api/coach-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          clientDomain: domain,
          clientTopThemes: topThemes,
          routeCount,
          apiKey: arkKey,
          model
        })
      });

      const json = await resp.json();
      if (!resp.ok || !json?.success) {
        throw new Error(json?.error || '生成失败');
      }

      if (isCoachRoutesPayload(json.data)) {
        setData(normalizePayload(json.data));
        return;
      }

      const fallback =
        typeof json?.raw === 'string'
          ? tryParseCoachRoutesPayloadFromText(json.raw)
          : typeof json?.data === 'string'
            ? tryParseCoachRoutesPayloadFromText(json.data)
            : null;

      if (fallback) {
        setData(fallback);
        return;
      }

      if (typeof json?.raw === 'string') {
        const pretty = tryParseCoachRoutesPayloadFromText(json.raw);
        setRaw(pretty ? JSON.stringify(pretty, null, 2) : json.raw);
      } else {
        setRaw('（未返回可解析的结构化 JSON）');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-cream">
      <Navbar />

      <div className="px-4 md:px-8 py-6 border-b border-stone-line bg-white">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-navy font-bold">教练提效 · 多路线会谈设计</h1>
              <p className="text-sm text-navy-light mt-1">同一材料输出 2–3 套路线，并按对方盖洛普域适配语气（如 Relationship Building 更温和、关系导向）。</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <button
                onClick={handleGenerate}
                disabled={loading || !material.trim()}
                className="px-4 py-2 rounded-lg bg-terra text-white font-semibold disabled:opacity-50 hover:bg-terra-dark"
                type="button"
              >
                {loading ? '生成中…' : '生成路线'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-stone-line rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-line bg-cream/40">
              <div className="text-xs font-bold text-navy uppercase tracking-widest">输入材料</div>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImportFiles(e.target.files)}
                />

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold text-navy-light">导入附件（推荐）</div>
                    <div className="text-xs text-navy-light/70 mt-0.5">仅支持 txt/md，会追加到材料末尾。</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="px-3 py-2 rounded-lg border border-stone-line bg-cream hover:border-terra text-sm text-navy disabled:opacity-50"
                  >
                    {isImporting ? '导入中…' : '选择文件'}
                  </button>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.slice(0, 6).map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-stone-line bg-white">
                        <div className="min-w-0">
                          <div className="text-sm text-navy truncate">{a.filename}</div>
                          <div className="text-xs text-navy-light">
                            {a.status === 'parsing' && '解析中…'}
                            {a.status === 'done' && '已导入'}
                            {a.status === 'pending' && '等待'}
                            {a.status === 'error' && `失败：${a.error || ''}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                          className="text-xs px-2 py-1 rounded border border-stone-line text-navy-light hover:text-terra"
                        >
                          移除
                        </button>
                      </div>
                    ))}
                    {attachments.length > 6 && (
                      <div className="text-xs text-navy-light">还有 {attachments.length - 6} 个附件未显示…</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy-light block mb-1">盖洛普域（用于语气适配）</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value as DomainOption)}
                    className="w-full bg-cream border border-stone-line rounded-lg px-3 py-2 text-sm text-navy outline-none"
                  >
                    <option value="">自动推断/不确定</option>
                    <option value="Relationship Building">Relationship Building（关系建立）</option>
                    <option value="Executing">Executing（执行）</option>
                    <option value="Influencing">Influencing（影响）</option>
                    <option value="Strategic Thinking">Strategic Thinking（战略思维）</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy-light block mb-1">输出套数</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRouteCount(2)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        routeCount === 2
                          ? 'bg-terra text-white border-terra'
                          : 'bg-cream text-navy border-stone-line hover:border-terra'
                      }`}
                    >
                      2 套
                    </button>
                    <button
                      type="button"
                      onClick={() => setRouteCount(3)}
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                        routeCount === 3
                          ? 'bg-terra text-white border-terra'
                          : 'bg-cream text-navy border-stone-line hover:border-terra'
                      }`}
                    >
                      3 套
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-light block mb-1">模型</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-cream border border-stone-line rounded-lg px-3 py-2 text-sm text-navy outline-none"
                >
                  <option value="doubao-seed-1-6-251015">doubao-seed-1-6-251015（推荐）</option>
                  <option value="doubao-pro-32k">doubao-pro-32k（长文本）</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-light block mb-1">Top Themes（可选，逗号分隔）</label>
                <input
                  value={topThemesInput}
                  onChange={(e) => setTopThemesInput(e.target.value)}
                  placeholder="例如：Empathy, Harmony, Relator"
                  className="w-full bg-cream border border-stone-line rounded-lg px-3 py-2 text-sm text-navy outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy-light block mb-1">材料（转写/手记/文本/PDF提取文字）</label>
                <textarea
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="粘贴材料…"
                  className="w-full h-[360px] bg-cream border border-stone-line rounded-lg px-3 py-2 text-sm text-navy outline-none resize-none leading-relaxed"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
            </div>
          </section>

          <section className="bg-white border border-stone-line rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-line bg-cream/40 flex items-center justify-between">
              <div className="text-xs font-bold text-navy uppercase tracking-widest">输出结果</div>
              <div className="flex items-center gap-2">
                {data?.meta && (
                  <div className="text-xs text-navy-light">domain: {data.meta.domainUsed || 'auto'} · {data.meta.routeCount} 套</div>
                )}
                {data && (
                  <>
                    <button
                      type="button"
                      onClick={exportMarkdown}
                      className="text-xs px-2 py-1 rounded border border-stone-line hover:border-terra text-navy"
                    >
                      导出 MD
                    </button>
                    <button
                      type="button"
                      onClick={exportHtml}
                      className="text-xs px-2 py-1 rounded border border-stone-line hover:border-terra text-navy"
                    >
                      导出 HTML
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4">
              {!data && !raw && (
                <div className="text-sm text-navy-light">点击“生成路线”开始。</div>
              )}

              {raw && (
                <pre className="whitespace-pre-wrap text-xs bg-cream border border-stone-line rounded-lg p-3 text-navy overflow-auto">
                  {raw}
                </pre>
              )}

              {data && (
                <>
                  {data.meta?.notes?.length > 0 && (
                    <div className="p-3 bg-mustard/10 border border-mustard/20 rounded-lg">
                      <div className="text-sm font-semibold text-navy mb-1">Notes</div>
                      <ul className="list-disc pl-5 text-sm text-navy/80 space-y-1">
                        {data.meta.notes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-4">
                    {data.routes.map((r) => {
                      const agenda = Array.isArray(r.agenda) ? r.agenda : [];
                      const clarify = Array.isArray(r.keyQuestions?.clarify) ? r.keyQuestions.clarify : [];
                      const challenge = Array.isArray(r.keyQuestions?.challenge) ? r.keyQuestions.challenge : [];
                      const action = Array.isArray(r.keyQuestions?.action) ? r.keyQuestions.action : [];
                      const principles = Array.isArray(r.toneStyle?.principles) ? r.toneStyle.principles : [];
                      const samplePhrases = Array.isArray(r.toneStyle?.samplePhrases) ? r.toneStyle.samplePhrases : [];
                      const evidence = Array.isArray(r.evidence) ? r.evidence : [];
                      const toneDomain = r.toneStyle?.domain || 'auto';

                      return (
                        <div key={r.id} className="border border-stone-line rounded-xl overflow-hidden">
                          <div className="px-4 py-3 bg-paper flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-navy">{r.name}</div>
                              <div className="text-xs text-navy-light mt-0.5">
                                {r.id} · intensity: {r.intensity} · tone domain: {toneDomain}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 space-y-3">
                            <div>
                              <div className="text-xs font-semibold text-navy-light mb-1">Session Goal</div>
                              <div className="text-sm text-navy">{r.sessionGoal}</div>
                            </div>

                            <div>
                              <div className="text-xs font-semibold text-navy-light mb-1">Agenda</div>
                              <ol className="list-decimal pl-5 text-sm text-navy space-y-1">
                                {agenda.map((a, i) => (
                                  <li key={i}>{stripListPrefix(a)}</li>
                                ))}
                              </ol>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="bg-cream/40 border border-stone-line rounded-lg p-3">
                                <div className="text-xs font-semibold text-navy-light mb-2">澄清问题</div>
                                <ul className="list-disc pl-5 text-sm text-navy space-y-1">
                                  {clarify.map((q, i) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-cream/40 border border-stone-line rounded-lg p-3">
                                <div className="text-xs font-semibold text-navy-light mb-2">挑战问题</div>
                                <ul className="list-disc pl-5 text-sm text-navy space-y-1">
                                  {challenge.map((q, i) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="bg-cream/40 border border-stone-line rounded-lg p-3">
                                <div className="text-xs font-semibold text-navy-light mb-2">行动问题</div>
                                <ul className="list-disc pl-5 text-sm text-navy space-y-1">
                                  {action.map((q, i) => (
                                    <li key={i}>{q}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            <div>
                              <div className="text-xs font-semibold text-navy-light mb-1">语气原则（适配盖洛普域）</div>
                              <ul className="list-disc pl-5 text-sm text-navy space-y-1">
                                {principles.map((p, i) => (
                                  <li key={i}>{p}</li>
                                ))}
                              </ul>
                              {samplePhrases.length > 0 && (
                                <div className="mt-2 text-sm text-navy/80">
                                  <div className="text-xs font-semibold text-navy-light mb-1">示例句式</div>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {samplePhrases.map((s, i) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="text-xs font-semibold text-navy-light mb-1">Evidence（证据摘录）</div>
                              <div className="space-y-2">
                                {evidence.map((ev, i) => (
                                  <div key={i} className="p-3 bg-white border border-stone-line rounded-lg">
                                    <div className="text-sm text-navy">“{ev.quote}”</div>
                                    <div className="text-xs text-navy-light mt-1">{ev.whyItMatters} · {ev.locationHint}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
