export * from './design';
export * from './social-media';
export * from './photography';
export * from './illustration';
export * from './creative';
export * from './3d';
export * from './solarterm';

import { DESIGN_PROMPTS } from './design';
import { SOCIAL_MEDIA_PROMPTS } from './social-media';
import { PHOTOGRAPHY_PROMPTS } from './photography';
import { ILLUSTRATION_PROMPTS } from './illustration';
import { CREATIVE_COMPOSITE_PROMPTS } from './creative';
import { THREE_D_PROMPTS } from './3d';
import { SOLARTERM_PROMPTS } from './solarterm';

export const IMAGE_PROMPTS = [
  ...DESIGN_PROMPTS,
  ...SOCIAL_MEDIA_PROMPTS,
  ...PHOTOGRAPHY_PROMPTS,
  ...ILLUSTRATION_PROMPTS,
  ...CREATIVE_COMPOSITE_PROMPTS,
  ...THREE_D_PROMPTS,
  ...SOLARTERM_PROMPTS,
];
