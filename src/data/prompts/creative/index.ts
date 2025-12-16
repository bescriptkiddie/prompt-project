export * from './content-analysis';
export * from './personal-ip';
export * from './article-writing';
export * from './marketing-copy';
export * from './sales';

import { CONTENT_ANALYSIS_PROMPTS } from './content-analysis';
import { PERSONAL_IP_PROMPTS } from './personal-ip';
import { ARTICLE_WRITING_PROMPTS } from './article-writing';
import { MARKETING_COPY_PROMPTS } from './marketing-copy';
import { SALES_PROMPTS } from './sales';

export const CREATIVE_PROMPTS = [
  ...CONTENT_ANALYSIS_PROMPTS,
  ...PERSONAL_IP_PROMPTS,
  ...ARTICLE_WRITING_PROMPTS,
  ...MARKETING_COPY_PROMPTS,
  ...SALES_PROMPTS,
];
