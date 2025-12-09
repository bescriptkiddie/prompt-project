import OpenAI from 'openai';

// 模型配置
const MODEL_CONFIG = {
  Doubao: {
    model: 'doubao-seedream-4-5-251128',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    envKey: 'ARK_API_KEY',
    size: '2K'
  },
  Gemini: {
    model: 'gemini-3.0-pro-image-preview',
    baseURL: 'https://api.qnaigc.com/v1',
    envKey: 'GEMINI_API_KEY',
    size: '1024x1024'
  }
} as const;

type ModelType = keyof typeof MODEL_CONFIG;

function createClient(modelType: ModelType, customApiKey?: string): OpenAI {
  const config = MODEL_CONFIG[modelType];
  const apiKey = customApiKey || process.env[config.envKey];

  if (!apiKey) {
    throw new Error(`Missing API Key for ${modelType} (${config.envKey})`);
  }

  return new OpenAI({
    apiKey,
    baseURL: config.baseURL,
    timeout: 60000
  });
}

export async function handleGeneration(
  prompt: string,
  image: string | undefined,
  modelType: ModelType,
  apiKey?: string
): Promise<string> {
  const config = MODEL_CONFIG[modelType];
  const client = createClient(modelType, apiKey);

  console.log(`Using ${modelType} API with model:`, config.model);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [{ type: 'text', text: prompt }];

  // 图生图：添加图片
  if (image) {
    content.push({ type: 'image_url', image_url: { url: image } });
    console.log(`${modelType} Image-to-Image mode activated`);
  }


  const response = await client.chat.completions.create({
    model: config.model,
    messages: [{ role: 'user', content }],
    response_format: { type: 'url' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = response.choices[0].message as any;
  console.log(`${modelType} API Response:`, JSON.stringify(message, null, 2));

  // 从 images 数组中提取 URL
  if (message.images && Array.isArray(message.images) && message.images.length > 0) {
    const firstImage = message.images[0];
    if (firstImage.image_url?.url) {
      return firstImage.image_url.url;
    }
    if (firstImage.url) {
      return firstImage.url;
    }
  }

  // fallback: content 可能直接是 URL
  if (message.content?.startsWith('http')) {
    return message.content;
  }

  throw new Error(`No image URL found in ${modelType} response`);
}
