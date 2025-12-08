export interface PromptItem {
  id: string;
  title: string;
  model: string;
  prompt: string;
  imageUrl?: string;
  type: 'image' | 'text';
  category?: string;
  date?: string;
}

export type GenerationType = 'image' | 'video';
