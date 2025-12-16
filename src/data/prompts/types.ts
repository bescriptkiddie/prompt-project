export const CREATIVE_CATEGORIES = ['内容分析', '个人IP', '文章创作', '营销文案', '销售成交'] as const;

export type CreativeCategory = (typeof CREATIVE_CATEGORIES)[number];

export interface CreativePrompt {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: CreativeCategory;
  systemPrompt: string;
  placeholder: string;
}

export interface ImagePrompt {
  id: string;
  title: string;
  model: string;
  promptZh: string;
  promptEn: string;
  description?: string;
  category: string;
  source?: string;
  imageUrl?: string;
}

export interface CodePrompt {
  id: string;
  title: string;
  model: string;
  promptZh: string;
  promptEn: string;
  description?: string;
  category: string;
  source?: string;
}

export interface ArticlePrompt {
  id: string;
  title: string;
  model: string;
  promptZh: string;
  promptEn: string;
  description?: string;
  category: string;
  source?: string;
}


