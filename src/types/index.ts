export interface PromptItem {
  id: string;
  title: string;
  model: string;
  promptZh: string;
  promptEn: string;
  description?: string;
  category?: string;
  source?: string;
  imageUrl?: string;
  type: 'image' | 'article' | 'code';
  date?: string;
}

export type GenerationType = 'image' | 'video';
