'use client';

import { useEffect, useRef, useState } from 'react';
import { History, Plus, Send, Square, Trash2 } from 'lucide-react';
import { marked } from 'marked';

type Role = 'user' | 'assistant';

interface ChatMessage {
  role: Role;
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  goal: string;
  scenario: string;
  myDraft: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const CHAT_SESSIONS_KEY = 'coach_communication_sessions';
const CURRENT_SESSION_KEY = 'coach_communication_current_session';

const defaultBrief = `你将进行一节“教练沟通”互动课：

1) 你先描述一个真实场景（对象/关系/冲突点/你想达成什么）。
2) 我会给出：课程目标、要点框架、一个可直接照着说的对话脚本。
3) 然后我们进入角色扮演：你说一句，我回一句，并给即时点评与改写。
`;

marked.setOptions({ gfm: true, breaks: true });

function addMarkdownClasses(html: string): string {
  let out = html;

  // Headings
  out = out.replaceAll('<h1>', '<h1 class="text-base font-semibold text-navy mt-2 mb-2">');
  out = out.replaceAll('<h2>', '<h2 class="text-base font-semibold text-navy mt-2 mb-2">');
  out = out.replaceAll('<h3>', '<h3 class="text-sm font-semibold text-navy mt-2 mb-1">');
  out = out.replaceAll('<h4>', '<h4 class="text-sm font-semibold text-navy mt-2 mb-1">');
  out = out.replaceAll('<h5>', '<h5 class="text-sm font-semibold text-navy mt-2 mb-1">');
  out = out.replaceAll('<h6>', '<h6 class="text-sm font-semibold text-navy mt-2 mb-1">');

  // Paragraphs / lists
  out = out.replaceAll('<p>', '<p class="mb-2 leading-relaxed">');
  out = out.replaceAll('<ul>', '<ul class="list-disc pl-5 mb-2 space-y-1">');
  out = out.replaceAll('<ol>', '<ol class="list-decimal pl-5 mb-2 space-y-1">');
  out = out.replaceAll('<li>', '<li class="leading-relaxed">');

  // Blockquote
  out = out.replaceAll('<blockquote>', '<blockquote class="border-l-2 border-stone-line pl-3 text-navy/90 mb-2">');

  // Code
  out = out.replaceAll('<pre>', '<pre class="bg-cream border border-stone-line rounded-lg p-3 overflow-auto mb-2">');
  out = out.replaceAll('<code>', '<code class="text-xs">');
  out = out.replaceAll('<code class="language-', '<code class="text-xs language-');

  // HR
  out = out.replaceAll('<hr>', '<hr class="my-3 border-stone-line" />');

  return out;
}

function renderAssistantMarkdown(md: string): string {
  // Prevent raw HTML injection from model output
  const escaped = (md || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const html = marked.parse(escaped) as string;
  return addMarkdownClasses(html);
}

export default function CommunicationCourse() {
  const [geminiKey, setGeminiKey] = useState('');
  const [goal, setGoal] = useState('');
  const [scenario, setScenario] = useState('');
  const [myDraft, setMyDraft] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: defaultBrief }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGeminiKey(localStorage.getItem('gemini_key') || '');
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(CHAT_SESSIONS_KEY);
    if (saved) {
      try {
        setChatSessions(JSON.parse(saved) as ChatSession[]);
      } catch {
        setChatSessions([]);
      }
    }
    const savedCurrent = localStorage.getItem(CURRENT_SESSION_KEY);
    if (savedCurrent) setCurrentSessionId(savedCurrent);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const saveSessions = (sessions: ChatSession[]) => {
    setChatSessions(sessions);
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  };

  const generateTitle = (msgs: ChatMessage[], fallback: string) => {
    const firstUser = msgs.find((m) => m.role === 'user' && m.content.trim());
    const base = firstUser?.content?.trim() || fallback.trim() || '新对话';
    return base.slice(0, 20) + (base.length > 20 ? '…' : '');
  };

  const createNewSession = () => {
    const now = Date.now();
    const s: ChatSession = {
      id: `session-${now}`,
      title: '新对话',
      goal: goal.trim(),
      scenario: scenario.trim(),
      myDraft: myDraft.trim(),
      messages: [{ role: 'assistant', content: defaultBrief }],
      createdAt: now,
      updatedAt: now
    };

    const next = [s, ...chatSessions];
    saveSessions(next);
    setCurrentSessionId(s.id);
    localStorage.setItem(CURRENT_SESSION_KEY, s.id);
    setMessages(s.messages);
    setShowHistory(false);
  };

  const loadSession = (id: string) => {
    const s = chatSessions.find((x) => x.id === id);
    if (!s) return;
    setCurrentSessionId(id);
    localStorage.setItem(CURRENT_SESSION_KEY, id);
    setGoal(s.goal);
    setScenario(s.scenario);
    setMyDraft(s.myDraft);
    setMessages(s.messages?.length ? s.messages : [{ role: 'assistant', content: defaultBrief }]);
    setShowHistory(false);
  };

  const deleteSession = (id: string) => {
    const next = chatSessions.filter((s) => s.id !== id);
    saveSessions(next);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      localStorage.removeItem(CURRENT_SESSION_KEY);
      setGoal('');
      setScenario('');
      setMyDraft('');
      setMessages([{ role: 'assistant', content: defaultBrief }]);
    }
  };

  const upsertCurrentSession = (nextMessages: ChatMessage[]) => {
    const now = Date.now();
    const sid = currentSessionId || `session-${now}`;
    const existing = chatSessions.find((s) => s.id === sid);
    const payload: ChatSession = {
      id: sid,
      title: generateTitle(nextMessages, scenario || goal),
      goal: goal.trim(),
      scenario: scenario.trim(),
      myDraft: myDraft.trim(),
      messages: nextMessages,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    const others = chatSessions.filter((s) => s.id !== sid);
    saveSessions([payload, ...others]);
    if (!currentSessionId) {
      setCurrentSessionId(sid);
      localStorage.setItem(CURRENT_SESSION_KEY, sid);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const startLesson = async () => {
    const brief = {
      goal: goal.trim(),
      scenario: scenario.trim(),
      myDraft: myDraft.trim()
    };

    const text = `请开始这节课。以下是我的背景：\n${JSON.stringify(brief, null, 2)}`;
    await send(text);
  };

  const send = async (overrideText?: string) => {
    const userText = (overrideText ?? input).trim();
    if (!userText || isLoading) return;

    setInput('');
    setIsLoading(true);

    const next: ChatMessage[] = [...messages, { role: 'user', content: userText }, { role: 'assistant', content: '' }];
    setMessages(next);
    upsertCurrentSession(next);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch('/api/coach-communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: geminiKey,
          stream: true,
          messages: next
            .filter((m) => m.content.trim().length > 0)
            .map((m) => ({ role: m.role, content: m.content }))
        }),
        signal: controller.signal
      });

      if (!resp.ok) {
        const j = await resp.json().catch(() => null);
        throw new Error(j?.error || '请求失败');
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('响应不可读取');
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (typeof parsed?.content === 'string') {
              full += parsed.content;
              setMessages((prev) => {
                const copied = [...prev];
                copied[copied.length - 1] = { role: 'assistant', content: full };
                upsertCurrentSession(copied);
                return copied;
              });
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '请求失败';
      setMessages((prev) => {
        const copied = [...prev];
        if (copied.length && copied[copied.length - 1].role === 'assistant') {
          copied[copied.length - 1] = { role: 'assistant', content: `出错：${msg}` };
        } else {
          copied.push({ role: 'assistant', content: `出错：${msg}` });
        }
        upsertCurrentSession(copied);
        return copied;
      });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section className="bg-white border border-stone-line rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-line bg-cream/40">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-navy uppercase tracking-widest">课程设置</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="text-xs px-2 py-1 rounded border border-stone-line hover:border-terra text-navy flex items-center gap-1"
                title="历史记录"
              >
                <History className="w-3 h-3" /> 历史
              </button>
              <button
                type="button"
                onClick={createNewSession}
                className="text-xs px-2 py-1 rounded border border-stone-line hover:border-terra text-navy flex items-center gap-1"
                title="新建会话"
              >
                <Plus className="w-3 h-3" /> 新建
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {showHistory && (
            <div className="p-3 bg-cream/40 border border-stone-line rounded-lg">
              <div className="text-xs font-semibold text-navy-light mb-2">历史会话</div>
              {chatSessions.length === 0 ? (
                <div className="text-xs text-navy-light">暂无历史记录。</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                  {chatSessions.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded border ${
                        s.id === currentSessionId ? 'border-terra bg-white' : 'border-stone-line bg-white'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => loadSession(s.id)}
                        className="min-w-0 text-left flex-1"
                        title={s.title}
                      >
                        <div className="text-sm text-navy truncate">{s.title}</div>
                        <div className="text-xs text-navy-light">{new Date(s.updatedAt).toLocaleString()}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSession(s.id)}
                        className="text-xs px-2 py-1 rounded border border-stone-line text-navy-light hover:text-terra flex items-center gap-1"
                        title="删除"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-navy-light block mb-1">你想练的目标（可选）</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例如：更坚定地表达边界，但不伤害关系"
              className="w-full bg-cream border border-stone-line rounded-lg px-3 py-2 text-sm text-navy outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-light block mb-1">场景描述（建议填写）</label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="对象是谁？发生了什么？你卡住在哪？你希望对方怎么做？"
              className="w-full h-40 bg-cream border border-stone-line rounded-lg px-3 py-2 text-sm text-navy outline-none resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-light block mb-1">你现在的说法草稿（可选）</label>
            <textarea
              value={myDraft}
              onChange={(e) => setMyDraft(e.target.value)}
              placeholder="把你可能会说的话直接粘贴过来，我会逐句改写。"
              className="w-full h-28 bg-cream border border-stone-line rounded-lg px-3 py-2 text-sm text-navy outline-none resize-none leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={startLesson}
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-lg bg-terra text-white font-semibold disabled:opacity-50 hover:bg-terra-dark"
          >
            开始上课
          </button>
        </div>
      </section>

      <section className="bg-white border border-stone-line rounded-xl overflow-hidden flex flex-col min-h-[520px]">
        <div className="px-4 py-3 border-b border-stone-line bg-cream/40 flex items-center justify-between">
          <div className="text-xs font-bold text-navy uppercase tracking-widest">课堂对话</div>
          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="text-xs px-2 py-1 rounded border border-stone-line hover:border-terra text-navy flex items-center gap-1"
            >
              <Square className="w-3 h-3" /> 停止
            </button>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] p-3 text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-terra text-white rounded-2xl rounded-tr-sm'
                    : 'bg-white border border-stone-line rounded-2xl rounded-tl-sm text-navy'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div
                    className="markdown"
                    dangerouslySetInnerHTML={{ __html: renderAssistantMarkdown(m.content) }}
                  />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="p-3 border-t border-stone-line bg-cream/30">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="继续练习：你说一句（回客户/回同事/回伴侣）…"
              className="flex-1 resize-none bg-white border border-stone-line rounded-lg p-2 text-sm text-navy focus:outline-none focus:border-terra min-h-[44px] max-h-[120px]"
              rows={2}
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-terra hover:bg-terra-dark disabled:opacity-50 text-white rounded-lg shrink-0"
              title="发送"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-navy-light mt-2">提示：右上角「设置」里配置 `gemini_key` 后效果更稳定。</div>
        </div>
      </section>
    </div>
  );
}
