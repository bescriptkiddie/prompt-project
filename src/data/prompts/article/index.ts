import type { ArticlePrompt } from '../types';

export const ARTICLE_PROMPTS: ArticlePrompt[] = [
  {
    id: '18',
    title: '深度技术文章生成',
    model: 'Claude 3.5 Sonnet',
    promptZh: '请写一篇关于 [技术主题] 的深度解析文章。\n结构要求：\n1. 引言：背景介绍与核心问题。\n2. 技术原理：深入剖析底层机制。\n3. 实战案例：代码示例与应用场景。\n4. 优缺点分析：客观评价。\n5. 总结与展望。\n语气风格：专业、客观、深入浅出。',
    promptEn: 'Please write a deep dive article about [Technical Topic].\nStructure requirements:\n1. Introduction: Background and core issues.\n2. Technical Principles: In-depth analysis of underlying mechanisms.\n3. Practical Cases: Code examples and application scenarios.\n4. Pros/Cons Analysis: Objective evaluation.\n5. Conclusion and Outlook.\nTone: Professional, objective, insightful yet accessible.',
    description: '生成结构严谨、内容详实的技术深度解析文章。',
    category: '写作辅助',
    source: '原创',
  },
];
