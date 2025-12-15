import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

type GallupDomain =
  | 'Executing'
  | 'Influencing'
  | 'Relationship Building'
  | 'Strategic Thinking';

function normalizeDomain(input: unknown): GallupDomain | null {
  if (typeof input !== 'string') return null;
  const v = input.trim().toLowerCase();
  if (!v) return null;

  if (v.includes('relationship') || v.includes('关系') || v.includes('建立')) return 'Relationship Building';
  if (v.includes('execut') || v.includes('执行')) return 'Executing';
  if (v.includes('influenc') || v.includes('影响')) return 'Influencing';
  if (v.includes('strateg') || v.includes('战略') || v.includes('思维')) return 'Strategic Thinking';
  return null;
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

function escapeUnescapedNewlinesInStrings(input: string): string {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (!inString) {
      if (ch === '"') {
        inString = true;
        out += ch;
        continue;
      }
      out += ch;
      continue;
    }

    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      out += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = false;
      out += ch;
      continue;
    }

    if (ch === '\n') {
      out += '\\n';
      continue;
    }
    if (ch === '\r') {
      out += '\\r';
      continue;
    }
    if (ch === '\t') {
      out += '\\t';
      continue;
    }
    if (ch === '\u2028') {
      out += '\\u2028';
      continue;
    }
    if (ch === '\u2029') {
      out += '\\u2029';
      continue;
    }

    out += ch;
  }

  return out;
}

function renameTopLevelDuplicateKey(input: string, key: string): string {
  const token = `"${key}"`;
  let out = '';
  let depth = 0;
  let inString = false;
  let escaped = false;
  let seen = 0;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      // potential key name
      if (depth === 1 && input.startsWith(token, i)) {
        seen += 1;
        if (seen === 1) {
          out += token;
        } else {
          out += `"${key}__dup${seen - 1}"`;
        }
        i += token.length - 1;
        continue;
      }

      inString = true;
      out += ch;
      continue;
    }

    if (ch === '{') {
      depth += 1;
      out += ch;
      continue;
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1);
      out += ch;
      continue;
    }
    if (ch === '[') {
      depth += 1;
      out += ch;
      continue;
    }
    if (ch === ']') {
      depth = Math.max(0, depth - 1);
      out += ch;
      continue;
    }

    out += ch;
  }

  return out;
}

function mergeDuplicateTopLevelArrays(parsed: unknown, key: string): unknown {
  if (!parsed || typeof parsed !== 'object') return parsed;
  const obj = parsed as Record<string, unknown>;

  const merged: unknown[] = [];
  const base = obj[key];
  if (Array.isArray(base)) merged.push(...base);
  else if (base && typeof base === 'object') merged.push(base);

  for (let i = 1; i < 10; i++) {
    const k = `${key}__dup${i}`;
    if (!(k in obj)) break;
    const v = obj[k];
    if (Array.isArray(v)) merged.push(...v);
    else if (v && typeof v === 'object') merged.push(v);
    delete obj[k];
  }

  if (merged.length > 0) obj[key] = merged;
  return parsed;
}

function normalizeCoachRoutesMeta(parsed: unknown): void {
  if (!parsed || typeof parsed !== 'object') return;
  const obj = parsed as Record<string, unknown>;
  const routes = Array.isArray(obj.routes) ? (obj.routes as unknown[]) : [];

  if (!obj.meta || typeof obj.meta !== 'object') {
    obj.meta = {
      routeCount: routes.length,
      domainUsed: null,
      topThemes: [],
      notes: ['meta 缺失：已自动补全']
    };
    return;
  }

  const meta = obj.meta as Record<string, unknown>;
  meta.routeCount = routes.length;
  if (!Array.isArray(meta.topThemes)) meta.topThemes = [];
  if (!Array.isArray(meta.notes)) meta.notes = [];
  if (meta.domainUsed !== null && typeof meta.domainUsed !== 'string') meta.domainUsed = null;
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
      if (ch === '"') {
        inString = false;
      }
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

function extractJson(text: string): unknown {
  const trimmed = (text || '').replace(/^\uFEFF/, '').trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate0 = fenced?.[1] ? fenced[1] : trimmed;

  const candidate = extractFirstJsonObjectSubstring(candidate0) || candidate0;

  // Common LLM formatting issues
  let repaired = candidate
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();

  repaired = escapeUnescapedNewlinesInStrings(repaired);
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  // Preserve duplicate top-level keys that LLMs sometimes emit (e.g. multiple "routes": [...] blocks)
  repaired = renameTopLevelDuplicateKey(repaired, 'routes');

  const parsed = JSON.parse(repaired);
  const merged = mergeDuplicateTopLevelArrays(parsed, 'routes');
  normalizeCoachRoutesMeta(merged);
  return merged;
}

function getOutputText(response: unknown): string {
  if (!response || typeof response !== 'object') return '';
  const r = response as Record<string, unknown>;

  if (typeof r.output_text === 'string' && r.output_text.trim()) {
    return r.output_text.trim();
  }

  const output = r.output;
  if (Array.isArray(output)) {
    const texts: string[] = [];
    for (const item of output) {
      if (!item || typeof item !== 'object') continue;
      const it = item as Record<string, unknown>;
      if (it.type !== 'message') continue;
      const content = it.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        if (!c || typeof c !== 'object') continue;
        const cc = c as Record<string, unknown>;
        if (cc.type === 'output_text' && typeof cc.text === 'string') {
          texts.push(cc.text);
        }
      }
    }
    return texts.join('').trim();
  }

  // Fallback: if Ark returns chat.completions-like shape
  const choices = r.choices;
  if (Array.isArray(choices)) {
    const first = choices[0] as Record<string, unknown> | undefined;
    const msg = first?.message as Record<string, unknown> | undefined;
    if (typeof msg?.content === 'string') return msg.content.trim();
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      material,
      materials,
      pdfText,
      fileIds,
      clientDomain,
      clientTopThemes,
      routeCount = 3,
      apiKey,
      model
    } = body || {};

    const text =
      [material, materials, pdfText]
        .flat()
        .filter((x: unknown) => typeof x === 'string' && x.trim().length > 0)
        .join('\n\n') ||
      '';

    const uploadedFileIds: string[] = Array.isArray(fileIds)
      ? fileIds
          .filter((x: unknown) => typeof x === 'string' && x.trim())
          .map((x: string) => x.trim())
      : typeof fileIds === 'string' && fileIds.trim()
        ? [fileIds.trim()]
        : [];

    if (!text && uploadedFileIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供材料（转写/文本/手记/PDF均可）' },
        { status: 400 }
      );
    }

    const count = Math.max(2, Math.min(3, Number(routeCount) || 3));
    const domain = normalizeDomain(clientDomain);
    const topThemes: string[] = Array.isArray(clientTopThemes)
      ? clientTopThemes.filter((t: unknown) => typeof t === 'string' && t.trim()).map((t: string) => t.trim())
      : typeof clientTopThemes === 'string'
        ? clientTopThemes
            .split(/[，,\n]/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    const client = createClient(apiKey);

    const chatModel =
      (typeof model === 'string' && model.trim()) ||
      process.env.ARK_CHAT_MODEL ||
      'doubao-seed-1-6-251015';

    const system = `你是一位资深盖洛普优势教练（高级教练/督导级），擅长把一份会谈材料转成“下一次会谈的多路线设计”。

重要规则：
1) 你必须输出严格 JSON（不要额外解释文字、不要 Markdown），便于产品直接渲染。
2) 任何洞察/判断都必须给出“证据摘录”（来自材料的原话）作为依据；如果材料中没有足够证据，必须写明“证据不足/待验证”。
3) 你不会做医疗/心理诊断，不给出越界建议；必要时只做边界提醒。
4) 路线需要是“同一材料的不同策略”，而不是重复换句话说。

盖洛普语气适配（按对方更容易接受的语言风格）：
- Relationship Building：温和、共情、以关系/连接/被理解为中心，先肯定再挑战。
- Executing：务实、清晰、以行动与落地为中心，步骤化、可衡量。
- Influencing：鼓舞、外显目标、强调影响力与表达，带一点号召感。
- Strategic Thinking：抽象但清晰、强调模式/框架/洞察，允许更长的思考空间。`;

    const user = {
      material: text,
      client_profile: {
        domain: domain,
        top_themes: topThemes
      },
      instruction: `请基于材料，为“下一次会谈”生成 ${count} 套路线。必须包含下列路线类型（如果只输出2套，则优先输出：共情型 + 结构化；若输出3套则包含三种）：
1) 挑战型（高强度推进）
2) 共情型（低威胁推进）
3) 结构化（框架化推进）

并且：所有路线都需要“按对方盖洛普域（domain）适配语气”。若 domain 为空或不确定，请在输出中给出你推断 domain 的理由与置信度，并在语言上采用“中性+可选分支”的写法。

JSON 输出结构要求：
{
  "meta": {"routeCount": number, "domainUsed": string|null, "topThemes": string[], "notes": string[]},
  "routes": [
    {
      "id": "challenge"|"empathy"|"structured",
      "name": string,
      "intensity": "high"|"medium"|"low",
      "toneStyle": {"domain": string|null, "principles": string[], "samplePhrases": string[]},
      "sessionGoal": string,
      "agenda": string[],
      "keyQuestions": {"clarify": string[], "challenge": string[], "action": string[]},
      "microInterventions": string[],
      "actionOptions": [{"action": string, "metric": string, "deadline": string, "firstStep": string}],
      "risksAndBoundaries": string[],
      "evidence": [{"quote": string, "whyItMatters": string, "locationHint": string}]
    }
  ]
}

要求：
- 每条路线的 evidence 至少 3 条（如果材料不足，允许少于3条，但必须在 meta.notes 说明原因）。
- keyQuestions 必须可直接复制使用，避免空泛。`
    };

    const userContent: Array<{ type: 'input_file'; file_id: string } | { type: 'input_text'; text: string }> = [];
    for (const fid of uploadedFileIds) {
      userContent.push({ type: 'input_file', file_id: fid });
    }
    userContent.push({ type: 'input_text', text: JSON.stringify(user) });

    const response = await client.responses.create({
      model: chatModel,
      temperature: 0.4,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: system }] },
        { role: 'user', content: userContent }
      ]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const content = getOutputText(response);
    let parsed: unknown = null;
    try {
      parsed = extractJson(content);
    } catch {
      parsed = null;
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      raw: parsed ? undefined : content
    });
  } catch (error) {
    console.error('Coach routes error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error && error.message === 'Missing ARK_API_KEY'
            ? '服务端未配置 ARK_API_KEY'
            : '生成失败，请稍后重试'
      },
      { status: 500 }
    );
  }
}
