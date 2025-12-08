import OpenAI from 'openai';

// Initialize OpenAI client with the provided configuration
export const openai = new OpenAI({
  apiKey: 'sk-36b1cdd6b9b02a583411c3eec2dfb83918b0b6f4f09ab700e0b8c5d1b7107e8f',
  baseURL: 'https://api.qnaigc.com/v1',
  timeout: 600000 // 60 seconds timeout
});
