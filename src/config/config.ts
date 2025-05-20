import dotenv from 'dotenv';
import { z } from 'zod';

// 環境変数のロード
dotenv.config();

// 環境変数のバリデーションスキーマ
const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API Key is required'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  DEBUG_MODE: z.string().transform(val => val === 'true').default('false')
});

// 環境変数の検証と型付け
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const config = {
  port: parseInt(_env.data.PORT, 10),
  nodeEnv: _env.data.NODE_ENV,
  openai: {
    apiKey: _env.data.OPENAI_API_KEY,
    model: _env.data.OPENAI_MODEL
  },
  debugMode: _env.data.DEBUG_MODE
};