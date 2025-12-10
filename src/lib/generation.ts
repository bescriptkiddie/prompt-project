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
    // throw new Error(`Missing API Key for ${modelType} (${config.envKey})`);
    const defaultKey = modelType === 'Doubao' ? 'default-doubao-key' : 'default-gemini-key';
    return new OpenAI({
      apiKey: defaultKey,
      baseURL: config.baseURL,
      timeout: 60000
    });
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
  const client = createClient(modelType, apiKey);

  console.log(`Using ${modelType} API with model:`, MODEL_CONFIG[modelType].model);

  // Doubao 使用 images.generate API
  if (modelType === 'Doubao') {
    return handleDoubaoGeneration(client, MODEL_CONFIG.Doubao, prompt, image);
  }

  // Gemini: chat.completions API
  if (image) {
    return handleGeminiImageGeneration(client, MODEL_CONFIG.Gemini, prompt, image);
  }
  return handleGeminiChatGeneration(client, MODEL_CONFIG.Gemini, prompt);
}

// Doubao: images.generate API
async function handleDoubaoGeneration(
  client: OpenAI,
  config: typeof MODEL_CONFIG['Doubao'],
  prompt: string,
  image?: string
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    model: config.model,
    prompt: prompt,
    size: config.size,
    response_format: 'url',
    extra_body: { watermark: false }
  };

  if (image) {
    params.image = image;
    console.log('Doubao Image-to-Image mode activated');
  }

  const response = await client.images.generate(params);
  console.log('Doubao API Response:', JSON.stringify(response, null, 2));

  if (response.data?.[0]?.url) {
    return response.data[0].url;
  }
  // fallback: base64
  if (response.data?.[0]?.b64_json) {
    return `data:image/png;base64,${response.data[0].b64_json}`;
  }

  throw new Error('No image found in Doubao response');
}

// Gemini 图生图: chat.completions API
async function handleGeminiImageGeneration(
  client: OpenAI,
  config: typeof MODEL_CONFIG['Gemini'],
  prompt: string,
  image: string
): Promise<string> {
  console.log('Gemini Image-to-Image mode activated');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any[] = [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: image } }
  ];

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [{ role: 'user', content }]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = response.choices[0].message as any;
  console.log('Gemini chat.completions (image) Response:', JSON.stringify(message, null, 2));

  // 从 images 数组中提取 URL
  if (message.images?.length > 0) {
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

  throw new Error('No image URL found in Gemini chat response');
}

// Gemini 文生图: chat.completions API
async function handleGeminiChatGeneration(
  client: OpenAI,
  config: typeof MODEL_CONFIG['Gemini'],
  prompt: string
): Promise<string> {
  const response = await client.chat.completions.create({
    model: config.model,
    messages: [{ role: 'user', content: prompt }]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const message = response.choices[0].message as any;
  console.log('Gemini chat.completions Response:', JSON.stringify(message, null, 2));

  // 从 images 数组中提取 URL
  if (message.images?.length > 0) {
    const firstImage = message.images[0];
    if (firstImage.image_url?.url) {
      return firstImage.image_url.url;
    }
    if (firstImage.url) {
      return firstImage.url;
    }
    // base64 格式
    if (firstImage.b64_json) {
      return `data:image/png;base64,${firstImage.b64_json}`;
    }
  }

  // fallback: content 可能直接是 URL
  if (message.content?.startsWith('http')) {
    return message.content;
  }

  // fallback: content 可能是 base64
  if (message.content?.startsWith('data:image')) {
    return message.content;
  }

  throw new Error(`No image found. Response: ${JSON.stringify(message)}`);
}
