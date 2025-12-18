// Types
export * from './types';

// Creative prompts (for methodology/chat)
export * from './creative';
export { CREATIVE_PROMPTS } from './creative';

// Generation prompts
export * from './image';
export { IMAGE_PROMPTS } from './image';

export * from './code';
export { CODE_PROMPTS } from './code';

// Combined generation prompts (backward compatible with MOCK_PROMPTS)
import { IMAGE_PROMPTS } from './image';
import { CODE_PROMPTS } from './code';
import type { PromptItem } from '@/types';

export const MOCK_PROMPTS: PromptItem[] = [
  ...IMAGE_PROMPTS.map(p => ({ ...p, type: 'image' as const })),
  ...CODE_PROMPTS.map(p => ({ ...p, type: 'code' as const })),
];
